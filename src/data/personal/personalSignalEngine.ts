import type { PersonalEvent } from "./personalEvent";
import { localDay, shiftDay } from "../habits/calendar";

export type PersonalSignalDomain = "habit" | "nutrition" | "exercise";
export type PersonalSignalStatus = "insufficient" | "early" | "possible" | "consistent";
export type PersonalSignalTiming = "today" | "same_day" | "next_day";

export interface PersonalSignal {
  id: string;
  domain: PersonalSignalDomain;
  metric: string;
  kind: "fact" | "baseline_change" | "association";
  timing: PersonalSignalTiming;
  status: PersonalSignalStatus;
  direction: "up" | "down" | "stable";
  confidence: number;
  evidenceCount: number;
  score: number;
  observedValue?: number;
  baselineValue?: number;
  effect?: number;
  firstDate?: string;
  lastDate?: string;
  contradictionRate?: number;
  metadata?: Record<string, string | number | boolean>;
}

export interface PersonalExperimentCandidate {
  id: string;
  domain: PersonalSignalDomain;
  metric: string;
  timing: "same_day" | "next_day";
  direction: "up" | "down";
  confidence: number;
  evidenceCount: number;
  sourceSignalId: string;
}

export interface PersonalSignalSnapshot {
  generatedAt: string;
  observationCount: number;
  activeDays: number;
  facts: PersonalSignal[];
  patterns: PersonalSignal[];
  topSignal?: PersonalSignal;
  experimentCandidate?: PersonalExperimentCandidate;
}

type DayMetric = Map<string, number>;
type MetricSeries = { domain: PersonalSignalDomain; values: DayMetric; ids: Map<string, string[]> };

const DAY_MS = 86400000;
const METRIC_WINDOW_DAYS = 90;
const ASSOCIATION_WINDOW_DAYS = 60;
const MIN_BASELINE_DAYS = 5;
const MIN_GROUP_DAYS = 5;
const MIN_EFFECT = 0.8;

let cachedSignature = "";
let cachedSnapshot: PersonalSignalSnapshot | undefined;

const mean = (values: number[]) => values.length ? values.reduce((a, b) => a + b, 0) / values.length : undefined;
const finite = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);

function signature(events: PersonalEvent[], now: Date): string {
  const last = events.reduce((value, event) => event.timestamp > value ? event.timestamp : value, "");
  return [events.length, last, localDay(now)].join("|");
}

function latestMoodByDay(events: PersonalEvent[]): Map<string, number> {
  const latest = new Map<string, PersonalEvent>();
  for (const event of events) {
    if (event.type !== "mood" || !finite(event.value)) continue;
    const moment = String(event.metadata?.moment ?? "daily");
    const key = event.localDate + ":" + moment;
    const previous = latest.get(key);
    if (!previous || event.timestamp > previous.timestamp) latest.set(key, event);
  }
  const grouped = new Map<string, number[]>();
  for (const event of latest.values()) {
    const values = grouped.get(event.localDate) ?? [];
    values.push(Number(event.value));
    grouped.set(event.localDate, values);
  }
  return new Map([...grouped].map(([day, values]) => [day, mean(values)!]));
}

function addMetric(series: Map<string, MetricSeries>, metric: string, domain: PersonalSignalDomain, day: string, value: number, id: string, additive = false) {
  if (!Number.isFinite(value)) return;
  const current = series.get(metric) ?? { domain, values: new Map<string, number>(), ids: new Map<string, string[]>() };
  current.values.set(day, additive ? (current.values.get(day) ?? 0) + value : value);
  current.ids.set(day, [...(current.ids.get(day) ?? []), id]);
  series.set(metric, current);
}

