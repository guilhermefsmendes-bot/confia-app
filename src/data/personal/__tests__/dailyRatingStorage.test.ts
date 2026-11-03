import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { normalizeDailyRatings, normalizeLegacyRating } from "../../../storage/dailyRatingStorage";

describe("shared emotional rating scale", () => {
  it("maps legacy 0–10 values to 1–10", () => {
    assert.deepEqual([0,2,4,6,8,10].map(normalizeLegacyRating), [1,3,5,6,8,10]);
  });
  it("keeps null values and does not remap versioned data", () => {
    const result = normalizeDailyRatings([{date:"2026-11-01",morning:1,afternoon:null,scaleVersion:2}]);
    assert.equal(result[0].morning,1);
    assert.equal(result[0].afternoon,null);
  });
  it("normalizes historical records exactly once", () => {
    const result = normalizeDailyRatings([{date:"2026-10-01",morning:0,afternoon:10}]);
    assert.equal(result[0].morning,1);
    assert.equal(result[0].afternoon,10);
    assert.equal(result[0].scaleVersion,2);
  });
});

  it("ignores malformed calendar dates instead of creating invalid timeline timestamps", () => {
    const result = normalizeDailyRatings([
      { date: "2026-11-03", morning: 7, afternoon: null, scaleVersion: 2 },
      { date: "2026-02-30", morning: 8, afternoon: null, scaleVersion: 2 },
      { date: "not-a-date", morning: 9, afternoon: null, scaleVersion: 2 },
    ]);
    assert.deepEqual(result.map(item => item.date), ["2026-11-03"]);
    it("ignores malformed calendar dates instead of creating invalid timeline timestamps", () => {
    const result = normalizeDailyRatings([
      { date: "2026-11-03", morning: 7, afternoon: null, scaleVersion: 2 },
      { date: "2026-02-30", morning: 8, afternoon: null, scaleVersion: 2 },
      { date: "not-a-date", morning: 9, afternoon: null, scaleVersion: 2 },
    ]);
    assert.deepEqual(result.map(item => item.date), ["2026-11-03"]);
  });
});
