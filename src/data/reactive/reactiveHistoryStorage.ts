import type {
  ReactiveIntent,
} from "./reactiveIntent";

import type {
  ReactiveSituation,
} from "./reactiveTypes";

const STORAGE_KEY =
  "confia_reactive_response_history_v1";

const MAX_HISTORY_ENTRIES = 200;

export interface ReactiveHistoryEntry {
  responseId: string;
  situation: ReactiveSituation;
  intent: ReactiveIntent;
  timestamp: string;
}

function isBrowserStorageAvailable(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.localStorage !== "undefined"
  );
}

export function loadReactiveHistory(): ReactiveHistoryEntry[] {
  if (!isBrowserStorageAvailable()) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (item): item is ReactiveHistoryEntry =>
        Boolean(item) &&
        typeof item.responseId === "string" &&
        typeof item.situation === "string" &&
        typeof item.intent === "string" &&
        typeof item.timestamp === "string"
    );
  } catch {
    return [];
  }
}

function saveReactiveHistory(
  history: ReactiveHistoryEntry[]
): void {
  if (!isBrowserStorageAvailable()) {
    return;
  }

  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(
        history.slice(-MAX_HISTORY_ENTRIES)
      )
    );
  } catch {
    // O motor reativo nunca deve falhar por causa
    // de um problema de armazenamento local.
  }
}

export function recordReactiveResponse(
  entry: ReactiveHistoryEntry
): void {
  const history = loadReactiveHistory();

  history.push(entry);

  saveReactiveHistory(history);
}

export function getLastResponseUse(
  responseId: string
): ReactiveHistoryEntry | undefined {
  const history = loadReactiveHistory();

  for (let i = history.length - 1; i >= 0; i -= 1) {
    if (history[i].responseId === responseId) {
      return history[i];
    }
  }

  return undefined;
}

export function getResponseUseCount(
  responseId: string
): number {
  return loadReactiveHistory().filter(
    (item) => item.responseId === responseId
  ).length;
}

export function getRecentReactiveHistory(
  limit = 20
): ReactiveHistoryEntry[] {
  if (limit <= 0) {
    return [];
  }

  return loadReactiveHistory().slice(-limit);
}

export function clearReactiveHistory(): void {
  if (!isBrowserStorageAvailable()) {
    return;
  }

  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignorar falhas de armazenamento.
  }
}
