import { useEffect, useState } from "react";
import type { DailyRating } from "../types";
import type { PersonalInsight } from "../data/personal/personalInsights";
import { scheduleBackgroundWork } from "../utils/scheduleBackgroundWork";
import { readCompanionPersonalContextConsent } from "../data/reactive/companionContextConsent";

export function usePersonalDiscovery(appDataReady: boolean, ratings: DailyRating[]) {
  const [personalDiscovery, setPersonalDiscovery] = useState<PersonalInsight | undefined>(undefined);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    if (!appDataReady) return;
    let cancelled = false;
    let unsubscribe = () => {};
    let idleId: number | undefined;
    let timerId: number | undefined;
    const cancelScheduledWork = () => {
      if (idleId !== undefined) (window as any).cancelIdleCallback?.(idleId);
      if (timerId !== undefined) window.clearTimeout(timerId);
    };
    const handleConsentChanged = () => setRevision(value => value + 1);
    window.addEventListener("confia:companion-context-consent-changed", handleConsentChanged);

    // Consent gates the analysis itself, not merely the display of its result.
    if (!readCompanionPersonalContextConsent()) {
      setPersonalDiscovery(undefined);
      return () => {
        cancelled = true;
        window.removeEventListener("confia:companion-context-consent-changed", handleConsentChanged);
      };
    }

    const cancelBackgroundStart = scheduleBackgroundWork(() => {
      void import("../data/personal").then(({
        PERSONAL_EVENTS_UPDATED_EVENT,
        readPersonalEvents,
        buildPersonalInsights,
        applyInsightLifecycle,
      }) => {
        if (cancelled || !readCompanionPersonalContextConsent()) return;
        const handlePersonalEventsUpdated = () => setRevision(value => value + 1);
        window.addEventListener(PERSONAL_EVENTS_UPDATED_EVENT, handlePersonalEventsUpdated);
        unsubscribe = () => window.removeEventListener(PERSONAL_EVENTS_UPDATED_EVENT, handlePersonalEventsUpdated);
        const calculateDiscovery = () => {
          if (cancelled || !readCompanionPersonalContextConsent()) {
            setPersonalDiscovery(undefined);
            return;
          }
          const insights = applyInsightLifecycle(buildPersonalInsights(readPersonalEvents(), new Date()));
          setPersonalDiscovery(insights
            .filter(insight => insight.status === "consistent" || insight.status === "possible")
            .filter(insight => insight.novelty !== "known" && insight.actionability !== "low")
            .sort((a, b) => {
              const confidence = { high: 3, moderate: 2, low: 1 };
              const actionability = { high: 3, medium: 2, low: 1 };
              return (confidence[b.confidence] * 2 + actionability[b.actionability]) - (confidence[a.confidence] * 2 + actionability[a.actionability]);
            })[0]);
        };
        const idle = (window as any).requestIdleCallback;
        if (typeof idle === "function") idleId = idle(calculateDiscovery, { timeout: 700 });
        else timerId = window.setTimeout(calculateDiscovery, 50);
      }).catch(() => { if (!cancelled) setPersonalDiscovery(undefined); });
    }, 900, 1200);
    return () => {
      cancelled = true;
      window.removeEventListener("confia:companion-context-consent-changed", handleConsentChanged);
      cancelBackgroundStart();
      cancelScheduledWork();
      unsubscribe();
    };
  }, [ratings, revision, appDataReady]);

  return personalDiscovery;
}
