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

// Same bounded local diagnostics as existing events; no external tracking or new SDK.
let previousScreen="";
export function recordPersonalScreenView(screen:string){if(screen===previousScreen)return;previousScreen=screen;recordPersonalAnalytics("screen_view",screen);}
