import type { HabitRecord, HabitSnapshot, SyncStatus } from "./types";
import { getCurrentHabitOwner, setCurrentHabitOwner } from "./owner";
import { localDay, timezone } from "./calendar";
import { publishHabitEvents } from "./events";
const PREFIX = "confia_habits_v1:";
let state: HabitSnapshot = { version:1, records:[], pending:{} };
let status: SyncStatus = "local";
let error = false;
let initialized = false;
const listeners = new Set<()=>void>();
let revision = 0;
export const subscribeHabits = (fn:()=>void) => { listeners.add(fn); return ()=>{listeners.delete(fn);}; };
export const getHabitRevision = () => revision;
export const getHabitOwner = getCurrentHabitOwner;
export const getHabitSnapshot = () => state;
export const getHabitStatus = () => error ? "error" : status;
export function notifyHabits() { revision++; listeners.forEach(fn=>fn()); }
function read(uid:string): HabitSnapshot {
  const raw = localStorage.getItem(PREFIX+uid);
  if (!raw) return {version:1,records:[],pending:{}};
  const value = JSON.parse(raw);
  if (value.version !== 1 || !Array.isArray(value.records) || !value.pending) throw new Error("invalid-storage");
  return value;
}
function persist(next:HabitSnapshot, publishEvents = true, changedRecords?: HabitRecord[]) {
  // Commit UI state only after durable local storage succeeds.
  localStorage.setItem(PREFIX+getCurrentHabitOwner(), JSON.stringify(next));
  state = next; error = false;
  if (publishEvents) publishHabitEvents(state.records, getCurrentHabitOwner(), changedRecords ? { changedIds: new Set(changedRecords.map(record => record.id)), recordsById: new Map(changedRecords.map(record => [record.id, record])) } : undefined);
  notifyHabits();
}
export function activateHabitOwner(uid:string) {
  const previous = getCurrentHabitOwner();
  if (initialized && uid===previous) return;
  const guest = previous==="guest" && initialized ? state : undefined;
  setCurrentHabitOwner(uid); initialized=true;
  try {
    state=read(uid); error=false;
    if (uid!=="guest" && previous==="guest") {
      const unsynced = guest ?? read("guest");
      if (unsynced.records.length) {
        const next=mergeHabitRecords(state.records,unsynced.records);
        persist({version:1, records:next, pending:{...state.pending,...Object.fromEntries(unsynced.records.map(r=>[r.id,r.updatedAt]))}});
        localStorage.removeItem(PREFIX+"guest");
      }
    }
    publishHabitEvents(state.records,getCurrentHabitOwner());
  } catch { state={version:1,records:[],pending:{}}; error=true; }
  status=uid==="guest"?"local":"pending"; notifyHabits();
}
export function setHabitSyncStatus(next:SyncStatus) { if(status!==next){status=next;notifyHabits();} }
export function mergeHabitRecords(local:HabitRecord[], remote:HabitRecord[]): HabitRecord[] {
  const map=new Map(local.map(r=>[r.id,r]));
  for(const r of remote){ const old=map.get(r.id); if(!old || r.updatedAt>old.updatedAt) map.set(r.id,r); }
  return [...map.values()];
}
export function mergeRemoteHabits(records:HabitRecord[], uid:string) {
  if(uid!==getCurrentHabitOwner()) return;
  const currentById = new Map(state.records.map(record => [record.id, record]));
  const merged = mergeHabitRecords(state.records, records);
  const changedRecords = merged.filter(record => currentById.get(record.id) !== record);
  if (!changedRecords.length) return false;
  persist({...state,records:merged}, true, changedRecords);
  return true;
}
export function acknowledgeHabits(sent:HabitRecord[],uid:string) {
  if(uid!==getCurrentHabitOwner()) return;
  const pending={...state.pending};
  sent.forEach(r=>{if(pending[r.id] && pending[r.id]<=r.updatedAt) delete pending[r.id];});
  if (Object.keys(pending).length === Object.keys(state.pending).length) return;
  persist({...state,pending}, false);
}
export function saveHabitRecords(records:HabitRecord[]) {
  if(!initialized) activateHabitOwner("guest");
  if(error) throw new Error("storage-unavailable");
  const currentById = new Map(state.records.map(record => [record.id, record]));
  const changedRecords = records.filter(record => {
    const previous = currentById.get(record.id);
    return !previous || JSON.stringify(previous) !== JSON.stringify(record) || state.pending[record.id] !== record.updatedAt;
  });
  if (!changedRecords.length) return;
  const ids=new Set(records.map(r=>r.id));
  persist({version:1,records:state.records.filter(r=>!ids.has(r.id)).concat(records),pending:{...state.pending,...Object.fromEntries(records.map(r=>[r.id,r.updatedAt]))}}, true, changedRecords);
  if(getCurrentHabitOwner()!=="guest") setHabitSyncStatus("pending");
  window.dispatchEvent(new Event("confia:habit-write"));
}
export function saveHabitRecord(record:HabitRecord) { saveHabitRecords([record]); }
export function makeRecord(fields:Pick<HabitRecord,"id"|"kind"|"data">, date=localDay()): HabitRecord {
  const latest = Math.max(0, ...state.records.map(r => Date.parse(r.updatedAt)).filter(Number.isFinite));
  return {...fields,date,updatedAt:new Date(Math.max(Date.now(), latest + 1)).toISOString(),timezone:timezone()} as HabitRecord;
}
export function newHabitId() { return typeof crypto.randomUUID==="function" ? crypto.randomUUID() : Date.now()+"_"+Math.random().toString(36).slice(2); }
