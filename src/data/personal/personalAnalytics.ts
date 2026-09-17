export type PersonalAnalyticsEvent =
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

export function recordPersonalAnalytics(event: PersonalAnalyticsEvent): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(KEY);
    const history = raw ? JSON.parse(raw) : [];
    const next = Array.isArray(history) ? history : [];
    next.push({ event, timestamp: new Date().toISOString() });
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
