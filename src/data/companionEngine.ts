/**
 * COMPANHEIRO CONFIA
 *
 * Motor de análise personalizada.
 *
 * Este motor NÃO guarda dados.
 * Recebe os dados recolhidos por companionData.ts
 * e transforma-os em sinais compreensíveis.
 */

import type { CompanionCollectedData } from "./companionData";
import { getLocalCalendarDate } from "../utils/date";

export type MoodTrend =
  | "positive"
  | "stable"
  | "negative"
  | "insufficient";

export interface CompanionAnalysis {
  moodTrend: MoodTrend;

  morningTrend: MoodTrend;

  afternoonTrend: MoodTrend;

  averageMood7Days: number | null;

  averageMood14Days: number | null;

  morningAverage7Days: number | null;

  afternoonAverage7Days: number | null;

  completedObjectives: number;

  totalObjectives: number;

  objectiveCompletionRate: number;

  interventionCount7Days: number;

  interventionCount14Days: number;

  interventionEffectiveness: number | null;

  strongestSignal:
    | "morning"
    | "afternoon"
    | "objectives"
    | "impulse"
    | "habits"
    | "positive"
    | "insufficient";

  message: string;

  suggestion: string;

  gratitude: string;
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;

  return (
    values.reduce((sum, value) => sum + value, 0) /
    values.length
  );
}

function calculateTrend(values: number[]): MoodTrend {
  if (values.length < 4) return "insufficient";

  const middle=Math.floor(values.length/2);
  const first=average(values.slice(0,middle))!;
  const last=average(values.slice(middle))!;

  const difference = last - first;

  if (difference >= 1) return "positive";

  if (difference <= -1) return "negative";

  return "stable";
}

function getRecentDates(days: number, today = new Date()): string[] {
  const result: string[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    result.push(getLocalCalendarDate(date));
  }

  return result;
}

export function analyzeCompanionData(
  data: CompanionCollectedData
): CompanionAnalysis {

  const today = new Date();
  const dates7 = getRecentDates(7, today);
  const dates14 = getRecentDates(14, today);

  /*
   * HUMOR
   */

  const orderedMood=data.mood.filter(item=>/^\d{4}-\d{2}-\d{2}$/.test(item.date)).sort((a,b)=>a.date.localeCompare(b.date));
  const mood7 = orderedMood.filter(item =>
    dates7.includes(item.date)
  );

  const mood14 = orderedMood.filter(item =>
    dates14.includes(item.date)
  );

  const allMood7 = mood7.flatMap(item => [
    ...(typeof item.morning === "number"
      ? [item.morning]
      : []),

    ...(typeof item.afternoon === "number"
      ? [item.afternoon]
      : []),
  ]);

  const allMood14 = mood14.flatMap(item => [
    ...(typeof item.morning === "number"
      ? [item.morning]
      : []),

    ...(typeof item.afternoon === "number"
      ? [item.afternoon]
      : []),
  ]);

  const morning7 = mood7
    .filter(item => typeof item.morning === "number")
    .map(item => item.morning as number);

  const afternoon7 = mood7
    .filter(item => typeof item.afternoon === "number")
    .map(item => item.afternoon as number);

  const averageMood7Days = average(allMood7);

  const averageMood14Days = average(allMood14);

  const morningAverage7Days = average(morning7);

  const afternoonAverage7Days = average(afternoon7);

  const moodTrend = calculateTrend(mood14.map(item=>average([item.morning,item.afternoon].filter((v):v is number=>typeof v==="number"&&Number.isFinite(v)))!).filter(v=>v!==null));

  const morningTrend = calculateTrend(morning7);

  const afternoonTrend = calculateTrend(afternoon7);

  /*
   * OBJECTIVOS
   */

  const recentObjectives = data.objectives.filter(item =>
    dates7.includes(item.date)
  );

  const completedObjectives = recentObjectives.reduce(
    (sum, item) => sum + item.completed,
    0
  );

  const totalObjectives = recentObjectives.reduce(
    (sum, item) => sum + item.total,
    0
  );

  const objectiveCompletionRate =
    totalObjectives > 0
      ? completedObjectives / totalObjectives
      : 0;

  /*
   * IMPULSO
   */

  const recentImpulses7 = data.impulse.filter(item =>
    dates7.some(date =>
      item.date.startsWith(date)
    )
  );

  const recentImpulses14 = data.impulse.filter(item =>
    dates14.some(date =>
      item.date.startsWith(date)
    )
  );

  const completedInterventions =
    recentImpulses14.filter(item =>
      typeof item.intensity === "number" &&
      typeof item.finalIntensity === "number"
    );

  let interventionEffectiveness: number | null = null;

  if (completedInterventions.length > 0) {

    const reductions =
      completedInterventions.map(item =>
        (item.intensity ?? 0) -
        (item.finalIntensity ?? 0)
      );

    interventionEffectiveness =
      average(reductions);
  }

  /*
   * DETERMINAR O SINAL MAIS FORTE
   */

  let strongestSignal:
    | "morning"
    | "afternoon"
    | "objectives"
    | "impulse"
    | "habits"
    | "positive"
    | "insufficient" = "insufficient";

  if (
    morningTrend === "negative" &&
    (morningAverage7Days ?? 10) <
      (afternoonAverage7Days ?? 10)
  ) {
    strongestSignal = "morning";

  } else if (
    afternoonTrend === "negative"
  ) {
    strongestSignal = "afternoon";

  } else if (
    totalObjectives >= 4 && recentObjectives.length >= 3 && objectiveCompletionRate >= 0.75
  ) {
    strongestSignal = "objectives";

  } else if (
    interventionEffectiveness !== null &&
    completedInterventions.length >= 3 && interventionEffectiveness >= 2
  ) {
    strongestSignal = "impulse";

  } else if (
    moodTrend === "positive"
  ) {
    strongestSignal = "positive";
  }

  /*
   * MENSAGEM PERSONALIZADA
   */

  // Legacy API returns i18n keys; the live Companion uses the unified Brain.
  const suffix=strongestSignal.charAt(0).toUpperCase()+strongestSignal.slice(1);
  const message="companionMessage"+suffix;
  const suggestion="companionSuggestion"+suffix;
  const gratitude="companionGratitude"+suffix;

  return {
    moodTrend,

    morningTrend,

    afternoonTrend,

    averageMood7Days,

    averageMood14Days,

    morningAverage7Days,

    afternoonAverage7Days,

    completedObjectives,

    totalObjectives,

    objectiveCompletionRate,

    interventionCount7Days:
      recentImpulses7.length,

    interventionCount14Days:
      recentImpulses14.length,

    interventionEffectiveness,

    strongestSignal,

    message,

    suggestion,

    gratitude,
  };
}
