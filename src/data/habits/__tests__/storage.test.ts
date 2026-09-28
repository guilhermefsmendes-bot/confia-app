import { it } from "node:test";
import assert from "node:assert/strict";
import { activateHabitOwner,getHabitSnapshot,mergeHabitRecords,saveHabitRecord,makeRecord } from "../store";
import { createHabit,recordHabitDay,restartHabit,recordNutrition,recordExercise } from "../actions";
import { habitStats } from "../statistics";
import { localDay } from "../calendar";
const data=new Map<string,string>();
let quota=false;
const local={getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>{if(quota && k.startsWith("confia_habits_v1:"))throw new Error("quota");data.set(k,v);},removeItem:(k:string)=>data.delete(k)};
const target=new EventTarget();
Object.defineProperty(globalThis,"localStorage",{value:local,configurable:true});
Object.defineProperty(globalThis,"window",{value:Object.assign(target,{localStorage:local}),configurable:true});
const create=()=>createHabit({type:"tobacco",name:"",icon:"🚬",goal:"My chosen goal",active:true,createdAt:new Date().toISOString()});
it("persists without authentication and restores after owner activation",()=>{
 activateHabitOwner("guest");const id=create();recordHabitDay(id,localDay(),true);
 assert.equal(habitStats(getHabitSnapshot().records,id).current,1);
 activateHabitOwner("alice");
 assert.ok(getHabitSnapshot().records.some(r=>r.id===id));
 assert.equal(data.has("confia_habits_v1:guest"),false);
 activateHabitOwner("bob");assert.equal(getHabitSnapshot().records.length,0);
 activateHabitOwner("alice");assert.equal(habitStats(getHabitSnapshot().records,id).current,1);
});
it("does not create duplicate days or lose history after restart",()=>{
 activateHabitOwner("storage-restart");const id=create();
 recordHabitDay(id,localDay(),true);recordHabitDay(id,localDay(),true);
 assert.equal(habitStats(getHabitSnapshot().records,id).total,1);
 restartHabit(id,"once");
 assert.equal(habitStats(getHabitSnapshot().records,id).current,0);
 assert.equal(habitStats(getHabitSnapshot().records,id).best,1);
 assert.equal(habitStats(getHabitSnapshot().records,id).total,1);
 recordHabitDay(id,localDay(),true);
 assert.equal(habitStats(getHabitSnapshot().records,id).total,1);
 assert.equal(habitStats(getHabitSnapshot().records,id).current,1);
});
it("local storage failure leaves both log and summary unchanged",()=>{
 activateHabitOwner("storage-quota");const id=create();const before=JSON.stringify(getHabitSnapshot());
 quota=true;assert.throws(()=>recordHabitDay(id,localDay(),true));quota=false;
 assert.equal(JSON.stringify(getHabitSnapshot()),before);
});
it("validates food and exercise before storage",()=>{
 activateHabitOwner("validation");
 assert.throws(()=>recordNutrition(localDay(),{coffee:-1}));
 assert.throws(()=>recordNutrition(localDay(),{}));
 assert.throws(()=>recordExercise(localDay(),"walk",NaN));
 recordNutrition(localDay(),{coffee:0});recordExercise(localDay(),"walk",5);
 assert.equal(getHabitSnapshot().records.length,2);
});
it("merges per-record revisions without replacing unrelated local records",()=>{
 const a=makeRecord({id:"nutrition_a",kind:"nutrition",data:{coffee:2}});
 const old={...a,updatedAt:"2000-01-01T00:00:00.000Z"};
 const merged=mergeHabitRecords([a],[old])[0];
 assert.equal(merged.kind==="nutrition"?merged.data.coffee:undefined,2);
});
