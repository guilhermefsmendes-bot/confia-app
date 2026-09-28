// Descriptive summaries feed the same personal-pattern UI. They do not diagnose,
// score the person, infer missing categories, or manufacture emotional outcomes.
import type { HabitRecord } from '../habits/types';
import { nutritionSignals } from '../habits/nutrition';
import { exerciseWeek,nutritionWeek } from '../habits/statistics';
import { shiftDay } from '../habits/calendar';
export function dailyLifestyleReview(records:HabitRecord[],date:string) {
 const n=nutritionSignals(records,date),movement=exerciseWeek(records,date,date);
 const hasFood=records.some(r=>r.kind==='nutrition'&&r.date===date);
 return {hasData:hasFood||movement.days>0,minutes:movement.minutes,plants:(n.fruit??0)+(n.vegetables??0)>0,late:n.lateCaffeine===true,
  energy:(n.energy??0)>0,coffee:n.coffee,idea:n.lateCaffeine?'caffeine':movement.minutes>0?'repeat':'observe'};
}
export function weeklyLifestyleReview(records:HabitRecord[],today:string) {
 const start=shiftDay(today,-6),recent=records.filter(r=>r.date>=start&&r.date<=today);
 const movement=exerciseWeek(recent,start,today);
 return {start,food:nutritionWeek(recent,start,today),movement,activeDays:new Set(recent.filter(r=>r.kind==='exercise'&&r.data.minutes>0).map(r=>r.date)).size,
  recordedDays:new Set(recent.filter(r=>r.kind==='nutrition'||r.kind==='exercise').map(r=>r.date)).size};
}
