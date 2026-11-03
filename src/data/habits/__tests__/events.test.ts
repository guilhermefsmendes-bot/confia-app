import { it } from "node:test";
import assert from "node:assert/strict";
import type { HabitRecord } from "../types";
import { publishHabitEvents, recordsToPersonalEvents } from "../events";
import { clearPersonalEvents, readPersonalEvents, writePersonalEvents } from "../../personal/personalEventStorage";

const base = { date: "2026-10-30", updatedAt: "2026-10-30T12:00:00.000Z", timezone: "UTC" };

it("projects habit logs using a definition index even when the definition follows the log", () => {
  const records: HabitRecord[] = [
    { ...base, id: "log-1", kind: "habitLog", data: { habitId: "habit-1", completed: true } },
    { ...base, id: "habit-1", kind: "habit", data: { type: "coffee", name: "Café", icon: "☕", goal: "Reduzir", active: true, createdAt: base.updatedAt } },
  ];
  const [event] = recordsToPersonalEvents(records, "owner-1");
  assert.equal(event.type, "habit_challenge");
  assert.equal(event.value, true);
  assert.equal(event.metadata?.habitName, "Café");
  assert.equal(event.metadata?.habitType, "coffee");
});

it("calculates nutrition signals once per date and keeps detailed food alongside legacy totals", () => {
  const records: HabitRecord[] = [
    { ...base, id: "nutrition-1", kind: "nutrition", data: { coffee: 2, water: 4 } },
    { ...base, id: "food-1", kind: "foodItem", data: { category: "coffee", subtype: "espresso", quantity: 2, unit: "item", deleted: false } },
    { ...base, id: "food-2", kind: "foodItem", data: { category: "fruit", subtype: "apple", quantity: 3, unit: "item", deleted: false } },
    { ...base, id: "nutrition-2", kind: "nutrition", data: { coffee: 2 } },
  ];
  const events = recordsToPersonalEvents(records, "owner-1");
  assert.equal(events.length, 2);
  assert.equal(events[0].metadata?.coffee, 2);
  assert.equal(events[0].metadata?.water, 4);
  assert.equal((events[0].metadata?.items as unknown[]).length, 2);
  assert.equal(events[1].metadata?.fruit, 3);
});

it("preserves exercise and experiment event values and metadata", () => {
  const records: HabitRecord[] = [
    { ...base, id: "exercise-1", kind: "exercise", data: { activity: "walk", minutes: 35, intensity: "moderate" } },
    { ...base, id: "plan-1", kind: "wellbeingPlan", data: { templateId: "sleep", status: "completed" } as never },
  ];
  const events = recordsToPersonalEvents(records, "owner-1");
  assert.equal(events[0].type, "exercise");
  assert.equal(events[0].value, 35);
  assert.equal(events[1].type, "experiment");
  assert.equal(events[1].metadata?.phase, "complete");
});


const persisted = new Map<string, string>();
let writes = 0;
const storage = {
  get length() { return persisted.size; },
  key: (index: number) => [...persisted.keys()][index] ?? null,
  getItem: (key: string) => persisted.get(key) ?? null,
  setItem: (key: string, value: string) => { writes++; persisted.set(key, value); },
  removeItem: (key: string) => persisted.delete(key),
};
Object.defineProperty(globalThis, "window", { configurable: true, value: Object.assign(new EventTarget(), { localStorage: storage }) });
Object.defineProperty(globalThis, "localStorage", { configurable: true, value: storage });

it("does not rewrite or announce an unchanged habit event projection", () => {
  const records: HabitRecord[] = [{ ...base, id: "exercise-stable", kind: "exercise", data: { activity: "walk", minutes: 20 } }];
  writePersonalEvents(recordsToPersonalEvents(records, "owner-stable"));
  writes = 0;
  assert.equal(publishHabitEvents(records, "owner-stable"), false);
  assert.equal(writes, 0);
  const updated = [{ ...records[0], updatedAt: "2026-10-30T13:00:00.000Z" }] as HabitRecord[];
  assert.equal(publishHabitEvents(updated, "owner-stable"), true);
  assert.equal(writes, 1);
  assert.equal(readPersonalEvents()[0].timestamp, "2026-10-30T13:00:00.000Z");
  assert.equal(publishHabitEvents([], "owner-stable"), true);
  assert.equal(readPersonalEvents().length, 0);
});


