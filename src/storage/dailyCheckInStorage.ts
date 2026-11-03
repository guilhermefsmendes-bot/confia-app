import { getLocalCalendarDate } from "../utils/date";

export interface DailyCheckInData {
  date: string;
  mood: number;
  need: string;
  completed: boolean;
  scaleVersion?: 2;
}

const KEY = "confia_daily_checkin";
const HISTORY_KEY = "confia_daily_checkin_history";

export function normalizeLegacyDailyMood(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.min(10, Math.max(1, Math.round((value / 10) * 9 + 1)));
}

function normalizeStoredCheckIn(value: any): DailyCheckInData | null {
  if (!value || typeof value.date !== "string" || !Number.isFinite(value.mood)) return null;
  const mood = value.scaleVersion === 2
    ? Math.min(10, Math.max(1, Math.round(value.mood)))
    : normalizeLegacyDailyMood(value.mood);
  return { ...value, mood, scaleVersion: 2 } as DailyCheckInData;
}

export function getDailyCheckIn(): DailyCheckInData | null {
  try {
    const stored = localStorage.getItem(KEY);

    if (!stored) return null;

    return normalizeStoredCheckIn(JSON.parse(stored));
  } catch {
    return null;
  }
}

export function getDailyCheckInHistory(): DailyCheckInData[] {
  let history: DailyCheckInData[] = [];
  try {
    const stored = localStorage.getItem(HISTORY_KEY);
    const parsed = stored ? JSON.parse(stored) : [];
    history = Array.isArray(parsed) ? parsed.map(normalizeStoredCheckIn).filter((item): item is DailyCheckInData => item !== null) : [];
  } catch { /* retain the independently stored current record for recovery */ }

  // The current-day key is a second recovery copy if a history write was
  // interrupted or the history JSON became unreadable.
  try {
    const currentRaw = localStorage.getItem(KEY);
    const current = currentRaw ? normalizeStoredCheckIn(JSON.parse(currentRaw)) : null;
    if (current) history = [...history.filter(item => item.date !== current.date), current];
  } catch { /* preserve all readable history if the current key is unavailable */ }

  // One canonical check-in per local date; the most recently stored value wins.
  const byDate = new Map<string, DailyCheckInData>();
  for (const item of history) byDate.set(item.date, item);
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export function saveDailyCheckIn(
  mood: number,
  need: string
): DailyCheckInData {
  const data: DailyCheckInData = {
    date: getLocalCalendarDate(),
    mood: Math.min(10, Math.max(1, Math.round(Number.isFinite(mood) ? mood : 1))),
    need,
    completed: true,
    scaleVersion: 2,
  };

  // Persist the current record first: it is the recovery copy if the history
  // update fails. The history is unbounded so older check-ins remain available.
  localStorage.setItem(KEY, JSON.stringify(data));

  const history = getDailyCheckInHistory();
  const updatedHistory = [
    ...history.filter((item) => item.date !== data.date),
    data,
  ].sort((a, b) => a.date.localeCompare(b.date));

  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
  } catch {
    // getDailyCheckInHistory() merges the current key back into the timeline.
    // A later save can retry persisting the complete history.
  }

  window.dispatchEvent(new Event("confia:daily-checkin-saved"));
  return data;
}

export function hasCompletedToday(): boolean {
  const data = getDailyCheckIn();

  if (!data) return false;

  const today = getLocalCalendarDate();

  return data.date === today && data.completed;
}
