import {useEffect,useRef,useState} from 'react';
import {getHomeCompanionBrainDecision,type HomeDecisionInput} from '../../data/reactive/companionBrain/homeDecision';
import type {CompanionBrainDecision} from '../../data/reactive/companionBrain/companionBrainTypes';
import {subscribeHabits,getHabitOwner} from '../../data/habits/store';
import {PERSONAL_EVENTS_UPDATED_EVENT} from '../../data/personal/personalEventStorage';
import {markCompanionDecisionShown} from '../../data/reactive/companionBrain/companionBrain';
import {localDay} from '../../data/habits/calendar';
// One shared, short-lived utterance across Home and the detail screen. No emotional text stored.
let active:{owner:string|null;decision:CompanionBrainDecision;shownAt:number}|null=null;
export function useCompanionVoice(input:HomeDecisionInput){
 const latest=useRef(input);latest.current=input;
 const [decision,setDecision]=useState<CompanionBrainDecision|null>(null);
 const [reactiveWriteAt,setReactiveWriteAt]=useState<number|undefined>(undefined);
 useEffect(()=>{
  let timer:ReturnType<typeof setTimeout>|undefined,midnight:ReturnType<typeof setTimeout>|undefined;
  let disposed=false;
  const evaluate=()=>{
   if(disposed||document.hidden)return;
   const now=Date.now(),owner=getHabitOwner();
   if(active&&(active.owner!==owner||now-active.shownAt>15*60_000))active=null;
   const value={...latest.current,reactiveWriteAt};
   if(value.selectedDate!==localDay()){setDecision(null);return;}
   const next=getHomeCompanionBrainDecision(value);
   setDecision(active?.decision??next);
   clearTimeout(midnight);const d=new Date();midnight=setTimeout(schedule,new Date(d.getFullYear(),d.getMonth(),d.getDate()+1).getTime()-Date.now()+50);
  };
  const schedule=()=>{clearTimeout(timer);timer=setTimeout(evaluate,80);};
  const stop=subscribeHabits(schedule);
  const events=[PERSONAL_EVENTS_UPDATED_EVENT,'confia-companion-interaction','confia:daily-checkin-saved','confia:habit-write','storage','focus'];
  const onHabitWrite=()=>{const at=Date.now();active=null;setDecision(null);setReactiveWriteAt(at);schedule();};
  window.addEventListener('confia:habit-write',onHabitWrite);
  events.filter(e=>e!=='confia:habit-write').forEach(e=>window.addEventListener(e,schedule));document.addEventListener('visibilitychange',schedule);
  schedule();
  return()=>{disposed=true;stop();clearTimeout(timer);clearTimeout(midnight);window.removeEventListener('confia:habit-write',onHabitWrite);events.filter(e=>e!=='confia:habit-write').forEach(e=>window.removeEventListener(e,schedule));document.removeEventListener('visibilitychange',schedule);};
 },[input.selectedDate,input.todayLogged,input.ratings,input.personalDiscovery,input.reactiveResult,reactiveWriteAt]);
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
