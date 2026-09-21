export type FutureMessage = {
  id: string;
  text: string;
  createdAt: string;
  revealAt: string;
  revealedAt?: string;
};

export type ManualNoteKind =
  | "early_signal"
  | "helps"
  | "does_not_help"
  | "support_person"
  | "drains_me"
  | "victory";

export type ManualNote = {
  id: string;
  kind: ManualNoteKind;
  text: string;
  createdAt: string;
};

const FUTURE_KEY = "confia_future_messages_v1";
const MANUAL_KEY = "confia_manual_notes_v1";
const UPDATE_EVENT = "confia:self-memory-updated";

function readArray<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function writeArray<T>(key: string, value: T[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new Event(UPDATE_EVENT));
}

export function readFutureMessages() {
  return readArray<FutureMessage>(FUTURE_KEY);
}

export function saveFutureMessage(text: string, months = 6): FutureMessage {
  const created = new Date();
  const reveal = new Date(created);
  reveal.setMonth(reveal.getMonth() + months);
  const item: FutureMessage = {
    id: `future_${Date.now().toString(36)}`,
    text: text.trim().slice(0, 1200),
    createdAt: created.toISOString(),
    revealAt: reveal.toISOString(),
  };
  writeArray(FUTURE_KEY, [item, ...readFutureMessages()].slice(0, 40));
  return item;
}

export function revealFutureMessage(id: string) {
  const now = new Date().toISOString();
  writeArray(
    FUTURE_KEY,
    readFutureMessages().map(item =>
      item.id === id ? { ...item, revealedAt: item.revealedAt || now } : item,
    ),
  );
}

export function readManualNotes() {
  return readArray<ManualNote>(MANUAL_KEY);
}

export function addManualNote(kind: ManualNoteKind, text: string): ManualNote {
  const item: ManualNote = {
    id: `manual_${Date.now().toString(36)}`,
    kind,
    text: text.trim().slice(0, 500),
    createdAt: new Date().toISOString(),
  };
  writeArray(MANUAL_KEY, [item, ...readManualNotes()].slice(0, 120));
  return item;
}

export function removeManualNote(id: string) {
  writeArray(MANUAL_KEY, readManualNotes().filter(item => item.id !== id));
}

export const SELF_MEMORY_UPDATED_EVENT = UPDATE_EVENT;
