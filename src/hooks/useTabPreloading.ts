import { useCallback } from "react";

function safePreload(loader: () => Promise<unknown>, label: string) {
  void loader().catch(error => console.warn(`[Confia] prefetch_failed:${label}`, error));
}

/** Load a tab's code only after a real navigation intent (hover/focus/tap). */
export function useTabPreloading(enabled: boolean) {
  return useCallback((tab: number) => {
    if (!enabled) return;
    if (tab === 1 || tab === 2 || tab === 4) {
      // AppTabs itself is lazy too; warming only its children still leaves
      // the first tap waiting for the parent chunk on slower mobile networks.
      safePreload(() => import("../components/layout/AppTabs"), "tabs-shell");
    }
    if (tab === 1) {
      safePreload(() => import("../components/HorizonExperience"), "horizon");
      safePreload(() => import("../components/AbracoTimer"), "abraco");
    } else if (tab === 2) {
      safePreload(() => import("../components/ObjectivosList"), "objectives");
      safePreload(() => import("../components/WeeklyGoalSection"), "weekly-goal");
    } else if (tab === 4) {
      safePreload(() => import("../components/PartilhaFeed"), "community-feed");
    }
  }, [enabled]);
}
