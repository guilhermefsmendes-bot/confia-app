import { useEffect, useRef, type Dispatch, type SetStateAction } from "react";
import type { Objective } from "../types";
import { getLocalCalendarDate } from "../utils/date";

/**
 * Keeps daily objectives aligned with the user's local calendar day without
 * polling continuously. Rechecks at local midnight and when the app resumes.
 */
export function useObjectiveDaySync(
  setObjectives: Dispatch<SetStateAction<Objective[]>>,
): void {
  const objectiveDayRef = useRef(getLocalCalendarDate());

  useEffect(() => {
    let midnightTimer: number | undefined;

    const syncObjectiveDay = () => {
      const today = getLocalCalendarDate();
      if (today !== objectiveDayRef.current) {
        objectiveDayRef.current = today;
        void import("../data/initialData")
          .then(({ getDailyObjectives }) =>
            setObjectives(getDailyObjectives(new Date())),
          )
          .catch(() => {});
      }

      if (midnightTimer !== undefined) window.clearTimeout(midnightTimer);
      const now = new Date();
      const nextMidnight = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
        0,
        0,
        1,
      );
      midnightTimer = window.setTimeout(
        syncObjectiveDay,
        Math.max(1_000, nextMidnight.getTime() - now.getTime()),
      );
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") syncObjectiveDay();
    };

    syncObjectiveDay();
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", syncObjectiveDay);

    return () => {
      if (midnightTimer !== undefined) window.clearTimeout(midnightTimer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", syncObjectiveDay);
    };
  }, [setObjectives]);
}
