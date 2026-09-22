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
  { id:"wind_down", days:5, titleKey:"experiments.templates.windDown.title", hypothesisKey:"experiments.templates.windDown.hypothesis", actionKey:"experiments.templates.windDown.action", metricKey:"experiments.templates.windDown.metric" },
  { id:"short_walk", days:5, titleKey:"experiments.templates.shortWalk.title", hypothesisKey:"experiments.templates.shortWalk.hypothesis", actionKey:"experiments.templates.shortWalk.action", metricKey:"experiments.templates.shortWalk.metric" },
  { id:"screen_pause", days:5, titleKey:"experiments.templates.screenPause.title", hypothesisKey:"experiments.templates.screenPause.hypothesis", actionKey:"experiments.templates.screenPause.action", metricKey:"experiments.templates.screenPause.metric" },
  { id:"worry_note", days:5, titleKey:"experiments.templates.worryNote.title", hypothesisKey:"experiments.templates.worryNote.hypothesis", actionKey:"experiments.templates.worryNote.action", metricKey:"experiments.templates.worryNote.metric" },
];

export function readExperiments(): PersonalExperiment[] { try { const r=localStorage.getItem(EXPERIMENT_KEY); return r ? JSON.parse(r) : []; } catch { return []; } }
export function writeExperiments(items: PersonalExperiment[]) { localStorage.setItem(EXPERIMENT_KEY, JSON.stringify(items)); window.dispatchEvent(new Event("confia:experiments-updated")); }
export function experimentSummary(item: PersonalExperiment) {
  const checks=item.checks||[]; const done=checks.filter(x=>x.done); const better=done.filter(x=>x.effect==="better").length; const worse=done.filter(x=>x.effect==="worse").length;
  return { total:checks.length, done:done.length, better, same:done.filter(x=>x.effect==="same").length, worse, enough:done.length>=3, direction: better>worse ? "better" : worse>better ? "worse" : "mixed" } as const;
}
export function recommendExperimentTemplate(): ExperimentTemplate {
  const events=readPersonalEvents().slice(-80); const text=JSON.stringify(events).toLowerCase();
  if (text.includes("sleep") || text.includes("sono")) return EXPERIMENT_TEMPLATES[0];
  if (text.includes("rumination") || text.includes("pensamento")) return EXPERIMENT_TEMPLATES[3];
  if (text.includes("stress") || text.includes("work") || text.includes("trabalho")) return EXPERIMENT_TEMPLATES[1];
  return EXPERIMENT_TEMPLATES[2];
}
export function recordExperimentMeasure(item: PersonalExperiment, check: ExperimentCheck) {
  const now=new Date().toISOString();
  appendPersonalEvents([makePersonalEvent({ id:`pe_experiment_measure_${item.id}_${check.date}`, type:"experiment", timestamp:now, source:"microexperiment", value:check.effect||check.done, metadata:{ experimentId:item.id, phase:"measure", hypothesis:item.hypothesis, targetMetric:item.metric, completion:check.done?"done":"not_done", outcome:check.effect||undefined } })]);
}
export function getExperimentLearningForSOS() {
  const completed=readExperiments().filter(x=>x.status==="complete").map(x=>({item:x, summary:experimentSummary(x)})).filter(x=>x.summary.enough && x.summary.direction==="better").sort((a,b)=>b.summary.better-a.summary.better);
  return completed[0] || null;
}
