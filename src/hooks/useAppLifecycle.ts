import { useEffect, useState } from "react";

export function useAgeGate() {
  const [ageConfirmed, setAgeConfirmed] = useState(() => {
    try {
      return typeof window !== "undefined" && window.localStorage.getItem("confia_age_18_confirmed_v1") === "yes";
    } catch {
      return false;
    }
  });
  const ageGateReady = true;
  const [ageCheckboxChecked, setAgeCheckboxChecked] = useState(false);
  const [underageNotice, setUnderageNotice] = useState(false);

  const confirmAge = () => {
    try { localStorage.setItem("confia_age_18_confirmed_v1", "yes"); } catch { /* sessão atual */ }
    setAgeConfirmed(true);
  };

  return {
    ageGateReady,
    ageConfirmed,
    setAgeConfirmed,
    ageCheckboxChecked,
    setAgeCheckboxChecked,
    underageNotice,
    setUnderageNotice,
    confirmAge,
  };
}

export function useDocumentVisibility() {
  useEffect(() => {
    const updateVisibility = () => document.documentElement.classList.toggle(
      "confia-document-hidden",
      document.visibilityState === "hidden",
    );
    updateVisibility();
    document.addEventListener("visibilitychange", updateVisibility);
    return () => {
      document.removeEventListener("visibilitychange", updateVisibility);
      document.documentElement.classList.remove("confia-document-hidden");
    };
  }, []);
}

export function useObjectiveDaySync(
  appDataReady: boolean,
  setObjectives: React.Dispatch<React.SetStateAction<any[]>>,
) {
  useEffect(() => {
    if (!appDataReady) return;
    let objectiveDay = getLocalCalendarDate();
    const syncObjectiveDay = () => {
      const today = getLocalCalendarDate();
      if (today === objectiveDay) return;
      objectiveDay = today;
      void import("../data/initialData")
        .then(({ getDailyObjectives }) => setObjectives(getDailyObjectives(new Date())))
        .catch(() => {});
    };

    let midnightTimeout = 0;
    const scheduleNextMidnight = () => {
      const now = new Date();
      const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1);
      midnightTimeout = window.setTimeout(() => {
        syncObjectiveDay();
        scheduleNextMidnight();
      }, Math.max(1000, nextMidnight.getTime() - now.getTime()));
    };
    const handleVisibility = () => {
      if (document.visibilityState === "visible") syncObjectiveDay();
    };
    scheduleNextMidnight();
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.clearTimeout(midnightTimeout);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [appDataReady, setObjectives]);
}

function getLocalCalendarDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return year + "-" + month + "-" + day;
}
