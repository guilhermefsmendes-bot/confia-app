import type { PersonalEvent } from "./personalEvent";

const STORAGE_KEY = "confia_personal_events_v1";
const EVENT_PREFIX = "confia_personal_event_v2:";
const MAX_EVENTS = 5000;
export const PERSONAL_EVENTS_UPDATED_EVENT = "confia:personal-events-updated";

type EventStorage = Pick<Storage, "getItem" | "setItem" | "removeItem"> & Partial<Pick<Storage, "length" | "key">>;
let cachedStorage: EventStorage | null = null;
let cachedById = new Map<string, PersonalEvent>();
let cachedEvents: PersonalEvent[] = [];
let loaded = false;
let storageListener: ((event: StorageEvent) => void) | undefined;

function getStorage(): EventStorage | null {
  if (typeof window === "undefined") return null;
  try { return window.localStorage; } catch { return null; }
}
function itemKey(id: string) { return EVENT_PREFIX + encodeURIComponent(id); }
function trimOldestEvents() {
  while (cachedEvents.length > MAX_EVENTS) {
    const oldest = cachedEvents.shift();
    if (!oldest) continue;
    cachedById.delete(oldest.id);
    try { cachedStorage?.removeItem(itemKey(oldest.id)); } catch { /* best effort retention cap */ }
  }
}
function orderedEvents() {
  cachedEvents = [...cachedById.values()].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  trimOldestEvents();
  return cachedEvents;
}
function findSortedEventIndex(event: PersonalEvent): number {
  let low = 0, high = cachedEvents.length;
  while (low < high) {
    const middle = (low + high) >>> 1;
    if (cachedEvents[middle].timestamp < event.timestamp) low = middle + 1;
    else high = middle;
  }
  for (let index = low; index < cachedEvents.length && cachedEvents[index].timestamp === event.timestamp; index++) {
    if (cachedEvents[index].id === event.id) return index;
  }
  return -1;
}
function removeCachedEvent(event: PersonalEvent) {
  const index = findSortedEventIndex(event);
  if (index >= 0) cachedEvents.splice(index, 1);
  cachedById.delete(event.id);
}
function upsertCachedEvent(event: PersonalEvent) {
  const previous = cachedById.get(event.id);
  if (previous) removeCachedEvent(previous);
  cachedById.set(event.id, event);
  let low = 0, high = cachedEvents.length;
  while (low < high) {
    const middle = (low + high) >>> 1;
    if (cachedEvents[middle].timestamp <= event.timestamp) low = middle + 1;
    else high = middle;
  }
  cachedEvents.splice(low, 0, event);
  trimOldestEvents();
}

function parseEvent(raw: string | null): PersonalEvent | undefined {
  if (!raw) return undefined;
  try {
    const value = JSON.parse(raw);
    return value && typeof value.id === "string" && typeof value.timestamp === "string" ? value as PersonalEvent : undefined;
  } catch { return undefined; }
}
function loadStorage(storage: EventStorage) {
  cachedStorage = storage;
  cachedById = new Map();
  if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
    if (storageListener) window.removeEventListener("storage", storageListener);
    storageListener = (event: StorageEvent) => {
      if (event.key === null || event.key === STORAGE_KEY) {
        loadStorage(storage);
        return;
      }
      if (!event.key.startsWith(EVENT_PREFIX)) return;
      let id: string;
      try { id = decodeURIComponent(event.key.slice(EVENT_PREFIX.length)); } catch { return; }
      const next = parseEvent(event.newValue);
      if (next) upsertCachedEvent(next);
      else {
        const previous = cachedById.get(id);
        if (previous) removeCachedEvent(previous);
          }
    };
    window.addEventListener("storage", storageListener);
  }
  // Backwards-compatible migration from the former monolithic JSON array.
  // The legacy blob is the recovery copy: never remove it unless every entry
  // has a valid, readable v2 record with the same ID.
  let legacyRaw: string | null = null;
  try { legacyRaw = storage.getItem(STORAGE_KEY); } catch { /* storage may be temporarily unavailable */ }
  if (legacyRaw !== null) {
    try {
      const legacy: unknown = JSON.parse(legacyRaw);
      if (Array.isArray(legacy)) {
        let complete = true;
        for (const candidate of legacy) {
          if (!candidate || typeof candidate !== "object" || typeof candidate.id !== "string" || typeof candidate.timestamp !== "string") {
            complete = false;
            continue;
          }
          const event = candidate as PersonalEvent;
          const key = itemKey(event.id);
          let persisted: PersonalEvent | undefined;
          try { persisted = parseEvent(storage.getItem(key)); } catch { /* retry from legacy below */ }
          // Keep a valid, newer v2 event, but reject corrupt values and ID mismatches.
          if (!persisted || persisted.id !== event.id) {
            try {
              storage.setItem(key, JSON.stringify(event));
              const verified = parseEvent(storage.getItem(key));
              if (verified && verified.id === event.id) persisted = verified;
              else persisted = undefined;
            } catch { persisted = undefined; }
          }
          if (persisted && persisted.id === event.id) cachedById.set(event.id, persisted);
          else {
            complete = false;
            // Keep valid legacy data available in memory even if durable migration failed.
            cachedById.set(event.id, event);
          }
        }
        if (complete) {
          try { storage.removeItem(STORAGE_KEY); } catch { /* a later read retries cleanup */ }
        }
      }
      // Malformed JSON or a non-array legacy payload is deliberately preserved
      // for recovery/inspection; it is never silently deleted here.
    } catch { /* preserve legacy bytes and keep the app usable */ }
  }
  const length = storage.length ?? 0;
  if (typeof storage.key === "function") {
    for (let index = 0; index < length; index++) {
      const key = storage.key(index);
      if (!key?.startsWith(EVENT_PREFIX)) continue;
      const event = parseEvent(storage.getItem(key));
      if (event && !cachedById.has(event.id)) cachedById.set(event.id, event);
    }
  }
  loaded = true;
  orderedEvents();
}
function ensureLoaded(): EventStorage | null {
  const storage = getStorage();
  if (!storage) return null;
  if (!loaded || cachedStorage !== storage) loadStorage(storage);
  else {
    // Retry an incomplete migration on later reads (for example after quota clears).
    try { if (storage.getItem(STORAGE_KEY) !== null) loadStorage(storage); } catch { /* retain current in-memory view */ }
  }
  return storage;
}
function dispatchUpdated() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(PERSONAL_EVENTS_UPDATED_EVENT));
}

