import { useEffect, useState } from "react";
import { scheduleBackgroundWork } from "../utils/scheduleBackgroundWork";
import type { ReactiveResult } from "../data/reactive/reactiveTypes";

interface UseHomeReactiveEngineOptions {
  appDataReady: boolean;
  currentTab: number;
  homeScreen: string;
  ratings: readonly unknown[];
  objectives: readonly unknown[];
  weeklyGoal: unknown;
  avatarXp: number;
}

/**
 * Owns the lifecycle of the existing single Reactive Engine result.
 * The engine is still imported on demand and analysed only for the home view.
 */
export function useHomeReactiveEngine({
  appDataReady,
  currentTab,
  homeScreen,
  ratings,
  objectives,
  weeklyGoal,
  avatarXp,
}: UseHomeReactiveEngineOptions) {
const [homeReactiveResult, setHomeReactiveResult] =
  useState<ReactiveResult | null>(null);

useEffect(() => {
  let cancelled = false;
  if (!appDataReady || currentTab !== 0 || homeScreen !== "home") {
    setHomeReactiveResult(null);
    return () => { cancelled = true; };
  }
  // Debounce rapid state changes and fetch the analysis engine only in idle time.
  const cancelBackgroundStart = scheduleBackgroundWork(() => {
    void import("../data/reactive/reactiveEngine")
      .then(({ analyzeReactiveState }) => {
        if (!cancelled) setHomeReactiveResult(analyzeReactiveState({ source: "general" }));
      })
      .catch(() => { if (!cancelled) setHomeReactiveResult(null); });
  }, 1800, 3200);
  return () => {
    cancelled = true;
    cancelBackgroundStart();
  };
}, [currentTab, homeScreen, ratings, objectives, weeklyGoal, avatarXp, appDataReady]);

  return homeReactiveResult;
}
