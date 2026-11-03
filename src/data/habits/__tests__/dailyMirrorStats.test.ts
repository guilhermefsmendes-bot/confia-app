import { it, test } from "node:test";
import assert from "node:assert/strict";
import type { HabitRecord } from "../types";
import type { PersonalEvent } from "../../personal/personalEvent";
import { dailyMirrorStats, createDailyMirrorStatsIndex, createHabitDateIndex, createHabitWindowIndex, mirrorDateRange, averageRecordedValues } from "../dailyMirrorStats";
import { createMoodObservationEvent, localDateFromTimestamp } from "../../personal/personalEvent";

const storage = new Map<string, string>();
Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => storage.set(key, value),
  removeItem: (key: string) => storage.delete(key),
} });
const sleep = (id: string, date: string, hours: number): HabitRecord => ({
  id, date, updatedAt: `${date}T12:00:00.000Z`, timezone: "UTC", kind: "sleep", data: { hours, quality: 3 },
});
const mood = (id: string, localDate: string, value: number): PersonalEvent => ({
  id, type: "mood", timestamp: `${localDate}T12:00:00.000Z`, localDate, source: "daily_rating", schemaVersion: 1, value,
});

it("averages multiple sleep and mood records for the same local day", () => {
  storage.delete("confia_ratings_v2");
  const result = dailyMirrorStats([sleep("s1", "2026-10-29", 6), sleep("s2", "2026-10-29", 8)], [mood("m1", "2026-10-29", 4), mood("m2", "2026-10-29", 8)], "2026-10-29");
  assert.equal(result.sleep, 7); assert.equal(result.sleepCount, 2);
  assert.equal(result.mood, 6); assert.equal(result.moodCount, 2);
});

it("returns undefined when there is no data and ignores invalid values", () => {
  storage.delete("confia_ratings_v2");
  const result = dailyMirrorStats([sleep("s0", "2026-10-29", -1), sleep("s1", "2026-10-29", 25), sleep("s2", "2026-10-28", 7)], [mood("m0", "2026-10-29", 0), mood("m1", "2026-10-29", 11), mood("m2", "2026-10-28", 5)], "2026-10-29");
  assert.equal(result.sleep, undefined); assert.equal(result.mood, undefined);
  assert.equal(result.sleepCount, 0); assert.equal(result.moodCount, 0);
});

it("prefers canonical new mood entries when old legacy ratings coexist", () => {
  storage.set("confia_ratings_v2", JSON.stringify([{ date: "2026-10-29", morning: 2, afternoon: 4 }]));
  const result = dailyMirrorStats([], [mood("new", "2026-10-29", 9)], "2026-10-29");
  assert.equal(result.mood, 9); assert.equal(result.moodCount, 1);
  storage.delete("confia_ratings_v2");
});

it("uses legacy mood ratings only when no canonical mood exists and ignores invalid legacy values", () => {
  storage.set("confia_ratings_v2", JSON.stringify([{ date: "2026-10-29", morning: 6, afternoon: 8 }]));
  assert.equal(dailyMirrorStats([], [], "2026-10-29").mood, 7);
  storage.set("confia_ratings_v2", JSON.stringify([{ date: "2026-10-29", morning: 6, afternoon: "bad" }]));
  assert.equal(dailyMirrorStats([], [], "2026-10-29").mood, 6);
  storage.delete("confia_ratings_v2");
});

it("deduplicates duplicate IDs without counting the same record twice", () => {
  storage.delete("confia_ratings_v2");
  const result = dailyMirrorStats([sleep("same", "2026-10-29", 6), sleep("same", "2026-10-29", 8)], [mood("same-mood", "2026-10-29", 5), mood("same-mood", "2026-10-29", 9)], "2026-10-29");
  assert.equal(result.sleep, 8); assert.equal(result.sleepCount, 1);
  assert.equal(result.mood, 9); assert.equal(result.moodCount, 1);
});

it("builds stable seven-day and 30-day ranges across month, year and leap-day boundaries", () => {
  assert.deepEqual(mirrorDateRange("2026-03-02", 7), ["2026-02-24", "2026-02-25", "2026-02-26", "2026-02-27", "2026-02-28", "2026-03-01", "2026-03-02"]);
  const month = mirrorDateRange("2024-03-01", 30);
  assert.equal(month.length, 30); assert.equal(month[0], "2024-02-01"); assert.equal(month.at(-1), "2024-03-01");
  assert.deepEqual(mirrorDateRange("2026-01-02", 3), ["2025-12-31", "2026-01-01", "2026-01-02"]);
  assert.deepEqual(mirrorDateRange("invalid", 7), []); assert.deepEqual(mirrorDateRange("2026-02-31", 7), []); assert.deepEqual(mirrorDateRange("2026-01-01", 0), []);
});


