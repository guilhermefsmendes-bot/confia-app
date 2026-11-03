import { useCallback } from "react";

function safePreload(loader: () => Promise<unknown>, label: string) {
  void loader().catch(error => console.warn(`[Confia] prefetch_failed:${label}`, error));
}

/** Load a tab's code only after a real navigation intent (hover/focus/tap). */
export function useTabPreloading(enabled: boolean) {
  return useCallback((tab: number) => {
    if (!enabled) return;
    if (tab === 1) {
      safePreload(() => import("../components/HorizonExperience"), "horizon");
      safePreload(() => import("../components/AbracoTimer"), "abraco");
    } else if (tab === 2) {
      safePreload(() => import("../components/ObjectivosList"), "objectives");
      safePreload(() => import("../components/WeeklyGoalSection"), "weekly-goal");
    } else if (tab === 4) {
      safePreload(() => import("../components/PartilhaFeed"), "community-feed");
      safePreload(() => import("../components/CommunityChat"), "community-chat");
    }
  }, [enabled]);
}
