import type { PersonalEvent } from "./personalEvent";
import type { InsightStatus } from "./personalInsights";

export interface PersonalPattern {
  id: string;
  fingerprint: string;
  type: "habit_association" | "time_of_day" | "weekday" | "repeated_need";
  label: string;
  evidenceCount: number;
  positiveDays: number;
  negativeDays: number;
  effect: number;
  confidence: "low" | "moderate" | "high";
  status: InsightStatus;
  firstSeen: string;
  lastSeen: string;
  supportingEventIds: string[];
}

const mood = (event: PersonalEvent) =>
  (event.type === "mood" || event.type === "checkin") && typeof event.value === "number"
    ? event.value
    : undefined;

const average = (values: number[]) => values.length
  ? values.reduce((sum, value) => sum + value, 0) / values.length
  : undefined;

function confidenceFor(evidence: number, effect: number, days: number): PersonalPattern["confidence"] {
  if (evidence >= 12 && Math.abs(effect) >= 1.25 && days >= 8) return "high";
  if (evidence >= 7 && Math.abs(effect) >= 0.8 && days >= 5) return "moderate";
  return "low";
}

function statusFor(evidence: number, days: number): InsightStatus {
  if (evidence >= 12 && days >= 8) return "consistent";
  if (evidence >= 7 && days >= 5) return "possible";
  return "emerging";
}

export function buildPersonalPatterns(events: PersonalEvent[]): PersonalPattern[] {
  const sorted = events
    .filter(event => Number.isFinite(new Date(event.timestamp).getTime()))
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  const moods = sorted.filter(event => mood(event) !== undefined);
  const byDay = new Map<string, PersonalEvent[]>();
  for (const event of sorted) byDay.set(event.localDate, [...(byDay.get(event.localDate) ?? []), event]);
  const patterns: PersonalPattern[] = [];

  const habits = new Map<string, { days: Set<string>; eventIds: string[]; intensity: number[] }>();
  for (const event of sorted) {
    if (event.type !== "habit") continue;
    const key = String(event.metadata?.habitName ?? event.metadata?.habitId ?? "habit");
    const entry = habits.get(key) ?? { days: new Set<string>(), eventIds: [], intensity: [] };
    if (event.metadata?.completed === true || typeof event.metadata?.intensity === "number") entry.days.add(event.localDate);
    entry.eventIds.push(event.id);
    if (typeof event.metadata?.intensity === "number") entry.intensity.push(Number(event.metadata.intensity));
    habits.set(key, entry);
  }

  for (const [habit, entry] of habits) {
    const paired = [...entry.days].map(day => ({
      day,
      mood: average((byDay.get(day) ?? []).map(mood).filter((v): v is number => v !== undefined)),
    })).filter(item => item.mood !== undefined);
    if (paired.length < 5) continue;
    const pairedAvg = average(paired.map(item => item.mood!))!;
    const unpaired = moods.filter(event => !entry.days.has(event.localDate)).map(mood).filter((v): v is number => v !== undefined);
    const unpairedAvg = average(unpaired);
    if (unpairedAvg === undefined) continue;
    const effect = pairedAvg - unpairedAvg;
    if (Math.abs(effect) < 0.75) continue;
    patterns.push({
      id: `pattern_habit_${habit.toLowerCase().replace(/[^a-z0-9]+/gi, "_")}`,
      fingerprint: `habit:${habit}:${effect >= 0 ? "up" : "down"}`,
      type: "habit_association", label: habit, evidenceCount: paired.length,
      positiveDays: effect >= 0 ? paired.length : 0, negativeDays: effect < 0 ? paired.length : 0,
      effect, confidence: confidenceFor(paired.length, effect, entry.days.size),
      status: statusFor(paired.length, entry.days.size), firstSeen: paired[0].day, lastSeen: paired[paired.length - 1].day,
      supportingEventIds: entry.eventIds.slice(-24),
    });
  }

  const moments = new Map<string, { values: number[]; ids: string[]; days: Set<string> }>();
  for (const event of moods) {
    const moment = String(event.metadata?.moment ?? "unknown");
    if (moment === "unknown") continue;
    const entry = moments.get(moment) ?? { values: [], ids: [], days: new Set<string>() };
    entry.values.push(mood(event)!); entry.ids.push(event.id); entry.days.add(event.localDate); moments.set(moment, entry);
  }
  const overall = average(moods.map(mood).filter((v): v is number => v !== undefined));
  if (overall !== undefined) for (const [moment, entry] of moments) {
    const effect = average(entry.values)! - overall;
    if (entry.values.length < 6 || Math.abs(effect) < 0.8) continue;
    patterns.push({
      id: `pattern_time_${moment}`, fingerprint: `time_of_day:${moment}:${effect >= 0 ? "up" : "down"}`,
      type: "time_of_day", label: moment, evidenceCount: entry.values.length, positiveDays: effect >= 0 ? entry.values.length : 0,
      negativeDays: effect < 0 ? entry.values.length : 0, effect, confidence: confidenceFor(entry.values.length, effect, entry.days.size),
      status: statusFor(entry.values.length, entry.days.size), firstSeen: [...entry.days][0], lastSeen: [...entry.days].at(-1)!, supportingEventIds: entry.ids.slice(-24),
    });
  }

  const needs = new Map<string, { ids: string[]; days: Set<string> }>();
  for (const event of sorted) if (event.type === "checkin" && typeof event.metadata?.need === "string") {
    const need = String(event.metadata.need); const entry = needs.get(need) ?? { ids: [], days: new Set<string>() };
    entry.ids.push(event.id); entry.days.add(event.localDate); needs.set(need, entry);
  }
  for (const [need, entry] of needs) if (entry.ids.length >= 3) {
    const days = [...entry.days].sort();
    patterns.push({ id: `pattern_need_${need}`, fingerprint: `need:${need}`, type: "repeated_need", label: need,
      evidenceCount: entry.ids.length, positiveDays: 0, negativeDays: 0, effect: 0,
      confidence: entry.ids.length >= 7 ? "moderate" : "low", status: entry.ids.length >= 7 ? "consistent" : "possible",
      firstSeen: days[0], lastSeen: days.at(-1)!, supportingEventIds: entry.ids.slice(-24) });
  }
  return patterns;
}

export function describePersonalPattern(pattern: PersonalPattern): string {
  if (pattern.type === "habit_association") {
    const direction = pattern.effect > 0 ? "tem coincidido com estados médios mais altos" : "tem coincidido com estados médios mais baixos";
    return `Nos teus registos, ${pattern.label} ${direction}. Isto é uma associação observada, não uma causa.`;
  }
  if (pattern.type === "time_of_day") {
    const direction = pattern.effect > 0 ? "tende a ser mais alto" : "tende a ser mais baixo";
    return `Nos teus registos, o estado médio ${direction} em ${pattern.label}.`;
  }
  return `A necessidade “${pattern.label}” aparece repetidamente nos teus registos.`;
}
