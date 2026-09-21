import test from "node:test";
import assert from "node:assert/strict";
import { summarizeGoalJourney, type GoalJourney } from "../goalJourney";

test("goal journey identifies a repeated blocker", () => {
  const journey: GoalJourney = {
    objectiveId: "walk",
    createdAt: "2026-09-01T10:00:00.000Z",
    attempts: [
      { date: "2026-09-01T10:00:00.000Z", outcome: "blocked", blocker: "energy" },
      { date: "2026-09-02T10:00:00.000Z", outcome: "blocked", blocker: "energy" },
      { date: "2026-09-03T10:00:00.000Z", outcome: "blocked", blocker: "time" },
    ],
  };
  const summary = summarizeGoalJourney(journey);
  assert.equal(summary.topBlocker, "energy");
  assert.equal(summary.topBlockerCount, 2);
});

test("returning after five days is treated as an invisible win", () => {
  const journey: GoalJourney = {
    objectiveId: "walk",
    createdAt: "2026-09-01T10:00:00.000Z",
    attempts: [
      { date: "2026-09-01T10:00:00.000Z", outcome: "done", level: "minimum" },
      { date: "2026-09-08T10:00:00.000Z", outcome: "done", level: "minimum" },
    ],
  };
  assert.equal(summarizeGoalJourney(journey).returnAfterGap, true);
});
