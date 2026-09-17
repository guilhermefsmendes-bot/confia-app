import type { PersonalEvent } from "./personalEvent";

export type InsightType = "trend" | "time_of_day" | "weekday" | "habit_association" | "intervention_effect" | "recovery_pattern" | "repeated_need" | "personal_change" | "pattern_disappearance";
export type InsightStatus = "active" | "weakened" | "changed" | "disappeared";

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
  novelty: "new" | "known" | "returning";
  actionability: "low" | "medium" | "high";
  supportingEventIds: string[];
  supersedesInsightId?: string;
  message: string;
}

const mood = (event: PersonalEvent) => event.type === "mood" || event.type === "checkin" ? typeof event.value === "number" ? event.value : undefined : undefined;
const avg = (values: number[]) => values.length ? values.reduce((a, b) => a + b, 0) / values.length : undefined;

export function calculateInsightConfidence(observations: number, consistency: number, recency: number, dispersion: number, effectSize: number, completeness: number): PersonalInsight["confidence"] {
  const score = Math.max(0, Math.min(1, observations / 10)) * 0.25 + consistency * 0.2 + recency * 0.15 + dispersion * 0.1 + Math.min(1, effectSize) * 0.2 + completeness * 0.1;
  if (score >= 0.72 && observations >= 6) return "high";
  if (score >= 0.48 && observations >= 3) return "moderate";
  return "low";
}

export function buildPersonalInsights(events: PersonalEvent[], now = new Date()): PersonalInsight[] {
  const valid = events.filter(event => mood(event) !== undefined && Number.isFinite(new Date(event.timestamp).getTime())).sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  if (valid.length < 3) return [];
  const start = new Date(now.getTime() - 30 * 86400000);
  const recent = valid.filter(event => new Date(event.timestamp).getTime() >= start.getTime());
  if (recent.length < 3) return [];
  const values = recent.map(event => mood(event)!);
  const half = Math.floor(values.length / 2);
  const early = avg(values.slice(0, half));
  const late = avg(values.slice(half));
  if (early === undefined || late === undefined) return [];
  const delta = late - early;
  const direction: PersonalInsight["direction"] = delta >= 0.75 ? "up" : delta <= -0.75 ? "down" : "stable";
  const confidence = calculateInsightConfidence(recent.length, Math.min(1, Math.abs(delta) / 2), Math.min(1, recent.length / 14), 0.7, Math.abs(delta) / 2, Math.min(1, new Set(recent.map(event => event.localDate)).size / 14));
  if (direction === "stable") return [];

  return [{
    id: `insight_trend_30d_${recent[recent.length - 1].localDate}`,
    type: "trend",
    generatedAt: now.toISOString(),
    periodStart: recent[0].localDate,
    periodEnd: recent[recent.length - 1].localDate,
    evidenceCount: recent.length,
    confidence,
    direction,
    variables: ["mood"],
    status: "active",
    novelty: "new",
    actionability: "medium",
    supportingEventIds: recent.map(event => event.id),
    message: direction === "up" ? "Nos teus registos recentes, o teu estado médio tem subido." : "Nos teus registos recentes, o teu estado médio tem descido.",
  }];
}

export function explainInsight(insight: PersonalInsight): string {
  const confidence = insight.confidence === "high" ? "há evidência consistente" : insight.confidence === "moderate" ? "há alguns sinais repetidos" : "há sinais iniciais";
  return `${insight.message} ${confidence} em ${insight.evidenceCount} observações entre ${insight.periodStart} e ${insight.periodEnd}. Isto descreve uma associação observada, não uma causa.`;
}
