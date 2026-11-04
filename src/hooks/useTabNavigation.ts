import { useEffect, useState } from "react";
import { useVisitedTabs } from "./useVisitedTabs";
import { useTabPreloading } from "./useTabPreloading";

/** Owns tab state, first-visit retention and non-blocking navigation preloads. */
export function useTabNavigation({ enabled, resetHomeScreen }: { enabled: boolean; resetHomeScreen: () => void }) {
  const [currentTab, setCurrentTab] = useState(0);
  const { visitedTabs, markVisited } = useVisitedTabs(0);
  const preloadTab = useTabPreloading(enabled);

  useEffect(() => { markVisited(currentTab); }, [currentTab, markVisited]);

  // Also warm programmatic/deep-link navigation paths, not only pointer intent.
  useEffect(() => {
    if (enabled && currentTab !== 0) preloadTab(currentTab);
  }, [currentTab, enabled, preloadTab]);

  const changeTab = (tab: number) => {
    resetHomeScreen();
    setCurrentTab(tab);
    markVisited(tab);
    const run = () => preloadTab(tab);
    const idle = (window as any).requestIdleCallback;
    if (typeof idle === "function") idle(run, { timeout: 1200 });
    else window.setTimeout(run, 0);
  };

  return { currentTab, setCurrentTab, visitedTabs, markVisited, preloadTab, changeTab };
}
