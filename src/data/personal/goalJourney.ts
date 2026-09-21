export type GoalLevel = "minimum" | "normal" | "extra";
export type GoalBlocker = "energy" | "anxiety" | "forgot" | "time" | "too_hard" | "motivation" | "other";

export type GoalJourney = {
  objectiveId: string;
  why?: string;
  minimum?: string;
  normal?: string;
  extra?: string;
  paused?: boolean;
  createdAt: string;
  attempts: Array<{
    date: string;
    outcome: "done" | "blocked";
    level?: GoalLevel;
    blocker?: GoalBlocker;
  }>;
};

const KEY = "confia_goal_journeys_v1";
const EVENT = "confia:goal-journeys-updated";

function readAll(): Record<string, GoalJourney> {
  if (typeof window === "undefined") return {};
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeAll(value: Record<string, GoalJourney>) {
  localStorage.setItem(KEY, JSON.stringify(value));
  window.dispatchEvent(new Event(EVENT));
}

export function readGoalJourney(id: string): GoalJourney | undefined {
  return readAll()[id];
}

export function readGoalJourneys(): GoalJourney[] {
  return Object.values(readAll());
}

export function ensureGoalJourney(id: string): GoalJourney {
  const all = readAll();
  if (all[id]) return all[id];
  const item: GoalJourney = { objectiveId: id, createdAt: new Date().toISOString(), attempts: [] };
  all[id] = item; writeAll(all); return item;
}

export function updateGoalJourney(id: string, patch: Partial<Omit<GoalJourney, "objectiveId" | "attempts" | "createdAt">>) {
  const all = readAll();
  const current = all[id] ?? { objectiveId: id, createdAt: new Date().toISOString(), attempts: [] };
  all[id] = { ...current, ...patch };
  writeAll(all);
}

export function recordGoalAttempt(id: string, attempt: GoalJourney["attempts"][number]) {
  const all = readAll();
  const current = all[id] ?? { objectiveId: id, createdAt: new Date().toISOString(), attempts: [] };
  all[id] = { ...current, attempts: [...current.attempts, attempt].slice(-120) };
  writeAll(all);
}

export function summarizeGoalJourney(journey?: GoalJourney) {
  if (!journey) return { done: 0, blocked: 0, topBlocker: undefined as GoalBlocker | undefined, topBlockerCount: 0, returnAfterGap: false };
  const done = journey.attempts.filter(a => a.outcome === "done").length;
  const blockedAttempts = journey.attempts.filter(a => a.outcome === "blocked" && a.blocker);
  const counts = new Map<GoalBlocker, number>();
  blockedAttempts.forEach(a => counts.set(a.blocker!, (counts.get(a.blocker!) || 0) + 1));
  const top = [...counts.entries()].sort((a,b) => b[1] - a[1])[0];
  const dates = journey.attempts.filter(a => a.outcome === "done").map(a => new Date(a.date).getTime()).sort((a,b)=>a-b);
  const returnAfterGap = dates.some((date, i) => i > 0 && date - dates[i-1] >= 5 * 86400000);
  return { done, blocked: blockedAttempts.length, topBlocker: top?.[0], topBlockerCount: top?.[1] || 0, returnAfterGap };
}

export const GOAL_JOURNEYS_UPDATED_EVENT = EVENT;