function buildMetricSeries(events: PersonalEvent[]): Map<string, MetricSeries> {
  const series = new Map<string, MetricSeries>();
  const nutritionMetrics = ["coffee", "energy", "soda", "water", "fastFood", "fruit", "vegetables", "sweets"] as const;
  const activityTypes = ["walk", "run", "gym", "bike", "swim", "sport", "yoga", "other"] as const;
  const intensityTypes = ["light", "moderate", "intense"] as const;
  const periodTypes = ["morning", "afternoon", "evening"] as const;
  const exerciseDays = new Set<string>();
  const intensityKnownDays = new Set<string>();
  const periodKnownDays = new Set<string>();

  for (const event of events) {
    if (event.type === "nutrition") {
      for (const metric of nutritionMetrics) {
        const value = event.metadata?.[metric];
        if (finite(value)) addMetric(series, metric, "nutrition", event.localDate, value, event.id);
      }
      const late = event.metadata?.lateCaffeine;
      if (typeof late === "boolean") addMetric(series, "lateCaffeine", "nutrition", event.localDate, Number(late), event.id);
      continue;
    }

    if (event.type === "exercise" && finite(event.value)) {
      const minutes = Number(event.value);
      exerciseDays.add(event.localDate);
      addMetric(series, "movement", "exercise", event.localDate, minutes, event.id, true);
      const activity = String(event.metadata?.activity ?? "");
      if (activity) addMetric(series, "activity:" + activity, "exercise", event.localDate, minutes, event.id, true);
      const intensity = String(event.metadata?.intensity ?? "");
      if (intensity) {
        intensityKnownDays.add(event.localDate);
        addMetric(series, "intensity:" + intensity, "exercise", event.localDate, minutes, event.id, true);
      }
      const period = String(event.metadata?.period ?? "");
      if (period) {
        periodKnownDays.add(event.localDate);
        addMetric(series, "period:" + period, "exercise", event.localDate, minutes, event.id, true);
      }
      continue;
    }

    if (event.type === "habit_challenge" && typeof event.value === "boolean") {
      const habitId = String(event.metadata?.habitId ?? "");
      if (habitId) addMetric(series, "challenge:" + habitId, "habit", event.localDate, Number(event.value), event.id);
    }
  }

  // Zero is added only inside explicitly logged exercise dimensions. A light
  // session is valid evidence of 0 logged intense minutes; a completely missing
  // exercise day remains unknown and is never converted to zero.
  for (const day of exerciseDays) {
    for (const activity of activityTypes) {
      const key = "activity:" + activity;
      const source = series.get(key);
      if (source && !source.values.has(day)) addMetric(series, key, "exercise", day, 0, "explicit:" + day);
    }
  }
  for (const day of intensityKnownDays) {
    for (const intensity of intensityTypes) {
      const key = "intensity:" + intensity;
      const source = series.get(key);
      if (source && !source.values.has(day)) addMetric(series, key, "exercise", day, 0, "explicit:" + day);
    }
  }
  for (const day of periodKnownDays) {
    for (const period of periodTypes) {
      const key = "period:" + period;
      const source = series.get(key);
      if (source && !source.values.has(day)) addMetric(series, key, "exercise", day, 0, "explicit:" + day);
    }
  }
  return series;
}

function recencyWeight(day: string, now: Date): number {
  const age = Math.max(0, (now.getTime() - new Date(day + "T12:00:00").getTime()) / DAY_MS);
  return Math.exp(-age / 45);
}

function weightedMean(items: Array<{ day: string; value: number }>, now: Date): number | undefined {
  let total = 0, weight = 0;
  for (const item of items) {
    const w = recencyWeight(item.day, now);
    total += item.value * w;
    weight += w;
  }
  return weight ? total / weight : undefined;
}

function splitThreshold(values: number[]): number {
  const unique = [...new Set(values)].sort((a, b) => a - b);
  if (unique.length <= 1) return unique[0] ?? 0;
  if (unique.every(value => value === 0 || value === 1)) return 0.5;
  let best = (unique[0] + unique[1]) / 2;
  let bestBalance = -1;
  for (let i = 0; i < unique.length - 1; i++) {
    const candidate = (unique[i] + unique[i + 1]) / 2;
    const low = values.filter(value => value < candidate).length;
    const high = values.length - low;
    const balance = Math.min(low, high);
    if (balance > bestBalance) {
      bestBalance = balance;
      best = candidate;
    }
  }
  return best;
}

function statusForEvidence(high: number, low: number, contradictionRate: number): PersonalSignalStatus {
  if (high < MIN_GROUP_DAYS || low < MIN_GROUP_DAYS) return "early";
  if (high >= 10 && low >= 10 && contradictionRate <= 0.35) return "consistent";
  return "possible";
}

