import type { HabitRecord } from '../../habits/types';
import type { PersonalEvent } from '../../personal/personalEvent';
import type { CompanionBrainCandidate as Candidate } from './companionBrainTypes';
import { habitStats } from '../../habits/statistics';
import { localDay,shiftDay } from '../../habits/calendar';
import { planDay } from '../../habits/plans';
import { buildPersonalSignalSnapshot } from '../../personal/personalSignalEngine';
// Facts only: the shared insight engine remains responsible for associations.
export function dailyCandidates(records:HabitRecord[],events:PersonalEvent[],now=new Date()):Candidate[]{
 const today=localDay(now),since=shiftDay(today,-6),out:Candidate[]=[];
 const add=(family:string,fact:string,priority:number,category:Candidate['category'],target:NonNullable<Candidate['action']>['target'],values:Record<string,string|number>={})=>out.push({id:`daily:${family}:${fact}`,translationKey:`companionDaily.${family}.0`,translationValues:values,category,emotion:category==='progress'?'encouraging':category==='emotional_followup'?'warm':'calm',priority,reason:family,cooldownMinutes:1440,expiresAt:new Date(now.getFullYear(),now.getMonth(),now.getDate()+1).toISOString(),metadata:{family},action:{target,labelKey:`companionDaily.actions.${target}`}});
 const settings=records.find(r=>r.kind==='settings');
 const habits=records.filter(r=>r.kind==='habit'&&r.data.active);
 const primary=habits.find(r=>settings?.kind==='settings'&&r.id===settings.data.primaryId)??habits[0];
 if(primary){
  const stats=habitStats(records,primary.id,today);
  const restart=records.filter(r=>r.kind==='restart'&&r.data.habitId===primary.id&&r.date===today).sort((a,b)=>a.updatedAt.localeCompare(b.updatedAt)).at(-1);
  if(restart&&stats.current===0)add('restart',restart.id+':'+restart.updatedAt,92,'emotional_followup','habits');
  else if([3,7,14,30,60,100].includes(stats.current))add('milestone',primary.id+':'+stats.runStart+':'+stats.current,88,'progress','habitHistory',{count:stats.current});
  else if(stats.today===true&&stats.current>1)add('continuity',today,62,'progress','habitHistory',{count:stats.current});
 }
 const plan=records.find(r=>r.kind==='wellbeingPlan'&&r.data.status==='active');
 if(plan?.kind==='wellbeingPlan'){
  const day=planDay(plan.data,today);
  if(day===15)add('planEnd',plan.id,85,'progress','plans');
  else if(!records.some(r=>r.kind==='planCheck'&&r.data.planId===plan.id&&r.date===today))add('planStep',plan.id+':'+today,52,'objective','plans',{count:day});
 }
 const recent=events.filter(e=>e.localDate>=shiftDay(today,-29)&&e.localDate<=today&&Date.parse(e.timestamp)<=now.getTime());
 const zen=recent.filter(e=>e.type==='intervention'&&e.metadata?.exercise==='five_minutes'&&['calmer','same','agitated'].includes(String(e.metadata?.response))).slice(-10);
 const last=zen.at(-1);
 if(last&&last.localDate>=since){
  if(last.localDate===today&&last.metadata?.response==='agitated')add('stillAgitated',last.id,94,'emotional_followup','breathe');
  else if(zen.length>=3&&zen.filter(e=>e.metadata?.response==='calmer').length>zen.length/2)add('breathing',last.id,72,'impulse_followup','breathe');
 }
 const signals=buildPersonalSignalSnapshot(events,now);
 const lateFact=signals.facts.find(s=>s.metric==='lateCaffeine'&&s.observedValue===1);
 if(lateFact&&now.getHours()>=18)add('caffeine',today,48,'discovery','nutrition');

 // Reuse the same personal signal engine as the Reactive Engine. Only patterns
 // with enough evidence can become Companion observations; missing logs stay unknown.
 const lifestylePattern=signals.patterns.find(s=>s.kind==='association'&&s.status!=='early'&&s.confidence>=0.55);
 if(lifestylePattern){
  if(lifestylePattern.domain==='exercise')add('movement',lifestylePattern.id,64,'progress','exercise',{count:lifestylePattern.evidenceCount});
  else if(lifestylePattern.metric==='water')add('hydration',lifestylePattern.id,45,'discovery','nutrition',{count:lifestylePattern.evidenceCount});
 }
 return out;
}
