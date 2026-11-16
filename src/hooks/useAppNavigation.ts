import { useCallback, type Dispatch, type SetStateAction } from "react";

type HomeScreen = "home" | "dailyCheckIn" | "shop" | "inventory" | "settings" | "progress" | "innerCanvas" | "map";

export interface AppNavigationDependencies {
  setCurrentTab: (tab: number) => void;
  setHomeScreen: Dispatch<SetStateAction<HomeScreen>>;
  setOpenHabitSupport: Dispatch<SetStateAction<boolean>>;
  setOpenPendingChatOnCommunityEntry: Dispatch<SetStateAction<boolean>>;
  setShowStopMode: Dispatch<SetStateAction<boolean>>;
}

/** Pure handler factory makes route destinations and operation order regression-testable. */
export function createAppNavigationHandlers({
  setCurrentTab,
  setHomeScreen,
  setOpenHabitSupport,
  setOpenPendingChatOnCommunityEntry,
  setShowStopMode,
}: AppNavigationDependencies) {
  const handleOpenInnerCanvas = () => {
    setHomeScreen("innerCanvas");
  };

  const handleMainNavigation = (index: number) => {
    setOpenHabitSupport(false);
    setHomeScreen("home");
    // Community opens on the feed; unread chats remain available from its badge.
    setOpenPendingChatOnCommunityEntry(false);
    setCurrentTab(index);
  };

  const handleMorningSheetOpenSky = () => {
    setCurrentTab(1);
    setHomeScreen("innerCanvas");
  };

  const handleMorningSheetOpenMountain = () => {
    setCurrentTab(2);
    setHomeScreen("home");
  };

  const handleMorningSheetOpenSea = () => {
    setCurrentTab(1);
    setHomeScreen("home");
  };

  const handleMorningSheetOpenCommunity = () => {
    setCurrentTab(4);
    setHomeScreen("home");
  };

  const handleMorningSheetOpenChest = () => {
    setCurrentTab(2);
    setHomeScreen("home");
  };

  const handleStopModeStartImpulse = () => {
    setShowStopMode(false);
    setOpenHabitSupport(true);
    setCurrentTab(0);
    setHomeScreen("home");
    requestAnimationFrame(() =>
      document.getElementById("home-habits")?.scrollIntoView({ block: "start" })
    );
  };

  return {
    handleOpenInnerCanvas,
    handleMainNavigation,
    handleMorningSheetOpenSky,
    handleMorningSheetOpenMountain,
    handleMorningSheetOpenSea,
    handleMorningSheetOpenCommunity,
    handleMorningSheetOpenChest,
    handleStopModeStartImpulse,
  };
}

/** React adapter keeps callbacks stable while their state setters remain stable. */
export function useAppNavigation(options: AppNavigationDependencies) {
  const {
    setCurrentTab,
    setHomeScreen,
    setOpenHabitSupport,
    setOpenPendingChatOnCommunityEntry,
    setShowStopMode,
  } = options;

  const handleOpenInnerCanvas = useCallback(
    () => createAppNavigationHandlers(options).handleOpenInnerCanvas(),
    [setHomeScreen],
  );
  const handleMainNavigation = useCallback(
    (index: number) => createAppNavigationHandlers(options).handleMainNavigation(index),
    [setCurrentTab, setHomeScreen, setOpenHabitSupport, setOpenPendingChatOnCommunityEntry],
  );
  const handleMorningSheetOpenSky = useCallback(
    () => createAppNavigationHandlers(options).handleMorningSheetOpenSky(),
    [setCurrentTab, setHomeScreen],
  );
  const handleMorningSheetOpenMountain = useCallback(
    () => createAppNavigationHandlers(options).handleMorningSheetOpenMountain(),
    [setCurrentTab, setHomeScreen],
  );
  const handleMorningSheetOpenSea = useCallback(
    () => createAppNavigationHandlers(options).handleMorningSheetOpenSea(),
    [setCurrentTab, setHomeScreen],
  );
  const handleMorningSheetOpenCommunity = useCallback(
    () => createAppNavigationHandlers(options).handleMorningSheetOpenCommunity(),
    [setCurrentTab, setHomeScreen],
  );
  const handleMorningSheetOpenChest = useCallback(
    () => createAppNavigationHandlers(options).handleMorningSheetOpenChest(),
    [setCurrentTab, setHomeScreen],
  );
  const handleStopModeStartImpulse = useCallback(
    () => createAppNavigationHandlers(options).handleStopModeStartImpulse(),
    [setCurrentTab, setHomeScreen, setOpenHabitSupport, setShowStopMode],
  );

  return {
    handleOpenInnerCanvas,
    handleMainNavigation,
    handleMorningSheetOpenSky,
    handleMorningSheetOpenMountain,
    handleMorningSheetOpenSea,
    handleMorningSheetOpenCommunity,
    handleMorningSheetOpenChest,
    handleStopModeStartImpulse,
  };
}


export interface AppReturnNavigationDependencies {
  setHomeScreen: Dispatch<SetStateAction<HomeScreen>>;
  recordCompanionBrainEventDeferred: (
    type: "home_returned",
    metadata: { from: "shop" | "inventory" },
  ) => void;
}

/** Return handlers preserve the existing analytics-before-navigation contract. */
export function createAppReturnNavigationHandlers({
  setHomeScreen,
  recordCompanionBrainEventDeferred,
}: AppReturnNavigationDependencies) {
  const handleBackFromGrowth = () => setHomeScreen("home");
  const handleBackFromInnerCanvas = () => setHomeScreen("home");

  const handleBackFromShop = () => {
    recordCompanionBrainEventDeferred("home_returned", { from: "shop" });
    setHomeScreen("home");
  };

  const handleBackFromInventory = () => {
    recordCompanionBrainEventDeferred("home_returned", { from: "inventory" });
    setHomeScreen("home");
  };

  return {
    handleBackFromGrowth,
    handleBackFromInnerCanvas,
    handleBackFromShop,
    handleBackFromInventory,
  };
}

export function useAppReturnNavigation(options: AppReturnNavigationDependencies) {
  const { setHomeScreen, recordCompanionBrainEventDeferred } = options;

  const handleBackFromGrowth = useCallback(
    () => setHomeScreen("home"),
    [setHomeScreen],
  );
  const handleBackFromInnerCanvas = useCallback(
    () => setHomeScreen("home"),
    [setHomeScreen],
  );
  const handleBackFromShop = useCallback(() => {
    recordCompanionBrainEventDeferred("home_returned", { from: "shop" });
    setHomeScreen("home");
  }, [recordCompanionBrainEventDeferred, setHomeScreen]);
  const handleBackFromInventory = useCallback(() => {
    recordCompanionBrainEventDeferred("home_returned", { from: "inventory" });
    setHomeScreen("home");
  }, [recordCompanionBrainEventDeferred, setHomeScreen]);

  return {
    handleBackFromGrowth,
    handleBackFromInnerCanvas,
    handleBackFromShop,
    handleBackFromInventory,
  };
}