/** The first read hydrates the in-memory index; subsequent reads reuse it. */
export function readPersonalEvents(): PersonalEvent[] {
  if (!ensureLoaded()) return [];
  return cachedEvents;
}

/** Read only the requested event IDs; used by incremental projections. */
export function readPersonalEventsByIds(ids: Iterable<string>): Map<string, PersonalEvent> {
  const storage = ensureLoaded();
  const result = new Map<string, PersonalEvent>();
  if (!storage) return result;
  for (const id of ids) {
    const cached = cachedById.get(id);
    if (cached) result.set(id, cached);
    else {
      const event = parseEvent(storage.getItem(itemKey(id)));
      if (event) { upsertCachedEvent(event); result.set(id, event); }
    }
  }
  return result;
}

/** Upsert/delete only the supplied records; no history-wide JSON rewrite. */
export function reconcilePersonalEvents(upserts: PersonalEvent[], deleteIds: Iterable<string> = []): boolean {
  const storage = ensureLoaded();
  if (!storage) return false;
  let changed = false;
  try {
  for (const id of deleteIds) {
    if (!cachedById.has(id) && !storage.getItem(itemKey(id))) continue;
    storage.removeItem(itemKey(id));
    const previous = cachedById.get(id);
    if (previous) removeCachedEvent(previous);
    else cachedById.delete(id);
    changed = true;
  }
  for (const event of upserts) {
    const serialized = JSON.stringify(event);
    const previous = cachedById.get(event.id);
    if (previous && JSON.stringify(previous) === serialized) continue;
    storage.setItem(itemKey(event.id), serialized);
    upsertCachedEvent(event);
    changed = true;
  }
  if (changed) dispatchUpdated();
  return changed;
  } catch {
    // Some keys may already have been durably written before a quota/error.
    // Notify subscribers so they can re-read the best available persisted state.
    if (changed) dispatchUpdated();
    return false;
  }
}

/** Compatibility API for full replacement/reconciliation paths only. */
export function writePersonalEvents(events: PersonalEvent[]): void {
  const storage = ensureLoaded();
  if (!storage) return;
  try {
    const sorted = [...events].sort((a, b) => a.timestamp.localeCompare(b.timestamp)).slice(-MAX_EVENTS);
    const keep = new Set(sorted.map(event => itemKey(event.id)));
    const keys = new Set<string>([...cachedById.keys()].map(itemKey));
    for (let index = 0; index < (storage.length ?? 0); index++) {
      const key = storage.key?.(index);
      if (key?.startsWith(EVENT_PREFIX)) keys.add(key);
    }
    for (const key of keys) if (!keep.has(key)) storage.removeItem(key);
    const next = new Map<string, PersonalEvent>();
    for (const event of sorted) {
      storage.setItem(itemKey(event.id), JSON.stringify(event));
      next.set(event.id, event);
    }
    storage.removeItem(STORAGE_KEY);
    cachedById = next;
    cachedEvents = sorted;
  } catch {
    // Refresh the cache from whatever was durably written before the quota/error.
    loadStorage(storage);
  }
}

export function appendPersonalEvents(events: PersonalEvent[]): PersonalEvent[] {
  if (!events.length) return readPersonalEvents();
  const existing = readPersonalEvents();
  const ids = new Set(cachedById.keys());
  const additions: PersonalEvent[] = [];
  for (const event of events) {
    if (ids.has(event.id)) continue;
    ids.add(event.id);
    additions.push(event);
  }
  if (!additions.length) return existing;
  let changed = false;
  for (const event of additions) {
    try {
      getStorage()?.setItem(itemKey(event.id), JSON.stringify(event));
      upsertCachedEvent(event);
      changed = true;
    } catch { /* Quota errors must not break the user's current action. */ }
  }
  if (changed) dispatchUpdated();
  return cachedEvents;
}

export function clearPersonalEvents(): void {
  const storage = ensureLoaded();
  if (!storage) return;
  const keys = new Set<string>([...cachedById.keys()].map(itemKey));
  for (let index = 0; index < (storage.length ?? 0); index++) {
    const key = storage.key?.(index);
    if (key?.startsWith(EVENT_PREFIX)) keys.add(key);
  }
  for (const key of keys) storage.removeItem(key);
  storage.removeItem(STORAGE_KEY);
  cachedById.clear();
  cachedEvents = [];
  dispatchUpdated();
}

export function getPersonalEventStorageKey(): string { return STORAGE_KEY; }
