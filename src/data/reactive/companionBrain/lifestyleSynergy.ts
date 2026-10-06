import type { HabitRecord } from "../../habits/types";
import type { CompanionBrainCandidate } from "./companionBrainTypes";
import type { CompanionCollectedData } from "../../companionData";
import { localDay, shiftDay } from "../../habits/calendar";
import { estimateDailyCaffeine, weeklyExercise, sleepSignal } from "../scientificGuidance";

/** Cross-domain interpretation layer. Associations are hypotheses, never causality. */
export function buildLifestyleSynergyCandidate(records: HabitRecord[], companionData: CompanionCollectedData, now = new Date()): CompanionBrainCandidate | undefined {
  const today = localDay(now);
  const days = Array.from({ length: 7 }, (_, i) => shiftDay(today, -i));
  const ratings = companionData.mood.filter((m) => days.includes(m.date));
  if (ratings.length < 3) return undefined;
  const moodValues = ratings.flatMap((m) => [m.morning, m.afternoon].filter((v): v is number => typeof v === "number"));
  if (moodValues.length < 4) return undefined;
  const moodAverage = moodValues.reduce((a, b) => a + b, 0) / moodValues.length;
  const recent = ratings.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
  const recentValues = recent.flatMap((m) => [m.morning, m.afternoon].filter((v): v is number => typeof v === "number"));
  const recentAverage = recentValues.length ? recentValues.reduce((a, b) => a + b, 0) / recentValues.length : moodAverage;
  if (moodAverage > 5.5 && recentAverage > 5.5) return undefined;

  const caffeineDays = days.filter((day) => { const c = estimateDailyCaffeine(records, day); return (c.mg !== undefined && c.mg >= 300) || c.coffeeCount >= 3; }).length;
  const sweetDays = days.filter((day) => records.some((r) => r.kind === "foodItem" && r.date === day && !r.data.deleted && r.data.category === "sweets" && r.data.quantity > 0)).length;
  const fastFoodDays = days.filter((day) => records.some((r) => r.kind === "foodItem" && r.date === day && !r.data.deleted && r.data.category === "fastFood" && r.data.quantity > 0)).length;
  const shortSleepDays = days.filter((day) => { const sleep = sleepSignal(records, day); return Boolean(sleep && sleep.hours < 7); }).length;
  const exercise = weeklyExercise(records, now);
  const exerciseRecorded = exercise.loggedDays > 0;

  const objectiveDays = companionData.objectives.filter((o) => days.includes(o.date) && o.total > 0);
  const objectiveCompletionRate = objectiveDays.length ? objectiveDays.reduce((sum, o) => sum + Math.min(1, Math.max(0, o.completed / o.total)), 0) / objectiveDays.length : undefined;
  const lowObjectiveDays = objectiveDays.filter((o) => o.completed < o.total).length;
  const impulseDays = new Set(companionData.impulse.filter((e) => days.includes(e.date.slice(0, 10))).map((e) => e.date.slice(0, 10))).size;
  const lowCheckInDays = companionData.checkIns.filter((c) => days.includes(c.date) && c.mood <= 5).length;

  const lifestyleFlags = [
    caffeineDays >= 2 ? "caffeine" : null,
    sweetDays >= 2 ? "sweets" : null,
    fastFoodDays >= 2 ? "fastFood" : null,
    shortSleepDays >= 2 ? "sleep" : null,
  ].filter((v): v is string => Boolean(v));
  const objectiveFlag = objectiveDays.length >= 3 && (objectiveCompletionRate ?? 1) < 0.6;
  const impulseFlag = impulseDays >= 2;
  const checkInFlag = lowCheckInDays >= 2;
  const movementFlag = !exerciseRecorded;
  const extraFlags = [objectiveFlag ? "objectives" : null, impulseFlag ? "impulse" : null, checkInFlag ? "checkins" : null].filter((v): v is string => Boolean(v));

  // At least two measured signals, or one repeated signal plus an unrecorded movement opportunity.
  if (lifestyleFlags.length + extraFlags.length < 2 && !(lifestyleFlags.length >= 1 && movementFlag)) return undefined;

  const foodFlag = lifestyleFlags.some((flag) => ["caffeine", "sweets", "fastFood"].includes(flag));
  const sleepFlag = lifestyleFlags.includes("sleep");
  const allFlags = [...lifestyleFlags, ...extraFlags, ...(movementFlag ? ["movement"] : [])];
  const broad = extraFlags.length > 0;
  const group = broad ? "combined"
    : foodFlag && sleepFlag && movementFlag ? "food_sleep_movement"
    : foodFlag && sleepFlag ? "food_sleep"
    : foodFlag && movementFlag ? "food_movement"
    : sleepFlag && movementFlag ? "sleep_movement"
    : foodFlag ? "food"
    : sleepFlag ? "sleep" : "movement";

  const evidenceCount = ratings.length + allFlags.length + objectiveDays.length + impulseDays + lowCheckInDays;
  const confidence: CompanionBrainCandidate["confidence"] = allFlags.length >= 3 && ratings.length >= 5 ? "strong" : "moderate";
  return {
    id: `synergy:lifestyle:${today}:${allFlags.sort().join("+")}`,
    translationKey: `companionSynergy.${group}.0`,
    translationValues: {
      mood: Number(moodAverage.toFixed(1)), recentMood: Number(recentAverage.toFixed(1)), caffeineDays, sweetsDays: sweetDays,
      fastFoodDays, shortSleepDays, exerciseDays: exercise.activeDays, evidenceDays: ratings.length,
      objectiveDays: objectiveDays.length, objectiveCompletionRate: objectiveCompletionRate === undefined ? "—" : Math.round(objectiveCompletionRate * 100),
      lowObjectiveDays, impulseDays, lowCheckInDays,
    },
    category: "discovery", emotion: "curious", priority: allFlags.length >= 3 ? 97 : 93,
    reason: "cross_domain_lifestyle_synergy", cooldownMinutes: 720,
    metadata: { family: "lifestyleSynergy", mode: "insight", evidenceCount, evidenceWindowDays: 7, flags: allFlags, exerciseRecorded, group },
    intent: "explain", confidence, evidenceCount, evidenceWindowDays: 7,
    action: { target: "objectives", labelKey: "companionDaily.actions.completeObjective" },
  };
}
