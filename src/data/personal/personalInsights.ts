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


function buildWeekdayInsight(valid: PersonalEvent[], now: Date): PersonalInsight | undefined {
  const recent = valid.filter(event => new Date(event.timestamp).getTime() >= now.getTime() - 90 * 86400000);
  if (recent.length < 14) return undefined;
  const buckets = new Map<number, number[]>();
  for (const event of recent) {
    const day = new Date(event.timestamp).getDay();
    const values = buckets.get(day) ?? [];
    values.push(mood(event)!);
    buckets.set(day, values);
  }
  const eligible = [...buckets.entries()].filter(([, values]) => values.length >= 3);
  if (eligible.length < 3) return undefined;
  const overall = avg(recent.map(event => mood(event)!))!;
  const [day, values] = eligible.sort((a, b) => Math.abs(avg(b[1])! - overall) - Math.abs(avg(a[1])! - overall))[0];
  const delta = avg(values)! - overall;
  if (Math.abs(delta) < 0.8) return undefined;
  const confidence = calculateInsightConfidence(values.length, Math.min(1, values.length / 6), Math.min(1, recent.length / 30), Math.min(1, eligible.length / 7), Math.abs(delta) / 2, Math.min(1, recent.length / 30));
  const last = recent[recent.length - 1];
  return {
    id: `insight_weekday_${day}_${last.localDate}`, type: "weekday", generatedAt: now.toISOString(), periodStart: recent[0].localDate, periodEnd: last.localDate,
    evidenceCount: values.length, confidence, direction: delta > 0 ? "up" : "down", variables: [`weekday:${day}`], status: values.length >= 5 ? "consistent" : "possible",
    fingerprint: `weekday:mood:${day}:${delta > 0 ? "up" : "down"}`, firstSeen: recent[0].localDate, lastSeen: last.localDate, timesShown: 0, novelty: "new", actionability: "medium", supportingEventIds: recent.filter(e => new Date(e.timestamp).getDay() === day).map(e => e.id),
    message: "Os teus registos mostram uma diferença recorrente num dia da semana.", messageKey: "personalInsights.weekday", messageValues: { day: String(day) },
  };
}

function buildRecoveryInsight(valid: PersonalEvent[], now: Date): PersonalInsight | undefined {
  const recent = valid.filter(event => new Date(event.timestamp).getTime() >= now.getTime() - 90 * 86400000);
  if (recent.length < 12) return undefined;
  const ordered = recent.slice().sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  const changes: number[] = [];
  const supporting: string[] = [];
  for (let i = 1; i < ordered.length; i += 1) {
    const before = mood(ordered[i - 1])!;
    const after = mood(ordered[i])!;
    const gap = new Date(ordered[i].timestamp).getTime() - new Date(ordered[i - 1].timestamp).getTime();
    if (gap <= 36 * 3600000 && before <= 4 && after - before >= 2) { changes.push(after - before); supporting.push(ordered[i - 1].id, ordered[i].id); }
  }
  if (changes.length < 3) return undefined;
  const average = avg(changes)!;
  const first = ordered[0], last = ordered[ordered.length - 1];
  return {
    id: `insight_recovery_${last.localDate}`, type: "recovery_pattern", generatedAt: now.toISOString(), periodStart: first.localDate, periodEnd: last.localDate,
    evidenceCount: changes.length, confidence: calculateInsightConfidence(changes.length, Math.min(1, changes.length / 5), Math.min(1, recent.length / 30), 0.7, Math.min(1, average / 3), Math.min(1, new Set(supporting).size / 8)),
    direction: "up", variables: ["mood_recovery"], status: changes.length >= 5 ? "consistent" : "possible", fingerprint: "recovery:mood:repeated", firstSeen: first.localDate, lastSeen: last.localDate, timesShown: 0, novelty: "new", actionability: "high", supportingEventIds: [...new Set(supporting)],
    message: "Quando um registo esteve mais baixo, há ocasiões em que os registos seguintes mostram uma recuperação significativa.", messageKey: "personalInsights.recoveryPattern",
  };
}

function buildPersonalChangeInsight(valid: PersonalEvent[], now: Date): PersonalInsight | undefined {
  const recent = valid.filter(event => new Date(event.timestamp).getTime() >= now.getTime() - 30 * 86400000);
  const previous = valid.filter(event => { const time = new Date(event.timestamp).getTime(); return time >= now.getTime() - 60 * 86400000 && time < now.getTime() - 30 * 86400000; });
  if (recent.length < 8 || previous.length < 8) return undefined;
  const delta = avg(recent.map(e => mood(e)!))! - avg(previous.map(e => mood(e)!))!;
  if (Math.abs(delta) < 1) return undefined;
  const last = recent[recent.length - 1];
  return {
    id: `insight_change_30d_${last.localDate}`, type: "personal_change", generatedAt: now.toISOString(), periodStart: previous[0].localDate, periodEnd: last.localDate,
    evidenceCount: recent.length + previous.length, confidence: calculateInsightConfidence(recent.length + previous.length, Math.min(1, Math.abs(delta) / 2), Math.min(1, recent.length / 14), 0.8, Math.min(1, Math.abs(delta) / 2), Math.min(1, recent.length / 14)), direction: delta > 0 ? "up" : "down", variables: ["mood:30d_vs_previous_30d"], status: recent.length >= 12 ? "consistent" : "possible", fingerprint: `personal_change:mood:${delta > 0 ? "up" : "down"}`, firstSeen: previous[0].localDate, lastSeen: last.localDate, timesShown: 0, novelty: "new", actionability: "medium", supportingEventIds: [...previous, ...recent].map(e => e.id), message: "O teu padrão recente está diferente do período anterior, segundo os teus próprios registos.", messageKey: "personalInsights.personalChange",
  };
}

export function buildPersonalInsights(events: PersonalEvent[], now = new Date()): PersonalInsight[] {
  const valid = events.filter(validTimestamp).filter(event => mood(event) !== undefined).sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  const insights: PersonalInsight[] = [];
  const trend = buildTrendInsight(valid, now);
  if (trend) insights.push(trend);
  const weekday = buildWeekdayInsight(valid, now);
  if (weekday) insights.push(weekday);
  const recovery = buildRecoveryInsight(valid, now);
  if (recovery) insights.push(recovery);
  const change = buildPersonalChangeInsight(valid, now);
  if (change) insights.push(change);
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

export function explainInsight(
  insight: PersonalInsight,
  translate?: (key: string, values?: Record<string, unknown>) => string,
): string {
  if (translate) {
    return translate("personalInsights.evidenceExplanation", {
      confidence: translate(`personalInsights.confidence.${insight.confidence}`),
      count: insight.evidenceCount,
      start: insight.periodStart,
      end: insight.periodEnd,
    });
  }
  const confidence = insight.confidence === "high" ? "há evidência consistente" : insight.confidence === "moderate" ? "há alguns sinais repetidos" : "há sinais iniciais";
  return `${insight.message} ${confidence} em ${insight.evidenceCount} observações entre ${insight.periodStart} e ${insight.periodEnd}. Isto descreve uma associação observada, não uma causa.`;
}
