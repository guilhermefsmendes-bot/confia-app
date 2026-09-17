import { loadEpisodes } from "../../components/Impulso/storage";
import { getDailyCheckInHistory } from "../../storage/dailyCheckInStorage";
import { appendPersonalEvents } from "./personalEventStorage";
import { makePersonalEvent } from "./personalEvent";
import type { PersonalEvent } from "./personalEvent";

function json<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch { return fallback; }
}

function stableId(prefix: string, parts: unknown[]): string {
  const input = `${prefix}:${parts.map(value => String(value ?? "")).join("|")}`;
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) hash = Math.imul(hash ^ input.charCodeAt(i), 16777619);
  return `pe_${prefix}_${(hash >>> 0).toString(36)}`;
}

export function syncPersonalEventsFromLegacySources(): PersonalEvent[] {
  if (typeof window === "undefined") return [];
  const events: PersonalEvent[] = [];
  const add = (event: PersonalEvent) => events.push(event);

  const ratings = json<Array<{ date: string; morning?: number | null; afternoon?: number | null; note?: string }>>("confia_ratings_v2", []);
  for (const rating of ratings) for (const [moment, value] of [["morning", rating.morning], ["afternoon", rating.afternoon]] as const) {
    if (typeof value !== "number") continue;
    const timestamp = new Date(`${rating.date}T12:00:00`).toISOString();
    add(makePersonalEvent({ id: stableId("mood", [rating.date, moment, value]), type: "mood", timestamp, localDate: rating.date, source: "daily_rating", value, metadata: { moment, note: rating.note } }));
  }

  for (const checkIn of getDailyCheckInHistory()) {
    const timestamp = new Date(`${checkIn.date}T12:00:00`).toISOString();
    add(makePersonalEvent({ id: stableId("checkin", [checkIn.date, checkIn.mood, checkIn.need]), type: "checkin", timestamp, localDate: checkIn.date, source: "daily_checkin", value: checkIn.mood, metadata: { need: checkIn.need, completed: checkIn.completed } }));
  }

  const habits = json<Array<{ date: string; ratings?: Record<string, number>; completed?: number; total?: number }>>("confia_habits_daily_history", []);
  for (const day of habits) {
    const timestamp = new Date(`${day.date}T12:00:00`).toISOString();
    if (day.ratings) for (const [habitId, intensity] of Object.entries(day.ratings)) {
      add(makePersonalEvent({ id: stableId("habit", [day.date, habitId, intensity]), type: "habit", timestamp, localDate: day.date, source: "habit_daily", value: null, metadata: { habitId, intensity, semantics: "intensity_observation" } }));
    }
  }

  const objectives = json<Array<{ date: string; completed?: number; total?: number }>>("confia_objectives_history_v1", []);
  for (const day of objectives) if (typeof day.completed === "number") {
    const timestamp = new Date(`${day.date}T12:00:00`).toISOString();
    add(makePersonalEvent({ id: stableId("goal", [day.date, day.completed, day.total]), type: "goal", timestamp, localDate: day.date, source: "objective", value: day.completed > 0, metadata: { completedCount: day.completed, total: day.total, action: "completed" } }));
  }

  try {
    for (const episode of loadEpisodes()) {
      const timestamp = episode.createdAt;
      add(makePersonalEvent({ id: stableId("intervention", [timestamp, episode.initialIntensity, episode.finalIntensity, episode.need]), type: "intervention", timestamp, source: "impulso", value: episode.finalIntensity ?? null, metadata: { initialIntensity: episode.initialIntensity, finalIntensity: episode.finalIntensity, need: episode.need, emotion: episode.emotion, trigger: episode.trigger, automaticThought: episode.thought } }));
    }
  } catch { /* optional legacy source */ }

  return appendPersonalEvents(events);
}
