/**
 * CONFIA — SINAIS REATIVOS
 *
 * Transforma métricas num conjunto de sinais interpretáveis.
 *
 * O motor deixa assim de depender apenas de uma situação.
 */

import { ReactiveMetrics } from "./reactiveTypes";

export type ReactiveSignal =
  | "mood_very_low"
  | "mood_low"
  | "mood_ok"
  | "mood_high"
  | "mood_rising"
  | "mood_falling"
  | "mood_stable"
  | "has_recent_progress"
  | "has_recent_setback"
  | "objectives_strong"
  | "objectives_weak"
  | "impulse_effective"
  | "impulse_some_effect"
  | "consistent_use"
  | "long_streak"
  | "recent_return"
  | "little_data"
  | "no_data";

export interface ReactiveSignalResult {
  signals: ReactiveSignal[];
  weights: Record<string, number>;
}

export function detectReactiveSignals(
  metrics: ReactiveMetrics
): ReactiveSignalResult {
  const signals: ReactiveSignal[] = [];
  const weights: Record<string, number> = {};

  const add = (
    signal: ReactiveSignal,
    weight: number
  ) => {
    signals.push(signal);
    weights[signal] = weight;
  };

  if (typeof metrics.currentMood !== "number") {
    add("no_data", 1);
  } else if (metrics.currentMood <= 2) {
    add("mood_very_low", 1);
  } else if (metrics.currentMood <= 4) {
    add("mood_low", 1);
  } else if (metrics.currentMood >= 8) {
    add("mood_high", 0.9);
  } else {
    add("mood_ok", 0.6);
  }

  if (typeof metrics.moodChange === "number") {
    if (metrics.moodChange >= 0.8) {
      add("mood_rising", 0.9);
      add("has_recent_progress", 0.8);
    } else if (metrics.moodChange <= -0.8) {
      add("mood_falling", 0.9);
      add("has_recent_setback", 0.8);
    } else if (Math.abs(metrics.moodChange) < 0.5) {
      add("mood_stable", 0.6);
    }
  }

  if (
    typeof metrics.objectiveCompletionRate === "number"
  ) {
    if (metrics.objectiveCompletionRate >= 0.75) {
      add("objectives_strong", 0.8);
    } else if (
      metrics.objectiveCompletionRate < 0.4
    ) {
      add("objectives_weak", 0.7);
    }
  }

  if (
    typeof metrics.impulseAverageReduction === "number"
  ) {
    if (metrics.impulseAverageReduction >= 2) {
      add("impulse_effective", 0.9);
    } else if (
      metrics.impulseAverageReduction > 0
    ) {
      add("impulse_some_effect", 0.6);
    }
  }

  if (
    typeof metrics.currentStreak === "number"
  ) {
    if (metrics.currentStreak >= 7) {
      add("long_streak", 1);
    } else if (metrics.currentStreak >= 4) {
      add("consistent_use", 0.8);
    }
  }

  if (
    typeof metrics.daysSinceLastRecord === "number" &&
    metrics.daysSinceLastRecord >= 5
  ) {
    add("recent_return", 0.9);
  }

  if (metrics.daysTracked <= 2) {
    add("little_data", 0.8);
  }

  return {
    signals,
    weights,
  };
}
