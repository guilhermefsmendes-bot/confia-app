import type { PersonalInsight } from "./personalInsights";

type InsightHistory = Record<string, { firstSeen: string; lastSeen: string; timesShown: number; status: PersonalInsight["status"]; type?: PersonalInsight["type"] }>;
const KEY = "confia_personal_insight_lifecycle_v1";

function read(): InsightHistory {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    const value = raw ? JSON.parse(raw) : {};
    return value && typeof value === "object" ? value as InsightHistory : {};
  } catch { return {}; }
}

function write(value: InsightHistory): void {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(KEY, JSON.stringify(value)); } catch { /* non-blocking */ }
}

export function applyInsightLifecycle(insights: PersonalInsight[]): PersonalInsight[] {
  const history = read();
  const currentFingerprints = new Set(insights.map(insight => insight.fingerprint));
  const resolved = insights.map(insight => {
    const previous = history[insight.fingerprint];
    if (!previous) return insight;
    const statusChanged = previous.status !== insight.status;
    return {
      ...insight,
      firstSeen: previous.firstSeen,
      timesShown: previous.timesShown,
      novelty: (statusChanged ? "returning" : "known") as PersonalInsight["novelty"],
      supersedesInsightId: statusChanged ? `insight_${insight.fingerprint}` : insight.supersedesInsightId,
    };
  });
  const now = new Date();
  for (const [fingerprint, previous] of Object.entries(history)) {
    if (currentFingerprints.has(fingerprint) || !previous.lastSeen) continue;
    if (previous.status !== "consistent" && previous.status !== "possible") continue;
    const lastSeenAt = new Date(previous.lastSeen);
    const ageDays = (now.getTime() - lastSeenAt.getTime()) / 86400000;
    if (!Number.isFinite(ageDays) || ageDays < 14) continue;
    resolved.push({
      id: `insight_disappearance_${fingerprint.replace(/[^a-z0-9]+/gi, "_")}`,
      type: "pattern_disappearance", generatedAt: now.toISOString(),
      periodStart: previous.firstSeen, periodEnd: previous.lastSeen, evidenceCount: 0,
      confidence: "low", direction: "mixed", variables: [previous.type ?? "pattern"],
      status: "disappeared", fingerprint: `disappearance:${fingerprint}`,
      firstSeen: previous.firstSeen, lastSeen: previous.lastSeen, timesShown: 0, novelty: "new",
      actionability: "low", supportingEventIds: [],
      message: "Um padrão que aparecia antes deixou de surgir nos registos recentes.",
      messageKey: "personalInsights.patternDisappearance",
    });
  }
  return resolved;
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
      type: insight.type,
    };
  }
  write(history);
}
