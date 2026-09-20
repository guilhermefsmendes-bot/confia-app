import type {
  CompanionBehaviorSignal,
} from "./companionEventIntelligence";

const STORAGE_KEY =
  "confia_companion_behavior_shown_v3";

type BehaviorShownMemory = Partial<
  Record<CompanionBehaviorSignal, string>
>;

function readMemory(): BehaviorShownMemory {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw =
      window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw);

    return parsed &&
      typeof parsed === "object" &&
      !Array.isArray(parsed)
      ? parsed
      : {};
  } catch {
    return {};
  }
}

export function wasCompanionBehaviorShownRecently(
  signal: CompanionBehaviorSignal,
  cooldownMinutes: number,
  now = new Date()
): boolean {
  const timestamp =
    readMemory()[signal];

  if (!timestamp) {
    return false;
  }

  const shownAt =
    new Date(timestamp).getTime();

  if (!Number.isFinite(shownAt)) {
    return false;
  }

  return (
    now.getTime() - shownAt <
    cooldownMinutes * 60 * 1000
  );
}

export function markCompanionBehaviorShown(
  signal: CompanionBehaviorSignal,
  now = new Date()
): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const memory = readMemory();

    memory[signal] =
      now.toISOString();

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(memory)
    );
  } catch {
    // O Companion nunca pode bloquear a app.
  }
}
