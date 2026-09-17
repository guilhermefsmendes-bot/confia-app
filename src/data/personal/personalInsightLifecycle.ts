import type { PersonalInsight } from "./personalInsights";

type InsightHistory = Record<string, { firstSeen: string; lastSeen: string; timesShown: number; status: PersonalInsight["status"] }>;
const KEY = "confia_personal_insight_lifecycle_v1";

function read(): InsightHistory {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(KEY);
    const value = raw ? JSON.parse(raw) : {};
    return value && typeof value === "object" ? value as InsightHistory : {};
  } catch { return {}; }
}

function write(value: InsightHistory): void {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(KEY, JSON.stringify(value)); } catch { /* non-blocking */ }
}

export function applyInsightLifecycle(insights: PersonalInsight[]): PersonalInsight[] {
  const history = read();
  return insights.map(insight => {
    const previous = history[insight.fingerprint];
    if (!previous) return insight;
    const statusChanged = previous.status !== insight.status;
    return {
      ...insight,
      firstSeen: previous.firstSeen,
      timesShown: previous.timesShown,
      novelty: statusChanged ? "returning" : "known",
      supersedesInsightId: statusChanged ? `insight_${insight.fingerprint}` : insight.supersedesInsightId,
    };
  });
}

export function markInsightsShown(insights: PersonalInsight[]): void {
  if (!insights.length) return;
  const history = read();
  const now = new Date().toISOString();
  for (const insight of insights) {
    const previous = history[insight.fingerprint];
    history[insight.fingerprint] = {
      firstSeen: previous?.firstSeen ?? insight.firstSeen,
      lastSeen: now,
      timesShown: (previous?.timesShown ?? 0) + 1,
      status: insight.status,
    };
  }
  write(history);
}
