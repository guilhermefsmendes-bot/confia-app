import { nutritionSignals } from "./nutrition";
import type { HabitRecord } from "./types";
import type { PersonalEvent } from "../personal/personalEvent";
import { makePersonalEvent } from "../personal/personalEvent";
import { readPersonalEvents, writePersonalEvents, PERSONAL_EVENTS_UPDATED_EVENT } from "../personal/personalEventStorage";
export function recordsToPersonalEvents(records:HabitRecord[], owner:string): PersonalEvent[] {
  return records.flatMap(r=>{
    if(r.kind!=="nutrition" && r.kind!=="exercise" && r.kind!=="habitLog" && r.kind!=="wellbeingPlan" && r.kind!=="planCheck") return [];
    const definition=r.kind==="habitLog"?records.find(h=>h.kind==="habit" && h.id===r.data.habitId):undefined;
    const habit=definition?.kind==="habit"?definition.data:undefined;
    return [makePersonalEvent({
      id:"habit_event_"+owner+"_"+r.id, type:r.kind==="habitLog"?"habit_challenge":r.kind==="wellbeingPlan"||r.kind==="planCheck"?"experiment":r.kind,
      source:"habits", timestamp:r.updatedAt,localDate:r.date,
      value:r.kind==="exercise"?r.data.minutes:r.kind==="habitLog"?r.data.completed:r.kind==="planCheck"?r.data.outcome==="done":null,
      metadata:{...r.data,...(r.kind==="wellbeingPlan"?{experimentId:r.id,phase:r.data.status==="completed"?"complete":"start",targetMetric:r.data.templateId}:r.kind==="planCheck"?{experimentId:r.data.planId,phase:"measure",completion:r.data.outcome}:{}),...(r.kind==="nutrition"?nutritionSignals(records,r.date):{}), owner, timezone:r.timezone,...(habit?{habitType:habit.type,habitName:habit.name}:{})},
    }) as PersonalEvent];
  });
}
export function publishHabitEvents(records:HabitRecord[],owner:string) {
  const previous=readPersonalEvents();
  const next=[...previous.filter(e=>e.source!=="habits"),...recordsToPersonalEvents(records,owner)];
  writePersonalEvents(next);
  window.dispatchEvent(new Event(PERSONAL_EVENTS_UPDATED_EVENT));
}
