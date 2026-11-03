import { appendPersonalEvents, readPersonalEvents } from "./personalEventStorage";
import { makePersonalEvent } from "./personalEvent";

export type ExperimentCheck = { date: string; done: boolean; effect: "better" | "same" | "worse" | null };
export type PersonalExperiment = {
  id: string; templateId?: string; hypothesis: string; metric: string; startedAt: string; completedAt?: string;
  baseline?: number; target?: number; status: "active" | "complete"; outcome?: string; durationDays?: number; checks?: ExperimentCheck[];
};
export type ExperimentTemplate = { id: string; days: number; titleKey: string; hypothesisKey: string; actionKey: string; metricKey: string };
export const EXPERIMENT_KEY = "confia_personal_experiments_v1";

export const EXPERIMENT_TEMPLATES: ExperimentTemplate[] = [
  { id:"wind_down", days:14, titleKey:"experiments.templates.windDown.title", hypothesisKey:"experiments.templates.windDown.hypothesis", actionKey:"experiments.templates.windDown.action", metricKey:"experiments.templates.windDown.metric" },
  { id:"short_walk", days:7, titleKey:"experiments.templates.shortWalk.title", hypothesisKey:"experiments.templates.shortWalk.hypothesis", actionKey:"experiments.templates.shortWalk.action", metricKey:"experiments.templates.shortWalk.metric" },
  { id:"screen_pause", days:7, titleKey:"experiments.templates.screenPause.title", hypothesisKey:"experiments.templates.screenPause.hypothesis", actionKey:"experiments.templates.screenPause.action", metricKey:"experiments.templates.screenPause.metric" },
  { id:"worry_note", days:14, titleKey:"experiments.templates.worryNote.title", hypothesisKey:"experiments.templates.worryNote.hypothesis", actionKey:"experiments.templates.worryNote.action", metricKey:"experiments.templates.worryNote.metric" },
];

export function readExperiments(): PersonalExperiment[] {
  try {
    const value = JSON.parse(localStorage.getItem(EXPERIMENT_KEY) || "[]");
    return Array.isArray(value) ? value.filter(item => item && typeof item.id === "string" && typeof item.startedAt === "string") : [];
  } catch { return []; }
}
export function writeExperiments(items: PersonalExperiment[]): boolean {
  try {
    localStorage.setItem(EXPERIMENT_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event("confia:experiments-updated"));
    return true;
  } catch { return false; }
}
export function experimentSummary(item: PersonalExperiment) {
  const checks=item.checks||[]; const done=checks.filter(x=>x.done); const better=done.filter(x=>x.effect==="better").length; const worse=done.filter(x=>x.effect==="worse").length;
  const minimumEvidence = item.durationDays ? Math.max(4, Math.ceil(item.durationDays * 0.5)) : 3;
  return { total:checks.length, done:done.length, better, same:done.filter(x=>x.effect==="same").length, worse, enough:done.length>=minimumEvidence, minimumEvidence, direction: better>worse ? "better" : worse>better ? "worse" : "mixed" } as const;
}
export function recommendExperimentTemplate(): ExperimentTemplate {
  const events=readPersonalEvents().slice(-80); const text=JSON.stringify(events).toLowerCase();
  if (text.includes("sleep") || text.includes("sono")) return EXPERIMENT_TEMPLATES[0];
  if (text.includes("rumination") || text.includes("pensamento")) return EXPERIMENT_TEMPLATES[3];
  if (text.includes("stress") || text.includes("work") || text.includes("trabalho")) return EXPERIMENT_TEMPLATES[1];
  return EXPERIMENT_TEMPLATES[2];
}
export function recordExperimentStarted(item: PersonalExperiment) {
  const now = new Date().toISOString();
  appendPersonalEvents([makePersonalEvent({
    id: `pe_experiment_start_${item.id}`,
    type: "experiment",
    timestamp: now,
    source: "microexperiment",
    value: true,
    metadata: { experimentId: item.id, phase: "start", hypothesis: item.hypothesis, start: item.startedAt, targetMetric: item.metric, status: "active" },
  })]);
}

export function recordExperimentMeasure(item: PersonalExperiment, check: ExperimentCheck) {
  const now=new Date().toISOString();
  appendPersonalEvents([makePersonalEvent({ id:`pe_experiment_measure_${item.id}_${check.date}`, type:"experiment", timestamp:now, source:"microexperiment", value:check.effect||check.done, metadata:{ experimentId:item.id, phase:"measure", hypothesis:item.hypothesis, targetMetric:item.metric, completion:check.done?"done":"not_done", outcome:check.effect||undefined } })]);
}

export function recordExperimentCompleted(item: PersonalExperiment) {
  const now = new Date().toISOString();
  const summary = experimentSummary(item);
  const outcome = summary.enough ? summary.direction : "insufficient_data";
  appendPersonalEvents([makePersonalEvent({
    id: `pe_experiment_complete_${item.id}`,
    type: "experiment",
    timestamp: now,
    source: "microexperiment",
    value: true,
    metadata: { experimentId: item.id, phase: "complete", hypothesis: item.hypothesis, start: item.startedAt, end: item.completedAt || now.slice(0, 10), targetMetric: item.metric, outcome, status: "complete", evidenceCount: summary.done, minimumEvidence: summary.minimumEvidence },
  })]);
}
export function getExperimentLearningForSOS() {
  const completed=readExperiments().filter(x=>x.status==="complete").map(x=>({item:x, summary:experimentSummary(x)})).filter(x=>x.summary.enough && x.summary.direction==="better").sort((a,b)=>b.summary.better-a.summary.better);
  return completed[0] || null;
}
