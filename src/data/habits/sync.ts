import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, getDocs, limit, orderBy, query, writeBatch, startAfter, where, type QueryDocumentSnapshot } from "firebase/firestore";
import { localDay, shiftDay } from "./calendar";
import { auth } from "../../firebaseAuth";
import { db } from "../../firebaseFirestore";
import type { HabitRecord } from "./types";
import { acknowledgeHabits, activateHabitOwner, getHabitOwner, getHabitSnapshot, mergeRemoteHabits, setHabitSyncStatus } from "./store";
let started=false;
let busy=false;
let again=false;
let refreshAgain=false;
let paused=false;
let cursor:QueryDocumentSnapshot|undefined;
let older=true;
const path=(uid:string)=>collection(db,"users",uid,"habitRecords");
export async function syncHabits(refresh=false) {
  const uid=auth.currentUser?.uid;
  if(paused || !uid || uid!==getHabitOwner()) return;
  if(!navigator.onLine){setHabitSyncStatus("pending");return;}
  if(busy){again=true;refreshAgain=refreshAgain||refresh;return;}
  busy=true;setHabitSyncStatus("pending");
  try {
    // Reconcile before writing: a later edit from another device wins.
    if(refresh) {
      const definitions=await getDocs(query(path(uid),where("kind","in",["habit","settings","summary","wellbeingPlan","planPreference"]),limit(200)));
      const recent:HabitRecord[]=[];
      let next:QueryDocumentSnapshot|undefined;
      // Only the last 30 local days are needed for daily/weekly summaries.
      // Page through that bounded time window; older history is opt-in.
      do {
        const constraints=[where("date",">=",shiftDay(localDay(),-29)),orderBy("date","desc"),limit(150)];
        const page=await getDocs(query(path(uid),...constraints,...(next?[startAfter(next)]:[])));
        if(uid!==getHabitOwner()) return;
        recent.push(...page.docs.map(d=>d.data() as HabitRecord));
        if(page.docs.length)next=page.docs.at(-1);
        if(page.size<150)break;
      } while(true);
      cursor=next;older=true;
      mergeRemoteHabits([...recent,...definitions.docs.map(d=>d.data() as HabitRecord)],uid);
    }
    const snapshot=getHabitSnapshot();
    const pending=snapshot.records.filter(r=>snapshot.pending[r.id]);
    // Bounded batches of independent writes; no per-second writes.
    for(let i=0;i<pending.length;i+=20) {
      if(uid!==getHabitOwner()) return;
      const chunk=pending.slice(i,i+20);
      const batch=writeBatch(db);
      chunk.forEach(r=>batch.set(doc(path(uid),r.id),{...r,userId:uid}));
      await batch.commit();
      acknowledgeHabits(chunk,uid);
    }
    if(uid===getHabitOwner()) setHabitSyncStatus(Object.keys(getHabitSnapshot().pending).length?"pending":"synced");
  } catch {
    if(uid===getHabitOwner()) setHabitSyncStatus("error");
  } finally { busy=false; if(again){const refreshNext=refreshAgain;again=false;refreshAgain=false;void syncHabits(refreshNext);} }
}
export async function loadOlderHabits():Promise<boolean> {
  const uid=auth.currentUser?.uid;
  if(!uid || uid!==getHabitOwner() || !older) return false;
  const result=await getDocs(query(path(uid),orderBy("date","desc"),...(cursor?[startAfter(cursor)]:[where("date","<",shiftDay(localDay(),-29))]),limit(100)));
  if(uid!==getHabitOwner()) return false;
  cursor=result.docs.at(-1)??cursor;older=result.size===100;
  mergeRemoteHabits(result.docs.map(d=>d.data() as HabitRecord),uid);
  return older;
}
export function hasOlderHabits(){return Boolean(auth.currentUser && older);}
export function startHabitSync() {
  if(started) return;
  started=true;
  activateHabitOwner(auth.currentUser?.uid??"guest");
  onAuthStateChanged(auth,user=>{
    cursor=undefined;older=true;
    activateHabitOwner(user?.uid??"guest");
    if(user) void syncHabits(true);
  });
  window.addEventListener("confia:habit-write",()=>void syncHabits());
  window.addEventListener("online",()=>void syncHabits(true));
  window.addEventListener("offline",()=>setHabitSyncStatus(getHabitOwner()==="guest"?"local":"pending"));
  document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible") void syncHabits(true);});
}

export async function pauseHabitSyncForDeletion() {
  paused=true;again=false;refreshAgain=false;
  for(let n=0;busy && n<100;n++)await new Promise(resolve=>setTimeout(resolve,100));
  if(busy){paused=false;throw new Error("habit-sync-pending");}
}
export function resumeHabitSyncAfterDeletionError(){paused=false;}
