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
