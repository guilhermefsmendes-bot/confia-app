import type { HabitRecord, HabitSnapshot, SyncStatus } from "./types";
import { localDay, timezone } from "./calendar";
import { publishHabitEvents } from "./events";
const PREFIX = "confia_habits_v1:";
let owner = "guest";
let state: HabitSnapshot = { version:1, records:[], pending:{} };
let status: SyncStatus = "local";
let error = false;
let initialized = false;
const listeners = new Set<()=>void>();
let revision = 0;
export const subscribeHabits = (fn:()=>void) => { listeners.add(fn); return ()=>{listeners.delete(fn);}; };
export const getHabitRevision = () => revision;
export const getHabitOwner = () => owner;
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
function persist(next:HabitSnapshot) {
  // Commit UI state only after durable local storage succeeds.
  localStorage.setItem(PREFIX+owner, JSON.stringify(next));
  state = next; error = false;
  publishHabitEvents(state.records, owner);
  notifyHabits();
}
export function activateHabitOwner(uid:string) {
  if (initialized && uid===owner) return;
  const previous = owner;
  const guest = previous==="guest" && initialized ? state : undefined;
  owner=uid; initialized=true;
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
    publishHabitEvents(state.records,owner);
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
  if(uid!==owner) return;
  persist({...state,records:mergeHabitRecords(state.records,records)});
}
export function acknowledgeHabits(sent:HabitRecord[],uid:string) {
  if(uid!==owner) return;
  const pending={...state.pending};
  sent.forEach(r=>{if(pending[r.id] && pending[r.id]<=r.updatedAt) delete pending[r.id];});
  persist({...state,pending});
}
export function saveHabitRecords(records:HabitRecord[]) {
  if(!initialized) activateHabitOwner("guest");
  if(error) throw new Error("storage-unavailable");
  const ids=new Set(records.map(r=>r.id));
  persist({version:1,records:state.records.filter(r=>!ids.has(r.id)).concat(records),pending:{...state.pending,...Object.fromEntries(records.map(r=>[r.id,r.updatedAt]))}});
  if(owner!=="guest") setHabitSyncStatus("pending");
  window.dispatchEvent(new Event("confia:habit-write"));
}
export function saveHabitRecord(record:HabitRecord) { saveHabitRecords([record]); }
export function makeRecord(fields:Pick<HabitRecord,"id"|"kind"|"data">, date=localDay()): HabitRecord {
  const latest = Math.max(0, ...state.records.map(r => Date.parse(r.updatedAt)).filter(Number.isFinite));
  return {...fields,date,updatedAt:new Date(Math.max(Date.now(), latest + 1)).toISOString(),timezone:timezone()} as HabitRecord;
}
export function newHabitId() { return typeof crypto.randomUUID==="function" ? crypto.randomUUID() : Date.now()+"_"+Math.random().toString(36).slice(2); }
