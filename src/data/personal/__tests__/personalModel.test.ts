import assert from "node:assert/strict";
import test from "node:test";
import { buildPersonalModel } from "../personalModel";
import { buildPersonalInsights, calculateInsightConfidence } from "../personalInsights";
import { makePersonalEvent } from "../personalEvent";

const event = (id: string, date: string, value: number) => makePersonalEvent({
  id, type: "mood", timestamp: `${date}T12:00:00.000Z`, localDate: date,
  source: "daily_rating", value,
});

test("new user has no unsupported insight", () => {
  assert.deepEqual(buildPersonalInsights([], new Date("2026-09-17T12:00:00Z")), []);
});

test("personal model compares recent data with the person's own baseline", () => {
  const dates = ["2026-08-20", "2026-08-25", "2026-09-01", "2026-09-10", "2026-09-12", "2026-09-16"];
  const values = [4, 4, 5, 7, 7, 8];
  const model = buildPersonalModel(dates.map((date, i) => event(String(i), date, values[i])), new Date("2026-09-17T12:00:00Z"));
  assert.equal(model.observationCount, 6);
  assert.equal(model.moodDirection, "up");
  assert.equal(model.currentMood, 8);
  assert.equal(model.dataQuality, "low");
});

test("insight needs repeated evidence", () => {
  const events = ["2026-08-29", "2026-09-01", "2026-09-04", "2026-09-08", "2026-09-12", "2026-09-16"].map((date, i) => event(String(i), date, i < 2 ? 4 : 7));
  const insights = buildPersonalInsights(events, new Date("2026-09-17T12:00:00Z"));
  assert.equal(insights.length, 1);
  assert.equal(insights[0].type, "trend");
  assert.ok(insights[0].supportingEventIds.length >= 3);
});

test("confidence avoids false precision", () => {
  assert.equal(calculateInsightConfidence(1, 1, 1, 1, 1, 1), "low");
  assert.equal(calculateInsightConfidence(10, 1, 1, 1, 1, 1), "high");
});

import { buildPersonalPatterns } from "../personalPatterns";

test("habit pattern needs repeated paired days", () => {
  const events = [];
  for (let i = 0; i < 8; i++) {
    const date = `2026-09-${String(i + 1).padStart(2, "0")}`;
    events.push(event(`m${i}`, date, i < 5 ? 8 : 3));
    if (i < 5) events.push(makePersonalEvent({
      id: `h${i}`, type: "habit", timestamp: `${date}T09:00:00.000Z`, localDate: date,
      source: "habit_daily", value: 1, metadata: { habitId: "walk", habitName: "Caminhada", completed: true },
    }));
  }
  const patterns = buildPersonalPatterns(events);
  assert.ok(patterns.some(pattern => pattern.type === "habit_association" && pattern.label === "Caminhada"));
});

test("repeated need becomes a pattern without inventing causality", () => {
  const events = [1, 2, 3, 4].map(i => makePersonalEvent({
    id: `c${i}`, type: "checkin", timestamp: `2026-09-${String(i).padStart(2, "0")}T12:00:00.000Z`,
    localDate: `2026-09-${String(i).padStart(2, "0")}`, source: "daily_checkin", value: 5,
    metadata: { need: "calm" },
  }));
  const patterns = buildPersonalPatterns(events);
  assert.equal(patterns.filter(pattern => pattern.type === "repeated_need").length, 1);
});

import { applyInsightLifecycle } from "../personalInsightLifecycle";

test("two observations do not create a longitudinal pattern", () => {
  const events = [event("a", "2026-09-10", 3), event("b", "2026-09-17", 9)];
  assert.equal(buildPersonalInsights(events, new Date("2026-09-17T12:00:00Z")).length, 0);
});

test("irregular history stays low-confidence rather than becoming precise", () => {
  const dates = ["2026-06-01", "2026-07-20", "2026-08-31", "2026-09-17"];
  const insights = buildPersonalInsights(dates.map((date, i) => event(String(i), date, i + 4)), new Date("2026-09-17T12:00:00Z"));
  assert.ok(insights.every(insight => insight.confidence !== "high"));
});

test("one intervention outcome is not enough for an effect insight", () => {
  const intervention = makePersonalEvent({
    id: "i1", type: "intervention", timestamp: "2026-09-17T10:00:00.000Z", localDate: "2026-09-17",
    source: "impulso", value: 4, metadata: { initialIntensity: 8, finalIntensity: 4 },
  });
  assert.equal(buildPersonalInsights([intervention], new Date("2026-09-17T12:00:00Z")).length, 0);
});

test("insight lifecycle can surface a pattern that disappeared after a meaningful gap", () => {
  const store = new Map<string, string>();
  const previousWindow = globalThis.window;
  (globalThis as any).window = { localStorage: { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => store.set(k, v) } };
  store.set("confia_personal_insight_lifecycle_v1", JSON.stringify({ "habit:walk": { firstSeen: "2026-06-01", lastSeen: "2026-07-01", timesShown: 2, status: "consistent", type: "habit_association" } }));
  const result = applyInsightLifecycle([]);
  assert.equal(result.length, 1);
  assert.equal(result[0].type, "pattern_disappearance");
  (globalThis as any).window = previousWindow;
});

test("weekday insight needs repeated observations on the same weekday", () => {
  const events = [];
  const start = new Date("2026-08-20T12:00:00Z");
  for (let i = 0; i < 21; i++) {
    const d = new Date(start.getTime() + i * 86400000);
    const date = d.toISOString().slice(0, 10);
    events.push(event(`w${i}`, date, d.getUTCDay() === 1 ? 9 : 5));
  }
  const insights = buildPersonalInsights(events, new Date("2026-09-17T12:00:00Z"));
  assert.ok(insights.some(insight => insight.type === "weekday"));
});

test("recovery insight requires repeated low-to-higher sequences", () => {
  const events = [];
  for (let i = 0; i < 12; i++) {
    const date = new Date(Date.UTC(2026, 7, 25 + i)).toISOString().slice(0, 10);
    events.push(event(`r${i}`, date, i % 2 === 0 ? 3 : 6));
  }
  const insights = buildPersonalInsights(events, new Date("2026-09-17T12:00:00Z"));
  assert.ok(insights.some(insight => insight.type === "recovery_pattern"));
});

test("personal change compares adjacent periods rather than population norms", () => {
  const events = [];
  for (let i = 0; i < 16; i++) {
    const oldDate = new Date(Date.UTC(2026, 7, 20 + i)).toISOString().slice(0, 10);
    const newDate = new Date(Date.UTC(2026, 7, 1 + i)).toISOString().slice(0, 10);
    events.push(event(`old${i}`, oldDate, 4));
    events.push(event(`new${i}`, newDate, 7));
  }
  const insights = buildPersonalInsights(events, new Date("2026-09-17T12:00:00Z"));
  assert.ok(insights.some(insight => insight.type === "personal_change"));
});
