import type { HabitRecord, FoodType, HabitType } from "./types";
import type { PersonalEvent } from "../personal/personalEvent";
import { dayFoodItems, nutritionTotals } from "./nutrition";
import { estimateDailyCaffeine, fruitVegetableRegistrations } from "../reactive/scientificGuidance";
import { shiftDay } from "./calendar";
import { HABIT_IMPACT_SOURCES, type HabitImpactSource } from "./impactKnowledge";

export type ImpactSeverity = "information" | "attention" | "neutral";
export interface HabitImpactCard {
  id: string;
  titleKey: string;
  messageKey: string;
  values: Record<string, string | number>;
  severity: ImpactSeverity;
  sourceId?: string;
  detailKey?: string;
}
export interface PersonalHabitAssociation {
  id: string;
  habit: "sleep" | "exercise" | "caffeine" | "fastFood";
  exposedMean: number;
  comparisonMean: number;
  exposedDays: number;
  comparisonDays: number;
  difference: number;
  direction: "higher" | "lower" | "similar";
}
export interface HabitImpactReport {
  date: string;
  hasData: boolean;
  cards: HabitImpactCard[];
  personalAssociations: PersonalHabitAssociation[];
  moodDaysAvailable: number;
  sourceCount: number;
}

const round1 = (value: number) => Math.round(value * 10) / 10;
const mean = (values: number[]) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : undefined;
const isMood = (event: PersonalEvent) => event.type === "mood" && typeof event.value === "number" && Number.isFinite(event.value);

function moodByDate(events: PersonalEvent[], start: string, end: string): Map<string, number> {
  const latest = new Map<string, PersonalEvent>();
  for (const event of events) {
    if (!isMood(event) || event.localDate < start || event.localDate > end) continue;
    const key = event.localDate + ":" + String(event.metadata?.moment ?? "daily");
    const old = latest.get(key);
    if (!old || event.timestamp > old.timestamp) latest.set(key, event);
  }
  const byDay = new Map<string, number[]>();
  for (const event of latest.values()) byDay.set(event.localDate, [...(byDay.get(event.localDate) ?? []), Number(event.value)]);
  return new Map([...byDay].map(([day, values]) => [day, mean(values)!]));
}

function categoryWasMeasured(records: HabitRecord[], date: string, category: FoodType): boolean {
  return records.some(record => record.date === date && (
    record.kind === "foodItem" && record.data.category === category ||
    record.kind === "nutrition" && Object.prototype.hasOwnProperty.call(record.data, category)
  ));
}
function categoryValue(records: HabitRecord[], date: string, category: FoodType): number {
  const totals = nutritionTotals(records, date);
  return typeof totals[category] === "number" ? totals[category]! : 0;
}
function activeFoodCount(records: HabitRecord[], date: string, category: FoodType): number {
  return dayFoodItems(records, date).filter(record => record.data.category === category && !record.data.deleted && record.data.quantity > 0).length;
}
function hasExplicitProduce(records: HabitRecord[], date: string): boolean {
  return dayFoodItems(records, date).some(record => !record.data.deleted &&
    (record.data.category === "fruit" || record.data.category === "vegetables") &&
    (record.data.unit === "g" || record.data.unit === "portion") && record.data.quantity > 0);
}
function estimatedWaterItemMl(item: { unit: string; quantity: number; servingMl?: number }): number | undefined {
  if (item.unit === "ml") return item.quantity;
  if (item.unit === "g") return undefined;
  if (item.servingMl !== undefined) return item.quantity * item.servingMl;
  if (item.unit === "cup") return item.quantity * 250;
  return undefined;
}
function dailyWaterMl(records: HabitRecord[], date: string): number {
  return dayFoodItems(records, date).filter(record => record.data.category === "water" && !record.data.deleted)
    .reduce((total, record) => total + (estimatedWaterItemMl(record.data) ?? 0), 0);
}
function explicitWaterLogged(records: HabitRecord[], date: string): boolean {
  return dayFoodItems(records, date).some(record => record.data.category === "water" && !record.data.deleted && estimatedWaterItemMl(record.data) !== undefined);
}

