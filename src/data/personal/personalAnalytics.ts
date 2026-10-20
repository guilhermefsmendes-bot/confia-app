export type PersonalAnalyticsEvent =
  | "screen_view"
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
  | "experiment_started"
  | "experiment_completed"
  | "personal_map_viewed"
  | "return_after_insight";

const KEY = "confia_personal_analytics_v1";
const MAX = 500;

export function recordPersonalAnalytics(event: PersonalAnalyticsEvent,screen?:string): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(KEY);
    const history = raw ? JSON.parse(raw) : [];
    const next = Array.isArray(history) ? history : [];
    next.push({ event, timestamp: new Date().toISOString(),...(screen?{screen}: {}) });
    localStorage.setItem(KEY, JSON.stringify(next.slice(-MAX)));
  } catch {
    // Analytics must never block product behavior.
  }
}

export function readPersonalAnalytics(): Array<{ event: PersonalAnalyticsEvent; timestamp: string }> {
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
