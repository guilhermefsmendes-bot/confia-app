import { useEffect } from "react";
import type { NoticeTarget } from "../notifications/model";
import { scheduleBackgroundWork } from "../utils/scheduleBackgroundWork";

export function useDeferredAppServices(
  appDataReady: boolean,
  setNoticeDestination: (target: NoticeTarget | null) => void,
) {
  useEffect(() => {
    if (!appDataReady) return;
    return scheduleBackgroundWork(() => {
      void import("../firebaseAuth").then(({ initAnonymousAuth }) =>
        initAnonymousAuth().catch(error => console.error("Firebase Auth:", error)),
      );
    }, 800, 1200);
  }, [appDataReady]);

  useEffect(() => {
    if (!appDataReady) return;
    return scheduleBackgroundWork(() => {
      void import("../data/personal").then(({ syncPersonalEventsFromLegacySources }) => {
        try { syncPersonalEventsFromLegacySources(); } catch { /* migração complementar */ }
      });
    }, 9000, 5200);
  }, [appDataReady]);

  useEffect(() => {
    if (!appDataReady) return;
    return scheduleBackgroundWork(() => {
      void import("../data/habits/sync").then(module => module.startHabitSync());
    }, 3500, 4200);
  }, [appDataReady]);

  useEffect(() => {
    if (!appDataReady) return;
    let stop = () => {};
    let cancelled = false;
    const cancelSchedule = scheduleBackgroundWork(() => {
      void import("../notifications/service").then(({ connectNoticeNavigation, startNativeNotices }) => {
        if (cancelled) return;
        stop = connectNoticeNavigation(setNoticeDestination);
        void startNativeNotices();
      }).catch(error => console.error("Notificações:", error));
    }, 6500, 4200);
    return () => {
      cancelled = true;
      cancelSchedule();
      stop();
    };
  }, [appDataReady, setNoticeDestination]);
}
