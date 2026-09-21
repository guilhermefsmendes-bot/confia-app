import type { PersonalEvent } from "./personalEvent";
import { buildPersonalInsights } from "./personalInsights";
import { findAnalogousMoments } from "./personalModel";

export type ReplayMoment = {
  id: string;
  date: string;
  mood: number;
  note?: string;
  recovery?: { date: string; mood: number; daysLater: number };
};

const isMood = (event: PersonalEvent) =>
  (event.type === "mood" || event.type === "checkin") &&
  typeof event.value === "number";

const dayGap = (a: string, b: string) =>
  Math.max(0, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000));

export function buildReplayMoments(events: PersonalEvent[], limit = 4): ReplayMoment[] {
  const moods = events.filter(isMood).sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  const current = moods.at(-1);
  if (!current) return [];

  return findAnalogousMoments(events, current, limit).map(moment => {
    const index = moods.findIndex(item => item.id === moment.id);
    const recovery = moods.slice(index + 1).find(item =>
      dayGap(moment.localDate, item.localDate) <= 7 &&
      Number(item.value) >= Number(moment.value) + 2,
    );
    return {
      id: moment.id,
      date: moment.localDate,
      mood: Number(moment.value),
      note: typeof moment.metadata?.note === "string" ? moment.metadata.note : undefined,
      recovery: recovery
        ? { date: recovery.localDate, mood: Number(recovery.value), daysLater: dayGap(moment.localDate, recovery.localDate) }
        : undefined,
    };
  });
}

export function buildPersonalTwinSummary(events: PersonalEvent[]) {
  const insights = buildPersonalInsights(events);
  const strongest = insights
    .slice()
    .sort((a, b) => {
      const rank = { high: 3, moderate: 2, low: 1 };
      return rank[b.confidence] - rank[a.confidence] || b.evidenceCount - a.evidenceCount;
    })
    .slice(0, 3);

  const interventions = events
    .filter(event => event.type === "intervention")
    .filter(event =>
      typeof event.metadata?.initialIntensity === "number" &&
      typeof event.metadata?.finalIntensity === "number",
    );
  const helpful = interventions.filter(event =>
    Number(event.metadata?.finalIntensity) < Number(event.metadata?.initialIntensity),
  );

  return {
    observationCount: events.length,
    insightCount: insights.length,
    strongest,
    interventionCount: interventions.length,
    helpfulInterventionRate: interventions.length
      ? Math.round((helpful.length / interventions.length) * 100)
      : undefined,
  };
}
