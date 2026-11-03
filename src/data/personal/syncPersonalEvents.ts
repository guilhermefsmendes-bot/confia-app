import { loadEpisodes } from "../../components/Impulso/storage";
import { getDailyCheckInHistory } from "../../storage/dailyCheckInStorage";
import { normalizeDailyRatings } from "../../storage/dailyRatingStorage";
import { readPersonalEvents, reconcilePersonalEvents } from "./personalEventStorage";
import { makePersonalEvent } from "./personalEvent";
import type { PersonalEvent } from "./personalEvent";

function json<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch { return fallback; }
}

function timestampForLocalDate(date: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const local = new Date(date + "T12:00:00");
  if (!Number.isFinite(local.getTime()) || local.getFullYear() !== Number(date.slice(0, 4)) || local.getMonth() + 1 !== Number(date.slice(5, 7)) || local.getDate() !== Number(date.slice(8, 10))) return null;
  return local.toISOString();
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

  const ratings = normalizeDailyRatings(json<unknown>("confia_ratings_v2", []));
  for (const rating of ratings) for (const [moment, value] of [["morning", rating.morning], ["afternoon", rating.afternoon]] as const) {
    if (typeof value !== "number") continue;
    const timestamp = timestampForLocalDate(rating.date);
    if (!timestamp) continue;
    add(makePersonalEvent({ id: stableId("mood", [rating.date, moment]), type: "mood", timestamp, localDate: rating.date, source: "daily_rating", value, metadata: { moment, note: rating.note } }));
  }

  for (const checkIn of getDailyCheckInHistory()) {
    const timestamp = timestampForLocalDate(checkIn.date);
    if (!timestamp) continue;
    add(makePersonalEvent({ id: stableId("checkin", [checkIn.date]), type: "checkin", timestamp, localDate: checkIn.date, source: "daily_checkin", value: checkIn.mood, metadata: { need: checkIn.need, completed: checkIn.completed } }));
  }

  const habits = json<Array<{ date: string; ratings?: Record<string, number>; completed?: number; total?: number }>>("confia_habits_daily_history", []);
  for (const day of habits) {
    const timestamp = timestampForLocalDate(day.date);
    if (!timestamp) continue;
    if (day.ratings) for (const [habitId, intensity] of Object.entries(day.ratings)) {
      add(makePersonalEvent({ id: stableId("habit", [day.date, habitId, intensity]), type: "habit", timestamp, localDate: day.date, source: "habit_daily", value: null, metadata: { habitId, intensity, semantics: "intensity_observation" } }));
    }
  }

  const objectives = json<Array<{ date: string; completed?: number; total?: number }>>("confia_objectives_history_v1", []);
  for (const day of objectives) if (typeof day.completed === "number") {
    const timestamp = timestampForLocalDate(day.date);
    if (!timestamp) continue;
    add(makePersonalEvent({ id: stableId("goal", [day.date, day.completed, day.total]), type: "goal", timestamp, localDate: day.date, source: "objective", value: day.completed > 0, metadata: { completedCount: day.completed, total: day.total, action: "completed" } }));
  }

  try {
    for (const episode of loadEpisodes()) {
      const timestamp = episode.createdAt;
      add(makePersonalEvent({ id: stableId("intervention", [timestamp, episode.initialIntensity, episode.finalIntensity, episode.need]), type: "intervention", timestamp, source: "impulso", value: episode.finalIntensity ?? null, metadata: { initialIntensity: episode.initialIntensity, finalIntensity: episode.finalIntensity, need: episode.need, emotion: episode.emotion, trigger: episode.trigger, automaticThought: episode.thought } }));
    }
  } catch { /* optional legacy source */ }

  const canonicalIds = new Set(events.map(event => event.id));
  const ratingDates = new Set(ratings.map(rating => rating.date));
  const checkInDates = new Set(getDailyCheckInHistory().map(checkIn => checkIn.date));
  const obsoleteIds = readPersonalEvents().filter(event => {
    if (canonicalIds.has(event.id)) return false;
    if (event.type === "mood" && (event.source === "daily_rating" || (event.source === "migration" && event.metadata?.legacySource === "confia_ratings_v2")) && (event.metadata?.moment === "morning" || event.metadata?.moment === "afternoon")) {
      return ratingDates.has(event.localDate);
    }
    if (event.type === "checkin" && (event.source === "daily_checkin" || (event.source === "migration" && event.metadata?.legacySource === "confia_daily_checkin_history"))) return checkInDates.has(event.localDate);
    return false;
  }).map(event => event.id);
  reconcilePersonalEvents(events, obsoleteIds);
  return readPersonalEvents();
}
