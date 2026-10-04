import { validFoodItem,defaultUnit,PERIODS,type FoodItem,type DayPeriod } from "./catalog";
import { nutritionTotals } from "./nutrition";
import { habitStats } from "./statistics";
import { HABIT_TYPES, FOOD_TYPES, ACTIVITY_TYPES, type Habit, type FoodType, type ActivityType, type HabitRecord, type SlipReason } from "./types";
import { editableDay, localDay } from "./calendar";
import { getHabitSnapshot, makeRecord, newHabitId, saveHabitRecord, saveHabitRecords } from "./store";
import { recordPersonalAnalytics } from "../personal/personalAnalytics";
export function createHabit(data:Habit) {
  if(!HABIT_TYPES.includes(data.type) || !data.goal.trim() || data.goal.length>180 || data.name.length>60 || !data.icon || data.icon.length>16 || (data.type==="custom" && !data.name.trim())) throw new Error("invalid");
  const id="habit_"+newHabitId();
  saveHabitRecord(makeRecord({id,kind:"habit",data:{...data,name:data.name.trim(),goal:data.goal.trim()}}));
  if(!getHabitSnapshot().records.some(r=>r.kind==="settings"))setPrimaryHabit(id);
  recordPersonalAnalytics("habit_created");return id;
}
export function setPrimaryHabit(primaryId:string) {
  if(!getHabitSnapshot().records.some(r=>r.kind==="habit" && r.id===primaryId && r.data.active))throw new Error("invalid");
  saveHabitRecord(makeRecord({id:"settings",kind:"settings",data:{primaryId}}));
}
function saveWithSummary(record:HabitRecord,habitId:string,total:number) {
  const records=getHabitSnapshot().records.filter(r=>r.id!==record.id).concat(record);
  const stats=habitStats(records,habitId);
  const summary=makeRecord({id:"summary_"+habitId,kind:"summary",data:{habitId,best:stats.best,total,runStart:stats.runStart,runEnd:stats.runEnd,cycleAt:stats.cycleAt,cycleDate:stats.cycleDate}});
  saveHabitRecords([record,summary]);
}
export function recordHabitDay(habitId:string,date:string,completed:boolean) {
  const definition=getHabitSnapshot().records.find(r=>r.kind==="habit" && r.id===habitId);
  if(!definition || !editableDay(date) || date<definition.date)throw new Error("invalid");
  const old=getHabitSnapshot().records.find(r=>r.id==="day_"+habitId+"_"+date);
  const before=habitStats(getHabitSnapshot().records,habitId);
  const wasComplete=old?.kind==="habitLog" && old.data.completed;
  saveWithSummary(makeRecord({id:"day_"+habitId+"_"+date,kind:"habitLog",data:{habitId,completed}},date),habitId,Math.max(0,before.total+Number(completed)-Number(Boolean(wasComplete))));
}
export function restartHabit(habitId:string,reason:SlipReason) {
  if(!["once","several","fresh"].includes(reason) || !getHabitSnapshot().records.some(r=>r.kind==="habit" && r.id===habitId))throw new Error("invalid");
  // Independent restart marker: never overwrite a previous success or erase history.
  const before=habitStats(getHabitSnapshot().records,habitId);
  saveWithSummary(makeRecord({id:"restart_"+newHabitId(),kind:"restart",data:{habitId,reason,bestBefore:before.best}}),habitId,before.total);
}
export function recordNutrition(date:string,data:Partial<Record<FoodType,number>>) {
  const entries=Object.entries(data);
  if(!editableDay(date) || !entries.length || entries.some(([k,v])=>!FOOD_TYPES.includes(k as FoodType) || !Number.isInteger(v) || v<0 || v>100))throw new Error("invalid");
  saveHabitRecord(makeRecord({id:"nutrition_"+date,kind:"nutrition",data},date));
  recordPersonalAnalytics("nutrition_log_added");
}
export function recordExercise(date:string,activity:ActivityType,minutes:number,intensity?: "light"|"moderate"|"intense",period?:DayPeriod) {
  if((period && !PERIODS.includes(period)) || !editableDay(date) || !ACTIVITY_TYPES.includes(activity) || !Number.isInteger(minutes) || minutes<0 || minutes>1440 || (intensity && !["light","moderate","intense"].includes(intensity)))throw new Error("invalid");
  const data={activity,minutes,...(period?{period}:{}),...(intensity?{intensity}:{})};
  saveHabitRecord(makeRecord({id:minutes===0?"rest_"+date:"exercise_"+newHabitId(),kind:"exercise",data},date));
  recordPersonalAnalytics("exercise_log_added");
}

export function recordSleep(date:string,hours:number,quality:number,awakenings?:number) {
  if(!editableDay(date) || !Number.isFinite(hours) || hours<0 || hours>24 || !Number.isFinite(quality) || !Number.isInteger(quality) || quality<1 || quality>5 || (awakenings!==undefined && (!Number.isInteger(awakenings)||awakenings<0||awakenings>100))) throw new Error("invalid");
  saveHabitRecord(makeRecord({id:"sleep_"+date,kind:"sleep",data:{hours,quality,...(awakenings!==undefined?{awakenings}:{})}},date));
  recordPersonalAnalytics("sleep_log_added");
}

export function saveFoodItem(date:string,data:FoodItem,id?:string) {
  if(!editableDay(date)||!validFoodItem(data))throw new Error("invalid");
  const records=getHabitSnapshot().records;
  if(id && !records.some(r=>r.id===id&&r.kind==='foodItem'&&r.date===date&&r.data.category===data.category))throw new Error("invalid");
  if(!id && records.filter(r=>r.kind==='foodItem'&&r.date===date&&!r.data.deleted).length>=60)throw new Error("limit");
  const record=makeRecord({id:id??"food_"+newHabitId(),kind:"foodItem",data},date);
  const additions:HabitRecord[]=[record];
  const legacy=records.find(r=>r.kind==='nutrition'&&r.date===date);
  // Preserve an existing category total as an explicitly unspecified item before
  // accepting the first new detailed entry. Never silently replace old intake.
  if(!id && legacy?.kind==='nutrition' && legacy.data[data.category]!==undefined && !records.some(r=>r.kind==='foodItem'&&r.date===date&&r.data.category===data.category)) {
    const old:FoodItem={category:data.category,subtype:'unspecified',quantity:legacy.data[data.category]!,unit:defaultUnit(data.category,'unspecified'),deleted:false};
    additions.push(makeRecord({id:'food_legacy_'+date+'_'+data.category,kind:'foodItem',data:old},date));
  }
  const next=records.filter(r=>r.id!==record.id).concat(additions);
  const totals=nutritionTotals(next,date);
  if(Object.values(totals).some(n=>n>1000))throw new Error("limit");
  saveHabitRecords([...additions,makeRecord({id:"nutrition_"+date,kind:"nutrition",data:totals},date)]);
  recordPersonalAnalytics("nutrition_log_added");
}
