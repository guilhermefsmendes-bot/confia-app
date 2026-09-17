import { loadEpisodes } from "../../components/Impulso/storage";
import { getDailyCheckInHistory } from "../../storage/dailyCheckInStorage";
import { appendPersonalEvents, readPersonalEvents } from "./personalEventStorage";
import { createPersonalEventId, localDateFromTimestamp, makePersonalEvent } from "./personalEvent";
import type { PersonalEvent } from "./personalEvent";

const MIGRATION_KEY = "confia_personal_events_migration_v1";

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function timestampForDate(date: string): string {
  return new Date(`${date}T12:00:00`).toISOString();
}

export interface PersonalMigrationResult {
  migrated: boolean;
  eventCount: number;
  sources: string[];
}

export function migrateLegacyPersonalData(): PersonalMigrationResult {
  if (typeof window === "undefined") return { migrated: false, eventCount: 0, sources: [] };
  if (localStorage.getItem(MIGRATION_KEY) === "1") return { migrated: false, eventCount: readPersonalEvents().length, sources: [] };

  const events: PersonalEvent[] = [];
  const sources: string[] = [];
  const push = (event: PersonalEvent, source: string) => { events.push(event); if (!sources.includes(source)) sources.push(source); };

  const ratings = readJson<Array<{ date: string; morning?: number | null; afternoon?: number | null; note?: string }>>("confia_ratings_v2", []);
  for (const rating of ratings) {
    for (const [moment, value] of [["morning", rating.morning], ["afternoon", rating.afternoon]] as const) {
      if (typeof value !== "number") continue;
      const timestamp = timestampForDate(rating.date);
      push(makePersonalEvent({ id: createPersonalEventId("mood", timestamp), type: "mood", timestamp, localDate: rating.date, source: "migration", value, metadata: { moment, note: rating.note, legacySource: "confia_ratings_v2" } }), "ratings");
    }
  }

  const checkIns = getDailyCheckInHistory();
  for (const checkIn of checkIns) {
    const timestamp = timestampForDate(checkIn.date);
    push(makePersonalEvent({ id: createPersonalEventId("checkin", timestamp), type: "checkin", timestamp, localDate: checkIn.date, source: "migration", value: checkIn.mood, metadata: { need: checkIn.need, completed: checkIn.completed, legacySource: "confia_daily_checkin_history" } }), "checkins");
  }

  const habits = readJson<Array<{ date: string; ratings?: Record<string, number>; completed?: number; total?: number }>>("confia_habits_daily_history", []);
  for (const day of habits) {
    const timestamp = timestampForDate(day.date);
    if (day.ratings && typeof day.ratings === "object") {
      for (const [habitId, intensity] of Object.entries(day.ratings)) {
        push(makePersonalEvent({ id: createPersonalEventId("habit", `${timestamp}-${habitId}`), type: "habit", timestamp, localDate: day.date, source: "migration", value: null, metadata: { habitId, intensity, legacySource: "confia_habits_daily_history", semantics: "intensity_observation" } }), "habits");
      }
    } else if (typeof day.completed === "number") {
      push(makePersonalEvent({ id: createPersonalEventId("habit", timestamp), type: "habit", timestamp, localDate: day.date, source: "migration", value: day.completed, metadata: { completed: day.completed, total: day.total, legacySource: "confia_habits_daily_history", semantics: "completion_count" } }), "habits");
    }
  }

  const objectives = readJson<Array<{ date: string; completed?: number; total?: number }>>("confia_objectives_history_v1", []);
  for (const day of objectives) {
    const timestamp = timestampForDate(day.date);
    if (typeof day.completed !== "number") continue;
    push(makePersonalEvent({ id: createPersonalEventId("goal", timestamp), type: "goal", timestamp, localDate: day.date, source: "migration", value: day.completed > 0, metadata: { completedCount: day.completed, total: day.total, legacySource: "confia_objectives_history_v1", action: "completed" } }), "objectives");
  }

  try {
    for (const episode of loadEpisodes()) {
      const timestamp = episode.createdAt;
      push(makePersonalEvent({ id: createPersonalEventId("intervention", timestamp), type: "intervention", timestamp, localDate: localDateFromTimestamp(timestamp), source: "migration", value: episode.finalIntensity ?? null, metadata: { interventionId: `impulso_${timestamp}`, initialIntensity: episode.initialIntensity, finalIntensity: episode.finalIntensity, need: episode.need, emotion: episode.emotion, trigger: episode.trigger, legacySource: "impulso_episodes" } }), "impulso");
    }
  } catch {
    // Older installations may not have an accessible Impulso store.
  }

  const next = appendPersonalEvents(events);
  localStorage.setItem(MIGRATION_KEY, "1");
  return { migrated: true, eventCount: next.length, sources };
}
