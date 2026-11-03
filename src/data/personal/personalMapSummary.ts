import { isValidPersonalLocalDate, type PersonalEvent } from "./personalEvent";
import type { PersonalInsight } from "./personalInsights";
import type { PersonalExperiment } from "./personalExperiments";

export type PersonalMapStage = "insufficient" | "first_signals" | "emerging" | "consistent" | "changing";

export interface PersonalMapSummary {
  eventCount: number;
  activeDays: number;
  insightCount: number;
  activeExperiments: number;
  completedExperiments: number;
  firstDate?: string;
  latestDate?: string;
  stage: PersonalMapStage;
}

/** Uses existing insight evidence and explicit thresholds; raw event counts never become a diagnosis. */
export function buildPersonalMapSummary(
  events: readonly PersonalEvent[],
  insights: readonly PersonalInsight[],
  experiments: readonly PersonalExperiment[],
): PersonalMapSummary {
  const validEvents = events.filter(event =>
    Number.isFinite(new Date(event.timestamp).getTime()) &&
    isValidPersonalLocalDate(event.localDate)
  );
  const dates = [...new Set(validEvents.map(event => event.localDate))].sort();

  let stage: PersonalMapStage = "insufficient";
  if (insights.some(insight => insight.status === "changed" || insight.status === "weakened" || insight.novelty === "returning")) stage = "changing";
  else if (insights.some(insight => insight.status === "consistent" && insight.confidence === "high")) stage = "consistent";
  else if (insights.some(insight => insight.status === "possible" || insight.status === "emerging")) stage = "emerging";
  else if (validEvents.length >= 4 && dates.length >= 3) stage = "first_signals";

  return {
    eventCount: validEvents.length,
    activeDays: dates.length,
    insightCount: insights.filter(insight => insight.status !== "disappeared").length,
    activeExperiments: experiments.filter(item => item.status === "active").length,
    completedExperiments: experiments.filter(item => item.status === "complete").length,
    firstDate: dates[0],
    latestDate: dates[dates.length - 1],
    stage,
  };
}
