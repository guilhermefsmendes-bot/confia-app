import type { PersonalEvent } from "./personalEvent";
import { buildPersonalPatterns, describePersonalPattern } from "./personalPatterns";

export type InsightType = "trend" | "time_of_day" | "weekday" | "habit_association" | "intervention_effect" | "recovery_pattern" | "repeated_need" | "personal_change" | "pattern_disappearance";
export type InsightStatus = "emerging" | "possible" | "consistent" | "weakened" | "changed" | "disappeared";

export interface PersonalInsight {
  id: string;
  type: InsightType;
  generatedAt: string;
  periodStart: string;
  periodEnd: string;
  evidenceCount: number;
  confidence: "low" | "moderate" | "high";
  direction: "up" | "down" | "mixed" | "stable";
  variables: string[];
  status: InsightStatus;
  fingerprint: string;
  firstSeen: string;
  lastSeen: string;
  timesShown: number;
  novelty: "new" | "known" | "returning";
  actionability: "low" | "medium" | "high";
  supportingEventIds: string[];
  supersedesInsightId?: string;
  message: string;
  messageKey?: string;
  messageValues?: Record<string, string | number>;
}

const mood = (event: PersonalEvent) => event.type === "mood" || event.type === "checkin" ? typeof event.value === "number" ? event.value : undefined : undefined;
const avg = (values: number[]) => values.length ? values.reduce((a, b) => a + b, 0) / values.length : undefined;
const validTimestamp = (event: PersonalEvent) => Number.isFinite(new Date(event.timestamp).getTime());

export function calculateInsightConfidence(observations: number, consistency: number, recency: number, dispersion: number, effectSize: number, completeness: number): PersonalInsight["confidence"] {
  const score = Math.max(0, Math.min(1, observations / 10)) * 0.25 + consistency * 0.2 + recency * 0.15 + dispersion * 0.1 + Math.min(1, effectSize) * 0.2 + completeness * 0.1;
  if (score >= 0.72 && observations >= 6) return "high";
  if (score >= 0.48 && observations >= 4) return "moderate";
  return "low";
}

function buildTrendInsight(valid: PersonalEvent[], now: Date): PersonalInsight | undefined {
  const start = new Date(now.getTime() - 30 * 86400000);
  const recent = valid.filter(event => new Date(event.timestamp).getTime() >= start.getTime());
  if (recent.length < 6) return undefined;
  const values = recent.map(event => mood(event)!);
  const half = Math.floor(values.length / 2);
  const early = avg(values.slice(0, half));
  const late = avg(values.slice(half));
  if (early === undefined || late === undefined) return undefined;
  const delta = late - early;
  const direction: PersonalInsight["direction"] = delta >= 0.75 ? "up" : delta <= -0.75 ? "down" : "stable";
  if (direction === "stable") return undefined;
  const activeDays = new Set(recent.map(event => event.localDate)).size;
  const confidence = calculateInsightConfidence(recent.length, Math.min(1, Math.abs(delta) / 2), Math.min(1, recent.length / 14), Math.min(1, activeDays / 14), Math.abs(delta) / 2, Math.min(1, activeDays / 14));
  return {
    id: `insight_trend_30d_${recent[recent.length - 1].localDate}`,
    type: "trend", generatedAt: now.toISOString(), periodStart: recent[0].localDate, periodEnd: recent[recent.length - 1].localDate,
    evidenceCount: recent.length, confidence, direction, variables: ["mood"], status: recent.length >= 10 && activeDays >= 7 ? "consistent" : "possible",
    fingerprint: `trend:mood:30d:${direction}`, firstSeen: recent[0].localDate, lastSeen: recent[recent.length - 1].localDate, timesShown: 0,
    novelty: "new", actionability: "medium", supportingEventIds: recent.map(event => event.id),
    message: direction === "up" ? "Nos teus registos recentes, o teu estado médio tem subido." : "Nos teus registos recentes, o teu estado médio tem descido.",
    messageKey: direction === "up" ? "personalInsights.trendUp" : "personalInsights.trendDown",
  };
}

