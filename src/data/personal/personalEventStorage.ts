import type { PersonalEvent } from "./personalEvent";

const STORAGE_KEY = "confia_personal_events_v1";
const MAX_EVENTS = 5000;

function available(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function parse(raw: string | null): PersonalEvent[] {
  if (!raw) return [];
  try {
    const value = JSON.parse(raw);
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export function readPersonalEvents(): PersonalEvent[] {
  if (!available()) return [];
  return parse(window.localStorage.getItem(STORAGE_KEY));
}

export function writePersonalEvents(events: PersonalEvent[]): void {
  if (!available()) return;
  try {
    const sorted = [...events].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted.slice(-MAX_EVENTS)));
  } catch {
    // Histórico pessoal nunca deve impedir o uso da aplicação.
  }
}

export function appendPersonalEvents(events: PersonalEvent[]): PersonalEvent[] {
  if (!events.length) return readPersonalEvents();
  const existing = readPersonalEvents();
  const ids = new Set(existing.map(event => event.id));
  const next = [...existing, ...events.filter(event => !ids.has(event.id))];
  writePersonalEvents(next);
  return next;
}

export function clearPersonalEvents(): void {
  if (!available()) return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export function getPersonalEventStorageKey(): string {
  return STORAGE_KEY;
}