function associationSignal(metric: string, source: MetricSeries, mood: Map<string, number>, timing: "same_day" | "next_day", now: Date): PersonalSignal | undefined {
  const pairs = [...source.values].map(([day, value]) => {
    const targetDay = timing === "same_day" ? day : shiftDay(day, 1);
    const targetMood = mood.get(targetDay);
    return targetMood === undefined ? undefined : { day, value, mood: targetMood };
  }).filter((value): value is { day: string; value: number; mood: number } => Boolean(value));

  if (pairs.length < MIN_GROUP_DAYS * 2) return undefined;
  const values = pairs.map(p => p.value);
  const threshold = splitThreshold(values);
  const high = pairs.filter(p => p.value >= threshold);
  const low = pairs.filter(p => p.value < threshold);
  if (high.length < MIN_GROUP_DAYS || low.length < MIN_GROUP_DAYS) return undefined;

  const highMean = weightedMean(high.map(p => ({ day: p.day, value: p.mood })), now);
  const lowMean = weightedMean(low.map(p => ({ day: p.day, value: p.mood })), now);
  if (highMean === undefined || lowMean === undefined) return undefined;
  const effect = highMean - lowMean;
  if (Math.abs(effect) < MIN_EFFECT) return undefined;

  const split = (highMean + lowMean) / 2;
  const expectedHighAbove = effect > 0;
  const contradictions = [
    ...high.map(p => expectedHighAbove ? p.mood < split : p.mood > split),
    ...low.map(p => expectedHighAbove ? p.mood > split : p.mood < split),
  ].filter(Boolean).length;
  const contradictionRate = contradictions / pairs.length;
  const status = statusForEvidence(high.length, low.length, contradictionRate);
  const confidence = Math.max(0.35, Math.min(0.95,
    0.45 + Math.min(0.25, pairs.length / 80) + Math.min(0.2, Math.abs(effect) / 5) - contradictionRate * 0.25
  ));
  const dates = pairs.map(p => p.day).sort();
  const score = confidence * Math.min(1, Math.abs(effect) / 2) * (timing === "next_day" ? 1.05 : 1);

  return {
    id: ["signal", metric, timing, effect > 0 ? "up" : "down"].join(":"),
    domain: source.domain,
    metric,
    kind: "association",
    timing,
    status,
    direction: effect > 0 ? "up" : "down",
    confidence,
    evidenceCount: pairs.length,
    score,
    effect,
    contradictionRate,
    firstDate: dates[0],
    lastDate: dates.at(-1),
    metadata: { highDays: high.length, lowDays: low.length, threshold },
  };
}

function crossChallengeSignal(metric: string, source: MetricSeries, challengeMetric: string, challenge: MetricSeries, now: Date): PersonalSignal | undefined {
  if (source.domain === "habit") return undefined;
  const pairs = [...source.values].map(([day, value]) => {
    const challengeValue = challenge.values.get(day);
    return challengeValue === undefined ? undefined : { day, value, challenge: challengeValue };
  }).filter((value): value is { day: string; value: number; challenge: number } => Boolean(value));
  if (pairs.length < MIN_GROUP_DAYS * 2) return undefined;

  const values = pairs.map(p => p.value);
  const threshold = splitThreshold(values);
  const high = pairs.filter(p => p.value >= threshold);
  const low = pairs.filter(p => p.value < threshold);
  if (high.length < MIN_GROUP_DAYS || low.length < MIN_GROUP_DAYS) return undefined;

  const highRate = weightedMean(high.map(p => ({ day: p.day, value: p.challenge })), now);
  const lowRate = weightedMean(low.map(p => ({ day: p.day, value: p.challenge })), now);
  if (highRate === undefined || lowRate === undefined) return undefined;
  const effect = highRate - lowRate;
  if (Math.abs(effect) < 0.25) return undefined;

  const contradictions = [
    ...high.map(p => effect > 0 ? p.challenge === 0 : p.challenge === 1),
    ...low.map(p => effect > 0 ? p.challenge === 1 : p.challenge === 0),
  ].filter(Boolean).length;
  const contradictionRate = contradictions / pairs.length;
  const status = statusForEvidence(high.length, low.length, contradictionRate);
  const confidence = Math.max(0.35, Math.min(0.9,
    0.45 + Math.min(0.2, pairs.length / 80) + Math.min(0.2, Math.abs(effect)) - contradictionRate * 0.2
  ));
  const dates = pairs.map(p => p.day).sort();

  return {
    id: ["cross", metric, challengeMetric, effect > 0 ? "up" : "down"].join(":"),
    domain: source.domain,
    metric,
    kind: "association",
    timing: "same_day",
    status,
    direction: effect > 0 ? "up" : "down",
    confidence,
    evidenceCount: pairs.length,
    score: confidence * Math.min(1, Math.abs(effect) * 2),
    effect,
    contradictionRate,
    firstDate: dates[0],
    lastDate: dates.at(-1),
    metadata: { highDays: high.length, lowDays: low.length, threshold, target: challengeMetric },
  };
}

