import { nutritionSignals } from "./nutrition";
import type { HabitRecord } from "./types";
import type { PersonalEvent } from "../personal/personalEvent";
import { makePersonalEvent } from "../personal/personalEvent";
import { readPersonalEvents, readPersonalEventsByIds, reconcilePersonalEvents, writePersonalEvents, PERSONAL_EVENTS_UPDATED_EVENT } from "../personal/personalEventStorage";

/** Build the event projection with one index pass over definitions and daily records. */
export function recordsToPersonalEvents(records: HabitRecord[], owner: string, onlyRecordIds?: ReadonlySet<string>): PersonalEvent[] {
  const definitions = new Map<string, Extract<HabitRecord, { kind: "habit" }>["data"]>();
  const byDate = new Map<string, HabitRecord[]>();
  for (const record of records) {
    if (record.kind === "habit") definitions.set(record.id, record.data);
    if (record.kind === "nutrition" || record.kind === "foodItem") {
      const rows = byDate.get(record.date) ?? [];
      rows.push(record);
      byDate.set(record.date, rows);
    }
  }

  const nutritionByDate = new Map<string, ReturnType<typeof nutritionSignals>>();
  const events: PersonalEvent[] = [];
  for (const record of records) {
    if (onlyRecordIds && !onlyRecordIds.has(record.id)) continue;
    if (record.kind !== "nutrition" && record.kind !== "exercise" && record.kind !== "habitLog" && record.kind !== "wellbeingPlan" && record.kind !== "planCheck") continue;
    const habit = record.kind === "habitLog" ? definitions.get(record.data.habitId) : undefined;
    let nutrition: ReturnType<typeof nutritionSignals> | undefined;
    if (record.kind === "nutrition") {
      nutrition = nutritionByDate.get(record.date);
      if (!nutrition) {
        nutrition = nutritionSignals(byDate.get(record.date) ?? [], record.date);
        nutritionByDate.set(record.date, nutrition);
      }
    }
    events.push(makePersonalEvent({
      id: "habit_event_" + owner + "_" + record.id,
      type: record.kind === "habitLog" ? "habit_challenge" : record.kind === "wellbeingPlan" || record.kind === "planCheck" ? "experiment" : record.kind,
      source: "habits", timestamp: record.updatedAt, localDate: record.date,
      value: record.kind === "exercise" ? record.data.minutes : record.kind === "habitLog" ? record.data.completed : record.kind === "planCheck" ? record.data.outcome === "done" : null,
      metadata: {
        ...record.data,
        ...(record.kind === "wellbeingPlan" ? { experimentId: record.id, phase: record.data.status === "completed" ? "complete" : "start", targetMetric: record.data.templateId } : record.kind === "planCheck" ? { experimentId: record.data.planId, phase: "measure", completion: record.data.outcome } : {}),
        ...(nutrition ? nutrition : {}), owner, timezone: record.timezone,
        ...(habit ? { habitType: habit.type, habitName: habit.name } : {})
      }
    }) as PersonalEvent);
  }
  return events;
}

type ProjectionSnapshot = {
  records: Map<string, { record: HabitRecord; fingerprint: string }>;
  events: Map<string, PersonalEvent>;
  foodByDate: Map<string, Map<string, HabitRecord>>;
  nutritionByDate: Map<string, Set<string>>;
  habitLogsByHabit: Map<string, Set<string>>;
  definitions: Map<string, Extract<HabitRecord, { kind: "habit" }>["data"]>;
};
const projectionSnapshots = new Map<string, ProjectionSnapshot>();

function snapshotRecords(records: HabitRecord[]): Map<string, { record: HabitRecord; fingerprint: string }> {
  return new Map(records.map(record => [record.id, { record, fingerprint: JSON.stringify(record) }]));
}

