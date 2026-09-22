import type { PersonalEvent } from "./personalEvent";

export interface PersonalModel {
  generatedAt: string;
  observationCount: number;
  activeDays: number;
  completeness: number;
  dataQuality: "low" | "moderate" | "high";
  currentMood?: number;
  recentAverageMood?: number;
  baselineAverageMood?: number;
  moodDirection: "up" | "down" | "stable" | "unknown";
  repeatedNeeds: Array<{ need: string; count: number }>;
  recentInterventions: number;
  timeScales: Array<{ label: "24h" | "7d" | "30d" | "90d" | "history"; observationCount: number; activeDays: number; moodAverage?: number }>;
  personalChange?: { recent30d?: number; previous30d?: number; delta?: number; direction: "up" | "down" | "stable" | "unknown" };
}

const average = (values: number[]) => values.length ? values.reduce((a, b) => a + b, 0) / values.length : undefined;

function moodValue(event: PersonalEvent): number | undefined {
  return event.type === "mood" || event.type === "checkin" ? typeof event.value === "number" ? event.value : undefined : undefined;
}

export function buildPersonalModel(events: PersonalEvent[], now = new Date()): PersonalModel {
  const valid = events.filter(event => Number.isFinite(new Date(event.timestamp).getTime()));
  const sorted = [...valid].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  const moodEvents = sorted.filter(event => moodValue(event) !== undefined);
  const recentCutoff = now.getTime() - 7 * 86400000;
  const baselineCutoff = now.getTime() - 30 * 86400000;
  const recent = moodEvents.filter(event => new Date(event.timestamp).getTime() >= recentCutoff);
  const baseline = moodEvents.filter(event => new Date(event.timestamp).getTime() >= baselineCutoff && new Date(event.timestamp).getTime() < recentCutoff);
  const recentAverage = average(recent.map(event => moodValue(event)!));
  const baselineAverage = average(baseline.map(event => moodValue(event)!));
  const last = [...moodEvents].reverse().find(event => moodValue(event) !== undefined);

  const needCounts = new Map<string, number>();
  for (const event of sorted) {
    const need = event.metadata?.need;
    if (typeof need === "string" && need.trim()) needCounts.set(need, (needCounts.get(need) ?? 0) + 1);
  }
  const repeatedNeeds = [...needCounts.entries()].map(([need, count]) => ({ need, count })).filter(item => item.count >= 2).sort((a, b) => b.count - a.count);
  const activeDays = new Set(sorted.map(event => event.localDate)).size;
  const daysObserved = Math.min(30, Math.max(1, Math.ceil((now.getTime() - (sorted[0] ? new Date(sorted[0].timestamp).getTime() : now.getTime())) / 86400000) + 1));
  const completeness = Math.min(1, activeDays / daysObserved);

  const moodDays = new Set(moodEvents.map(event => event.localDate)).size;
  const dataQuality: PersonalModel["dataQuality"] = moodEvents.length >= 20 && moodDays >= 14 ? "high" : moodEvents.length >= 8 && moodDays >= 5 ? "moderate" : "low";

  let moodDirection: PersonalModel["moodDirection"] = "unknown";
  if (recentAverage !== undefined && baselineAverage !== undefined) {
    const delta = recentAverage - baselineAverage;
    moodDirection = delta >= 0.75 ? "up" : delta <= -0.75 ? "down" : "stable";
  }

  const scale = (label: "24h" | "7d" | "30d" | "90d" | "history", days?: number) => {
    const cutoff = days === undefined ? -Infinity : now.getTime() - days * 86400000;
    const selected = sorted.filter(event => new Date(event.timestamp).getTime() >= cutoff);
    const selectedMoods = selected.map(event => moodValue(event)).filter((value): value is number => value !== undefined);
    return { label, observationCount: selected.length, activeDays: new Set(selected.map(event => event.localDate)).size, moodAverage: average(selectedMoods) };
  };
  const timeScales = [scale("24h", 1), scale("7d", 7), scale("30d", 30), scale("90d", 90), scale("history")];
  const recent30d = timeScales[2].moodAverage;
  const previous30dEvents = moodEvents.filter(event => { const value = new Date(event.timestamp).getTime(); return value >= now.getTime() - 60 * 86400000 && value < now.getTime() - 30 * 86400000; });
  const previous30d = average(previous30dEvents.map(event => moodValue(event)!));
  const changeDelta = recent30d !== undefined && previous30d !== undefined ? recent30d - previous30d : undefined;
  const personalChange = { recent30d, previous30d, delta: changeDelta, direction: changeDelta === undefined ? "unknown" as const : changeDelta >= .75 ? "up" as const : changeDelta <= -.75 ? "down" as const : "stable" as const };

  return {
    generatedAt: now.toISOString(),
    observationCount: sorted.length,
    activeDays,
    completeness,
    dataQuality,
    currentMood: last ? moodValue(last) : undefined,
    recentAverageMood: recentAverage,
    baselineAverageMood: baselineAverage,
    moodDirection,
    repeatedNeeds,
    recentInterventions: sorted.filter(event => event.type === "intervention" && new Date(event.timestamp).getTime() >= recentCutoff).length,
    timeScales,
    personalChange,
  };
}

export function findAnalogousMoments(events: PersonalEvent[], target: PersonalEvent, limit = 3): PersonalEvent[] {
  const targetMood = moodValue(target);
  if (targetMood === undefined) return [];
  return events
    .filter(event => event.id !== target.id && moodValue(event) !== undefined)
    .map(event => ({ event, distance: Math.abs(moodValue(event)! - targetMood) }))
    .sort((a, b) => a.distance - b.distance || b.event.timestamp.localeCompare(a.event.timestamp))
    .slice(0, limit)
    .map(item => item.event);
}