it("calculates weekly and monthly means from recorded values only, never treating gaps as zero", () => {
  assert.equal(averageRecordedValues([6, undefined, 8, 7, undefined, 9, 6]), 7.2);
  assert.equal(averageRecordedValues(Array.from({ length: 30 }, (_, index) => index % 3 === 0 ? undefined : 6)), 6);
  assert.equal(averageRecordedValues([undefined, Number.NaN, Infinity]), undefined);
});


it("keeps historical observation date separate from the actual recording time", () => {
  const recordedAt = new Date("2026-10-29T09:15:00.000Z");
  const event = createMoodObservationEvent("2026-10-25", 7, recordedAt);
  assert.equal(event.localDate, "2026-10-25");
  assert.equal(event.metadata?.observationDate, "2026-10-25");
  assert.equal(localDateFromTimestamp(event.timestamp), "2026-10-25");
  assert.equal(event.metadata?.recordedAt, "2026-10-29T09:15:00.000Z");
  assert.equal(event.metadata?.retrospective, true);
  assert.equal(event.metadata?.observationTimeKnown, false);
});

it("uses the real timestamp for same-day mood and marks the observation time as known", () => {
  const now = new Date("2026-10-29T09:15:00.000Z");
  const event = createMoodObservationEvent("2026-10-29", 6, now);
  assert.equal(event.localDate, "2026-10-29");
  assert.equal(event.timestamp, now.toISOString());
  assert.equal(event.metadata?.recordedAt, now.toISOString());
  assert.equal(event.metadata?.retrospective, false);
  assert.equal(event.metadata?.observationTimeKnown, true);
});

it("deduplicates different IDs for the same source, date and moment, retaining the latest edit", () => {
  storage.delete("confia_ratings_v2");
  const persistedEvents = JSON.parse(JSON.stringify([
    { ...mood("legacy-id", "2026-10-29", 4), timestamp: "2026-10-29T08:00:00.000Z", source: "daily_rating", metadata: { moment: "morning" } },
    { ...mood("edited-id", "2026-10-29", 8), timestamp: "2026-10-29T09:00:00.000Z", source: "daily_rating", metadata: { moment: "morning" } },
    { ...mood("afternoon-id", "2026-10-29", 6), timestamp: "2026-10-29T14:00:00.000Z", source: "daily_rating", metadata: { moment: "afternoon" } },
    { ...mood("other-source-id", "2026-10-29", 10), timestamp: "2026-10-29T15:00:00.000Z", source: "daily_checkin", metadata: { moment: "morning" } },
  ]));
  const result = dailyMirrorStats([], persistedEvents, "2026-10-29");
  assert.equal(result.moodCount, 3);
  assert.equal(result.mood, 8);
});


it("shares one indexed daily summary across repeated calendar and report lookups", () => {
  storage.set("confia_ratings_v2", JSON.stringify([{ date: "2026-10-29", morning: 6, afternoon: 8 }]));
  const getStats = createDailyMirrorStatsIndex([sleep("s1", "2026-10-29", 7)], [],);
  const first = getStats("2026-10-29");
  const second = getStats("2026-10-29");
  assert.equal(first, second);
  assert.equal(first.sleep, 7);
  assert.equal(first.mood, 7);
  assert.equal(getStats("2026-10-28").mood, undefined);
  storage.delete("confia_ratings_v2");
});


it("exposes one set of record, event and daily-stat indexes for all date-based views", () => {
  storage.delete("confia_ratings_v2");
  const record = sleep("shared-sleep", "2026-10-29", 7);
  const event = mood("shared-mood", "2026-10-29", 8);
  const index = createHabitDateIndex([record], [event]);
  assert.deepEqual(index.recordsByDate.get("2026-10-29"), [record]);
  assert.deepEqual(index.eventsByDate.get("2026-10-29"), [event]);
  assert.equal(index.dailyStatsForDate("2026-10-29").sleep, 7);
  assert.equal(index.dailyStatsForDate("2026-10-29").mood, 8);
});


test("creates a seven-day mirror window in one pass and excludes unrelated history", () => {
  const dates = mirrorDateRange("2026-10-30", 7);
  const records = [
    ...dates.map((date, index) => ({ id: `window-${index}`, date, updatedAt: `${date}T12:00:00.000Z`, timezone: "UTC", kind: "exercise", data: { activity: "walk", minutes: 10 } } as HabitRecord)),
    { id: "outside-window", date: "2026-09-01", updatedAt: "2026-09-01T12:00:00.000Z", timezone: "UTC", kind: "exercise", data: { activity: "walk", minutes: 10 } } as HabitRecord,
  ];
  const index = createHabitWindowIndex(records, [], dates);
  assert.equal([...index.recordsByDate.values()].reduce((sum, rows) => sum + rows.length, 0), 7);
  assert.equal(index.recordsByDate.has("2026-09-01"), false);
});
