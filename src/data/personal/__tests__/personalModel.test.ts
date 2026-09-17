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