function addToIndex(index: Map<string, Set<string>>, key: string, id: string) {
  const values = index.get(key) ?? new Set<string>();
  values.add(id);
  index.set(key, values);
}
function removeFromIndex(index: Map<string, Set<string>>, key: string, id: string) {
  const values = index.get(key);
  if (!values) return;
  values.delete(id);
  if (!values.size) index.delete(key);
}
function addRecordIndexes(snapshot: ProjectionSnapshot, record: HabitRecord) {
  if (record.kind === "habit") snapshot.definitions.set(record.id, record.data);
  if (record.kind === "foodItem" || record.kind === "nutrition") {
    const byId = snapshot.foodByDate.get(record.date) ?? new Map<string, HabitRecord>();
    byId.set(record.id, record);
    snapshot.foodByDate.set(record.date, byId);
  }
  if (record.kind === "nutrition") addToIndex(snapshot.nutritionByDate, record.date, record.id);
  if (record.kind === "habitLog") addToIndex(snapshot.habitLogsByHabit, record.data.habitId, record.id);
}
function removeRecordIndexes(snapshot: ProjectionSnapshot, record: HabitRecord) {
  if (record.kind === "habit") snapshot.definitions.delete(record.id);
  if (record.kind === "foodItem" || record.kind === "nutrition") {
    const byId = snapshot.foodByDate.get(record.date);
    byId?.delete(record.id);
    if (!byId?.size) snapshot.foodByDate.delete(record.date);
  }
  if (record.kind === "nutrition") removeFromIndex(snapshot.nutritionByDate, record.date, record.id);
  if (record.kind === "habitLog") removeFromIndex(snapshot.habitLogsByHabit, record.data.habitId, record.id);
}
function createProjectionSnapshot(records: HabitRecord[], events = new Map<string, PersonalEvent>()): ProjectionSnapshot {
  const snapshot: ProjectionSnapshot = {
    records: snapshotRecords(records), events,
    foodByDate: new Map(), nutritionByDate: new Map(), habitLogsByHabit: new Map(), definitions: new Map(),
  };
  for (const record of records) addRecordIndexes(snapshot, record);
  return snapshot;
}
function dependentIds(snapshot: ProjectionSnapshot, record: HabitRecord | undefined, into: Set<string>) {
  if (!record) return;
  if (record.kind === "foodItem" || record.kind === "nutrition") {
    snapshot.nutritionByDate.get(record.date)?.forEach(id => into.add(id));
  }
  if (record.kind === "habit") snapshot.habitLogsByHabit.get(record.id)?.forEach(id => into.add(id));
}
function projectChangedRecords(snapshot: ProjectionSnapshot, owner: string, ids: Set<string>): PersonalEvent[] {
  const selected = [...ids].map(id => snapshot.records.get(id)?.record).filter((r): r is HabitRecord => !!r);
  const definitions = snapshot.definitions;
  const events: PersonalEvent[] = [];
  const nutritionByDate = new Map<string, ReturnType<typeof nutritionSignals>>();
  for (const record of selected) {
    if (record.kind !== "nutrition" && record.kind !== "exercise" && record.kind !== "habitLog" && record.kind !== "wellbeingPlan" && record.kind !== "planCheck") continue;
    const habit = record.kind === "habitLog" ? definitions.get(record.data.habitId) : undefined;
    let nutrition: ReturnType<typeof nutritionSignals> | undefined;
    if (record.kind === "nutrition") {
      nutrition = nutritionByDate.get(record.date);
      if (!nutrition) {
        nutrition = nutritionSignals([...(snapshot.foodByDate.get(record.date)?.values() ?? [])], record.date);
        nutritionByDate.set(record.date, nutrition);
      }
    }
    events.push(makePersonalEvent({
      id: "habit_event_" + owner + "_" + record.id,
      type: record.kind === "habitLog" ? "habit_challenge" : record.kind === "wellbeingPlan" || record.kind === "planCheck" ? "experiment" : record.kind,
      source: "habits", timestamp: record.updatedAt, localDate: record.date,
      value: record.kind === "exercise" ? record.data.minutes : record.kind === "habitLog" ? record.data.completed : record.kind === "planCheck" ? record.data.outcome === "done" : null,
      metadata: {
        ...record.data,
        ...(record.kind === "wellbeingPlan" ? { experimentId: record.id, phase: record.data.status === "completed" ? "complete" : "start", targetMetric: record.data.templateId } : record.kind === "planCheck" ? { experimentId: record.data.planId, phase: "measure", completion: record.data.outcome } : {}),
        ...(nutrition ? nutrition : {}), owner, timezone: record.timezone,
        ...(habit ? { habitType: habit.type, habitName: habit.name } : {})
      }
    }) as PersonalEvent);
  }
  return events;
}

/**
 * Reconcile only changed source records and their dependencies. The first call
 * builds the initial projection; later calls update affected event IDs only.
 * Record fingerprints are compared individually, never by serializing the
 * complete event history. Nutrition depends on all food items for its date and
 * habit logs depend on their habit definition, so those dependent IDs are added.
 */
