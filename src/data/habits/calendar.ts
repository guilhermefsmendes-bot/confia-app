import { getLocalCalendarDate } from "../../utils/date";
export const localDay = getLocalCalendarDate;
export function shiftDay(day: string, offset: number): string {
  const [y,m,d] = day.split("-").map(Number);
  return localDay(new Date(y, m - 1, d + offset, 12));
}
export function secondsToMidnight(now = new Date()): number {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return Math.max(0, Math.ceil((next.getTime() - now.getTime()) / 1000));
}
export function editableDay(day: string, today = localDay()): boolean {
  return day === today || day === shiftDay(today, -1);
}
export function weekStart(day = localDay()): string {
  const date = new Date(day + "T12:00:00");
  return shiftDay(day, -((date.getDay() + 6) % 7));
}
export function timezone(): string { return Intl.DateTimeFormat().resolvedOptions().timeZone || "local"; }
