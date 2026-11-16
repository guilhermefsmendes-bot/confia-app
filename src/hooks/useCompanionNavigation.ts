import { useCallback, type Dispatch, type SetStateAction } from "react";
import type { CompanionAction } from "../components/Companheiro/CompanionVoice";
import type { getHomeNowAction } from "../data/reactive/homePresentation";

type HomeNowAction = ReturnType<typeof getHomeNowAction>;
type HomeScreen =
  | "home"
  | "dailyCheckIn"
  | "shop"
  | "inventory"
  | "settings"
  | "progress"
  | "innerCanvas"
  | "map";

interface UseCompanionNavigationOptions {
  setCurrentTab: (tab: number) => void;
  changeTab: (tab: number) => void;
  setHomeScreen: Dispatch<SetStateAction<HomeScreen>>;
  setOpenHabitSupport: Dispatch<SetStateAction<boolean>>;
  setHabitEntry: Dispatch<SetStateAction<{ page: string; key: number }>>;
  setShowDayRatingPanel: Dispatch<SetStateAction<boolean>>;
  onProgressNavigation: () => void;
}

export interface CompanionNavigationDependencies extends UseCompanionNavigationOptions {}

export function createCompanionNavigationHandlers({
  setCurrentTab,
  changeTab,
  setHomeScreen,
  setOpenHabitSupport,
  setHabitEntry,
  setShowDayRatingPanel,
  onProgressNavigation,
}: CompanionNavigationDependencies) {
  const handleCompanionAction = (target: CompanionAction) => {
    if (["habits", "habitHistory", "nutrition", "exercise", "plans"].includes(target)) {
      setOpenHabitSupport(false);
      setHabitEntry(old => ({
        page: target === "habitHistory" ? "history" : target === "habits" ? "home" : target,
        key: old.key + 1,
      }));
      setCurrentTab(0);
      setHomeScreen("home");
      requestAnimationFrame(() =>
        document.getElementById("home-habits")?.scrollIntoView({ block: "start" })
      );
      return;
    }

    if (target === "breathe") {
      setCurrentTab(1);
      setHomeScreen("home");
      return;
    }
    if (target === "objectives") {
      setCurrentTab(2);
      setHomeScreen("home");
      return;
    }
    if (target === "community") {
      setCurrentTab(4);
      setHomeScreen("home");
      return;
    }
    if (target === "mood" || target === "record") {
      setCurrentTab(0);
      setHomeScreen("dailyCheckIn");
      return;
    }

    if (target === "impulse") {
      setOpenHabitSupport(true);
      setHomeScreen("home");
      setCurrentTab(0);
      setHomeScreen("home");
      requestAnimationFrame(() =>
        document.getElementById("home-habits")?.scrollIntoView({ block: "start" })
      );
      return;
    }

    if (target === "patterns") {
      setHomeScreen("map");
      setCurrentTab(0);
      return;
    }

    if (target === "progress") {
      onProgressNavigation();
      setHomeScreen("progress");
      setCurrentTab(0);
      return;
    }

    if (target === "inventory") {
      setHomeScreen("inventory");
      setCurrentTab(0);
      return;
    }

    if (target === "shop") {
      setHomeScreen("shop");
      setCurrentTab(0);
    }
  };

  const handleHomeNowAction = (homeNowAction: HomeNowAction) => {
    if (!homeNowAction) return;

    switch (homeNowAction.kind) {
      case "impulse":
        setOpenHabitSupport(true);
        setCurrentTab(0);
        setHomeScreen("home");
        requestAnimationFrame(() =>
          document.getElementById("home-habits")?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          })
        );
        return;

      case "patterns":
        setHomeScreen("map");
        return;

      case "objectives":
        changeTab(2);
        return;

      case "progress":
        setHomeScreen("progress");
        return;

      case "record":
        setShowDayRatingPanel(true);
        requestAnimationFrame(() => {
          document
            .getElementById("home-daily-record")
            ?.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
        });
        return;
    }
  };

  return { handleCompanionAction, handleHomeNowAction };
}

/** React adapter: handlers remain stable while their navigation dependencies are stable. */
export function useCompanionNavigation(options: UseCompanionNavigationOptions) {
  const {
    setCurrentTab,
    changeTab,
    setHomeScreen,
    setOpenHabitSupport,
    setHabitEntry,
    setShowDayRatingPanel,
    onProgressNavigation,
  } = options;

  const handleCompanionAction = useCallback(
    (target: CompanionAction) =>
      createCompanionNavigationHandlers(options).handleCompanionAction(target),
    [
      setCurrentTab,
      setHomeScreen,
      setOpenHabitSupport,
      setHabitEntry,
      onProgressNavigation,
    ],
  );

  const handleHomeNowAction = useCallback(
    (action: HomeNowAction) =>
      createCompanionNavigationHandlers(options).handleHomeNowAction(action),
    [
      setOpenHabitSupport,
      setCurrentTab,
      setHomeScreen,
      changeTab,
      setShowDayRatingPanel,
    ],
  );

  return { handleCompanionAction, handleHomeNowAction };
}