export function publishHabitEvents(records: HabitRecord[], owner: string, changeSet?: { changedIds: ReadonlySet<string>; deletedIds?: ReadonlySet<string>; recordsById?: ReadonlyMap<string, HabitRecord> }) {
  const previousSnapshot = projectionSnapshots.get(owner);
  let previous: PersonalEvent[] = [];
  let fullReconcile = !previousSnapshot;
  let snapshot: ProjectionSnapshot;
  const affectedIds = new Set<string>();
  const deletedIds = new Set<string>();

  if (!previousSnapshot || !changeSet) {
    previous = readPersonalEvents();
    // Initial hydration and compatibility callers reconcile once. Normal store
    // writes supply the exact changed IDs and never fingerprint the full history.
    snapshot = createProjectionSnapshot(records, previousSnapshot ? new Map(previousSnapshot.events) : new Map());
    if (!previousSnapshot) records.forEach(record => affectedIds.add(record.id));
    else {
      const nextIds = new Set(records.map(record => record.id));
      for (const [id, old] of previousSnapshot.records) if (!nextIds.has(id)) { deletedIds.add(id); dependentIds(previousSnapshot, old.record, affectedIds); }
      for (const record of records) {
        const old = previousSnapshot.records.get(record.id);
        if (!old || old.fingerprint !== JSON.stringify(record)) {
          affectedIds.add(record.id);
          dependentIds(previousSnapshot, old?.record, affectedIds);
        }
      }
      for (const record of records) dependentIds(snapshot, record, affectedIds);
    }
  } else {
    // The projection cache is private to this module; mutate only affected indexes in place.
    snapshot = previousSnapshot;
    const removed = changeSet.deletedIds ?? new Set<string>();
    for (const id of changeSet.changedIds) {
      const old = snapshot.records.get(id)?.record;
      dependentIds(snapshot, old, affectedIds);
      if (old) removeRecordIndexes(snapshot, old);
      const current = changeSet.recordsById?.get(id);
      if (current) {
        snapshot.records.set(id, { record: current, fingerprint: JSON.stringify(current) });
        addRecordIndexes(snapshot, current);
        dependentIds(snapshot, current, affectedIds);
      } else {
        snapshot.records.delete(id);
        if (old) deletedIds.add(id);
      }
      affectedIds.add(id);
    }
    for (const id of removed) {
      const old = snapshot.records.get(id)?.record;
      if (!old) continue;
      dependentIds(snapshot, old, affectedIds);
      removeRecordIndexes(snapshot, old);
      snapshot.records.delete(id);
      deletedIds.add(id);
      affectedIds.add(id);
    }
  }

  if (previousSnapshot && affectedIds.size === 0 && deletedIds.size === 0) {
    const expected = previousSnapshot.events;
    const storedOwnerEvents = readPersonalEventsByIds(expected.keys());
    const projectionMissing = storedOwnerEvents.size !== expected.size || [...expected].some(([id, event]) => {
      const stored = storedOwnerEvents.get(id);
      return !stored || JSON.stringify(stored) !== JSON.stringify(event);
    });
    if (!projectionMissing) return false;
    fullReconcile = true;
    previous = readPersonalEvents();
    for (const id of snapshot.records.keys()) affectedIds.add(id);
  }

  const ownerEventPrefix = `habit_event_${owner}_`;
  const affectedEventIds = new Set<string>([...([...affectedIds, ...deletedIds].map(id => `${ownerEventPrefix}${id}`))]);
  if (fullReconcile) {
    for (const event of previous) if (event.source === "habits" && event.id.startsWith(ownerEventPrefix)) affectedEventIds.add(event.id);
  }
  const storedAffected = fullReconcile ? new Map(previous.filter(event => affectedEventIds.has(event.id)).map(event => [event.id, event])) : readPersonalEventsByIds(affectedEventIds);
  const previousAffected = [...storedAffected.values()];
  const previousById = new Map(previousAffected.map(event => [event.id, event]));
  const projected = fullReconcile
    ? recordsToPersonalEvents(records, owner)
    : projectChangedRecords(snapshot, owner, affectedIds);
  const changed = previousAffected.length !== projected.length || projected.some(event => {
    const old = previousById.get(event.id);
    return !old || JSON.stringify(old) !== JSON.stringify(event);
  });

  if (fullReconcile) {
    snapshot.events = new Map(projected.map(event => [event.id, event]));
  } else {
    for (const id of affectedEventIds) snapshot.events.delete(id);
    for (const event of projected) snapshot.events.set(event.id, event);
  }
  projectionSnapshots.set(owner, snapshot);
  if (!changed) return false;

  if (fullReconcile) {
    const next = [...previous.filter(event => !affectedEventIds.has(event.id)), ...projected];
    const deduplicated = new Map<string, PersonalEvent>();
    for (const event of next) deduplicated.set(event.id, event);
    writePersonalEvents([...deduplicated.values()]);
  } else {
    reconcilePersonalEvents(projected, affectedEventIds);
  }
  if (typeof window !== "undefined") window.dispatchEvent(new Event(PERSONAL_EVENTS_UPDATED_EVENT));
  return true;
}
