import { useCallback } from "react";

type TabLoader = readonly [label: string, load: () => Promise<unknown>];

// Keep a tab's first screen warm only when the user signals intent.
// Avoid downloading and parsing screens that may never be opened, especially
// on constrained mobile devices and metered connections.
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
// duplicate work when pointer, focus and navigation intent overlap.
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
 * Prepares only the screen the user is approaching (pointer/focus).
 * Programmatic navigation relies on the same React.lazy import as rendering.
 * The tab never waits for speculative background downloads.
 */
export function useTabPreloading(enabled: boolean) {
  return useCallback((tab: number) => {
    if (!enabled) return;
    void preloadTabModules(tab);
  }, [enabled]);
}
