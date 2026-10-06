import type { HabitRecord } from "../../habits/types";
import type { PersonalEvent } from "../../personal/personalEvent";
import type { CompanionBrainCandidate as Candidate } from "./companionBrainTypes";
import { habitStats } from "../../habits/statistics";
import { localDay, shiftDay } from "../../habits/calendar";
import { planDay } from "../../habits/plans";
import { buildPersonalSignalSnapshot } from "../../personal/personalSignalEngine";
import type { CompanionCollectedData } from "../../companionData";
import { buildCompanionLongitudinalMoodMemory } from "./companionBrainLongitudinalMemory";
import { getRecentCompanionBrainEvents } from "./companionBrainMemory";
import { buildLifestyleSynergyCandidate } from "./lifestyleSynergy";
import { readCompanionInteractions } from "./companionEventIntelligence";
import {
  estimateDailyCaffeine,
  weeklyExercise,
  fruitVegetableRegistrations,
  foodCategorySignals,
  sleepSignal,
  SCIENTIFIC_GUIDANCE,
} from "../scientificGuidance";
// Facts only: the shared insight engine remains responsible for associations.
export function dailyCandidates(
  records: HabitRecord[],
  events: PersonalEvent[],
  now = new Date(),
  companionData?: CompanionCollectedData,
  reactiveWriteAt?: number,
): Candidate[] {
  const today = localDay(now),
    since = shiftDay(today, -6),
    out: Candidate[] = [];
  if (companionData) {
    const synergy = buildLifestyleSynergyCandidate(records, companionData, now);
    if (synergy) out.push(synergy);
  }
  const recentObjectiveCompletion = readCompanionInteractions()
    .filter((e) => e.kind === "goal_completed")
    .at(-1);
  if (recentObjectiveCompletion)
    out.push({
      id: `daily:objectiveCelebration:${recentObjectiveCompletion.id}`,
      translationKey: "companionDaily.objectiveCelebration.0",
      category: "progress",
      emotion: "celebrating",
      priority: 96,
      reason: "objective_completed",
      cooldownMinutes: 360,
      metadata: {
        family: "objectiveCelebration",
        mode: "insight",
        celebration: true,
        evidenceCount: 1,
        evidenceWindowDays: 1,
      },
      action: {
        target: "progress",
        labelKey: "companionDaily.actions.progress",
      },
    });
  const reactiveWrite = typeof reactiveWriteAt === "number" && now.getTime() - reactiveWriteAt <= 10_000;
  const add = (
    family: string,
    fact: string,
    priority: number,
    category: Candidate["category"],
    target: NonNullable<Candidate["action"]>["target"],
    values: Record<string, string | number> = {},
    mode: "insight" | "suggestion" = "insight",
    labelKey?: string,
  ) =>
    out.push({
      id: `daily:${family}:${fact}`,
      translationKey: `companionDaily.${family}.0`,
      translationValues: values,
      category,
      emotion:
        category === "progress"
          ? "encouraging"
          : category === "emotional_followup"
            ? "warm"
            : "calm",
      priority,
      reason: family,
      cooldownMinutes: 1440,
      expiresAt: new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
      ).toISOString(),
      metadata: {
        family,
        mode,
        evidenceCount:
          family === "morningTrend" || family === "morningTrendDeclining"
            ? 6
            : family === "objectiveSuggestion"
              ? 1
              : 3,
        evidenceWindowDays: 7,
        ...(reactiveWrite ? { reactiveWrite: true } : {}),
      },
      action: {
        target,
        labelKey: labelKey ?? `companionDaily.actions.${target}`,
      },
    });
  const moodMemory = companionData
    ? buildCompanionLongitudinalMoodMemory(
        companionData.mood.map((item) => ({
          date: item.date,
          morning: item.morning ?? null,
          afternoon: item.afternoon ?? null,
        })),
        now,
      )
    : null;

  // Modo 1 — explicação baseada em dados: só fala quando existe evidência
  // suficiente de que as avaliações da manhã mudaram de forma consistente.
  if (
    moodMemory?.morningTrend === "improving" &&
    (moodMemory.morningTrendDifference ?? 0) >= 0.8
  ) {
    add(
      "morningTrend",
      today,
      91,
      "progress",
      "patterns",
      {
        difference: Number((moodMemory.morningTrendDifference ?? 0).toFixed(1)),
        previous: Number((moodMemory.previousMorningAverage ?? 0).toFixed(1)),
        recent: Number((moodMemory.recentMorningAverage ?? 0).toFixed(1)),
      },
      "insight",
      "companionDaily.actions.patterns",
    );
  } else if (
    moodMemory?.morningTrend === "declining" &&
    (moodMemory.morningTrendDifference ?? 0) <= -0.8
  ) {
    add(
      "morningTrendDeclining",
      today,
      89,
      "emotional_followup",
      "mood",
      {
        difference: Number(
          Math.abs(moodMemory.morningTrendDifference ?? 0).toFixed(1),
        ),
        previous: Number((moodMemory.previousMorningAverage ?? 0).toFixed(1)),
        recent: Number((moodMemory.recentMorningAverage ?? 0).toFixed(1)),
      },
      "insight",
      "companionDaily.actions.mood",
    );
  }

  // Modo 2 — sugestão: objetivos ainda por cumprir hoje.
  // Scientific guidance: population-level evidence becomes a Companion signal only
  // when the user's explicit records provide enough context. Missing data stays unknown.
  const caffeine = estimateDailyCaffeine(records, today);
  if (
    caffeine.mg !== undefined &&
    caffeine.mg >= SCIENTIFIC_GUIDANCE.caffeine.dailyMg
  ) {
    add(
      "caffeineGuidance",
      `${today}:${caffeine.mg}:${caffeine.coffeeCount}`,
      98,
      "discovery",
      "nutrition",
      { mg: caffeine.mg, coffeeCount: caffeine.coffeeCount },
      "insight",
      "companionDaily.actions.nutrition",
    );
  } else if (caffeine.mg !== undefined && caffeine.mg >= 300) {
    add(
      "caffeineGuidance",
      `${today}:${caffeine.mg}:${caffeine.coffeeCount}`,
      82,
      "discovery",
      "nutrition",
      { mg: caffeine.mg, coffeeCount: caffeine.coffeeCount },
      "insight",
      "companionDaily.actions.nutrition",
    );
  } else if (
    caffeine.coffeeCount >= 2 &&
    (caffeine.mg === undefined || caffeine.mg < 300)
  ) {
    add(
      "caffeineCountGuidance",
      `${today}:${caffeine.coffeeCount}`,
      92,
      "discovery",
      "nutrition",
      { coffeeCount: caffeine.coffeeCount },
      "insight",
      "companionDaily.actions.nutrition",
    );
  }
  if (
    caffeine.late &&
    caffeine.mg !== undefined &&
    caffeine.mg >= SCIENTIFIC_GUIDANCE.caffeine.sleepSensitiveMg
  ) {
    add(
      "lateCaffeineGuidance",
      today,
      80,
      "discovery",
      "nutrition",
      { mg: caffeine.mg },
      "insight",
      "companionDaily.actions.nutrition",
    );
  }
  const activity = weeklyExercise(records, now);
  // After an exercise write, respond to the actual movement just recorded.
  // The weekly recommendation remains separate and still requires enough history.
  if (reactiveWrite) {
    const latestExercise = records
      .filter((r): r is Extract<HabitRecord, { kind: "exercise" }> => r.kind === "exercise" && r.date === today && r.data.minutes > 0)
      .sort((a, b) => a.updatedAt.localeCompare(b.updatedAt))
      .at(-1);
    if (latestExercise) {
      add(
        `exerciseType.${latestExercise.data.activity}`,
        `${latestExercise.id}:${latestExercise.updatedAt}`,
        94,
        "progress",
        "exercise",
        { minutes: latestExercise.data.minutes },
        "insight",
        "companionDaily.actions.exercise",
      );
    }
  }
  if (
    activity.loggedDays >= 3 &&
    activity.moderateMinutes < SCIENTIFIC_GUIDANCE.activity.moderateMinutes &&
    activity.vigorousMinutes < SCIENTIFIC_GUIDANCE.activity.vigorousMinutes
  ) {
    add(
      "activityGuidance",
      today,
      70,
      "discovery",
      "exercise",
      { minutes: activity.moderateMinutes, days: activity.activeDays },
      "suggestion",
      "companionDaily.actions.exercise",
    );
  }
  const typeGuidance = activity.byType as Record<string,{minutes:number;days:number}>;
  if (activity.strengthDays > 0 && activity.strengthDays < SCIENTIFIC_GUIDANCE.activity.strengthDays) {
    add("strengthGuidance", today, 72, "discovery", "exercise", { days: activity.strengthDays, target: SCIENTIFIC_GUIDANCE.activity.strengthDays }, "suggestion", "companionDaily.actions.exercise");
  }

  const produce = fruitVegetableRegistrations(records, today);
  if (
    produce.explicitPortions > 0 &&
    produce.explicitPortions < SCIENTIFIC_GUIDANCE.fruitVegetables.portions
  ) {
    add(
      "produceGuidance",
      today,
      60,
      "discovery",
      "nutrition",
      {
        portions: produce.explicitPortions,
        target: SCIENTIFIC_GUIDANCE.fruitVegetables.portions,
      },
      "suggestion",
      "companionDaily.actions.nutrition",
    );
  }

  const foodSignals = foodCategorySignals(records, today);
  if (reactiveWrite) {
    const latestFood = records.filter((r): r is Extract<HabitRecord, { kind: "foodItem" }> => r.kind === "foodItem" && r.date === today && !r.data.deleted && r.data.quantity > 0).sort((a,b) => a.updatedAt.localeCompare(b.updatedAt)).at(-1);
    if (latestFood) {
      const amount = latestFood.data.category === "water" ? (latestFood.data.unit === "ml" ? latestFood.data.quantity : (latestFood.data.servingMl ? latestFood.data.quantity * latestFood.data.servingMl : latestFood.data.quantity * 250)) : latestFood.data.quantity;
      const category=latestFood.data.category;
      const family=category==="coffee"?"caffeineCountGuidance":category==="energy"?"energyGuidance":category==="tea"?"teaGuidance":category==="fruit"||category==="vegetables"?"produceGuidance":category==="fastFood"?"processedFoodGuidance":category==="sweets"?"sweetsGuidance":category==="salty"?"saltyGuidance":category==="water"?"hydrationGuidance":"foodTypeSpecial";
      add(family, `${latestFood.id}:${latestFood.updatedAt}`, 95, "discovery", "nutrition", { count: latestFood.data.quantity, coffeeCount: latestFood.data.quantity, portions: latestFood.data.quantity, ml: Math.round(amount) }, "insight", "companionDaily.actions.nutrition");
    }
  }
  if (foodSignals.sweets > 0) add("sweetsGuidance", today, 64, "discovery", "nutrition", { count: foodSignals.sweets }, "suggestion", "companionDaily.actions.nutrition");
  if (foodSignals.salty > 0) add("saltyGuidance", today, 64, "discovery", "nutrition", { count: foodSignals.salty }, "suggestion", "companionDaily.actions.nutrition");
  if (foodSignals.fastFood > 0) add("processedFoodGuidance", today, 60, "discovery", "nutrition", { count: foodSignals.fastFood }, "suggestion", "companionDaily.actions.nutrition");
  if (foodSignals.waterMl > 0 && foodSignals.waterMl < 1500) add("hydrationGuidance", today, 66, "discovery", "nutrition", { ml: Math.round(foodSignals.waterMl) }, "suggestion", "companionDaily.actions.nutrition");

  const sleep = sleepSignal(records, today);
  if (sleep) {
    if (sleep.hours < SCIENTIFIC_GUIDANCE.sleep.typicalHoursMin) {
      add("sleepShortGuidance", today, 86, "discovery", "sleep", { hours: sleep.hours }, "suggestion", "companionDaily.actions.sleep");
    } else if (sleep.quality <= 2) {
      add("sleepQualityGuidance", today, 82, "emotional_followup", "sleep", { quality: sleep.quality }, "suggestion", "companionDaily.actions.sleep");
    } else if (reactiveWrite) {
      const latestSleep = records
        .filter((r): r is Extract<HabitRecord, { kind: "sleep" }> => r.kind === "sleep" && r.date === today)
        .sort((a, b) => a.updatedAt.localeCompare(b.updatedAt))
        .at(-1);
      if (latestSleep) {
        add("sleepGoodGuidance", `${latestSleep.id}:${latestSleep.updatedAt}`, 90, "progress", "sleep", { hours: sleep.hours, quality: sleep.quality }, "insight", "companionDaily.actions.sleep");
      }
    }
  }

  const todayMood = companionData?.mood.find(item => item.date === today);
  if (todayMood?.morning !== undefined && todayMood.morning <= 3) {
    add("morningLowGuidance", today, 88, "emotional_followup", "mood", { rating: todayMood.morning }, "suggestion", "companionDaily.actions.mood");
  }
  if (todayMood?.afternoon !== undefined && todayMood.afternoon <= 3) {
    add("afternoonLowGuidance", today, 90, "emotional_followup", "mood", { rating: todayMood.afternoon }, "suggestion", "companionDaily.actions.mood");
  }
  if (todayMood?.morning !== undefined && todayMood.afternoon !== undefined && todayMood.morning <= 3 && todayMood.afternoon >= 4) {
    add("dayRecoveryGuidance", today, 94, "progress", "mood", { morning: todayMood.morning, afternoon: todayMood.afternoon }, "insight", "companionDaily.actions.mood");
  }

  const todayObjectives = companionData?.objectives.find(
    (item) => item.date === today,
  );
  if (
    companionData &&
    companionData.objectives.length > 0 &&
    (!todayObjectives ||
      (todayObjectives.total > 0 &&
        todayObjectives.completed < todayObjectives.total))
  ) {
    const completed = todayObjectives?.completed ?? 0;
    const total = todayObjectives?.total ?? 5;
    add(
      "objectiveSuggestion",
      today,
      76,
      "objective",
      "objectives",
      { completed, total },
      "suggestion",
      "companionDaily.actions.completeObjective",
    );
  }

  // Modo 2 — sugestão: a Comunidade entra como convite leve, nunca como obrigação.
  const recentCommunityPost = getRecentCompanionBrainEvents(24 * 60).some(
    (event) =>
      event.type === "community_posted" &&
      now.getTime() - new Date(event.timestamp).getTime() < 24 * 60 * 60 * 1000,
  );
  if (
    companionData &&
    (companionData.mood.length > 0 || companionData.objectives.length > 0) &&
    !recentCommunityPost
  ) {
    add(
      "communitySuggestion",
      today,
      58,
      "community",
      "community",
      {},
      "suggestion",
      "companionDaily.actions.communityPost",
    );
  }

  const acceptedActions = getRecentCompanionBrainEvents(7 * 24 * 60).filter(
    (e) => e.type === "companion_action_clicked",
  );
  const acceptedTargets = new Set(
    acceptedActions.map((e) => String(e.metadata?.target ?? "")),
  );

  const settings = records.find((r) => r.kind === "settings");
  const habits = records.filter((r) => r.kind === "habit" && r.data.active);
  const primary =
    habits.find(
      (r) => settings?.kind === "settings" && r.id === settings.data.primaryId,
    ) ?? habits[0];
  if (primary) {
    const stats = habitStats(records, primary.id, today);
    const restart = records
      .filter(
        (r) =>
          r.kind === "restart" &&
          r.data.habitId === primary.id &&
          r.date === today,
      )
      .sort((a, b) => a.updatedAt.localeCompare(b.updatedAt))
      .at(-1);
    if (restart && stats.current === 0)
      add(
        "restart",
        restart.id + ":" + restart.updatedAt,
        92,
        "emotional_followup",
        "habits",
      );
    else if ([3, 7, 14, 30, 60, 100].includes(stats.current))
      add(
        "milestone",
        primary.id + ":" + stats.runStart + ":" + stats.current,
        88,
        "progress",
        "habitHistory",
        { count: stats.current },
      );
    else if (stats.today === true && stats.current > 1)
      add("continuity", today, 62, "progress", "habitHistory", {
        count: stats.current,
      });
  }
  out.forEach((candidate) => {
    const target = String(candidate.action?.target ?? "");
    if (target && acceptedTargets.has(target)) candidate.priority += 4;
  });
  const plan = records.find(
    (r) => r.kind === "wellbeingPlan" && r.data.status === "active",
  );
  if (plan?.kind === "wellbeingPlan") {
    const day = planDay(plan.data, today);
    if (day === 15) add("planEnd", plan.id, 85, "progress", "plans");
    else if (
      !records.some(
        (r) =>
          r.kind === "planCheck" &&
          r.data.planId === plan.id &&
          r.date === today,
      )
    )
      add("planStep", plan.id + ":" + today, 52, "objective", "plans", {
        count: day,
      });
  }
  const recent = events.filter(
    (e) =>
      e.localDate >= shiftDay(today, -29) &&
      e.localDate <= today &&
      Date.parse(e.timestamp) <= now.getTime(),
  );
  const zen = recent
    .filter(
      (e) =>
        e.type === "intervention" &&
        e.metadata?.exercise === "five_minutes" &&
        ["calmer", "same", "agitated"].includes(String(e.metadata?.response)),
    )
    .slice(-10);
  const last = zen.at(-1);
  if (last && last.localDate >= since) {
    if (last.localDate === today && last.metadata?.response === "agitated")
      add("stillAgitated", last.id, 94, "emotional_followup", "breathe");
    else if (
      zen.length >= 3 &&
      zen.filter((e) => e.metadata?.response === "calmer").length >
        zen.length / 2
    )
      add("breathing", last.id, 72, "impulse_followup", "breathe");
  }
  const signals = buildPersonalSignalSnapshot(events, now);
  const lateFact = signals.facts.find(
    (s) => s.metric === "lateCaffeine" && s.observedValue === 1,
  );
  if (lateFact && now.getHours() >= 18)
    add("caffeine", today, 48, "discovery", "nutrition");

  // Reuse the same personal signal engine as the Reactive Engine. Only patterns
  // with enough evidence can become Companion observations; missing logs stay unknown.
  const lifestylePattern = signals.patterns.find(
    (s) =>
      s.kind === "association" && s.status !== "early" && s.confidence >= 0.55,
  );
  if (lifestylePattern) {
    if (lifestylePattern.domain === "exercise")
      add("movement", lifestylePattern.id, 64, "progress", "exercise", {
        count: lifestylePattern.evidenceCount,
      });
    else if (lifestylePattern.metric === "water")
      add("hydration", lifestylePattern.id, 45, "discovery", "nutrition", {
        count: lifestylePattern.evidenceCount,
      });
  }
  return out;
}
