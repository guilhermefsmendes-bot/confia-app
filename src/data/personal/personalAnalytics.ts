import { getLocalCalendarDate } from "../../utils/date";

export type PersonalAnalyticsEvent =
  | "screen_view"
  | "app_opened"
  | "activation_completed"
  | "retention_d1"
  | "retention_d7"
  | "retention_d30"
  | "intervention_after_rating"
  | "experiment_started"
  | "experiment_checkin"
  | "experiment_completed"
  | "monthly_report_exported"
  | "zen_experience_started"
  | "zen_experience_completed"
  | "zen_experience_touch_mode"
  | "zen_experience_microphone_mode"
  | "wellbeing_plan_started"
  | "wellbeing_plan_completed"
  | "habit_created"
  | "exercise_log_added"
  | "sleep_log_added"
  | "nutrition_log_added"
  | "habit_milestone_reached"
  | "check_in_completed"
  | "insight_viewed"
  | "insight_expanded"
  | "insight_useful"
  | "insight_dismissed"
  | "personal_map_viewed"
  | "return_after_insight";

const KEY = "confia_personal_analytics_v1";
const MAX = 500;

export function recordPersonalAnalytics(event: PersonalAnalyticsEvent,context?:string): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(KEY);
    const history = raw ? JSON.parse(raw) : [];
    const next = Array.isArray(history) ? history : [];
    next.push({ event, timestamp: new Date().toISOString(),...(context?{context}: {}) });
    localStorage.setItem(KEY, JSON.stringify(next.slice(-MAX)));
  } catch {
    // Analytics must never block product behavior.
  }
}

export function readPersonalAnalytics(): Array<{ event: PersonalAnalyticsEvent; timestamp: string; context?: string }> {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    const value = raw ? JSON.parse(raw) : [];
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

// Screen views are frequent during navigation. Queue them in memory and persist
// them together when the browser is idle, instead of synchronously parsing and
// rewriting the analytics history on every tab click.
let previousScreen = "";
let pendingScreenViews: string[] = [];
let screenFlushScheduled = false;
let screenIdleId: number | undefined;
let screenTimerId: number | undefined;

function flushScreenViews(): void {
  screenFlushScheduled = false;
  screenIdleId = undefined;
  screenTimerId = undefined;
  if (pendingScreenViews.length === 0 || typeof window === "undefined") return;

  const batch = pendingScreenViews;
  pendingScreenViews = [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const history = raw ? JSON.parse(raw) : [];
    const next = Array.isArray(history) ? history : [];
    const timestamp = new Date().toISOString();
    for (const screen of batch) {
      next.push({ event: "screen_view", timestamp, screen });
    }
    window.localStorage.setItem(KEY, JSON.stringify(next.slice(-MAX)));
  } catch {
    // Analytics is optional and must never block navigation or app behavior.
  }
}

function scheduleScreenFlush(): void {
  if (screenFlushScheduled || typeof window === "undefined") return;
  screenFlushScheduled = true;
  const requestIdle = (window as any).requestIdleCallback;
  if (typeof requestIdle === "function") {
    screenIdleId = requestIdle(flushScreenViews, { timeout: 1000 });
  } else {
    screenTimerId = window.setTimeout(flushScreenViews, 0);
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("pagehide", flushScreenViews);
}

export function recordPersonalScreenView(screen: string): void {
  if (screen === previousScreen) return;
  previousScreen = screen;
  pendingScreenViews.push(screen);
  scheduleScreenFlush();
}


const LIFECYCLE_KEY = "confia_product_lifecycle_local_v1";
function dayDistance(first: string, current: string): number {
  const a = Date.parse(`${first}T12:00:00Z`), b = Date.parse(`${current}T12:00:00Z`);
  return Number.isFinite(a) && Number.isFinite(b) ? Math.max(0, Math.floor((b-a)/86400000)) : 0;
}
export function getRetentionMilestones(firstOpenedOn: string, currentDate: string): Array<"retention_d1" | "retention_d7" | "retention_d30"> {
  const age = dayDistance(firstOpenedOn, currentDate);
  return ([ [1, "retention_d1"], [7, "retention_d7"], [30, "retention_d30"] ] as const)
    .filter(([days]) => age === days)
    .map(([, event]) => event);
}
export function recordAppOpenLifecycleMetrics(today = getLocalCalendarDate()): void {
  if (typeof localStorage === "undefined") return;
  try {
    const previous = JSON.parse(localStorage.getItem(LIFECYCLE_KEY) || "{}") as { firstOpenedOn?: string; lastOpenedOn?: string; milestones?: string[] };
    const firstOpenedOn = previous.firstOpenedOn || today;
    const milestones = new Set(previous.milestones || []);
    if (previous.lastOpenedOn !== today) recordPersonalAnalytics("app_opened");
    for (const event of getRetentionMilestones(firstOpenedOn, today)) {
      if (!milestones.has(event)) {
        recordPersonalAnalytics(event);
        milestones.add(event);
      }
    }
    localStorage.setItem(LIFECYCLE_KEY, JSON.stringify({ firstOpenedOn, lastOpenedOn: today, milestones: [...milestones] }));
  } catch { /* Local product metrics are optional and never block app startup. */ }
}
export function recordFirstActivation(): void {
  if (typeof localStorage === "undefined") return;
  try {
    if (localStorage.getItem("confia_first_activation_recorded_v1") === "1") return;
    recordPersonalAnalytics("activation_completed");
    localStorage.setItem("confia_first_activation_recorded_v1", "1");
  } catch { /* Optional local metric. */ }
}
