import { useEffect, useState } from "react";
import {
  getCalendarDaysDifference,
  getLocalCalendarDate,
} from "../utils/date";

const LAST_APP_OPEN_DATE_KEY = "confia_last_app_open_date_v1";

export interface DailyOpenState {
  appOpenDate: string;
  previousAppOpenDate: string | null;
  isFirstAppOpenToday: boolean;
  daysSincePreviousAppOpen: number | undefined;
}

export function useDailyOpenState(): DailyOpenState {
  const [dailyOpenState] = useState<DailyOpenState>(() => {
    const appOpenDate = getLocalCalendarDate();
    const previousAppOpenDate = localStorage.getItem(LAST_APP_OPEN_DATE_KEY);
    const isFirstAppOpenToday = previousAppOpenDate !== appOpenDate;
    const daysSincePreviousAppOpen = getCalendarDaysDifference(
      previousAppOpenDate,
      appOpenDate,
    );

    return {
      appOpenDate,
      previousAppOpenDate,
      isFirstAppOpenToday,
      daysSincePreviousAppOpen,
    };
  });

  useEffect(() => {
    if (!dailyOpenState.isFirstAppOpenToday) return;

    const storedDate = localStorage.getItem(LAST_APP_OPEN_DATE_KEY);
    if (storedDate === dailyOpenState.appOpenDate) return;

    localStorage.setItem(
      LAST_APP_OPEN_DATE_KEY,
      dailyOpenState.appOpenDate,
    );
  }, [dailyOpenState]);

  return dailyOpenState;
}
