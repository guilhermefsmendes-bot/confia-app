import type { DailyRating } from "../types";
export function normalizeLegacyRating(value: number | null): number | null {
  if (value === null || value === undefined) return null;
  if (!Number.isFinite(value)) return 1;
  return Math.min(10, Math.max(1, Math.round((value / 10) * 9 + 1)));
}
function isValidLocalDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

export function normalizeDailyRatings(values: unknown): DailyRating[] {
  if (!Array.isArray(values)) return [];
  return values.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object" && isValidLocalDate((item as any).date)))
    .map(item => {
      const normalizeCurrent = (value: unknown) => value === null || value === undefined ? null : Math.min(10, Math.max(1, Math.round(Number.isFinite(Number(value)) ? Number(value) : 1)));
      const normalized = item.scaleVersion === 2
        ? { morning: normalizeCurrent(item.morning), afternoon: normalizeCurrent(item.afternoon) }
        : { morning: normalizeLegacyRating(typeof item.morning === "number" ? item.morning : null), afternoon: normalizeLegacyRating(typeof item.afternoon === "number" ? item.afternoon : null) };
      return { date: String(item.date), ...normalized, note: typeof item.note === "string" ? item.note : undefined, scaleVersion: 2 as const };
    });
}
