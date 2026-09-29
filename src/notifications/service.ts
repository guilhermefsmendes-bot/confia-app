import { beforeAuthStateChanged,onAuthStateChanged } from 'firebase/auth';
import { deleteDoc,doc,getDoc,setDoc,serverTimestamp } from 'firebase/firestore';
import { auth } from '../firebaseAuth';
import { db } from '../firebaseFirestore';
import i18n from '../i18n';
import { getDailyCheckIn } from '../storage/dailyCheckInStorage';
import { subscribeHabits,getHabitSnapshot,getHabitOwner } from '../data/habits/store';
import { habitStats } from '../data/habits/statistics';
import { localDay } from '../data/habits/calendar';
import { HABIT_ICONS } from '../data/habits/types';
import { ConfiaDevice,isNativeAndroid } from './native';
import { DEFAULT_NOTICES,validTime,noticeTarget,type NoticePreferences,type NoticeTarget } from './model';
let owner='guest',deviceId='',started=false,revision=0,syncError=false;
let preferences:NoticePreferences={...DEFAULT_NOTICES};
const listeners=new Set<()=>void>();const prefix='confia_notices_v1:';
export const subscribeNotices=(fn:()=>void)=>{listeners.add(fn);return()=>{listeners.delete(fn);};};
export const noticeRevision=()=>revision;
export const getNoticeState=()=>({preferences,syncError,native:isNativeAndroid()});
const notify=()=>{revision++;listeners.forEach(fn=>fn());};
const prefRef=(uid:string)=>doc(db,'users',uid,'preferences','notifications');
const deviceRef=(uid:string)=>doc(db,'users',uid,'devices',deviceId);
const language=()=>['pt','en','es','fr'].find(l=>i18n.language?.startsWith(l))??'pt';
function read(uid:string):NoticePreferences {try {const p=JSON.parse(localStorage.getItem(prefix+uid)??'{}');return {community:p.community===true,reminder:p.reminder===true,time:validTime(p.time)?p.time:'20:30',milestones:p.milestones===true};}catch{return {...DEFAULT_NOTICES};}}
function persist(){localStorage.setItem(prefix+owner,JSON.stringify(preferences));notify();}
async function configure(){if(!isNativeAndroid())return;const daily=getDailyCheckIn();await ConfiaDevice.configure({owner:owner==='guest'?'':owner,...preferences,language:language(),completedDate:daily?.completed?daily.date:''});}
let syncing=false,resync=false;
export async function syncNoticePreferences() {
 if(!isNativeAndroid()||owner==='guest'||!deviceId||auth.currentUser?.uid!==owner)return;
 if(syncing){resync=true;return;}
 syncing=true;const uid=owner;
 try {
  const pendingKey=prefix+uid+':pending';
  if(localStorage.getItem(pendingKey)==='1') {
   const sent={community:preferences.community,milestones:preferences.milestones};
   await setDoc(prefRef(uid),{...sent,updatedAt:serverTimestamp()});
   if(uid!==owner)return;
   if(sent.community===preferences.community&&sent.milestones===preferences.milestones)localStorage.removeItem(pendingKey);
  }else {
   const remote=await getDoc(prefRef(uid));if(uid!==owner)return;
   if(remote.exists()){preferences={...preferences,community:remote.data().community===true,milestones:remote.data().milestones===true};persist();await configure();}
  }
  if(uid!==owner)return;
  if(preferences.community){const {token}=await ConfiaDevice.token();if(uid!==owner||!preferences.community)return;
   await setDoc(deviceRef(uid),{fcmToken:token,platform:'android',notificationsEnabled:true,language:language(),updatedAt:serverTimestamp()});
  }else await deleteDoc(deviceRef(uid));
  if(uid===owner){syncError=false;notify();}
 }catch{if(uid===owner){syncError=true;notify();}}
 finally{syncing=false;if(resync){resync=false;void syncNoticePreferences();}}
}
export async function updateNoticePreferences(patch:Partial<NoticePreferences>) {
 if(!isNativeAndroid())throw Error('native-only');
 const next={...preferences,...patch};if(!validTime(next.time))throw Error('time');
 preferences=next;persist();if(patch.community!==undefined||patch.milestones!==undefined)localStorage.setItem(prefix+owner+':pending','1');await configure();void syncNoticePreferences();
}
export async function allowNotices(kind:'community'|'reminder') {
 const {granted}=await ConfiaDevice.requestNoticePermission();
 if(!granted)return false;
 await updateNoticePreferences({[kind]:true});return true;
}
export async function clearNativeNotices() {
 if(!isNativeAndroid())return;
 await ConfiaDevice.configure({owner:'',community:false,reminder:false,time:'20:30',language:language(),completedDate:''});
 await ConfiaDevice.widget({snapshot:{}});
 if(owner!=='guest'&&deviceId&&auth.currentUser?.uid===owner){try{await Promise.race([deleteDoc(deviceRef(owner)),new Promise<void>(resolve=>setTimeout(resolve,1500))]);}catch{/* Native owner check also rejects stale delivery after logout. */}}
}
function currentAvatarLevel(){
 try{
  const raw=JSON.parse(localStorage.getItem('confia_avatar_v2')??'{}');
  return Number.isFinite(raw.level)?Math.max(1,Math.min(10,Number(raw.level))):1;
 }catch{return 1;}
}
function objectiveIcon(id:string,category:string){
 const key=id.toLowerCase();
 if(/water|drink/.test(key))return '💧';
 if(/meal|food|snack|hunger|nutrition/.test(key))return '🍎';
 if(/walk|stand|stairs|stretch|body|move|dance|outdoor|shoulder|face|hands/.test(key))return '🚶';
 if(/breath|breathe/.test(key))return '🌬️';
 if(/phone|screen|notification/.test(key))return '📵';
 if(/message|family|social|someone|compliment|listen/.test(key))return '🤝';
 if(/gratitude|good|victory|progress|kind/.test(key))return '🌱';
 if(/organize|declutter|tidy|prepare/.test(key))return '🧹';
 return category==='nutricao'?'🍎':category==='corporeo'?'🚶':category==='social'?'🤝':category==='mental'?'🧠':'✨';
}
function currentObjectives(){
 try{
  const raw=JSON.parse(localStorage.getItem('confia_objectives_v2')??'{}');
  if(raw?.date!==localDay()||!Array.isArray(raw.items))return [];
  return raw.items.slice(0,5).map((item:any)=>({
   id:String(item.id??''),
   icon:objectiveIcon(String(item.id??''),String(item.category??'')),
   completed:item.completed===true
  }));
 }catch{return [];}
}
async function updateWidget() {
 if(!isNativeAndroid())return;
 if(getHabitOwner()!==owner&&!(owner==='guest'&&getHabitOwner()==='guest'))return;
 const records=getHabitSnapshot().records,settings=records.find(r=>r.kind==='settings');
 const habits=records.filter(r=>r.kind==='habit'&&r.data.active);
 const habit=habits.find(r=>r.id===(settings?.kind==='settings'?settings.data.primaryId:''))??habits[0];
 const objectives=currentObjectives();
 if(habit?.kind!=='habit'){await ConfiaDevice.widget({snapshot:{language:language(),level:currentAvatarLevel(),objectives}});return;}
 const stats=habitStats(records,habit.id);
 await ConfiaDevice.widget({snapshot:{name:habit.data.type==='custom'?habit.data.name:i18n.t('habitHub.habits.'+habit.data.type),icon:HABIT_ICONS[habit.data.type],days:stats.current,runEnd:stats.runEnd,best:stats.best,updatedDay:localDay(),language:language(),level:currentAvatarLevel(),objectives}});
}
let pending:NoticeTarget|null=null;let navigation:((target:NoticeTarget)=>void)|null=null;
export function connectNoticeNavigation(fn:(target:NoticeTarget)=>void){navigation=fn;if(pending){fn(pending);pending=null;}return()=>{if(navigation===fn)navigation=null;};}
function acceptLink(url?:string){if(!url)return;if(url==="confia://stop"){window.location.hash="#stop";return;}const target=noticeTarget(url);if(!target)return;if(navigation)navigation(target);else pending=target;}
export async function startNativeNotices() {
 if(started||!isNativeAndroid())return;started=true;
 try {
  deviceId=(await ConfiaDevice.info()).deviceId;
  await ConfiaDevice.addListener('openLink',event=>acceptLink(event.url));
  await ConfiaDevice.addListener('tokenChanged',()=>void syncNoticePreferences());
  acceptLink((await ConfiaDevice.consumeLink()).url);
  beforeAuthStateChanged(auth,async()=>{await clearNativeNotices();});
  onAuthStateChanged(auth,user=>{void (async()=>{
   owner=user?.uid??'guest';const uid=owner;preferences=read(uid);notify();await configure();await updateWidget();
   if(user)void syncNoticePreferences();
  })().catch(()=>{syncError=true;notify();});});
  subscribeHabits(()=>void updateWidget());
  const daily=()=>void configure();window.addEventListener('confia:daily-checkin-saved',daily);
  const avatarUpdated=()=>void updateWidget();window.addEventListener('confia:avatar-updated',avatarUpdated);
  const objectivesUpdated=()=>void updateWidget();window.addEventListener('confia:objectives-updated',objectivesUpdated);
  const resume=()=>{if(document.visibilityState==='visible'){void configure();void updateWidget();void syncNoticePreferences();}};
  document.addEventListener('visibilitychange',resume);window.addEventListener('online',resume);
  i18n.on('languageChanged',()=>{void configure();void updateWidget();void syncNoticePreferences();});
 }catch{syncError=true;notify();}
}
