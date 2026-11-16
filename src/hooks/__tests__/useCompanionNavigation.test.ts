import test from "node:test";
import assert from "node:assert/strict";
import {
  createCompanionNavigationHandlers,
  type CompanionNavigationDependencies,
} from "../useCompanionNavigation";
import type { CompanionAction } from "../../components/Companheiro/CompanionVoice";

function createHarness() {
  const calls: string[] = [];
  let habitEntry = { page: "home", key: 0 };

  const dependencies = {
    setCurrentTab: (tab: number) => calls.push(`tab:${tab}`),
    changeTab: (tab: number) => calls.push(`changeTab:${tab}`),
    setHomeScreen: (screen: string) => calls.push(`screen:${screen}`),
    setOpenHabitSupport: (value: unknown) => calls.push(`habitSupport:${String(value)}`),
    setHabitEntry: (update: (old: typeof habitEntry) => typeof habitEntry) => {
      habitEntry = update(habitEntry);
      calls.push(`habitEntry:${habitEntry.page}:${habitEntry.key}`);
    },
    setShowDayRatingPanel: (value: unknown) => calls.push(`dayRating:${String(value)}`),
    onProgressNavigation: () => calls.push("progressEvent"),
  } as unknown as CompanionNavigationDependencies;

  return { calls, dependencies, getHabitEntry: () => habitEntry };
}

const target = (value: string) => value as CompanionAction;

test("Companion habit navigation preserves setter order and page mapping", () => {
  const { calls, dependencies, getHabitEntry } = createHarness();
  const originalRAF = globalThis.requestAnimationFrame;
  globalThis.requestAnimationFrame = (() => {
    calls.push("requestFrame");
    return 1;
  }) as typeof requestAnimationFrame;

  try {
    createCompanionNavigationHandlers(dependencies).handleCompanionAction(target("habitHistory"));
    assert.deepEqual(calls, [
      "habitSupport:false",
      "habitEntry:history:1",
      "tab:0",
      "screen:home",
      "requestFrame",
    ]);
    assert.deepEqual(getHabitEntry(), { page: "history", key: 1 });
  } finally {
    if (originalRAF) globalThis.requestAnimationFrame = originalRAF;
    else delete (globalThis as { requestAnimationFrame?: typeof requestAnimationFrame }).requestAnimationFrame;
  }
});

test("Companion destinations preserve their original tab and screen order", () => {
  const { calls, dependencies } = createHarness();
  const handlers = createCompanionNavigationHandlers(dependencies);

  handlers.handleCompanionAction(target("breathe"));
  handlers.handleCompanionAction(target("objectives"));
  handlers.handleCompanionAction(target("community"));
  handlers.handleCompanionAction(target("record"));
  handlers.handleCompanionAction(target("patterns"));
  handlers.handleCompanionAction(target("inventory"));
  handlers.handleCompanionAction(target("shop"));

  assert.deepEqual(calls, [
    "tab:1", "screen:home",
    "tab:2", "screen:home",
    "tab:4", "screen:home",
    "tab:0", "screen:dailyCheckIn",
    "screen:map", "tab:0",
    "screen:inventory", "tab:0",
    "screen:shop", "tab:0",
  ]);
});

test("progress navigation records the event before changing screen and tab", () => {
  const { calls, dependencies } = createHarness();
  createCompanionNavigationHandlers(dependencies).handleCompanionAction(target("progress"));
  assert.deepEqual(calls, ["progressEvent", "screen:progress", "tab:0"]);
});

test("home-now objectives use changeTab while patterns only change the home screen", () => {
  const { calls, dependencies } = createHarness();
  const handlers = createCompanionNavigationHandlers(dependencies);

  handlers.handleHomeNowAction({ kind: "objectives" } as never);
  handlers.handleHomeNowAction({ kind: "patterns" } as never);

  assert.deepEqual(calls, ["changeTab:2", "screen:map"]);
});

test("home-now record opens the panel before scheduling its scroll", () => {
  const { calls, dependencies } = createHarness();
  const originalRAF = globalThis.requestAnimationFrame;
  globalThis.requestAnimationFrame = (() => {
    calls.push("requestFrame");
    return 1;
  }) as typeof requestAnimationFrame;

  try {
    createCompanionNavigationHandlers(dependencies)
      .handleHomeNowAction({ kind: "record" } as never);
    assert.deepEqual(calls, ["dayRating:true", "requestFrame"]);
  } finally {
    if (originalRAF) globalThis.requestAnimationFrame = originalRAF;
    else delete (globalThis as { requestAnimationFrame?: typeof requestAnimationFrame }).requestAnimationFrame;
  }
});
