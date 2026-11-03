import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildPersonalMapSummary } from "../personalMapSummary";
import type { PersonalEvent } from "../personalEvent";
import type { PersonalInsight } from "../personalInsights";
import type { PersonalExperiment } from "../personalExperiments";

const event = (id: string, localDate: string): PersonalEvent => ({
  id, type: "mood", timestamp: localDate + "T12:00:00.000Z", localDate,
  source: "daily_rating", schemaVersion: 1, value: 6,
});

const insight = (status: PersonalInsight["status"], confidence: PersonalInsight["confidence"], novelty: PersonalInsight["novelty"] = "new"): PersonalInsight => ({
  id: "insight", type: "trend", generatedAt: "2026-11-02T12:00:00.000Z",
  periodStart: "2026-10-01", periodEnd: "2026-11-02", evidenceCount: 8,
  confidence, direction: "up", variables: ["mood"], status, fingerprint: "trend",
  firstSeen: "2026-10-01", lastSeen: "2026-11-02", timesShown: 0, novelty,
  actionability: "medium", supportingEventIds: ["1"], message: "Observation",
});

const experiment = (status: PersonalExperiment["status"]): PersonalExperiment => ({
  id: status, hypothesis: "hypothesis", metric: "metric", startedAt: "2026-11-01", status,
});

describe("personal map evidence summary", () => {
  it("does not infer a pattern from sparse records", () => {
    assert.equal(buildPersonalMapSummary([event("1", "2026-11-01")], [], []).stage, "insufficient");
  });
  it("ignores malformed records when counting evidence", () => {
    const malformed = { ...event("bad", "2026-11-01"), timestamp: "not-a-date", localDate: "bad-date" } as PersonalEvent;
    const result = buildPersonalMapSummary([malformed], [], []);
    assert.equal(result.eventCount, 0);
    assert.equal(result.stage, "insufficient");
  });
  it("rejects impossible calendar dates even when they match the YYYY-MM-DD shape", () => {
    const impossible = event("bad-calendar", "2026-02-30");
    const result = buildPersonalMapSummary([impossible], [], []);
    assert.equal(result.eventCount, 0);
    assert.equal(result.activeDays, 0);
    assert.equal(result.stage, "insufficient");
  });
  it("shows first signals only after four records across three days", () => {
    const events = [
      event("1", "2026-10-30"), event("2", "2026-10-30"),
      event("3", "2026-10-31"), event("4", "2026-11-01"),
    ];
    assert.equal(buildPersonalMapSummary(events, [], []).stage, "first_signals");
  });
  it("uses the existing insight lifecycle to distinguish emerging, consistent and changing patterns", () => {
    const events = [event("1", "2026-10-30")];
    assert.equal(buildPersonalMapSummary(events, [insight("possible", "moderate")], []).stage, "emerging");
    assert.equal(buildPersonalMapSummary(events, [insight("consistent", "high")], []).stage, "consistent");
    assert.equal(buildPersonalMapSummary(events, [insight("changed", "moderate")], []).stage, "changing");
    assert.equal(buildPersonalMapSummary(events, [insight("possible", "moderate", "returning")], []).stage, "changing");
  });
  it("counts existing experiments without creating a second experiment store", () => {
    const result = buildPersonalMapSummary([], [], [experiment("active"), experiment("complete")]);
    assert.equal(result.activeExperiments, 1);
    assert.equal(result.completedExperiments, 1);
  });
});
