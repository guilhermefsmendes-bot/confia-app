export const PERSONAL_EVENT_SCHEMA_VERSION = 1 as const;

export type PersonalEventType =
  | "mood"
  | "checkin"
  | "habit"
  | "goal"
  | "intervention"
  | "context"
  | "insight_feedback"
  | "experiment";

export type PersonalEventSource =
  | "daily_checkin"
  | "daily_rating"
  | "habit_daily"
  | "objective"
  | "impulso"
  | "app_context"
  | "insight"
  | "microexperiment"
  | "migration";

export interface PersonalEventBase {
  id: string;
  type: PersonalEventType;
  timestamp: string;
  localDate: string;
  source: PersonalEventSource;
  schemaVersion: number;
  value: number | string | boolean | null;
  metadata?: Record<string, unknown>;
}

export interface MoodEvent extends PersonalEventBase {
  type: "mood";
  value: number;
  metadata?: { moment?: "morning" | "afternoon" | "evening"; note?: string; } & Record<string, unknown>;
}

export interface CheckInEvent extends PersonalEventBase {
  type: "checkin";
  value: number;
  metadata?: { note?: string; context?: string[]; } & Record<string, unknown>;
}

export interface HabitEvent extends PersonalEventBase {
  type: "habit";
  value: number | null;
  metadata?: { habitId?: string; habitName?: string; intensity?: number; completed?: boolean; } & Record<string, unknown>;
}

export interface GoalEvent extends PersonalEventBase {
  type: "goal";
  value: boolean;
  metadata?: { goalId?: string; goalTitle?: string; action?: "completed" | "created" | "updated"; } & Record<string, unknown>;
}

export interface InterventionEvent extends PersonalEventBase {
  type: "intervention";
  value: number | null;
  metadata?: { interventionId?: string; initialIntensity?: number; finalIntensity?: number; need?: string; } & Record<string, unknown>;
}

export interface ContextEvent extends PersonalEventBase {
  type: "context";
  value: string;
  metadata?: { category?: string; } & Record<string, unknown>;
}

export interface InsightFeedbackEvent extends PersonalEventBase {
  type: "insight_feedback";
  value: string;
  metadata?: { insightId?: string; feedback?: "useful" | "dismissed" | "expanded"; } & Record<string, unknown>;
}

export interface ExperimentEvent extends PersonalEventBase {
  type: "experiment";
  value: number | boolean | string | null;
  metadata?: { experimentId?: string; phase?: "start" | "measure" | "complete"; hypothesis?: string; start?: string; end?: string; baseline?: number | string; targetMetric?: string; completion?: string; outcome?: string; status?: "active" | "complete"; } & Record<string, unknown>;
}

export type PersonalEvent =
  | MoodEvent
  | CheckInEvent
  | HabitEvent
  | GoalEvent
  | InterventionEvent
  | ContextEvent
  | InsightFeedbackEvent
  | ExperimentEvent;

export function localDateFromTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  if (!Number.isFinite(date.getTime())) return timestamp.slice(0, 10);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function createPersonalEventId(type: PersonalEventType, timestamp = new Date().toISOString()): string {
  const entropy = Math.random().toString(36).slice(2, 9);
  return `pe_${type}_${timestamp.replace(/\D/g, "").slice(0, 14)}_${entropy}`;
}

export function makePersonalEvent<T extends PersonalEvent>(event: Omit<T, "schemaVersion" | "localDate"> & Partial<Pick<T, "localDate">>): T {
  return {
    ...event,
    localDate: event.localDate ?? localDateFromTimestamp(event.timestamp),
    schemaVersion: PERSONAL_EVENT_SCHEMA_VERSION,
  } as T;
}
