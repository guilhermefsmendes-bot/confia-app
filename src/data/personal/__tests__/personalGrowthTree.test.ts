import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildPersonalGrowthTree } from "../personalGrowthTree";
import type { PersonalEvent } from "../personalEvent";
import type { PersonalExperiment } from "../personalExperiments";
import type { PersonalInsight } from "../personalInsights";
const event = (id: string, type: PersonalEvent["type"], date: string, metadata: Record<string, unknown> = {}): PersonalEvent => ({
  id, type, timestamp: date + "T12:00:00.000Z", localDate: date, source: "app_context", schemaVersion: 1,
  value: type === "goal" ? true : 1, metadata,
} as PersonalEvent);
describe("personal growth tree", () => {
  it("does not grow from a single visit or a single recorded day", () => {
    const branches = buildPersonalGrowthTree([event("m1", "mood", "2026-10-01")], []);
    assert.equal(branches.every(branch => !branch.learned), true);
  });
  it("unlocks self-awareness only when a sufficiently supported insight exists", () => {
    const insight = { type: "trend", evidenceCount: 6, confidence: "high", status: "consistent" } as PersonalInsight;
    const branches = buildPersonalGrowthTree([event("m1", "mood", "2026-10-01"), event("m2", "mood", "2026-10-03"), event("m3", "mood", "2026-10-05"), event("m4", "mood", "2026-10-07")], [insight]);
    assert.equal(branches.find(branch => branch.id === "self_awareness")?.learned, true);
  });
  it("does not mistake sleep logging alone for learning", () => {
    const branches = buildPersonalGrowthTree([event("s1", "habit", "2026-10-01", { habitId: "sleep" }), event("s2", "habit", "2026-10-03", { habitId: "sleep" })], []);
    assert.equal(branches.find(branch => branch.id === "rest")?.learned, false);
  });
  it("does not mistake repeated logging alone for learning", () => {
    const branches = buildPersonalGrowthTree([event("h1", "habit", "2026-10-01"), event("e1", "exercise", "2026-10-02"), event("n1", "nutrition", "2026-10-03")], []);
    assert.equal(branches.find(branch => branch.id === "habits")?.learned, false);
  });
  it("recognizes a completed experiment with sufficient observations as learning", () => {
    const experiment: PersonalExperiment = {
      id: "exp1", templateId: "short_walk", hypothesis: "A walk may help", metric: "mood",
      startedAt: "2026-10-01", completedAt: "2026-10-08", status: "complete", durationDays: 7,
      checks: [1, 2, 3, 4].map(day => ({ date: "2026-10-0" + day, done: true, effect: "better" })),
    };
    const branches = buildPersonalGrowthTree([], [], [experiment]);
    assert.equal(branches.find(branch => branch.id === "habits")?.learned, true);
    const repeatedSameDay = { ...experiment, checks: [1, 2, 3, 4].map(() => ({ date: "2026-10-01", done: true, effect: "better" as const })) };
    const duplicateBranches = buildPersonalGrowthTree([], [], [repeatedSameDay]);
    assert.equal(duplicateBranches.find(branch => branch.id === "habits")?.learned, false);
  });
  it("does not unlock relationships without relationship-context records", () => {
    const branches = buildPersonalGrowthTree([event("c1", "context", "2026-10-01", { category: "work" }), event("c2", "context", "2026-10-02", { category: "sleep" })], []);
    assert.equal(branches.find(branch => branch.id === "relationships")?.learned, false);
  });
  it("unlocks self-regulation after repeated measured interventions on different days", () => {
    const branches = buildPersonalGrowthTree([event("i1", "intervention", "2026-10-01", { initialIntensity: 8, finalIntensity: 5 }), event("i2", "intervention", "2026-10-03", { initialIntensity: 7, finalIntensity: 4 })], []);
    assert.equal(branches.find(branch => branch.id === "self_regulation")?.learned, true);
  });
  it("ignores malformed dates and timestamps", () => {
    const branches = buildPersonalGrowthTree([event("bad", "habit", "bad-date")], []);
    assert.equal(branches.find(branch => branch.id === "habits")?.evidenceCount, 0);
  });
});
