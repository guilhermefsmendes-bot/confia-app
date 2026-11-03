import { useEffect, useState } from "react";
import { getCalendarDaysDifference, getLocalCalendarDate } from "../utils/date";

const LAST_APP_OPEN_DATE_KEY = "confia_last_app_open_date_v1";

export interface DailyOpenState {
  appOpenDate: string;
  previousAppOpenDate: string | null;
  isFirstAppOpenToday: boolean;
  daysSincePreviousAppOpen: number | undefined;
}

export function useDailyOpenState(enabled = true): DailyOpenState {
  // Capture the calendar date without touching persistent storage during the
  // age gate. The previous date is hydrated only after the app enables work.
  const [appOpenDate] = useState(getLocalCalendarDate);
  const [dailyOpenState, setDailyOpenState] = useState<DailyOpenState>({
    appOpenDate,
    previousAppOpenDate: null,
    isFirstAppOpenToday: false,
    daysSincePreviousAppOpen: undefined,
  });

  useEffect(() => {
    if (!enabled) return;
    let previousAppOpenDate: string | null = null;
    try { previousAppOpenDate = localStorage.getItem(LAST_APP_OPEN_DATE_KEY); } catch { /* storage may be unavailable */ }
    const isFirstAppOpenToday = previousAppOpenDate !== appOpenDate;
    const next: DailyOpenState = {
      appOpenDate,
      previousAppOpenDate,
      isFirstAppOpenToday,
      daysSincePreviousAppOpen: getCalendarDaysDifference(previousAppOpenDate, appOpenDate),
    };
    setDailyOpenState(next);
    if (isFirstAppOpenToday) {
      try { localStorage.setItem(LAST_APP_OPEN_DATE_KEY, appOpenDate); } catch { /* keep this session usable */ }
    }
  }, [appOpenDate, enabled]);

  return dailyOpenState;
}
