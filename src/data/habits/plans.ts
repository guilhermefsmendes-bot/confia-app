import type { HabitRecord } from './types';
import { localDay,shiftDay } from './calendar';
import { nutritionSignals } from './nutrition';
import type { PersonalEvent } from '../personal/personalEvent';
import { buildPersonalSignalSnapshot } from '../personal/personalSignalEngine';
export const PLAN_IDS=['caffeine','hydration','plants','energy','movement','walk','regularity','timing','routine'] as const;
export type PlanId=typeof PLAN_IDS[number];
export interface PlanSample { mean:number; days:number; moodMean:number; moodDays:number; }
export interface WellbeingPlan { templateId:PlanId; status:'active'|'paused'|'completed'|'abandoned'; startDate:string; endDate:string; pausedAt:string; pausedDays:number; gentle:boolean; baseline:PlanSample; result?:PlanSample; }
export interface PlanCheck { planId:string; day:number; outcome:'done'|'notToday'; }
export type PlanRecord=Extract<HabitRecord,{kind:'wellbeingPlan'}>;
export const PLAN_STEPS=['observe','try','try','repeat','observe','try','review','repeat','try','observe','repeat','try','repeat','review','reflect'] as const;
export const PLAN_TEMPLATES=PLAN_IDS.map(id=>({id,duration:15,steps:PLAN_STEPS,source:id==='caffeine'||id==='energy'||id==='timing'?'caffeine':id==='plants'?'plants':['movement','walk','regularity'].includes(id)?'movement':undefined}));
export function calendarDistance(a:string,b:string) {return Math.round((Date.parse(b+'T12:00:00Z')-Date.parse(a+'T12:00:00Z'))/86400000);}
export function planDay(plan:WellbeingPlan,today=localDay()) {return Math.max(1,Math.min(15,calendarDistance(plan.startDate,plan.status==='paused'?plan.pausedAt:today)-plan.pausedDays+1));}
export function planMetric(records:HabitRecord[],date:string,id:PlanId):number|undefined {
 const n=nutritionSignals(records,date);
 if(id==='caffeine')return n.coffee;
 if(id==='energy')return n.energy;
 if(id==='hydration')return n.water===undefined?undefined:n.water*250;
 if(id==='plants')return n.fruit===undefined&&n.vegetables===undefined?undefined:(n.fruit??0)+(n.vegetables??0);
 if(id==='timing')return n.lateCaffeine===undefined?undefined:Number(n.lateCaffeine);
 if(id==='routine')return Object.keys(n).some(k=>!['items','lateCaffeine'].includes(k))?1:undefined;
 const sessions=records.filter((r):r is Extract<HabitRecord,{kind:'exercise'}>=>r.kind==='exercise'&&r.date===date);
 if(!sessions.length)return undefined;
 return sessions.reduce((sum,r)=>sum+(id==='walk'&&r.data.activity!=='walk'?0:r.data.minutes),0);
}
export function samplePlan(records:HabitRecord[],events:PersonalEvent[],id:PlanId,start:string,end:string):PlanSample {
 const values:number[]=[];const dates=new Set<string>();
 const recordedDates=[...new Set(records.filter(r=>(r.kind==='nutrition'||r.kind==='exercise')&&r.date>=start&&r.date<=end).map(r=>r.date))];
 for(const d of recordedDates){const n=planMetric(records,d,id);if(n!==undefined){values.push(n);dates.add(d);}}
 const latest=new Map<string,PersonalEvent>();
 events.filter(e=>e.type==='mood'&&typeof e.value==='number'&&dates.has(e.localDate)).forEach(e=>{const key=e.localDate+':'+String(e.metadata?.moment??'daily');const old=latest.get(key);if(!old||e.timestamp>old.timestamp)latest.set(key,e);});
 const daily=new Map<string,number[]>();latest.forEach(e=>daily.set(e.localDate,[...(daily.get(e.localDate)??[]),Number(e.value)]));
 const moods=[...daily.values()].map(v=>v.reduce((a,b)=>a+b,0)/v.length);
 return {mean:values.length?values.reduce((a,b)=>a+b,0)/values.length:0,days:values.length,moodMean:moods.length?moods.reduce((a,b)=>a+b,0)/moods.length:0,moodDays:moods.length};
}
export function suggestedPlanFromSignals(events:PersonalEvent[],eligible:PlanId[],now=new Date()):PlanId|undefined {
 const candidate=buildPersonalSignalSnapshot(events,now).experimentCandidate;
 if(!candidate)return undefined;
 const metric=candidate.metric;
 const mapped:PlanId|undefined=
  metric==='lateCaffeine'?'timing':
  metric==='coffee'?'caffeine':
  metric==='water'?'hydration':
  metric==='fruit'||metric==='vegetables'?'plants':
  metric==='energy'?'energy':
  metric==='movement'?'movement':
  metric==='activity:walk'?'walk':
  metric.startsWith('activity:')||metric.startsWith('intensity:')||metric.startsWith('period:')?'regularity':
  undefined;
 return mapped&&eligible.includes(mapped)?mapped:undefined;
}

export function eligiblePlans(records:HabitRecord[],today=localDay()):PlanId[] {
 return PLAN_IDS.filter(id=>{
  let days=0,positive=0;
  for(let n=1;n<=14;n++){const value=planMetric(records,shiftDay(today,-n),id);if(value!==undefined){days++;if(value>0)positive++;}}
  return days>=5 && (!['caffeine','energy','timing'].includes(id)||positive>=3);
 });
}
export function planAction(plan:PlanRecord,records:HabitRecord[],today:string) {
 const checks=records.filter((r):r is Extract<HabitRecord,{kind:'planCheck'}>=>r.kind==='planCheck'&&r.data.planId===plan.id).sort((a,b)=>a.date.localeCompare(b.date));
 const recent=checks.slice(-3);const easier=plan.data.gentle||recent.filter(r=>r.data.outcome==='notToday').length>=2;
 const step=PLAN_STEPS[planDay(plan.data,today)-1];
 return {easier,key:step==='observe'||step==='review'||step==='reflect'?'habitHub.plans.steps.'+step:'habitHub.plans.actions.'+plan.data.templateId+(easier?'Gentle':'')};
}
