export type PersonalInsightFeedbackValue = "useful" | "dismissed";
export interface PersonalInsightFeedback {
  insightId: string;
  value: PersonalInsightFeedbackValue;
  updatedAt: string;
}
const KEY = "confia_personal_insight_feedback_v1";
export function readPersonalInsightFeedback(): Record<string, PersonalInsightFeedback> {
  if (typeof localStorage === "undefined") return {};
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || "{}");
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return Object.fromEntries(Object.entries(parsed).filter(([, value]) => {
      const item = value as any;
      return item && (item.value === "useful" || item.value === "dismissed") && typeof item.updatedAt === "string";
    })) as Record<string, PersonalInsightFeedback>;
  } catch { return {}; }
}
export function savePersonalInsightFeedback(insightId: string, value: PersonalInsightFeedbackValue): void {
  if (!insightId || typeof localStorage === "undefined") return;
  const current = readPersonalInsightFeedback();
  current[insightId] = { insightId, value, updatedAt: new Date().toISOString() };
  try { localStorage.setItem(KEY, JSON.stringify(current)); } catch { /* Optional feedback must never block the app. */ }
}
