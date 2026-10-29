import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildHabitImpact } from "../impactEngine";
import { getHabitClockState } from "../../../components/Habits/HabitClock";
import { weeklyExercise } from "../../reactive/scientificGuidance";
import { shiftDay } from "../calendar";
import { makePersonalEvent, type PersonalEvent } from "../../personal/personalEvent";
import type { HabitRecord } from "../types";

const record = (id: string, kind: "sleep", date: string, hours: number): HabitRecord => ({
  id, kind, date, updatedAt: `${date}T22:00:00.000Z`, timezone: "UTC", data: { hours, quality: 3, awakenings: 0 },
});
const mood = (date: string, value: number): PersonalEvent => makePersonalEvent({
  id: "mood_" + date, type: "mood", source: "daily_rating", timestamp: `${date}T20:00:00.000Z`, localDate: date, value,
  metadata: { moment: "evening" },
});

describe("Habit Impact Engine", () => {
  it("returns an evidence-backed reaction for short sleep", () => {
    const report = buildHabitImpact([record("sleep_today", "sleep", "2026-10-29", 5)], [], "2026-10-29");
    const card = report.cards.find(item => item.id === "sleep-short");
    assert.ok(card);
    assert.equal(card.sourceId, "sleepRestriction");
    assert.equal(card.values.deficit, 2);
    assert.equal(report.hasData, true);
  });

  it("does not invent a reaction when no habit was recorded", () => {
    const report = buildHabitImpact([], [], "2026-10-29");
    assert.equal(report.hasData, false);
    assert.equal(report.cards.length, 0);
  });

  it("shows a personal association only after five measured days in both groups", () => {
    const date = "2026-10-29";
    const records: HabitRecord[] = [];
    const events: PersonalEvent[] = [];
    for (let i = 0; i < 10; i++) {
      const day = shiftDay(date, i - 9);
      const short = i < 5;
      records.push(record("sleep_" + day, "sleep", day, short ? 5 : 8));
      events.push(mood(day, short ? 4 : 7));
    }
    const report = buildHabitImpact(records, events, date);
    const association = report.personalAssociations.find(item => item.habit === "sleep");
    assert.ok(association);
    assert.equal(association.exposedDays, 5);
    assert.equal(association.comparisonDays, 5);
    assert.equal(association.direction, "lower");
    assert.equal(association.difference, -3);
  });

  it("does not apply population-level ultra-processed-food statistics to one generic fast-food entry", () => {
    const date = "2026-10-29";
    const records: HabitRecord[] = [
      { id: "fast_food", kind: "foodItem", date, updatedAt: `${date}T12:00:00Z`, timezone: "UTC", data: { category: "fastFood", subtype: "meal", quantity: 1, unit: "meal", deleted: false } },
      { id: "nutrition", kind: "nutrition", date, updatedAt: `${date}T12:00:01Z`, timezone: "UTC", data: { fastFood: 1 } },
    ];
    const report = buildHabitImpact(records, [], date);
    const card = report.cards.find(item => item.id === "limitation-fastFood");
    assert.ok(card);
    assert.equal(card.sourceId, "ultraProcessedFood");
    assert.match(card.messageKey, /limits\.fastFood\.message$/);
  });

  it("does not count light or unspecified intensity as moderate exercise", () => {
    const date = "2026-10-29";
    const records: HabitRecord[] = [
      { id: "moderate", kind: "exercise", date, updatedAt: `${date}T10:00:00Z`, timezone: "UTC", data: { activity: "walk", minutes: 30, intensity: "moderate" } },
      { id: "vigorous", kind: "exercise", date, updatedAt: `${date}T11:00:00Z`, timezone: "UTC", data: { activity: "run", minutes: 20, intensity: "intense" } },
      { id: "light", kind: "exercise", date, updatedAt: `${date}T12:00:00Z`, timezone: "UTC", data: { activity: "walk", minutes: 15, intensity: "light" } },
      { id: "unknown", kind: "exercise", date, updatedAt: `${date}T13:00:00Z`, timezone: "UTC", data: { activity: "yoga", minutes: 10 } },
    ];
    const week = weeklyExercise(records, new Date(`${date}T12:00:00Z`));
    assert.equal(week.moderateMinutes, 30);
    assert.equal(week.vigorousMinutes, 20);
    assert.equal(week.unclassifiedMinutes, 25);
  });

  it("keeps the biological clock neutral when no habit records exist", () => {
    const state = getHabitClockState([], "2026-10-29");
    assert.equal(state.hasData, false);
    assert.equal(state.tone, "unknown");
  });

  it("moves the biological clock toward orange or lettuce green from recorded domains", () => {
    const shortSleep = getHabitClockState([record("short", "sleep", "2026-10-29", 5)], "2026-10-29");
    assert.equal(shortSleep.tone, "mixed");
    const balanced = getHabitClockState([
      record("sleep", "sleep", "2026-10-29", 8),
      { id: "walk", kind: "exercise", date: "2026-10-29", updatedAt: "2026-10-29T10:00:00Z", timezone: "UTC", data: { activity: "walk", minutes: 30, intensity: "moderate" } },
    ], "2026-10-29");
    assert.equal(balanced.tone, "favourable");
    assert.equal(balanced.domains, 2);
  });

  it("does not treat missing sleep logs as adequate sleep or zero exposure", () => {
    const date = "2026-10-29";
    const records: HabitRecord[] = [];
    const events: PersonalEvent[] = [];
    for (let i = 0; i < 12; i++) {
      const day = shiftDay(date, i - 11);
      events.push(mood(day, i % 2 ? 7 : 4));
      if (i < 4) records.push(record("sleep_" + day, "sleep", day, 5));
      else if (i < 8) records.push(record("sleep_" + day, "sleep", day, 8));
    }
    records.push(record("sleep_today", "sleep", date, 5));
    const report = buildHabitImpact(records, events, date);
    assert.equal(report.personalAssociations.some(item => item.habit === "sleep"), false);
  });
});
