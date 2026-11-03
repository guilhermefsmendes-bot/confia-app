import { useCallback, useState } from "react";

const RETAINED_TABS = new Set([0, 1, 2]);

/** Keeps the lightweight personal and objectives tabs mounted after first visit.
 * Community is intentionally excluded because it owns live subscriptions and
 * should release them while the user is elsewhere.
 */
export function useVisitedTabs(initialTab = 0) {
  const [visitedTabs, setVisitedTabs] = useState<number[]>([initialTab]);
  const markVisited = useCallback((tab: number) => {
    if (!RETAINED_TABS.has(tab)) return;
    setVisitedTabs(current => current.includes(tab) ? current : [...current, tab]);
  }, []);
  return { visitedTabs, markVisited };
}
