import test from "node:test";
import assert from "node:assert/strict";
import {
  getCalendarDaysDifference,
  getLocalCalendarDate,
} from "../date";

test("returns the local calendar date without UTC rollover", () => {
  const date = new Date(2026, 8, 18, 0, 30, 0);
  assert.equal(getLocalCalendarDate(date), "2026-09-18");
});

test("pads month and day consistently", () => {
  const date = new Date(2026, 0, 5, 12, 0, 0);
  assert.equal(getLocalCalendarDate(date), "2026-01-05");
});

test("handles month and year boundaries using local time", () => {
  assert.equal(getLocalCalendarDate(new Date(2026, 11, 31, 23, 59, 59)), "2026-12-31");
  assert.equal(getLocalCalendarDate(new Date(2027, 0, 1, 0, 0, 0)), "2027-01-01");
});

test("returns undefined when there is no previous date", () => {
  assert.equal(getCalendarDaysDifference(null, "2026-09-18"), undefined);
});

test("returns undefined for malformed calendar dates", () => {
  assert.equal(getCalendarDaysDifference("2026-09", "2026-09-18"), undefined);
  assert.equal(getCalendarDaysDifference("not-a-date", "2026-09-18"), undefined);
});

test("calculates calendar-day gaps across month boundaries", () => {
  assert.equal(getCalendarDaysDifference("2026-09-30", "2026-10-02"), 2);
});

test("clamps backwards dates to zero", () => {
  assert.equal(getCalendarDaysDifference("2026-09-19", "2026-09-18"), 0);
});
