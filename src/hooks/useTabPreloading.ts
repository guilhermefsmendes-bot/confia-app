import { useCallback, useEffect } from "react";
import { scheduleBackgroundWork } from "../utils/scheduleBackgroundWork";

type TabLoader = readonly [label: string, load: () => Promise<unknown>];

// Keep the first meaningful screen of each main tab warm. The larger Horizon
// experience remains intent-loaded from its own Explore control.
const TAB_LOADERS: Record<number, readonly TabLoader[]> = {
  1: [
    ["tabs-shell", () => import("../components/layout/AppTabs")],
    ["embrace-pause", () => import("../components/AbracoTimer")],
  ],
  2: [
    ["tabs-shell", () => import("../components/layout/AppTabs")],
    ["objectives-list", () => import("../components/ObjectivosList")],
    ["weekly-goal", () => import("../components/WeeklyGoalSection")],
  ],
  4: [
    ["tabs-shell", () => import("../components/layout/AppTabs")],
    ["community-feed", () => import("../components/PartilhaFeed")],
  ],
};

// Dynamic imports are cached by the bundler too; this map also prevents
// duplicate work when idle warm-up and a navigation intent happen together.
const moduleLoads = new Map<string, Promise<unknown>>();

function preloadModule([label, load]: TabLoader): Promise<unknown> {
  const existing = moduleLoads.get(label);
  if (existing) return existing;

  const pending = load().catch(error => {
    moduleLoads.delete(label);
    console.warn(`[Confia] prefetch_failed:${label}`, error);
  });
  moduleLoads.set(label, pending);
  return pending;
}

function preloadTabModules(tab: number): Promise<void> {
  const loaders = TAB_LOADERS[tab];
  if (!loaders) return Promise.resolve();
  return Promise.all(loaders.map(preloadModule)).then(() => undefined);
}

/**
 * Prepares the first screen of every main tab during idle time, in parallel.
 * Explicit pointer/focus intent can start the same imports before navigation.
 * No navigation waits for these promises and no large optional experience is
 * downloaded until the user chooses it.
 */
export function useTabPreloading(enabled: boolean) {
  const preloadTab = useCallback((tab: number) => {
    if (!enabled) return;
    void preloadTabModules(tab);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const cancelScheduledWork = scheduleBackgroundWork(() => {
      if (cancelled) return;
      // Parallel chunk requests avoid the previous multi-idle-slot waterfall.
      void Promise.all([1, 2, 4].map(tab => preloadTabModules(tab)));
    }, 450, 1400);

    return () => {
      cancelled = true;
      cancelScheduledWork();
    };
  }, [enabled]);

  return preloadTab;
}