function buildPersonalAssociations(records: HabitRecord[], events: PersonalEvent[], date: string): { associations: PersonalHabitAssociation[]; moodDays: number } {
  const start = shiftDay(date, -29);
  const moods = moodByDate(events, start, date);
  const dates = [...moods.keys()];
  const associations: PersonalHabitAssociation[] = [];
  const compare = (id: PersonalHabitAssociation["habit"], exposure: Map<string, boolean>) => {
    const exposed: number[] = [], comparison: number[] = [];
    for (const [day, value] of exposure) {
      const rating = moods.get(day);
      if (rating === undefined) continue;
      (value ? exposed : comparison).push(rating);
    }
    // Do not publish a personal association until both groups contain at least
    // five separately measured days. Missing logs are never interpreted as zero.
    if (exposed.length < 5 || comparison.length < 5) return;
    const exposedMean = mean(exposed)!, comparisonMean = mean(comparison)!;
    const difference = round1(exposedMean - comparisonMean);
    associations.push({
      id: "personal_" + id,
      habit: id,
      exposedMean: round1(exposedMean), comparisonMean: round1(comparisonMean),
      exposedDays: exposed.length, comparisonDays: comparison.length, difference,
      direction: difference <= -0.5 ? "lower" : difference >= 0.5 ? "higher" : "similar",
    });
  };

  const sleepExposure = new Map<string, boolean>();
  const caffeineExposure = new Map<string, boolean>();
  const fastFoodExposure = new Map<string, boolean>();
  const exerciseExposure = new Map<string, boolean>();
  for (const day of dates) {
    const sleep = records.find((record): record is Extract<HabitRecord, { kind: "sleep" }> => record.kind === "sleep" && record.date === day);
    if (sleep) sleepExposure.set(day, sleep.data.hours < 7);

    // A food day is comparable only when nutrition or detailed food was logged.
    const foodMeasured = records.some(record => record.date === day && (record.kind === "nutrition" || record.kind === "foodItem"));
    const caffeineMeasured = categoryWasMeasured(records, day, "coffee") || categoryWasMeasured(records, day, "tea") || categoryWasMeasured(records, day, "energy") ||
      dayFoodItems(records, day).some(item => item.data.category === "soda" && item.data.caffeine === "yes");
    if (foodMeasured && caffeineMeasured) {
      const estimate = estimateDailyCaffeine(records, day).mg;
      if (estimate !== undefined) caffeineExposure.set(day, estimate >= 200);
    }
    if (foodMeasured && categoryWasMeasured(records, day, "fastFood")) fastFoodExposure.set(day, categoryValue(records, day, "fastFood") > 0);

    const exerciseRecords = records.filter((record): record is Extract<HabitRecord, { kind: "exercise" }> => record.kind === "exercise" && record.date === day);
    if (exerciseRecords.length) exerciseExposure.set(day, exerciseRecords.some(record => record.data.minutes > 0));
  }
  compare("sleep", sleepExposure);
  compare("caffeine", caffeineExposure);
  compare("fastFood", fastFoodExposure);
  compare("exercise", exerciseExposure);
  return { associations, moodDays: moods.size };
}