it("reprojects only the nutrition events affected by a changed food item and removes deleted source events", () => {
  const owner = "owner-incremental";
  const food: HabitRecord = { ...base, id: "food-incremental", kind: "foodItem", data: { category: "coffee", subtype: "espresso", quantity: 1, unit: "item", deleted: false } };
  const nutrition: HabitRecord = { ...base, id: "nutrition-incremental", kind: "nutrition", data: { coffee: 1 } };
  const exercise: HabitRecord = { ...base, id: "exercise-incremental", kind: "exercise", data: { activity: "walk", minutes: 10 } };
  const initial = [food, nutrition, exercise];
  writePersonalEvents(recordsToPersonalEvents(initial, owner));
  assert.equal(publishHabitEvents(initial, owner), false);

  const updatedFood = { ...food, data: { ...food.data, quantity: 3 } } as HabitRecord;
  assert.equal(publishHabitEvents([updatedFood, nutrition, exercise], owner), true);
  const afterUpdate = readPersonalEvents().filter(event => event.id.startsWith(`habit_event_${owner}_`));
  assert.equal(afterUpdate.length, 2);
  const nutritionEvent = afterUpdate.find(event => event.id.endsWith("nutrition-incremental"));
  assert.equal((nutritionEvent?.metadata?.items as Array<{ quantity: number }>)[0]?.quantity, 3);
  assert.equal(afterUpdate.find(event => event.id.endsWith("exercise-incremental"))?.value, 10);

  assert.equal(publishHabitEvents([updatedFood, nutrition], owner), true);
  const afterDelete = readPersonalEvents().filter(event => event.id.startsWith(`habit_event_${owner}_`));
  assert.equal(afterDelete.length, 1);
  assert.equal(afterDelete[0].id, `habit_event_${owner}_nutrition-incremental`);
});


it("restores the current habit projection if another flow clears the shared personal history", () => {
  const owner = "owner-storage-reset";
  const record: HabitRecord = { ...base, id: "exercise-after-reset", kind: "exercise", data: { activity: "walk", minutes: 15 } };
  assert.equal(publishHabitEvents([record], owner), true);
  clearPersonalEvents();
  assert.equal(publishHabitEvents([record], owner), true);
  assert.equal(readPersonalEvents().some(event => event.id === `habit_event_${owner}_${record.id}`), true);
});


it("updates the cached projection from changed IDs without rebuilding unrelated records", () => {
  const owner = "owner-changeset";
  const food: HabitRecord = { ...base, id: "food-changeset", kind: "foodItem", data: { category: "coffee", subtype: "espresso", quantity: 1, unit: "item", deleted: false } };
  const nutrition: HabitRecord = { ...base, id: "nutrition-changeset", kind: "nutrition", data: { coffee: 1 } };
  const exercise: HabitRecord = { ...base, id: "exercise-unchanged", kind: "exercise", data: { activity: "walk", minutes: 25 } };
  const initial = [food, nutrition, exercise];
  assert.equal(publishHabitEvents(initial, owner), true);
  const updatedFood = { ...food, data: { ...food.data, quantity: 4 } } as HabitRecord;
  assert.equal(publishHabitEvents([updatedFood, nutrition, exercise], owner, { changedIds: new Set([food.id]), recordsById: new Map([[food.id, updatedFood]]) }), true);
  const current = readPersonalEvents().filter(event => event.id.startsWith(`habit_event_${owner}_`));
  assert.equal(current.length, 2);
  assert.equal((current.find(event => event.id.endsWith(nutrition.id))?.metadata?.items as Array<{ quantity: number }>)[0]?.quantity, 4);
  assert.equal(current.find(event => event.id.endsWith(exercise.id))?.value, 25);
  assert.equal(publishHabitEvents([updatedFood, nutrition], owner, { changedIds: new Set([exercise.id]), deletedIds: new Set([exercise.id]) }), true);
  assert.equal(readPersonalEvents().some(event => event.id.endsWith(exercise.id)), false);
});


it("persists a changed habit projection by individual event keys, not by rewriting the event history", () => {
  const owner = "owner-per-event-storage";
  const records: HabitRecord[] = [
    { ...base, id: "storage-food", kind: "foodItem", data: { category: "coffee", subtype: "espresso", quantity: 1, unit: "item", deleted: false } },
    { ...base, id: "storage-nutrition", kind: "nutrition", data: { coffee: 1 } },
    { ...base, id: "storage-exercise", kind: "exercise", data: { activity: "walk", minutes: 20 } },
  ];
  assert.equal(publishHabitEvents(records, owner), true);
  writes = 0;
  let removals = 0;
  const originalRemove = storage.removeItem;
  storage.removeItem = (key: string) => { removals += 1; return originalRemove(key); };
  const changedFood = { ...records[0], data: { ...records[0].data, quantity: 2 } } as HabitRecord;
  assert.equal(publishHabitEvents([changedFood, records[1], records[2]], owner, { changedIds: new Set([changedFood.id]), recordsById: new Map([[changedFood.id, changedFood]]) }), true);
  assert.equal(writes, 1, "only the changed event is written");
  assert.equal(removals, 1, "only the changed event is replaced");
  assert.equal(persisted.has("confia_personal_events_v1"), false, "the monolithic legacy blob is not rewritten");
  assert.equal(readPersonalEvents().filter(event => event.id.startsWith(`habit_event_${owner}_`)).length, 2);
});
