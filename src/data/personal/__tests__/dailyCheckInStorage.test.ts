import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { normalizeLegacyDailyMood } from "../../../storage/dailyCheckInStorage";

describe("daily check-in legacy mood scale", () => {
  it("maps legacy 0–10 values onto the shared 1–10 scale", () => {
    assert.deepEqual([0, 2, 4, 6, 8, 10].map(normalizeLegacyDailyMood), [1, 3, 5, 6, 8, 10]);
  });
  it("clamps malformed values to the valid scale", () => {
    assert.equal(normalizeLegacyDailyMood(-4), 1);
    assert.equal(normalizeLegacyDailyMood(14), 10);
    assert.equal(normalizeLegacyDailyMood(Number.NaN), 1);
  });
});
