import { getHabitSnapshot,makeRecord,newHabitId,saveHabitRecord } from './store';
import { readPersonalEvents } from '../personal/personalEventStorage';
import { recordPersonalAnalytics } from '../personal/personalAnalytics';
import { localDay,shiftDay } from './calendar';
import { eligiblePlans,samplePlan,planDay,calendarDistance,type PlanId,type PlanRecord } from './plans';
const findPlan=(id:string)=>{const r=getHabitSnapshot().records.find((r):r is PlanRecord=>r.id===id&&r.kind==='wellbeingPlan');if(!r)throw new Error('invalid');return r;};
export function startWellbeingPlan(templateId:PlanId) {
 const records=getHabitSnapshot().records,today=localDay();
 if(!eligiblePlans(records,today).includes(templateId)||records.some(r=>r.kind==='wellbeingPlan'&&['active','paused'].includes(r.data.status)))throw new Error('invalid');
 const baseline=samplePlan(records,readPersonalEvents(),templateId,shiftDay(today,-15),shiftDay(today,-1));
 saveHabitRecord(makeRecord({id:'plan_'+newHabitId(),kind:'wellbeingPlan',data:{templateId,status:'active',startDate:today,endDate:shiftDay(today,14),pausedAt:'',pausedDays:0,gentle:false,baseline}}));
 recordPersonalAnalytics('wellbeing_plan_started');
}
export function changeWellbeingPlan(id:string,action:'pause'|'resume'|'adjust'|'abandon'|'complete') {
 const plan=findPlan(id),d={...plan.data},today=localDay();
 if(!['active','paused'].includes(d.status))throw new Error('invalid');
 if(action==='complete'){
  if(d.status!=='active'||today<=d.endDate)throw new Error('invalid');
  d.status='completed';d.result=samplePlan(getHabitSnapshot().records,readPersonalEvents(),d.templateId,d.startDate,d.endDate);
 }else if(action==='pause'){if(d.status!=='active'||today>d.endDate)throw new Error('invalid');d.status='paused';d.pausedAt=today;
 }else if(action==='resume'){if(d.status!=='paused')throw new Error('invalid');const duration=Math.max(0,calendarDistance(d.pausedAt,today));d.pausedDays+=duration;d.endDate=shiftDay(d.endDate,duration);d.pausedAt='';d.status='active';
 }else if(action==='adjust')d.gentle=!d.gentle;
 else {d.status='abandoned';d.result=samplePlan(getHabitSnapshot().records,readPersonalEvents(),d.templateId,d.startDate,today);}
 saveHabitRecord(makeRecord({id,kind:'wellbeingPlan',data:d}));
 if(action==='complete')recordPersonalAnalytics('wellbeing_plan_completed');
}
export function recordPlanCheck(id:string,done:boolean) {
 const plan=findPlan(id),today=localDay();if(plan.data.status!=='active'||today>plan.data.endDate||today<plan.data.startDate)throw new Error('invalid');
 saveHabitRecord(makeRecord({id:'plancheck_'+id+'_'+today,kind:'planCheck',data:{planId:id,day:planDay(plan.data,today),outcome:done?'done':'notToday'}}));
}
export function dismissPlanInvite(){saveHabitRecord(makeRecord({id:'plan_preference',kind:'planPreference',data:{dismissedUntil:shiftDay(localDay(),7)}}));}
