import type { DailyRating } from "../../../types";
import { getLastCompanionShownMessage, getRecentCompanionBrainEvents, hasRecentCompanionBrainEvent, countRecentCompanionBrainEvents } from "./companionBrainMemory";
import { buildCompanionCrossMemory } from "./companionBrainCrossMemory";
import { buildCompanionLongitudinalImpulseMemory } from "./companionBrainLongitudinalImpulseMemory";
import { buildCompanionLongitudinalMoodMemory } from "./companionBrainLongitudinalMemory";
import { collectCompanionData } from "../../companionData";
import { buildCompanionBrainContext } from "./companionBrainContext";
import { evaluateCompanionContext } from "./companionBrainOrchestrator";
import { readPersonalEvents } from "../../personal/personalEventStorage";
import { buildPersonalIntelligenceSnapshot } from "../../personal/premiumIntelligence";

export type HomeDecisionInput = {
  currentTab: number;
  homeScreen: string;
  selectedDate: string;
  todayLogged: boolean;
  morningRating: number;
  afternoonRating: number;
  ratings: DailyRating[];
  personalDiscovery?: {
    id: string;
    messageKey: string;
    messageValues?: Record<string, string | number>;
    confidence: "low" | "moderate" | "high";
    evidenceCount: number;
    actionability: "low" | "medium" | "high";
  };
};

export function getHomeCompanionBrainDecision(input: HomeDecisionInput) {
  const { currentTab, homeScreen, selectedDate, todayLogged, morningRating, afternoonRating, ratings, personalDiscovery } = input;
  if (currentTab !== 0 || homeScreen !== "home") return null;
  const now = new Date();
  const localToday = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].join("-");
  if (selectedDate !== localToday) return null;
  const companionCollectedData = collectCompanionData();
  const context = buildCompanionBrainContext({
    previousShownMessage: getLastCompanionShownMessage(),
    now, currentTab, homeScreen,
    morningCompleted: todayLogged,
    afternoonCompleted: todayLogged,
    morningRating: todayLogged ? morningRating : undefined,
    afternoonRating: todayLogged ? afternoonRating : undefined,
    recentImpulse: hasRecentCompanionBrainEvent("impulse_completed", 30),
    latestInteractionEvent: getRecentCompanionBrainEvents(10)
      .filter(event => event.type === "avatar_tapped" || event.type === "home_returned")
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0],
    recentEvents: getRecentCompanionBrainEvents(30),
    longitudinalMood: buildCompanionLongitudinalMoodMemory(ratings, now),
    longitudinalImpulse: buildCompanionLongitudinalImpulseMemory(companionCollectedData.impulse, now),
    crossMemory: buildCompanionCrossMemory(ratings, companionCollectedData.impulse, now),
    personalDiscovery,
    personalIntelligence: buildPersonalIntelligenceSnapshot(readPersonalEvents(), now),
    sessionActivityCount: countRecentCompanionBrainEvents(60),
  });
  return evaluateCompanionContext(context);
}
