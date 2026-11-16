import { useCallback, useEffect, useRef, useState } from "react";
import { useVisitedTabs } from "./useVisitedTabs";
import { useTabPreloading } from "./useTabPreloading";
import { startPerformanceSpan } from "../monitoring/performanceMetrics";

/** Owns tab state, first-visit retention and non-blocking navigation preloads. */
export function useTabNavigation({ enabled, resetHomeScreen }: { enabled: boolean; resetHomeScreen: () => void }) {
  const [currentTab, setCurrentTabState] = useState(0);
  const currentTabRef = useRef(currentTab);
  currentTabRef.current = currentTab;
  const pendingNavigationSpan = useRef<(() => number | null) | null>(null);
  const { visitedTabs, markVisited } = useVisitedTabs(0);
  const preloadTab = useTabPreloading(enabled);

  // Wrap every navigation path (buttons, deep links and programmatic actions)
  // so the measurement starts before React commits the new tab.
  const setCurrentTab = useCallback((tab: number) => {
    const previousTab = currentTabRef.current;
    if (tab !== previousTab) {
      pendingNavigationSpan.current?.();
      pendingNavigationSpan.current = startPerformanceSpan("tab-navigation-to-two-frames", { fromTab: previousTab, toTab: tab });
      currentTabRef.current = tab;
    }
    setCurrentTabState(tab);
  }, []);

  useEffect(() => {
    markVisited(currentTab);
    if (!pendingNavigationSpan.current) return;
    let secondFrame = 0;
    const firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => {
        pendingNavigationSpan.current?.();
        pendingNavigationSpan.current = null;
      });
    });
    return () => {
      cancelAnimationFrame(firstFrame);
      if (secondFrame) cancelAnimationFrame(secondFrame);
    };
  }, [currentTab, markVisited]);

  const changeTab = (tab: number) => {
    resetHomeScreen();
    setCurrentTab(tab);
  };

  return { currentTab, setCurrentTab, visitedTabs, preloadTab, changeTab };
}
