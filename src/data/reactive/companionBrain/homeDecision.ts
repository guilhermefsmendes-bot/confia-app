import type { DailyRating } from "../../../types";
import { getLastCompanionShownMessage, getRecentCompanionBrainEvents, hasRecentCompanionBrainEvent, countRecentCompanionBrainEvents } from "./companionBrainMemory";
import { buildCompanionCrossMemory } from "./companionBrainCrossMemory";
import { buildCompanionLongitudinalImpulseMemory } from "./companionBrainLongitudinalImpulseMemory";
import { buildCompanionLongitudinalMoodMemory } from "./companionBrainLongitudinalMemory";
import { collectCompanionData } from "../../companionData";
import { buildCompanionBrainContext } from "./companionBrainContext";
import { readPersonalEvents } from "../../personal/personalEventStorage";
import { dailyCandidates } from "./dailyCandidates";
import { getHabitSnapshot } from "../../habits/store";
import { buildCompanionCandidates } from "./companionBrainRules";
import { resolveCompanionContext } from "./companionBrainContextResolver";
import { decideCompanionThought } from "./companionBrainDecisionEngine";
import { resolveCompanionReaction } from "../companionReactionEngine";
import type { ReactiveResult } from "../reactiveTypes";

export type HomeDecisionInput = {
  reactiveResult?: ReactiveResult | null;
  currentTab: number;
  homeScreen: string;
  selectedDate: string;
  todayLogged: boolean;
  morningRating: number;
  afternoonRating: number;
  ratings: DailyRating[];
  personalDiscovery?: {
    id: string;
    messageKey?: string;
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
  const checkin=companionCollectedData.checkIns.find(c=>c.date===localToday&&c.completed);
  const context = buildCompanionBrainContext({
    previousShownMessage: getLastCompanionShownMessage(),
    now, currentTab, homeScreen,
    morningCompleted: todayLogged||Boolean(checkin),
    afternoonCompleted: todayLogged||Boolean(checkin),
    morningRating: todayLogged ? morningRating : checkin?.mood,
    afternoonRating: todayLogged ? afternoonRating : checkin?.mood,
    recentImpulse: hasRecentCompanionBrainEvent("impulse_completed", 30),
    latestInteractionEvent: getRecentCompanionBrainEvents(10)
      .filter(event => event.type === "avatar_tapped" || event.type === "home_returned")
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0],
    recentEvents: getRecentCompanionBrainEvents(30),
    longitudinalMood: buildCompanionLongitudinalMoodMemory(ratings, now),
    longitudinalImpulse: buildCompanionLongitudinalImpulseMemory(companionCollectedData.impulse, now),
    crossMemory: buildCompanionCrossMemory(ratings, companionCollectedData.impulse, now),
    personalDiscovery:personalDiscovery?.messageKey?{...personalDiscovery,messageKey:personalDiscovery.messageKey}:undefined,

    sessionActivityCount: countRecentCompanionBrainEvents(60),
  });
  const candidates = resolveCompanionContext(context, buildCompanionCandidates(context)).filter(c=>!c.metadata?.personalDiscovery);
  // Reuse the currently displayed discovery, including its exact text and evidence.
  // No second personal-model or lifestyle-pattern pass in the Companion.
  if(personalDiscovery?.messageKey && personalDiscovery.evidenceCount >= 3) candidates.push({
    id:"shared:"+personalDiscovery.id, translationKey:personalDiscovery.messageKey,
    translationValues:personalDiscovery.messageValues,category:"discovery",emotion:"curious",
    priority:personalDiscovery.confidence==="low"?60:84,reason:"shared_insight",cooldownMinutes:1440,
    action:{target:"patterns",labelKey:"companionDaily.actions.patterns"}
  });
  const reaction=input.reactiveResult?resolveCompanionReaction(input.reactiveResult):null;
  if(reaction?.response?.translationKey && reaction.priority>=70)candidates.push({
    id:"reactive:"+reaction.sourceSituation+":"+localToday,translationKey:reaction.response.translationKey,
    category:reaction.state==="supportive"?"emotional_followup":"progress",emotion:reaction.state==="supportive"?"warm":"encouraging",
    priority:reaction.priority,reason:"shared_reactive",cooldownMinutes:1440,
    action:{target:reaction.state==="supportive"?"breathe":"progress",labelKey:reaction.state==="supportive"?"companionDaily.actions.breathe":"companionDaily.actions.progress"}
  });
  return decideCompanionThought([...candidates,...dailyCandidates(getHabitSnapshot().records,readPersonalEvents(),now,companionCollectedData)],now);
}
