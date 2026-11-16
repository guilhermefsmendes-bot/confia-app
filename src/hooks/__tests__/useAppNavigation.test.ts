import test from "node:test";
import assert from "node:assert/strict";
import {
  createAppNavigationHandlers,
  createAppReturnNavigationHandlers,
  type AppNavigationDependencies,
} from "../useAppNavigation";

function createHarness() {
  const calls: string[] = [];
  const dependencies = {
    setCurrentTab: (tab: number) => calls.push(`tab:${tab}`),
    setHomeScreen: (screen: string) => calls.push(`screen:${screen}`),
    setOpenHabitSupport: (value: unknown) => calls.push(`habitSupport:${String(value)}`),
    setOpenPendingChatOnCommunityEntry: (value: unknown) => calls.push(`pendingChat:${String(value)}`),
    setShowStopMode: (value: unknown) => calls.push(`stopMode:${String(value)}`),
  } as unknown as AppNavigationDependencies;
  return { calls, dependencies };
}

test("main tab navigation preserves state-reset order before selecting the tab", () => {
  const { calls, dependencies } = createHarness();
  createAppNavigationHandlers(dependencies).handleMainNavigation(4);
  assert.deepEqual(calls, [
    "habitSupport:false",
    "screen:home",
    "pendingChat:false",
    "tab:4",
  ]);
});

test("MorningSheet destinations preserve their original tab and screen pairs", () => {
  const { calls, dependencies } = createHarness();
  const handlers = createAppNavigationHandlers(dependencies);
  handlers.handleMorningSheetOpenSky();
  handlers.handleMorningSheetOpenMountain();
  handlers.handleMorningSheetOpenSea();
  handlers.handleMorningSheetOpenCommunity();
  handlers.handleMorningSheetOpenChest();
  assert.deepEqual(calls, [
    "tab:1", "screen:innerCanvas",
    "tab:2", "screen:home",
    "tab:1", "screen:home",
    "tab:4", "screen:home",
    "tab:2", "screen:home",
  ]);
});

test("Stop Mode closes first, opens habit support, navigates, then schedules the scroll", () => {
  const { calls, dependencies } = createHarness();
  const originalRAF = globalThis.requestAnimationFrame;
  globalThis.requestAnimationFrame = (() => {
    calls.push("requestFrame");
    return 1;
  }) as typeof requestAnimationFrame;
  try {
    createAppNavigationHandlers(dependencies).handleStopModeStartImpulse();
    assert.deepEqual(calls, [
      "stopMode:false",
      "habitSupport:true",
      "tab:0",
      "screen:home",
      "requestFrame",
    ]);
  } finally {
    if (originalRAF) globalThis.requestAnimationFrame = originalRAF;
    else delete (globalThis as { requestAnimationFrame?: typeof requestAnimationFrame }).requestAnimationFrame;
  }
});

test("opening the Inner Canvas changes only the home screen", () => {
  const { calls, dependencies } = createHarness();
  createAppNavigationHandlers(dependencies).handleOpenInnerCanvas();
  assert.deepEqual(calls, ["screen:innerCanvas"]);
});


test("return handlers preserve simple destinations and analytics-before-navigation order", () => {
  const calls: string[] = [];
  const handlers = createAppReturnNavigationHandlers({
    setHomeScreen: (screen: string) => calls.push(`screen:${screen}`),
    recordCompanionBrainEventDeferred: (type, metadata) =>
      calls.push(`event:${type}:${metadata.from}`),
  } as unknown as import("../useAppNavigation").AppReturnNavigationDependencies);

  handlers.handleBackFromGrowth();
  handlers.handleBackFromInnerCanvas();
  handlers.handleBackFromShop();
  handlers.handleBackFromInventory();

  assert.deepEqual(calls, [
    "screen:home",
    "screen:home",
    "event:home_returned:shop",
    "screen:home",
    "event:home_returned:inventory",
    "screen:home",
  ]);
});
