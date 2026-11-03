import type { HabitRecord } from "./types";
import type { PersonalEvent } from "../personal/personalEvent";
import { readMoodHistory } from "../companionData";
import { shiftDay } from "./calendar";

/** Shared daily aggregates used by the lake summary and detailed mirror. */
export function dailyMirrorStats(records: HabitRecord[], events: PersonalEvent[], date: string, legacyMoodHistory: ReturnType<typeof readMoodHistory> = readMoodHistory()) {
  // De-duplicate by stable ID before aggregating. Reject out-of-domain values so
  // corrupt records cannot distort daily, weekly or monthly averages.
  const unique = <T extends { id: string }>(rows: T[]) => [...new Map(rows.map(row => [row.id, row])).values()];
  const sleepRows = unique(records.filter((r): r is Extract<HabitRecord, { kind: "sleep" }> =>
    r.kind === "sleep" && r.date === date && Number.isFinite(r.data.hours) && r.data.hours >= 0 && r.data.hours <= 24
  ));
  const moodCandidates = events.filter(e => e.type === "mood" && e.localDate === date &&
    typeof e.value === "number" && Number.isFinite(e.value) && e.value >= 1 && e.value <= 10
  );
  // First collapse repeated IDs, keeping the latest version. For records with an
  // explicit moment, also collapse different IDs that represent edits to the same
  // source/day/moment. If no moment exists, preserve distinct IDs as observations.
  const byId = new Map<string, typeof moodCandidates[number]>();
  for (const event of moodCandidates) {
    const previous = byId.get(event.id);
    if (!previous || event.timestamp >= previous.timestamp) byId.set(event.id, event);
  }
  const moodRows = [...byId.values()].reduce((latest, event) => {
    const moment = event.metadata?.moment;
    const key = typeof moment === "string"
      ? `${event.source}|${event.localDate}|${moment}`
      : `id:${event.id}`;
    const previous = latest.get(key);
    if (!previous || event.timestamp >= previous.timestamp) latest.set(key, event);
    return latest;
  }, new Map<string, typeof moodCandidates[number]>()).values();
  const canonicalMoodRows = [...moodRows];
  // Prefer canonical personal events; fall back to the legacy ratings store for older entries.
  const legacyMood = canonicalMoodRows.length ? undefined : legacyMoodHistory.find(row => row.date === date);
  const legacyValues = [legacyMood?.morning, legacyMood?.afternoon].filter((value): value is number => typeof value === "number" && Number.isFinite(value) && value >= 1 && value <= 10);
  const moodValues = canonicalMoodRows.length ? canonicalMoodRows.map(event => Number(event.value)) : legacyValues;
  return {
    sleep: sleepRows.length ? sleepRows.reduce((sum, row) => sum + row.data.hours, 0) / sleepRows.length : undefined,
    mood: moodValues.length ? moodValues.reduce((sum, value) => sum + value, 0) / moodValues.length : undefined,
    sleepCount: sleepRows.length,
    moodCount: moodValues.length,
  };
}


/** Shared record index used by the calendar, history, mirror and reports. */
export function createHabitRecordDateIndex(records: HabitRecord[]) {
  const recordsByDate = new Map<string, HabitRecord[]>();
  for (const record of records) {
    const rows = recordsByDate.get(record.date) ?? [];
    rows.push(record);
    recordsByDate.set(record.date, rows);
  }
  return recordsByDate;
}

/** Build only a requested date window in one pass over each source collection. */
export function createHabitWindowIndex(records: HabitRecord[], events: PersonalEvent[], dates: string[]) {
  const wanted = new Set(dates);
  const recordsByDate = new Map<string, HabitRecord[]>();
  const eventsByDate = new Map<string, PersonalEvent[]>();
  for (const record of records) {
    if (!wanted.has(record.date)) continue;
    const rows = recordsByDate.get(record.date) ?? [];
    rows.push(record);
    recordsByDate.set(record.date, rows);
  }
  for (const event of events) {
    if (!wanted.has(event.localDate)) continue;
    const rows = eventsByDate.get(event.localDate) ?? [];
    rows.push(event);
    eventsByDate.set(event.localDate, rows);
  }
  return { recordsByDate, eventsByDate };
}

/** Build one shared date index for all daily views, calendars and reports. */
export function createHabitDateIndex(records: HabitRecord[], events: PersonalEvent[]) {
  const recordsByDate = createHabitRecordDateIndex(records);
  const eventsByDate = new Map<string, PersonalEvent[]>();
  for (const event of events) {
    const rows = eventsByDate.get(event.localDate) ?? [];
    rows.push(event);
    eventsByDate.set(event.localDate, rows);
  }
  // Parse legacy localStorage once per immutable records/events snapshot.
  const legacyMoodHistory = readMoodHistory();
  const cache = new Map<string, ReturnType<typeof dailyMirrorStats>>();
  const dailyStatsForDate = (date: string) => {
    const cached = cache.get(date);
    if (cached) return cached;
    const result = dailyMirrorStats(recordsByDate.get(date) ?? [], eventsByDate.get(date) ?? [], date, legacyMoodHistory);
    cache.set(date, result);
    return result;
  };
  return { recordsByDate, eventsByDate, dailyStatsForDate };
}

/** Backwards-compatible summary accessor, backed by the shared date engine. */
export function createDailyMirrorStatsIndex(records: HabitRecord[], events: PersonalEvent[]) {
  const index = createHabitDateIndex(records, events);
  return index.dailyStatsForDate;
}

/** Inclusive, oldest-to-newest date range ending on the selected local calendar day. */
export function mirrorDateRange(endDate: string, length: number): string[] {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(endDate) || !Number.isInteger(length) || length < 1) return [];
  const [year, month, day] = endDate.split("-").map(Number);
  const parsed = new Date(year, month - 1, day, 12);
  if (parsed.getFullYear() !== year || parsed.getMonth() !== month - 1 || parsed.getDate() !== day) return [];
  return Array.from({ length }, (_, index) => shiftDay(endDate, index - (length - 1)));
}

/** Mean of actual numeric observations; missing days are not treated as zero. */
export function averageRecordedValues(values: Array<number | undefined>): number | undefined {
  const observed = values.filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  return observed.length ? observed.reduce((sum, value) => sum + value, 0) / observed.length : undefined;
}
