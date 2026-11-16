import test from "node:test";
import assert from "node:assert/strict";
import {
  buildDailyContext,
  buildHomeNowContext,
  type DailyContextInput,
} from "../homeContext";

const dailyInput = (overrides: Partial<DailyContextInput> = {}) => ({
  currentTab: 0,
  homeScreen: "home",
  isFirstContact: false,
  isFirstAppOpenToday: true,
  daysSincePreviousAppOpen: 1,
  previousAppOpenDate: "2026-11-15",
  isEarlyLearning: false,
  homeNowMemory: null,
  homeNowAction: null,
  ...overrides,
} as DailyContextInput);

const memory = (value: unknown) =>
  value as Parameters<typeof buildHomeNowContext>[1];
const action = (value: unknown) =>
  value as Parameters<typeof buildHomeNowContext>[0];

test("daily context preserves the first-contact priority", () => {
  const result = buildDailyContext(dailyInput({
    isFirstContact: true,
    isFirstAppOpenToday: true,
    daysSincePreviousAppOpen: 8,
  }));
  assert.equal(result?.state, "first_contact");
});

test("daily context distinguishes return after absence from first open today", () => {
  assert.equal(
    buildDailyContext(dailyInput({ daysSincePreviousAppOpen: 2 }))?.state,
    "return_after_absence",
  );
  assert.equal(
    buildDailyContext(dailyInput({ daysSincePreviousAppOpen: 1 }))?.state,
    "first_today",
  );
  assert.equal(
    buildDailyContext(dailyInput({ isFirstAppOpenToday: false }))?.state,
    "already_here_today",
  );
});

test("daily context remains unavailable outside the home screen", () => {
  assert.equal(buildDailyContext(dailyInput({ currentTab: 1 })), null);
  assert.equal(buildDailyContext(dailyInput({ homeScreen: "map" })), null);
});

test("daily learning level follows the existing evidence hierarchy", () => {
  const cases = [
    [{ kind: "impulseLearning" }, false, "learned_impulse"],
    [{ kind: "impulseMemory" }, false, "effective_impulse"],
    [{ kind: "continuity" }, false, "repeated_signals"],
    [null, true, "early_learning"],
    [null, false, "none"],
  ] as const;

  for (const [homeNowMemory, isEarlyLearning, expected] of cases) {
    assert.equal(
      buildDailyContext(dailyInput({
        homeNowMemory: memory(homeNowMemory),
        isEarlyLearning,
      }))?.dailyLearningLevel,
      expected,
    );
  }
});

test("daily context reuses the existing action and memory labels", () => {
  const result = buildDailyContext(dailyInput({
    homeNowMemory: memory({ kind: "impulseLearning" }),
    homeNowAction: action({ kind: "impulse" }),
  }));
  assert.equal(result?.memoryKind, "impulseLearning");
  assert.equal(result?.suggestedAction, "impulse");
  assert.equal(result?.hasImpulseLearning, true);
});

test("impulse action shows learning memory unchanged", () => {
  const homeNowMemory = memory({ kind: "impulseLearning", effectiveCount: 3 });
  assert.deepEqual(
    buildHomeNowContext(action({ kind: "impulse" }), homeNowMemory),
    { kind: "impulseLearning", memory: homeNowMemory },
  );
});

test("impulse action requires repeated evidence for continuity", () => {
  assert.deepEqual(
    buildHomeNowContext(
      action({ kind: "impulse" }),
      memory({
        kind: "impulseMemory",
        continuity: {
          hasRepeatedSignals: true,
          repeatedNeedCount: 1,
          recentEffectiveImpulseCount: 2,
        },
      }),
    ),
    { kind: "continuity", source: "impulse", count: 2 },
  );
  assert.equal(
    buildHomeNowContext(
      action({ kind: "impulse" }),
      memory({
        kind: "impulseMemory",
        continuity: {
          hasRepeatedSignals: false,
          repeatedNeedCount: 4,
          recentEffectiveImpulseCount: 4,
        },
      }),
    ),
    null,
  );
});

test("patterns prefer cross-source continuity, then repeated check-ins", () => {
  assert.deepEqual(
    buildHomeNowContext(
      action({ kind: "patterns" }),
      memory({
        kind: "continuity",
        signalCount: 2,
        repeatedCheckInNeed: "sleep",
        repeatedCheckInNeedCount: 3,
      }),
    ),
    { kind: "continuity", source: "cross", count: 2 },
  );
  assert.deepEqual(
    buildHomeNowContext(
      action({ kind: "patterns" }),
      memory({
        kind: "continuity",
        signalCount: 1,
        repeatedCheckInNeed: "sleep",
        repeatedCheckInNeedCount: 3,
      }),
    ),
    { kind: "continuity", source: "checkIn", count: 3 },
  );
});

test("progress shows continuity only when mood direction is improving", () => {
  assert.deepEqual(
    buildHomeNowContext(
      action({ kind: "progress" }),
      memory({ kind: "continuity", moodDirection: "improving", moodRecordCount: 4 }),
    ),
    { kind: "continuity", source: "mood", count: 4 },
  );
  assert.equal(
    buildHomeNowContext(
      action({ kind: "progress" }),
      memory({ kind: "continuity", moodDirection: "stable", moodRecordCount: 4 }),
    ),
    null,
  );
});

test("incompatible action-memory pairs never create contextual continuity", () => {
  assert.equal(
    buildHomeNowContext(
      action({ kind: "objectives" }),
      memory({ kind: "continuity", signalCount: 8 }),
    ),
    null,
  );
  assert.equal(buildHomeNowContext(null, memory({ kind: "continuity" })), null);
  assert.equal(buildHomeNowContext(action({ kind: "patterns" }), null), null);
});
