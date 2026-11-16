import type { useCompanionHomeMemory } from "../../hooks/useCompanionHomeMemory";
import { getHomeNowAction } from "./homePresentation";

type HomeNowMemory = ReturnType<typeof useCompanionHomeMemory>["homeNowMemory"];
type HomeNowAction = ReturnType<typeof getHomeNowAction>;

export type DailyContextState =
  | "first_contact"
  | "return_after_absence"
  | "first_today"
  | "already_here_today";

export interface DailyContextInput {
  currentTab: number;
  homeScreen: string;
  isFirstContact: boolean;
  isFirstAppOpenToday: boolean;
  daysSincePreviousAppOpen: number | undefined;
  previousAppOpenDate: string | null;
  isEarlyLearning: boolean;
  homeNowMemory: HomeNowMemory;
  homeNowAction: HomeNowAction;
}

/**
 * Builds the existing daily presentation context from already-computed
 * app-open facts, Companion memory and the single Reactive Engine action.
 * No storage, side effects, new analysis or decisions are introduced.
 */
export function buildDailyContext({
  currentTab,
  homeScreen,
  isFirstContact,
  isFirstAppOpenToday,
  daysSincePreviousAppOpen,
  previousAppOpenDate,
  isEarlyLearning,
  homeNowMemory,
  homeNowAction,
}: DailyContextInput) {
  if (currentTab !== 0 || homeScreen !== "home") return null;

  let state: DailyContextState;

  if (isFirstContact) {
    state = "first_contact";
  } else if (
    isFirstAppOpenToday &&
    typeof daysSincePreviousAppOpen === "number" &&
    daysSincePreviousAppOpen >= 2
  ) {
    state = "return_after_absence";
  } else if (isFirstAppOpenToday) {
    state = "first_today";
  } else {
    state = "already_here_today";
  }

  const memoryKind = homeNowMemory?.kind ?? null;
  const hasImpulseLearning = memoryKind === "impulseLearning";
  const hasImpulseMemory = memoryKind === "impulseMemory";
  const hasContinuityMemory = memoryKind === "continuity";

  const dailyLearningLevel =
    hasImpulseLearning
      ? "learned_impulse"
      : hasImpulseMemory
        ? "effective_impulse"
        : hasContinuityMemory
          ? "repeated_signals"
          : isEarlyLearning
            ? "early_learning"
            : "none";

  const suggestedAction = homeNowAction?.kind ?? null;

  return {
    state,
    isFirstOpenToday: isFirstAppOpenToday,
    previousOpenDate: previousAppOpenDate,
    daysSincePreviousOpen: daysSincePreviousAppOpen,
    isEarlyLearning,
    memoryKind,
    hasImpulseLearning,
    hasImpulseMemory,
    hasContinuityMemory,
    suggestedAction,
    dailyLearningLevel,
  };
}

/**
 * Adds only domain-compatible continuity to the action already selected by
 * the Reactive Engine. The memory never chooses or changes that action.
 */
export function buildHomeNowContext(
  homeNowAction: HomeNowAction,
  homeNowMemory: HomeNowMemory,
) {
  if (!homeNowAction || !homeNowMemory) return null;

  if (homeNowAction.kind === "impulse") {
    if (homeNowMemory.kind === "impulseLearning") {
      return {
        kind: "impulseLearning" as const,
        memory: homeNowMemory,
      };
    }

    if (
      homeNowMemory.kind === "impulseMemory" &&
      homeNowMemory.continuity?.hasRepeatedSignals &&
      (
        homeNowMemory.continuity.repeatedNeedCount >= 2 ||
        homeNowMemory.continuity.recentEffectiveImpulseCount >= 2
      )
    ) {
      return {
        kind: "continuity" as const,
        source: "impulse" as const,
        count: Math.max(
          homeNowMemory.continuity.repeatedNeedCount,
          homeNowMemory.continuity.recentEffectiveImpulseCount
        ),
      };
    }

    if (
      homeNowMemory.kind === "continuity" &&
      (
        homeNowMemory.repeatedNeedCount >= 2 ||
        homeNowMemory.recentEffectiveImpulseCount >= 2
      )
    ) {
      return {
        kind: "continuity" as const,
        source: "impulse" as const,
        count: Math.max(
          homeNowMemory.repeatedNeedCount,
          homeNowMemory.recentEffectiveImpulseCount
        ),
      };
    }

    return null;
  }

  if (
    homeNowAction.kind === "patterns" &&
    homeNowMemory.kind === "continuity"
  ) {
    if (homeNowMemory.signalCount >= 2) {
      return {
        kind: "continuity" as const,
        source: "cross" as const,
        count: homeNowMemory.signalCount,
      };
    }

    if (
      homeNowMemory.repeatedCheckInNeed &&
      homeNowMemory.repeatedCheckInNeedCount >= 2
    ) {
      return {
        kind: "continuity" as const,
        source: "checkIn" as const,
        count: homeNowMemory.repeatedCheckInNeedCount,
      };
    }

    return null;
  }

  if (
    homeNowAction.kind === "progress" &&
    homeNowMemory.kind === "continuity" &&
    homeNowMemory.moodDirection === "improving"
  ) {
    return {
      kind: "continuity" as const,
      source: "mood" as const,
      count: homeNowMemory.moodRecordCount,
    };
  }

  return null;
}