function buildInterventionInsight(valid: PersonalEvent[], now: Date): PersonalInsight | undefined {
  const interventions = valid.filter(event => event.type === "intervention").filter(event => typeof event.metadata?.initialIntensity === "number" && typeof event.metadata?.finalIntensity === "number");
  if (interventions.length < 3) return undefined;
  const deltas = interventions.map(event => Number(event.metadata!.initialIntensity) - Number(event.metadata!.finalIntensity));
  const positive = deltas.filter(delta => delta > 0);
  const averageDelta = avg(deltas);
  if (averageDelta === undefined || positive.length < 2 || averageDelta < 0.75) return undefined;
  const recent = interventions.slice(-10);
  const first = recent[0];
  const last = recent[recent.length - 1];
  const consistency = positive.length / deltas.length;
  const confidence = calculateInsightConfidence(recent.length, consistency, Math.min(1, recent.length / 8), 0.7, Math.min(1, averageDelta / 3), Math.min(1, new Set(recent.map(event => event.localDate)).size / 8));
  const status: InsightStatus = recent.length >= 5 && consistency >= 0.7 ? "consistent" : "possible";
  return {
    id: `insight_intervention_effect_${last.localDate}`, type: "intervention_effect", generatedAt: now.toISOString(),
    periodStart: first.localDate, periodEnd: last.localDate, evidenceCount: recent.length, confidence,
    direction: "down", variables: ["intervention", "initialIntensity", "finalIntensity"], status,
    fingerprint: "intervention:impulso:intensity_change", firstSeen: first.localDate, lastSeen: last.localDate,
    timesShown: 0, novelty: "new", actionability: "high", supportingEventIds: recent.map(event => event.id),
    message: "Nos teus episódios registados, a intensidade baixou depois de algumas intervenções.",
    messageKey: "personalInsights.interventionEffect",
  };
}

export function buildPersonalInsights(events: PersonalEvent[], now = new Date()): PersonalInsight[] {
  const valid = events.filter(validTimestamp).filter(event => mood(event) !== undefined).sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  const insights: PersonalInsight[] = [];
  const trend = buildTrendInsight(valid, now);
  if (trend) insights.push(trend);
  const interventionEvents = events.filter(validTimestamp).sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  const intervention = buildInterventionInsight(interventionEvents, now);
  if (intervention) insights.push(intervention);

  for (const pattern of buildPersonalPatterns(events)) {
    if (pattern.status === "emerging") continue;
    insights.push({
      id: `insight_${pattern.id}`, type: pattern.type, generatedAt: now.toISOString(),
      periodStart: pattern.firstSeen, periodEnd: pattern.lastSeen, evidenceCount: pattern.evidenceCount,
      confidence: pattern.confidence, direction: pattern.effect > 0.25 ? "up" : pattern.effect < -0.25 ? "down" : "stable",
      variables: [pattern.label], status: pattern.status, fingerprint: pattern.fingerprint,
      firstSeen: pattern.firstSeen, lastSeen: pattern.lastSeen, timesShown: 0, novelty: "new",
      actionability: pattern.type === "repeated_need" ? "medium" : "high", supportingEventIds: pattern.supportingEventIds,
      message: describePersonalPattern(pattern),
      messageKey: pattern.type === "habit_association" ? "personalInsights.habitAssociation" : pattern.type === "time_of_day" ? "personalInsights.timeOfDay" : "personalInsights.repeatedNeed",
      messageValues: { label: pattern.label },
    });
  }
  return insights;
}

export function explainInsight(insight: PersonalInsight): string {
  const confidence = insight.confidence === "high" ? "há evidência consistente" : insight.confidence === "moderate" ? "há alguns sinais repetidos" : "há sinais iniciais";
  return `${insight.message} ${confidence} em ${insight.evidenceCount} observações entre ${insight.periodStart} e ${insight.periodEnd}. Isto descreve uma associação observada, não uma causa.`;
}
