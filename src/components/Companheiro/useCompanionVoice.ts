import {useEffect,useRef,useState} from 'react';
import {getHomeCompanionBrainDecision,type HomeDecisionInput} from '../../data/reactive/companionBrain/homeDecision';
import type {CompanionBrainDecision} from '../../data/reactive/companionBrain/companionBrainTypes';
import {subscribeHabits,getHabitOwner} from '../../data/habits/store';
import {PERSONAL_EVENTS_UPDATED_EVENT} from '../../data/personal/personalEventStorage';
import {markCompanionDecisionShown} from '../../data/reactive/companionBrain/companionBrain';
import {localDay} from '../../data/habits/calendar';
import {readCompanionPersonalContextConsent} from '../../data/reactive/companionContextConsent';
// One shared, short-lived utterance across Home and the detail screen. No emotional text stored.
let active:{owner:string|null;decision:CompanionBrainDecision;shownAt:number}|null=null;
export function useCompanionVoice(input:HomeDecisionInput){
 const latest=useRef(input);
 latest.current=input;
 const [decision,setDecision]=useState<CompanionBrainDecision|null>(null);
 const [reactiveWriteAt,setReactiveWriteAt]=useState<number|undefined>(undefined);
 const reactiveWriteAtRef=useRef(reactiveWriteAt);
 reactiveWriteAtRef.current=reactiveWriteAt;
 const scheduleRef=useRef<()=>void>(()=>{});

 // Install store/event subscriptions once for the lifetime of the Home
 // companion. Input changes update refs and schedule a fresh decision without
 // tearing down and rebuilding every listener.
 useEffect(()=>{
  let timer:ReturnType<typeof setTimeout>|undefined;
  let idleId:number|undefined;
  let midnight:ReturnType<typeof setTimeout>|undefined;
  let disposed=false;
  const evaluate=()=>{
   if(disposed||document.hidden)return;
   const now=Date.now(),owner=getHabitOwner();
   if(active&&(active.owner!==owner||now-active.shownAt>15*60_000))active=null;
   const value={...latest.current,reactiveWriteAt:reactiveWriteAtRef.current};
   if(value.allowPersonalContext===false){active=null;setDecision(null);return;}
   if(value.selectedDate!==localDay()){setDecision(null);return;}
   const next=getHomeCompanionBrainDecision(value);
   setDecision(active?.decision??next);
   clearTimeout(midnight);
   const d=new Date();
   midnight=setTimeout(schedule,new Date(d.getFullYear(),d.getMonth(),d.getDate()+1).getTime()-Date.now()+50);
  };
  const schedule=()=>{
   if(timer!==undefined)clearTimeout(timer);
   if(idleId!==undefined){
    (window as any).cancelIdleCallback?.(idleId);
    window.clearTimeout(idleId);
    idleId=undefined;
   }
   // Brain evaluation reads and ranks several personal histories. Wait until
   // the Home has settled, then use an idle slot instead of competing with
   // the first scroll or a tab transition.
   timer=setTimeout(()=>{
    const requestIdle=(window as any).requestIdleCallback;
    if(typeof requestIdle==='function') idleId=requestIdle(evaluate,{timeout:2200});
    else idleId=window.setTimeout(evaluate,650);
   },420);
  };
  scheduleRef.current=schedule;
  const stop=subscribeHabits(schedule);
  const events=[PERSONAL_EVENTS_UPDATED_EVENT,'confia-companion-interaction','confia:daily-checkin-saved','confia:habit-write','storage','focus'];
  const onHabitWrite=()=>{
   const at=Date.now();
   active=null;
   setDecision(null);
   setReactiveWriteAt(at);
  };
  const onConsentChanged=()=>{
   if(!readCompanionPersonalContextConsent()){active=null;setDecision(null);}
   schedule();
  };
  window.addEventListener('confia:habit-write',onHabitWrite);
  window.addEventListener('confia:companion-context-consent-changed',onConsentChanged);
  events.filter(e=>e!=='confia:habit-write').forEach(e=>window.addEventListener(e,schedule));
  document.addEventListener('visibilitychange',schedule);
  schedule();
  return()=>{
   disposed=true;
   stop();
   if(timer!==undefined)clearTimeout(timer);
   if(idleId!==undefined){(window as any).cancelIdleCallback?.(idleId);window.clearTimeout(idleId);}
   if(midnight!==undefined)clearTimeout(midnight);
   scheduleRef.current=()=>{};
   window.removeEventListener('confia:habit-write',onHabitWrite);
   window.removeEventListener('confia:companion-context-consent-changed',onConsentChanged);
   events.filter(e=>e!=='confia:habit-write').forEach(e=>window.removeEventListener(e,schedule));
   document.removeEventListener('visibilitychange',schedule);
  };
 },[]);
 useEffect(()=>{
  scheduleRef.current();
 },[input.selectedDate,input.todayLogged,input.morningRating,input.afternoonRating,input.ratings,input.personalDiscovery,input.reactiveResult,input.allowPersonalContext,reactiveWriteAt]);
 useEffect(()=>{
  if(!decision)return;
  const expiry=setTimeout(()=>{if(active?.decision===decision)active=null;setDecision(null);},Math.max(0,Date.parse(decision.decidedAt)+15*60_000-Date.now()));
  return()=>clearTimeout(expiry);
 },[decision]);
 const shown=(d:CompanionBrainDecision)=>{
  if(active?.decision.candidate.id===d.candidate.id&&active.owner===getHabitOwner())return;
  markCompanionDecisionShown(d,'home_opened');active={owner:getHabitOwner(),decision:d,shownAt:Date.now()};
 };
 return {decision,shown};
}
