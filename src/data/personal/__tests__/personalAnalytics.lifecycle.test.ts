import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getRetentionMilestones } from "../personalAnalytics";

describe("local retention cohort milestones", () => {
  it("records only exact day 1, 7 and 30 returns", () => {
    const first = "2026-11-01";
    assert.deepEqual(getRetentionMilestones(first, "2026-11-02"), ["retention_d1"]);
    assert.deepEqual(getRetentionMilestones(first, "2026-11-08"), ["retention_d7"]);
    assert.deepEqual(getRetentionMilestones(first, "2026-12-01"), ["retention_d30"]);
    assert.deepEqual(getRetentionMilestones(first, "2026-11-03"), []);
  });
});