export function buildHabitImpact(records: HabitRecord[], events: PersonalEvent[], date: string): HabitImpactReport {
  const cards: HabitImpactCard[] = [];
  const dayRecords = records.filter(record => record.date === date);
  const sleep = dayRecords.find((record): record is Extract<HabitRecord, { kind: "sleep" }> => record.kind === "sleep");
  const exercise = dayRecords.filter((record): record is Extract<HabitRecord, { kind: "exercise" }> => record.kind === "exercise");
  const foodItems = dayFoodItems(records, date);
  const nutrition = dayRecords.some(record => record.kind === "nutrition");
  const habitLogs = dayRecords.filter((record): record is Extract<HabitRecord, { kind: "habitLog" }> => record.kind === "habitLog");
  const hasData = Boolean(sleep || exercise.length || foodItems.length || nutrition || habitLogs.length);
  if (!hasData) return { date, hasData: false, cards, personalAssociations: [], moodDaysAvailable: 0, sourceCount: 0 };

  if (sleep) {
    cards.push({ id: "sleep-self-report", titleKey: "habitImpact.cards.sleepDetails.title",
      messageKey: sleep.data.awakenings === undefined ? "habitImpact.cards.sleepDetails.qualityOnly" : "habitImpact.cards.sleepDetails.message",
      values: { quality: sleep.data.quality, awakenings: sleep.data.awakenings ?? 0 }, severity: "information" });
    if (sleep.data.hours < 7) {
      cards.push({ id: "sleep-short", titleKey: "habitImpact.cards.sleepShort.title", messageKey: "habitImpact.cards.sleepShort.message",
        values: { hours: round1(sleep.data.hours), minimum: 7, deficit: round1(7 - sleep.data.hours), referenceHours: 8, differenceFromReference: round1(8 - sleep.data.hours) }, severity: "attention", sourceId: "sleepRestriction", detailKey: "adultSleep" });
    } else if (sleep.data.hours <= 9) {
      cards.push({ id: "sleep-range", titleKey: "habitImpact.cards.sleepRange.title", messageKey: "habitImpact.cards.sleepRange.message",
        values: { hours: round1(sleep.data.hours), minimum: 7, maximum: 9 }, severity: "information", sourceId: "adultSleep" });
    } else {
      cards.push({ id: "sleep-long", titleKey: "habitImpact.cards.sleepLong.title", messageKey: "habitImpact.cards.sleepLong.message",
        values: { hours: round1(sleep.data.hours) }, severity: "information", sourceId: "adultSleep" });
    }
  }

  if (exercise.length) {
    const start = shiftDay(date, -6);
    const week = records.filter((record): record is Extract<HabitRecord, { kind: "exercise" }> => record.kind === "exercise" && record.date >= start && record.date <= date && record.data.minutes > 0);
    const moderate = week.filter(record => record.data.intensity === "moderate").reduce((sum, record) => sum + record.data.minutes, 0);
    const vigorous = week.filter(record => record.data.intensity === "intense").reduce((sum, record) => sum + record.data.minutes, 0);
    const unclassified = week.filter(record => !record.data.intensity || record.data.intensity === "light").reduce((sum, record) => sum + record.data.minutes, 0);
    cards.push({ id: "exercise-week", titleKey: "habitImpact.cards.exercise.title", messageKey: "habitImpact.cards.exercise.message",
      values: { moderate, vigorous, moderateTarget: 150, vigorousTarget: 75, unclassified }, severity: "information", sourceId: "physicalActivity" });
  }

  if (foodItems.length || nutrition) {
    const caffeine = estimateDailyCaffeine(records, date);
    const caffeineItems = foodItems.filter(record => ["coffee", "tea", "energy"].includes(record.data.category) || record.data.category === "soda" && record.data.caffeine !== "no");
    const caffeineCategoryMeasured = ["coffee", "tea", "energy"].some(category => categoryWasMeasured(records, date, category as FoodType) && categoryValue(records, date, category as FoodType) > 0) ||
      dayFoodItems(records, date).some(item => item.data.category === "soda" && item.data.caffeine !== "no" && item.data.quantity > 0) ||
      categoryWasMeasured(records, date, "soda") && categoryValue(records, date, "soda") > 0;
    if (caffeine.mg !== undefined && caffeine.mg > 0) {
      cards.push({ id: "caffeine-estimate", titleKey: "habitImpact.cards.caffeine.title", messageKey: "habitImpact.cards.caffeine.message",
        values: { mg: caffeine.mg, dailyReference: 400, percentage: Math.round(caffeine.mg / 400 * 100) }, severity: caffeine.mg > 400 ? "attention" : "information", sourceId: "caffeine" });
      if (caffeine.late) cards.push({ id: "caffeine-late", titleKey: "habitImpact.cards.caffeineLate.title", messageKey: "habitImpact.cards.caffeineLate.message",
        values: { mg: caffeine.mg }, severity: "attention", sourceId: "caffeine" });
    } else if (caffeineItems.some(record => !record.data.deleted && record.data.quantity > 0) || caffeineCategoryMeasured) {
      cards.push({ id: "caffeine-unknown", titleKey: "habitImpact.cards.caffeineUnknown.title", messageKey: "habitImpact.cards.caffeineUnknown.message",
        values: {}, severity: "neutral", sourceId: "caffeine" });
    }

    if (foodItems.some(record => !record.data.deleted && !["water", "fruit", "vegetables"].includes(record.data.category)) ||
      ["coffee", "tea", "energy", "soda", "alcohol", "tobacco", "fastFood", "cereals", "protein", "fats", "sweets", "salty"].some(category => categoryWasMeasured(records, date, category as FoodType) && categoryValue(records, date, category as FoodType) > 0)) {
      cards.push({ id: "nutrient-detail-limit", titleKey: "habitImpact.cards.nutrientDetailLimit.title", messageKey: "habitImpact.cards.nutrientDetailLimit.message",
        values: {}, severity: "neutral" });
    }

    if (hasExplicitProduce(records, date)) {
      const produce = fruitVegetableRegistrations(records, date);
      if (produce.grams > 0) cards.push({ id: "produce-reference-g", titleKey: "habitImpact.cards.produce.title", messageKey: "habitImpact.cards.produce.message",
        values: { value: round1(produce.grams), unit: "g", reference: 400, percentage: Math.round(produce.grams / 400 * 100) }, severity: produce.grams >= 400 ? "information" : "neutral", sourceId: "fruitVegetables" });
      if (produce.explicitPortions > 0) cards.push({ id: "produce-reference-portions", titleKey: "habitImpact.cards.produce.title", messageKey: "habitImpact.cards.produce.message",
        values: { value: round1(produce.explicitPortions), unit: "portions", reference: 5, percentage: Math.round(produce.explicitPortions / 5 * 100) }, severity: produce.explicitPortions >= 5 ? "information" : "neutral", sourceId: "fruitVegetables" });
    } else if (foodItems.some(record => !record.data.deleted && ["fruit", "vegetables"].includes(record.data.category) && record.data.quantity > 0) ||
      (categoryWasMeasured(records, date, "fruit") && categoryValue(records, date, "fruit") > 0) ||
      (categoryWasMeasured(records, date, "vegetables") && categoryValue(records, date, "vegetables") > 0)) {
      cards.push({ id: "produce-unquantified", titleKey: "habitImpact.cards.produceUnquantified.title", messageKey: "habitImpact.cards.produceUnquantified.message",
        values: {}, severity: "neutral", sourceId: "fruitVegetables" });
    }

    if (explicitWaterLogged(records, date)) {
      cards.push({ id: "water-reference", titleKey: "habitImpact.cards.water.title", messageKey: "habitImpact.cards.water.message",
        values: { ml: Math.round(dailyWaterMl(records, date)), referenceMl: 1500 }, severity: "information", sourceId: "hydrationPortugal" });
    } else if (categoryWasMeasured(records, date, "water") && categoryValue(records, date, "water") > 0) {
      cards.push({ id: "water-unquantified", titleKey: "habitImpact.cards.waterUnknown.title", messageKey: "habitImpact.cards.waterUnknown.message",
        values: {}, severity: "neutral", sourceId: "hydrationPortugal" });
    }

    const limitations: Array<{ category: FoodType; id: string; sourceId?: string }> = [
      { category: "fastFood", id: "fastFood", sourceId: "ultraProcessedFood" },
      { category: "sweets", id: "sweets", sourceId: "freeSugar" },
      { category: "salty", id: "salt", sourceId: "salt" },
      { category: "alcohol", id: "alcohol", sourceId: "alcohol" },
      { category: "tobacco", id: "tobacco", sourceId: "tobacco" },
    ];
    for (const item of limitations) {
      const detailedCount = activeFoodCount(records, date, item.category);
      const recordedValue = categoryValue(records, date, item.category);
      const count = detailedCount || (categoryWasMeasured(records, date, item.category) && recordedValue > 0 ? 1 : 0);
      if (!count) continue;
      cards.push({ id: "limitation-" + item.id, titleKey: "habitImpact.cards.limits." + item.id + ".title", messageKey: "habitImpact.cards.limits." + item.id + ".message",
        values: { count }, severity: "neutral", sourceId: item.sourceId });
    }
  }

  if (habitLogs.length) {
    for (const log of habitLogs) {
      const definition = records.find((record): record is Extract<HabitRecord, { kind: "habit" }> => record.kind === "habit" && record.id === log.data.habitId);
      if (!definition) continue;
      const sourceByType: Partial<Record<HabitType, string>> = { tobacco: "tobacco", coffee: "caffeine", alcohol: "alcohol", sleep: "adultSleep", sugar: "freeSugar", gaming: "gamingDisorder" };
      cards.push({ id: "habit-log-" + log.id, titleKey: "habitImpact.cards.habitLog.title", messageKey: "habitImpact.cards.habitLog.message",
        values: { habitName: definition.data.name, goal: definition.data.goal, completed: log.data.completed ? 1 : 0 }, severity: "information", sourceId: sourceByType[definition.data.type] });
    }
  }

  const personal = buildPersonalAssociations(records, events, date);
  // Personal patterns are historical insights, so keep them visible when enough
  // measured days exist even if that habit was not logged on the selected day.
  const personalAssociations = personal.associations;
  const sourceCount = new Set(cards.map(card => card.sourceId).filter(Boolean)).size;
  return { date, hasData, cards, personalAssociations, moodDaysAvailable: personal.moodDays, sourceCount };
}

export function getHabitImpactSource(id: string): HabitImpactSource | undefined {
  return HABIT_IMPACT_SOURCES[id];
}
