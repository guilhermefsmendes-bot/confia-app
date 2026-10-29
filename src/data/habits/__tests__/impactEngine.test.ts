import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
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

  it("keeps historical personal associations visible when the selected day has no entries", () => {
    const date = "2026-10-29";
    const records: HabitRecord[] = [];
    const events: PersonalEvent[] = [];
    for (let i = 0; i < 10; i++) {
      const day = shiftDay(date, i - 10);
      const short = i < 5;
      records.push(record("historical_sleep_" + day, "sleep", day, short ? 5 : 8));
      events.push(mood(day, short ? 4 : 7));
    }
    const report = buildHabitImpact(records, events, date);
    assert.equal(report.cards.length, 0);
    assert.equal(report.hasData, true);
    assert.ok(report.personalAssociations.some(item => item.habit === "sleep"));
  });

  it("ignores a deleted-only food entry and its superseded legacy nutrition total", () => {
    const date = "2026-10-29";
    const records: HabitRecord[] = [
      { id: "legacy", kind: "nutrition", date, updatedAt: `${date}T10:00:00Z`, timezone: "UTC", data: { fastFood: 1 } },
      { id: "deleted", kind: "foodItem", date, updatedAt: `${date}T11:00:00Z`, timezone: "UTC", data: { category: "fastFood", subtype: "meal", quantity: 1, unit: "meal", deleted: true } },
    ];
    const report = buildHabitImpact(records, [], date);
    assert.equal(report.hasData, false);
    assert.equal(report.cards.length, 0);
  });

  it("scales food-domain contribution by recorded quantity instead of one category tick", () => {
    const date = "2026-10-29";
    const item = (quantity: number): HabitRecord => ({ id: "fruit_" + quantity, kind: "foodItem", date, updatedAt: `${date}T10:00:00Z`, timezone: "UTC", data: { category: "fruit", subtype: "apple", quantity, unit: "item", deleted: false } });
    const one = getHabitClockState([item(1)], date);
    const three = getHabitClockState([item(3)], date);
    assert.ok(one.score < three.score);
  });

  it("does not colour the clock from deleted-only food entries", () => {
    const date = "2026-10-29";
    const state = getHabitClockState([
      { id: "legacy", kind: "nutrition", date, updatedAt: `${date}T10:00:00Z`, timezone: "UTC", data: { fastFood: 1 } },
      { id: "deleted", kind: "foodItem", date, updatedAt: `${date}T11:00:00Z`, timezone: "UTC", data: { category: "fastFood", subtype: "meal", quantity: 1, unit: "meal", deleted: true } },
    ], date);
    assert.equal(state.hasData, false);
    assert.equal(state.tone, "unknown");
  });

  it("scales movement contribution by duration and intensity", () => {
    const date = "2026-10-29";
    const short = getHabitClockState([{ id: "short_walk", kind: "exercise", date, updatedAt: `${date}T10:00:00Z`, timezone: "UTC", data: { activity: "walk", minutes: 5, intensity: "moderate" } }], date);
    const longer = getHabitClockState([{ id: "long_walk", kind: "exercise", date, updatedAt: `${date}T10:00:00Z`, timezone: "UTC", data: { activity: "walk", minutes: 30, intensity: "moderate" } }], date);
    assert.ok(short.score < longer.score);
  });

  it("returns a non-empty, bounded interpretation for every recorded food category", () => {
    const date = "2026-10-29";
    const categories = [
      ["coffee", "other", "item"], ["tea", "other", "item"], ["energy", "other", "can"], ["soda", "other", "can"],
      ["water", "still", "cup"], ["alcohol", "other", "cup"], ["tobacco", "other", "occasion"], ["fastFood", "meal", "meal"],
      ["fruit", "other", "item"], ["vegetables", "other", "portion"], ["cereals", "other", "portion"], ["protein", "other", "portion"],
      ["fats", "other", "portion"], ["sweets", "other", "occasion"], ["salty", "other", "occasion"],
    ] as const;
    for (const [category, subtype, unit] of categories) {
      const report = buildHabitImpact([{ id: `food_${category}`, kind: "foodItem", date, updatedAt: `${date}T12:00:00Z`, timezone: "UTC", data: { category, subtype, quantity: 1, unit, deleted: false } } as HabitRecord], [], date);
      assert.equal(report.hasData, true, `${category} should be recognized as recorded data`);
      assert.ok(report.cards.length > 0, `${category} should receive a bounded interpretation`);
    }
  });

  it("responds to each built-in and custom habit-log type", () => {
    const date = "2026-10-29";
    const types = ["tobacco", "coffee", "alcohol", "social", "gaming", "sugar", "shopping", "checking", "sleep", "custom"] as const;
    for (const type of types) {
      const habitId = `habit_${type}`;
      const records: HabitRecord[] = [
        { id: habitId, kind: "habit", date: "2026-10-01", updatedAt: "2026-10-01T10:00:00Z", timezone: "UTC", data: { type, name: type === "custom" ? "My personal habit" : type, icon: "🌱", goal: "My stated goal", active: true, createdAt: "2026-10-01" } },
        { id: `log_${type}`, kind: "habitLog", date, updatedAt: `${date}T20:00:00Z`, timezone: "UTC", data: { habitId, completed: true } },
      ];
      const report = buildHabitImpact(records, [], date);
      assert.ok(report.cards.some(card => card.id === `habit-log-log_${type}`), `${type} should receive a habit-log response`);
    }
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


describe("Habit impact localization", () => {
  const locale = (language: string) => JSON.parse(readFileSync(`src/locales/${language}.json`, "utf8")).habitImpact as Record<string, unknown>;
  const flatten = (value: unknown, prefix = "", output: Record<string, string> = {}) => {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
        if (prefix === "" && key === "sources") continue;
        flatten(child, prefix ? `${prefix}.${key}` : key, output);
      }
    } else if (typeof value === "string") output[prefix] = value;
    return output;
  };
  it("provides every Portuguese habit-impact key in Spanish and French", () => {
    const base = flatten(locale("pt"));
    for (const language of ["en", "es", "fr"]) {
      const translated = flatten(locale(language));
      assert.deepEqual(Object.keys(translated).sort(), Object.keys(base).sort(), `${language} keys differ`);
    }
  });
  it("preserves interpolation variables in every translated habit-impact message", () => {
    const base = flatten(locale("pt"));
    const variables = (value: string) => [...value.matchAll(/{{\s*([^}\s]+)\s*}}/g)].map(match => match[1]).sort();
    for (const language of ["en", "es", "fr"]) {
      const translated = flatten(locale(language));
      for (const [key, value] of Object.entries(base)) assert.deepEqual(variables(translated[key]), variables(value), `${language}:${key} interpolation differs`);
    }
  });
  it("provides matching daily-experience keys and interpolation variables in all four languages", () => {
    const read = (language: string) => JSON.parse(readFileSync(`src/locales/${language}.json`, "utf8")).habitDailyExperience as Record<string, unknown>;
    const flattenExperience = (value: unknown, prefix = "", output: Record<string, string> = {}) => {
      if (value && typeof value === "object" && !Array.isArray(value)) {
        for (const [key, child] of Object.entries(value as Record<string, unknown>)) flattenExperience(child, prefix ? `${prefix}.${key}` : key, output);
      } else if (typeof value === "string") output[prefix] = value;
      return output;
    };
    const base = flattenExperience(read("pt"));
    const variables = (value: string) => [...value.matchAll(/{{\s*([^}\s]+)\s*}}/g)].map(match => match[1]).sort();
    for (const language of ["en", "es", "fr"]) {
      const translated = flattenExperience(read(language));
      assert.deepEqual(Object.keys(translated).sort(), Object.keys(base).sort(), `${language} daily-experience keys differ`);
      for (const [key, value] of Object.entries(base)) assert.deepEqual(variables(translated[key]), variables(value), `${language}:${key} interpolation differs`);
    }
  });

  it("localizes all evidence source fields in Spanish and French", () => {
    for (const language of ["es", "fr"]) {
      const sources = locale(language).sources as Record<string, Record<string, string>>;
      assert.equal(Object.keys(sources).length, 12);
      for (const [id, source] of Object.entries(sources)) {
        for (const key of ["title", "organization", "evidenceType", "population", "statistic", "certainty", "limitations"]) assert.ok(source[key]?.trim(), `${language}:${id}:${key} missing`);
      }
    }
  });
});
