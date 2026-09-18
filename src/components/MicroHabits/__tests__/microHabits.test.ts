import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { MICRO_HABITS, getMicroHabitForContext } from "../microHabits";

describe("micro habits", () => {
  it("keeps every habit within the 30-second contract", () => {
    assert.ok(MICRO_HABITS.length > 0);
    assert.ok(MICRO_HABITS.every(habit => habit.durationSeconds === 30));
  });

  it("selects deterministically from the local calendar date", () => {
    const morning = getMicroHabitForContext(new Date(2026, 8, 18, 0, 5));
    const evening = getMicroHabitForContext(new Date(2026, 8, 18, 23, 55));
    assert.equal(evening.id, morning.id);
  });

  it("selects only registered habits across calendar days", () => {
    const validIds = new Set(MICRO_HABITS.map(habit => habit.id));
    assert.ok(validIds.has(getMicroHabitForContext(new Date(2026, 8, 18)).id));
    assert.ok(validIds.has(getMicroHabitForContext(new Date(2026, 8, 19)).id));
  });
});
