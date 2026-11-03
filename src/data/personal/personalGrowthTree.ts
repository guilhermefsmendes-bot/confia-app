import type { PersonalEvent } from "./personalEvent";
import type { PersonalInsight } from "./personalInsights";
import { experimentSummary, type PersonalExperiment } from "./personalExperiments";
export type GrowthDimension = "self_awareness" | "habits" | "relationships" | "rest" | "self_regulation" | "goals";
export type GrowthBranch = { id: GrowthDimension; evidenceCount: number; activeDays: number; learned: boolean };
const validLocalDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(new Date(value + "T12:00:00").getTime()) && new Date(value + "T12:00:00").toISOString().slice(0, 10) === value;
const valid = (event: PersonalEvent) => typeof event.localDate === "string" && validLocalDate(event.localDate) && Number.isFinite(new Date(event.timestamp).getTime());
const isRestEvent = (event: PersonalEvent) => {
  const metadata = event.metadata ?? {};
  const descriptor = [metadata.habitId, metadata.habitName, metadata.category].filter(value => typeof value === "string").join(" ").toLowerCase();
  return (event.type === "habit" && /sleep|sono|rest|descanso/.test(descriptor)) || (event.type === "context" && /sleep|sono|rest|descanso/.test(descriptor));
};
const hasLearningInsight = (insights: PersonalInsight[], types: PersonalInsight["type"][]) =>
  insights.some(insight => types.includes(insight.type) && insight.evidenceCount >= 4 && (insight.confidence === "moderate" || insight.confidence === "high") && insight.status !== "disappeared");
const hasRestLearning = (insights: PersonalInsight[]) =>
  insights.some(insight => insight.type === "habit_association" && insight.evidenceCount >= 4 && (insight.confidence === "moderate" || insight.confidence === "high") && insight.status !== "disappeared" && insight.variables.some(value => /sleep|rest|sono|descanso/i.test(value)));
const hasDistinctExperimentEvidence = (item: PersonalExperiment) => {
  const summary = experimentSummary(item);
  const dates = new Set((item.checks ?? []).filter(check => check.done && validLocalDate(check.date)).map(check => check.date));
  return summary.enough && dates.size >= summary.minimumEvidence;
};
export function buildPersonalGrowthTree(events: PersonalEvent[], insights: PersonalInsight[], experiments: PersonalExperiment[] = []): GrowthBranch[] {
  const source = events.filter(valid);
  const completedExperiments = experiments.filter(item => item.status === "complete" && hasDistinctExperimentEvidence(item) && Number.isFinite(new Date(item.completedAt || item.startedAt).getTime()));
  const habitExperiments = completedExperiments.filter(item => item.templateId === "short_walk" || item.templateId === "screen_pause");
  const regulationExperiments = completedExperiments.filter(item => item.templateId === "worry_note");
  const restExperiments = completedExperiments.filter(item => item.templateId === "wind_down");
  const branches: Array<{ id: GrowthDimension; rows: PersonalEvent[]; learned: boolean }> = [
    { id: "self_awareness", rows: source.filter(event => ["mood", "checkin", "context"].includes(event.type)), learned: hasLearningInsight(insights, ["trend", "recovery_pattern", "personal_change", "time_of_day", "weekday"]) },
    { id: "habits", rows: source.filter(event => ["habit", "habit_challenge", "nutrition", "exercise"].includes(event.type)), learned: hasLearningInsight(insights, ["habit_association"]) },
    { id: "relationships", rows: source.filter(event => event.type === "context" && /relation|social|friend|family|partner|amig|fam[ií]l|rela[cç][aã]o/i.test(String(event.metadata?.category ?? ""))), learned: false },
    { id: "rest", rows: source.filter(isRestEvent), learned: hasRestLearning(insights) },
    { id: "self_regulation", rows: source.filter(event => event.type === "intervention" && Number.isFinite(event.metadata?.initialIntensity) && Number.isFinite(event.metadata?.finalIntensity)), learned: hasLearningInsight(insights, ["intervention_effect"]) },
    { id: "goals", rows: source.filter(event => event.type === "goal" && (event.value === true || Number(event.metadata?.completedCount ?? 0) > 0)), learned: false },
  ];
  return branches.map(branch => {
    const extraExperiments = branch.id === "habits" ? habitExperiments : branch.id === "self_regulation" ? regulationExperiments : branch.id === "rest" ? restExperiments : [];
    const experimentDates = extraExperiments.map(item => (item.completedAt || item.startedAt).slice(0, 10));
    const days = new Set([...branch.rows.map(event => event.localDate), ...experimentDates]);
    const evidenceCount = branch.rows.length + extraExperiments.length, activeDays = days.size;
    let learned = branch.learned;
    if (branch.id === "habits" || branch.id === "rest") learned ||= extraExperiments.length > 0;
    if (branch.id === "relationships") learned = evidenceCount >= 2 && activeDays >= 2;
    if (branch.id === "self_regulation") learned ||= (branch.rows.length >= 2 && activeDays >= 2) || extraExperiments.length > 0;
    if (branch.id === "goals") learned = evidenceCount >= 2 && activeDays >= 2;
    return { id: branch.id, evidenceCount, activeDays, learned };
  });
}