function baselineSignal(metric: string, source: MetricSeries, today: string): PersonalSignal | undefined {
  const current = source.values.get(today);
  if (current === undefined) return undefined;
  const previous = [...source.values]
    .filter(([day]) => day < today)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 14)
    .map(([, value]) => value);
  if (previous.length < MIN_BASELINE_DAYS) return undefined;
  const baseline = mean(previous);
  if (baseline === undefined) return undefined;
  const scale = Math.max(1, Math.abs(baseline));
  const relative = (current - baseline) / scale;
  if (Math.abs(relative) < 0.5 && Math.abs(current - baseline) < 1) return undefined;
  const confidence = Math.min(0.85, 0.45 + previous.length / 40);
  return {
    id: ["baseline", metric, today].join(":"),
    domain: source.domain,
    metric,
    kind: "baseline_change",
    timing: "today",
    status: previous.length >= 10 ? "possible" : "early",
    direction: current > baseline ? "up" : current < baseline ? "down" : "stable",
    confidence,
    evidenceCount: previous.length + 1,
    score: confidence * Math.min(1, Math.abs(relative)),
    observedValue: current,
    baselineValue: baseline,
    firstDate: today,
    lastDate: today,
  };
}

function factSignals(series: Map<string, MetricSeries>, today: string): PersonalSignal[] {
  const facts: PersonalSignal[] = [];
  for (const [metric, source] of series) {
    const value = source.values.get(today);
    if (value === undefined) continue;
    facts.push({
      id: ["fact", metric, today].join(":"),
      domain: source.domain,
      metric,
      kind: "fact",
      timing: "today",
      status: "possible",
      direction: value > 0 ? "up" : "stable",
      confidence: 1,
      evidenceCount: 1,
      score: 0.2,
      observedValue: value,
      firstDate: today,
      lastDate: today,
    });
  }
  return facts;
}

function experimentCandidate(patterns: PersonalSignal[]): PersonalExperimentCandidate | undefined {
  const allowed = new Set(["lateCaffeine", "coffee", "movement", "period:evening", "fruit", "vegetables", "water", "energy", "sweets", "fastFood"]);
  const candidate = patterns
    .filter(signal => signal.kind === "association" && allowed.has(signal.metric) && signal.status !== "early" && signal.confidence >= 0.55)
    .sort((a, b) => b.score - a.score)[0];
  if (!candidate) return undefined;
  return {
    id: "experiment:" + candidate.id,
    domain: candidate.domain,
    metric: candidate.metric,
    timing: candidate.timing as "same_day" | "next_day",
    direction: candidate.direction as "up" | "down",
    confidence: candidate.confidence,
    evidenceCount: candidate.evidenceCount,
    sourceSignalId: candidate.id,
  };
}

export function buildPersonalSignalSnapshot(events: PersonalEvent[], now = new Date()): PersonalSignalSnapshot {
  const sig = signature(events, now);
  if (cachedSignature === sig && cachedSnapshot) return cachedSnapshot;

  const today = localDay(now);
  const cutoff = shiftDay(today, -METRIC_WINDOW_DAYS);
  const associationCutoff = shiftDay(today, -ASSOCIATION_WINDOW_DAYS);
  const valid = events.filter(event =>
    event.localDate >= cutoff &&
    event.localDate <= today &&
    Number.isFinite(Date.parse(event.timestamp)) &&
    Date.parse(event.timestamp) <= now.getTime()
  );
  const recent = valid.filter(event => event.localDate >= associationCutoff);
  const mood = latestMoodByDay(recent);
  const series = buildMetricSeries(recent);
  const facts = factSignals(series, today);
  const patterns: PersonalSignal[] = [];

  for (const [metric, source] of series) {
    const baseline = baselineSignal(metric, source, today);
    if (baseline) patterns.push(baseline);
    const same = associationSignal(metric, source, mood, "same_day", now);
    if (same) patterns.push(same);
    const next = associationSignal(metric, source, mood, "next_day", now);
    if (next) patterns.push(next);
  }

  const challenges = [...series.entries()].filter(([metric]) => metric.startsWith("challenge:"));
  for (const [metric, source] of series) {
    if (source.domain === "habit") continue;
    for (const [challengeMetric, challenge] of challenges) {
      const cross = crossChallengeSignal(metric, source, challengeMetric, challenge, now);
      if (cross) patterns.push(cross);
    }
  }

  patterns.sort((a, b) => b.score - a.score || b.evidenceCount - a.evidenceCount);
  const topSignal = patterns.find(signal => signal.status === "consistent" || signal.status === "possible") ?? patterns[0];
  const snapshot: PersonalSignalSnapshot = {
    generatedAt: now.toISOString(),
    observationCount: valid.length,
    activeDays: new Set(valid.map(event => event.localDate)).size,
    facts,
    patterns: patterns.slice(0, 24),
    topSignal,
    experimentCandidate: experimentCandidate(patterns),
  };
  cachedSignature = sig;
  cachedSnapshot = snapshot;
  return snapshot;
}

export function clearPersonalSignalCache() {
  cachedSignature = "";
  cachedSnapshot = undefined;
}
