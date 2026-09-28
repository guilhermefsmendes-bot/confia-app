import type { FoodItem,DayPeriod } from "./catalog";
import type { WellbeingPlan,PlanCheck } from "./plans";
export const HABIT_TYPES = ["tobacco", "coffee", "alcohol", "social", "gaming", "sugar", "shopping", "checking", "sleep", "custom"] as const;
export type HabitType = typeof HABIT_TYPES[number];
export const HABIT_ICONS: Record<HabitType, string> = { tobacco:"🚬", coffee:"☕", alcohol:"🍺", social:"📱", gaming:"🎮", sugar:"🍬", shopping:"🛒", checking:"🔍", sleep:"🌙", custom:"🌱" };
export const FOOD_TYPES = ["coffee", "energy", "soda", "water", "alcohol", "tobacco", "fastFood", "fruit", "vegetables", "sweets"] as const;
export type FoodType = typeof FOOD_TYPES[number];
export const FOOD_ICONS: Record<FoodType, string> = { coffee:"☕", energy:"⚡", soda:"🥤", water:"💧", alcohol:"🍺", tobacco:"🚬", fastFood:"🍔", fruit:"🍎", vegetables:"🥦", sweets:"🍬" };
export const ACTIVITY_TYPES = ["walk", "run", "gym", "bike", "swim", "sport", "yoga", "other"] as const;
export type ActivityType = typeof ACTIVITY_TYPES[number];
export const ACTIVITY_ICONS: Record<ActivityType, string> = { walk:"🚶", run:"🏃", gym:"🏋️", bike:"🚴", swim:"🏊", sport:"⚽", yoga:"🧘", other:"🌿" };
export type SlipReason = "once" | "several" | "fresh";
export interface Habit { type: HabitType; name: string; icon: string; goal: string; active: boolean; createdAt: string; }
export interface RecordBase { id: string; date: string; updatedAt: string; timezone: string; }
export type HabitRecord = RecordBase & (
  | { kind: "habit"; data: Habit }
  | { kind: "settings"; data: { primaryId: string } }
  | { kind: "habitLog"; data: { habitId: string; completed: boolean } }
  | { kind: "restart"; data: { habitId: string; reason: SlipReason; bestBefore?: number } }
  | { kind: "summary"; data: { habitId: string; best: number; total: number; runStart: string; runEnd: string; cycleAt: string; cycleDate: string } }
  | { kind: "nutrition"; data: Partial<Record<FoodType, number>> }
  | { kind: "foodItem"; data: FoodItem }
  | { kind: "wellbeingPlan"; data: WellbeingPlan }
  | { kind: "planCheck"; data: PlanCheck }
  | { kind: "planPreference"; data: { dismissedUntil:string } }
  | { kind: "exercise"; data: { activity: ActivityType; minutes: number; period?: DayPeriod; intensity?: "light" | "moderate" | "intense" } }
);
export type HabitDefinition = Extract<HabitRecord, { kind: "habit" }>;
export type SyncStatus = "local" | "pending" | "synced" | "error";
export interface HabitSnapshot { version: 1; records: HabitRecord[]; pending: Record<string, string>; }
