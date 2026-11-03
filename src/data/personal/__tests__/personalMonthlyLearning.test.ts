import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildPersonalMonthlyLearning } from "../personalMonthlyLearning";
import type { PersonalEvent } from "../personalEvent";
import type { PersonalInsight } from "../personalInsights";
import type { PersonalExperiment } from "../personalExperiments";

const event = (id: string, localDate: string): PersonalEvent => ({
  id, type: "mood", timestamp: localDate + "T12:00:00.000Z", localDate,
  source: "daily_rating", schemaVersion: 1, value: 6,
});

const insight = (id: string, status: PersonalInsight["status"], novelty: PersonalInsight["novelty"] = "new"): PersonalInsight => ({
  id, type: "trend", generatedAt: "2026-11-03T12:00:00.000Z",
  periodStart: "2026-11-01", periodEnd: "2026-11-03", evidenceCount: 6,
  confidence: "moderate", direction: "up", variables: ["mood"], status, fingerprint: id,
  firstSeen: "2026-11-01", lastSeen: "2026-11-03", timesShown: 0, novelty,
  actionability: "medium", supportingEventIds: ["1"], message: id,
});

const experiment = (): PersonalExperiment => ({
  id: "exp-1", hypothesis: "A small walk", metric: "wellbeing",
  startedAt: "2026-11-01", completedAt: "2026-11-03", durationDays: 3,
  status: "complete", checks: [
    { date: "2026-11-01", done: true, effect: "better" },
    { date: "2026-11-02", done: true, effect: "same" },
    { date: "2026-11-03", done: true, effect: "better" },
  ],
});

describe("monthly personal learning", () => {
  const now = new Date(2026, 10, 3, 12);

  it("counts only valid records in the current calendar month", () => {
    const result = buildPersonalMonthlyLearning([
      event("1", "2026-11-01"), event("2", "2026-11-02"),
      event("3", "2026-11-03"), event("4", "2026-10-31"),
    ], [], [], now);
    assert.equal(result.eventCount, 3);
    assert.equal(result.activeDays, 3);
    assert.equal(result.hasEnoughRecords, false);
  });

  it("excludes impossible local dates from monthly evidence", () => {
    const result = buildPersonalMonthlyLearning([
      event("1", "2026-11-01"), event("2", "2026-11-02"),
      event("3", "2026-11-03"), event("bad", "2026-11-31"),
    ], [], [], now);
    assert.equal(result.eventCount, 3);
    assert.equal(result.activeDays, 3);
    assert.equal(result.hasEnoughRecords, false);
  });

  it("separates changes, consistent patterns and observations", () => {
    const result = buildPersonalMonthlyLearning(
      [event("1", "2026-11-01"), event("2", "2026-11-02"), event("3", "2026-11-03"), event("4", "2026-11-03")],
      [insight("changed", "changed"), insight("stable", "consistent"), insight("possible", "possible")],
      [],
      now,
    );
    assert.deepEqual(result.changed.map(item => item.id), ["changed"]);
    assert.deepEqual(result.remains.map(item => item.id), ["stable"]);
    assert.deepEqual(result.observations.map(item => item.id), ["possible"]);
    assert.equal(result.hasEnoughRecords, true);
  });

  it("includes experiments active in the month and preserves insufficient evidence", () => {
    const result = buildPersonalMonthlyLearning([], [], [experiment()], now);
    assert.equal(result.experiments.length, 1);
    assert.equal(result.experiments[0].evidenceCount, 3);
    assert.equal(result.experiments[0].enough, false);
  });

  it("does not label associations as causal conclusions", () => {
    const result = buildPersonalMonthlyLearning([], [insight("possible", "possible")], [], now);
    assert.equal(result.observations.length, 1);
    assert.equal(result.hasEnoughRecords, false);
  });
});
