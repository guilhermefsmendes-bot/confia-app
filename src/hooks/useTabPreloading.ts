import { useCallback, useEffect } from "react";

function safePreload(loader: () => Promise<unknown>, label: string) {
  void loader().catch(error => console.warn(`[Confia] prefetch_failed:${label}`, error));
}

/**
 * Warm the common tab modules sequentially during genuine idle periods.
 * Never start large imports on pointer-down: that event must remain responsive.
 * The very large Horizon experience is intentionally excluded and loads only
 * when the person explicitly chooses Explore.
 */
export function useTabPreloading(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    let startTimer: number | undefined;
    const idleIds: number[] = [];
    const fallbackTimers: number[] = [];
    const queueIdle = (task: () => void) => {
      if (cancelled) return;
      const requestIdle = (window as any).requestIdleCallback;
      if (typeof requestIdle === "function") {
        idleIds.push(requestIdle(() => { if (!cancelled) task(); }));
      } else {
        fallbackTimers.push(window.setTimeout(() => { if (!cancelled) task(); }, 1800));
      }
    };
    const loaders: Array<[string, () => Promise<unknown>]> = [
      ["tabs-shell", () => import("../components/layout/AppTabs")],
      ["embrace-pause", () => import("../components/AbracoTimer")],
      ["objectives", () => import("../components/ObjectivosList")],
      ["weekly-goal", () => import("../components/WeeklyGoalSection")],
      ["community-feed", () => import("../components/PartilhaFeed")],
    ];
    const warmNext = (index: number) => {
      if (cancelled || index >= loaders.length) return;
      const [label, loader] = loaders[index];
      void loader()
        .catch(error => console.warn(`[Confia] prefetch_failed:${label}`, error))
        .finally(() => queueIdle(() => warmNext(index + 1)));
    };

    // Let the first screen settle before warming one feature chunk per idle slot.
    startTimer = window.setTimeout(() => queueIdle(() => warmNext(0)), 3500);
    return () => {
      cancelled = true;
      if (startTimer !== undefined) window.clearTimeout(startTimer);
      idleIds.forEach(id => (window as any).cancelIdleCallback?.(id));
      fallbackTimers.forEach(id => window.clearTimeout(id));
    };
  }, [enabled]);

  // A small shell-only warm-up on explicit navigation intent. Feature chunks
  // have already been warmed opportunistically above where the browser allows.
  return useCallback((tab: number) => {
    if (!enabled || (tab !== 1 && tab !== 2 && tab !== 4)) return;
    safePreload(() => import("../components/layout/AppTabs"), "tabs-shell");
  }, [enabled]);
}
