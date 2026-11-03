import { isValidPersonalLocalDate, type PersonalEvent } from "./personalEvent";
import type { PersonalInsight } from "./personalInsights";
import { experimentSummary, type PersonalExperiment } from "./personalExperiments";

export interface MonthlyExperimentLearning {
  experiment: PersonalExperiment;
  evidenceCount: number;
  enough: boolean;
  direction: "better" | "worse" | "mixed";
}

export interface PersonalMonthlyLearning {
  month: string;
  eventCount: number;
  activeDays: number;
  changed: PersonalInsight[];
  remains: PersonalInsight[];
  observations: PersonalInsight[];
  experiments: MonthlyExperimentLearning[];
  hasEnoughRecords: boolean;
}

/**
 * Creates a cautious monthly reflection from the user's own records.
 * It describes observed patterns and self-reported experiment results;
 * it never infers causality or clinical effectiveness.
 */
export function buildPersonalMonthlyLearning(
  events: readonly PersonalEvent[],
  insights: readonly PersonalInsight[],
  experiments: readonly PersonalExperiment[],
  now = new Date(),
): PersonalMonthlyLearning {
  const year = now.getFullYear();
  const monthNumber = String(now.getMonth() + 1).padStart(2, "0");
  const month = `${year}-${monthNumber}`;
  const monthStart = `${month}-01`;
  const monthEnd = new Date(year, now.getMonth() + 1, 0).getDate();
  const monthLastDate = `${month}-${String(monthEnd).padStart(2, "0")}`;

  const monthEvents = events.filter(event =>
    isValidPersonalLocalDate(event.localDate) &&
    event.localDate >= monthStart &&
    event.localDate <= monthLastDate &&
    Number.isFinite(new Date(event.timestamp).getTime()),
  );
  const activeDays = new Set(monthEvents.map(event => event.localDate)).size;
  const hasEnoughRecords = monthEvents.length >= 4 && activeDays >= 3;
  const monthInsights = insights.filter(insight =>
    insight.lastSeen >= monthStart &&
    insight.lastSeen <= monthLastDate,
  );

  const changed = hasEnoughRecords ? monthInsights.filter(insight =>
    insight.status === "changed" ||
    insight.status === "weakened" ||
    insight.status === "disappeared" ||
    insight.novelty === "returning",
  ) : [];
  const remains = hasEnoughRecords ? monthInsights.filter(insight =>
    insight.status === "consistent" &&
    !changed.some(item => item.id === insight.id),
  ) : [];
  // With sparse data, keep possible signals as observations rather than
  // describing them as a monthly change or a stable pattern.
  const observations = hasEnoughRecords
    ? monthInsights.filter(insight =>
        !changed.some(item => item.id === insight.id) &&
        !remains.some(item => item.id === insight.id),
      )
    : monthInsights;

  const monthExperiments = experiments
    .filter(item =>
      (item.startedAt >= monthStart && item.startedAt <= monthLastDate) ||
      Boolean(item.completedAt && item.completedAt >= monthStart && item.completedAt <= monthLastDate) ||
      (item.checks || []).some(check => check.date >= monthStart && check.date <= monthLastDate),
    )
    .map(experiment => {
      const result = experimentSummary(experiment);
      return {
        experiment,
        evidenceCount: result.done,
        enough: result.enough,
        direction: result.direction,
      };
    });

  return {
    month,
    eventCount: monthEvents.length,
    activeDays,
    changed,
    remains,
    observations,
    experiments: monthExperiments,
    hasEnoughRecords,
  };
}
