import { it } from "node:test";
import assert from "node:assert/strict";
import { clearPersonalEvents, readPersonalEvents, writePersonalEvents, reconcilePersonalEvents } from "../personalEventStorage";
import { makePersonalEvent, type MoodEvent, type PersonalEvent } from "../personalEvent";

const legacyKey = "confia_personal_events_v1";
const prefix = "confia_personal_event_v2:";
const values = new Map<string, string>();
let failSetKey: string | null = null;
let failRemoveKey: string | null = null;
const storage = {
  get length() { return values.size; },
  key: (index: number) => [...values.keys()][index] ?? null,
  getItem: (key: string) => values.get(key) ?? null,
  setItem: (key: string, value: string) => {
    if (key === failSetKey) throw new Error("QuotaExceededError");
    values.set(key, value);
  },
  removeItem: (key: string) => {
    if (key === failRemoveKey) throw new Error("Storage write failure");
    values.delete(key);
  },
};
function resetStorage() {
  failSetKey = null;
  failRemoveKey = null;
  clearPersonalEvents();
  values.clear();
}
Object.defineProperty(globalThis, "window", { configurable: true, value: Object.assign(new EventTarget(), { localStorage: storage }) });
Object.defineProperty(globalThis, "localStorage", { configurable: true, value: storage });

const event = (id: string, timestamp: string): PersonalEvent => makePersonalEvent<MoodEvent>({
  id, type: "mood", source: "daily_rating", timestamp, localDate: timestamp.slice(0, 10), value: 6, metadata: {},
});

it("migrates legacy data while preserving newer individual keys from a partial prior migration", () => {
  resetStorage();
  const old = [event("old-1", "2026-10-29T10:00:00.000Z"), event("old-2", "2026-10-30T10:00:00.000Z")];
  const newer: MoodEvent = { ...(old[0] as MoodEvent), timestamp: "2026-10-30T11:00:00.000Z", value: 9 };
  values.set(legacyKey, JSON.stringify(old));
  values.set(prefix + "old-1", JSON.stringify(newer));
  const loaded = readPersonalEvents();
  assert.deepEqual(loaded.map(row => row.id), ["old-2", "old-1"]);
  assert.equal(loaded.find(row => row.id === "old-1")?.value, 9);
  assert.equal(values.has(legacyKey), false);
  assert.ok(values.has(prefix + "old-1"));
  assert.ok(values.has(prefix + "old-2"));
});

it("updates and deletes individual event keys without touching unrelated history", () => {
  resetStorage();
  const first = event("keep-1", "2026-10-29T10:00:00.000Z");
  const second = event("change-1", "2026-10-29T11:00:00.000Z");
  const third = event("keep-2", "2026-10-29T12:00:00.000Z");
  writePersonalEvents([first, second, third]);
  const updated: MoodEvent = { ...(second as MoodEvent), value: 8 };
  assert.equal(reconcilePersonalEvents([updated], [second.id]), true);
  assert.equal(values.has(prefix + first.id), true);
  assert.equal(values.has(prefix + third.id), true);
  assert.equal(values.has(prefix + second.id), true);
  assert.equal(readPersonalEvents().find(row => row.id === second.id)?.value, 8);
});


it("repairs a corrupt individual key before retiring the legacy recovery copy", () => {
  resetStorage();
  const old = event("repair-me", "2026-10-29T10:00:00.000Z");
  values.set(legacyKey, JSON.stringify([old]));
  values.set(prefix + old.id, "{corrupt json");

  const loaded = readPersonalEvents();
  assert.equal(loaded.length, 1);
  assert.equal(loaded[0].id, old.id);
  assert.deepEqual(JSON.parse(values.get(prefix + old.id)!), old);
  assert.equal(values.has(legacyKey), false);
});

it("replaces an individual key whose payload belongs to a different event ID", () => {
  resetStorage();
  const old = event("expected-id", "2026-10-29T10:00:00.000Z");
  const unrelated = event("wrong-id", "2026-10-28T10:00:00.000Z");
  values.set(legacyKey, JSON.stringify([old]));
  values.set(prefix + old.id, JSON.stringify(unrelated));

  const loaded = readPersonalEvents();
  assert.deepEqual(loaded.map(row => row.id), [old.id]);
  assert.deepEqual(JSON.parse(values.get(prefix + old.id)!), old);
  assert.equal(values.has(legacyKey), false);
});

it("preserves legacy bytes when quota prevents migration, then recovers on a later read", () => {
  resetStorage();
  const old = event("quota-recovery", "2026-10-29T10:00:00.000Z");
  values.set(legacyKey, JSON.stringify([old]));
  failSetKey = prefix + old.id;

  assert.equal(readPersonalEvents().some(row => row.id === old.id), true);
  assert.equal(values.get(legacyKey), JSON.stringify([old]));
  assert.equal(values.has(prefix + old.id), false);

  failSetKey = null;
  assert.equal(readPersonalEvents().some(row => row.id === old.id), true);
  assert.deepEqual(JSON.parse(values.get(prefix + old.id)!), old);
  assert.equal(values.has(legacyKey), false);
});

it("keeps the legacy recovery copy if an individual key cannot be verified", () => {
  resetStorage();
  const old = event("readback-failure", "2026-10-29T10:00:00.000Z");
  values.set(legacyKey, JSON.stringify([old]));
  const originalGet = storage.getItem;
  let failReadback = false;
  storage.getItem = (key: string) => failReadback && key === prefix + old.id ? null : originalGet(key);
  failReadback = true;
  try {
    assert.equal(readPersonalEvents().some(row => row.id === old.id), true);
    assert.equal(values.has(legacyKey), true);
  } finally {
    failReadback = false;
    storage.getItem = originalGet;
  }
  assert.equal(readPersonalEvents().some(row => row.id === old.id), true);
  assert.equal(values.has(legacyKey), false);
});

it("never deletes malformed legacy JSON and leaves it available for recovery", () => {
  resetStorage();
  values.set(legacyKey, "{not-json");
  assert.deepEqual(readPersonalEvents(), []);
  assert.equal(values.get(legacyKey), "{not-json");
});

it("preserves the legacy copy if cleanup fails after successful migration", () => {
  resetStorage();
  const old = event("cleanup-retry", "2026-10-29T10:00:00.000Z");
  values.set(legacyKey, JSON.stringify([old]));
  failRemoveKey = legacyKey;
  assert.equal(readPersonalEvents().some(row => row.id === old.id), true);
  assert.equal(values.has(prefix + old.id), true);
  assert.equal(values.has(legacyKey), true);
  failRemoveKey = null;
  assert.equal(readPersonalEvents().some(row => row.id === old.id), true);
  assert.equal(values.has(legacyKey), false);
});
