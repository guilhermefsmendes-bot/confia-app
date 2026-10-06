import { dayFoodItems } from "../habits/nutrition";
import { itemVolume, type FoodItem } from "../habits/catalog";
import type { HabitRecord, ActivityType } from "../habits/types";
import { localDay, shiftDay } from "../habits/calendar";

/** Population-level guidance. Values are deliberately conservative and are not individual medical advice. */
export const SCIENTIFIC_GUIDANCE = {
  caffeine: { dailyMg: 400, singleDoseMg: 200, sleepSensitiveMg: 100, source: "EFSA" },
  activity: { moderateMinutes: 150, vigorousMinutes: 75, strengthDays: 2, source: "WHO" },
  fruitVegetables: { portions: 5, grams: 400, source: "WHO" },
  freeSugar: { maxPercentEnergy: 10, idealPercentEnergy: 5, referenceGrams: 50, source: "WHO" },
  salt: { maxGrams: 5, source: "WHO" },
  fat: { maxPercentEnergy: 30, saturatedPercentEnergy: 10, source: "WHO" },
  sleep: { typicalHoursMin: 7, typicalHoursMax: 9, source: "NHS" },
} as const;

const caffeineBase: Record<string, number> = { espresso:80, short:80, long:90, americano:90, filter:90, capsule:80, instant:80, other:80 };
function coffeeEstimate(item: FoodItem): number | undefined {
  if (item.category !== "coffee" || item.subtype === "decaf") return item.category === "coffee" ? 0 : undefined;
  if (["g","ml"].includes(item.unit)) return undefined;
  const base=caffeineBase[item.subtype]??80;
  const sizeFactor=item.size==="large"?1.5:item.size==="small"?0.75:1;
  const intensityFactor=item.intensity==="strong"?1.25:item.intensity==="mild"?0.75:1;
  return item.quantity*base*sizeFactor*intensityFactor;
}
function otherCaffeineEstimate(item:FoodItem):number {
  if(item.category==="tea" && ["black","green"].includes(item.subtype) && !["g","ml"].includes(item.unit)) return item.quantity*50;
  if(item.category==="energy"){const ml=itemVolume(item);return ml?ml/250*80:item.quantity*80;}
  if(item.category==="soda" && item.caffeine==="yes"){const ml=itemVolume(item);return ml?ml/355*40:item.quantity*40;}
  return 0;
}
export function estimateDailyCaffeine(records:HabitRecord[],date:string){
 const items=dayFoodItems(records,date);let mg=0,known=false,coffeeCount=0,late=false;
 for(const record of items){const item=record.data;
  if(item.category==="coffee"&&item.subtype!=="decaf"){coffeeCount+=item.quantity;const estimate=coffeeEstimate(item);if(estimate!==undefined){mg+=estimate;known=true;}if(item.time?item.time>="16:00":item.period==="afternoon"||item.period==="evening")late=true;}
  const other=otherCaffeineEstimate(item);if(other>0){mg+=other;known=true;if((item.time?item.time>="16:00":item.period==="afternoon"||item.period==="evening"))late=true;}
 }
 return {mg:known?Math.round(mg):undefined,coffeeCount,late,itemCount:items.length};
}
export function weeklyExercise(records:HabitRecord[],now:Date){
 const today=localDay(now),since=shiftDay(today,-6),sessions=records.filter((r):r is Extract<HabitRecord,{kind:"exercise"}> =>r.kind==="exercise"&&r.date>=since&&r.date<=today);
 const activeDays=new Set(sessions.filter(r=>r.data.minutes>0).map(r=>r.date));
 const moderateMinutes=sessions.filter(r=>r.data.minutes>0&&(r.data.intensity==="moderate"||r.data.intensity==="light"||!r.data.intensity)).reduce((n,r)=>n+r.data.minutes,0);
 const vigorousMinutes=sessions.filter(r=>r.data.minutes>0&&r.data.intensity==="intense").reduce((n,r)=>n+r.data.minutes,0);
 const strengthDays=new Set(sessions.filter(r=>r.data.minutes>0&&r.data.activity==="gym").map(r=>r.date)).size;
 const byType=Object.fromEntries((['walk','run','bike','swim','gym','dance','sport','hiit','stretch','yoga','other'] as ActivityType[]).map(type=>[type,{minutes:sessions.filter(r=>r.data.activity===type).reduce((n,r)=>n+r.data.minutes,0),days:new Set(sessions.filter(r=>r.data.activity===type&&r.data.minutes>0).map(r=>r.date)).size}]));
 return {moderateMinutes,vigorousMinutes,activeDays:activeDays.size,strengthDays,loggedDays:new Set(sessions.map(r=>r.date)).size,byType};
}
export function fruitVegetableRegistrations(records:HabitRecord[],date:string){const items=dayFoodItems(records,date).filter(r=>r.data.category==="fruit"||r.data.category==="vegetables");const portions=items.reduce((n,r)=>n+(r.data.unit==="portion"?r.data.quantity:0),0);const grams=items.reduce((n,r)=>n+(r.data.unit==="g"?r.data.quantity:0),0);return {explicitPortions:portions,grams,registrations:items.length};}

export type FoodReferenceAnalysis={value:number;reference:number;unit:"g"|"ml"|"portion"|"mg";ratio:number;state:"ok"|"high"|"low"|"neutral"};
export function analyseFoodReference(category:string,items:FoodItem[]):FoodReferenceAnalysis|undefined {
 const active=items.filter(i=>!i.deleted); if(!active.length)return undefined;
 const same=(unit:FoodItem["unit"])=>active.filter(i=>i.unit===unit).reduce((n,i)=>n+i.quantity,0);
 if(category==="fruit"||category==="vegetables"||category==="produce"){
  const grams=same("g"), portions=same("portion");
  if(grams>0)return {value:grams,reference:SCIENTIFIC_GUIDANCE.fruitVegetables.grams,unit:"g",ratio:grams/SCIENTIFIC_GUIDANCE.fruitVegetables.grams,state:grams>=SCIENTIFIC_GUIDANCE.fruitVegetables.grams?"ok":"low"};
  if(portions>0)return {value:portions,reference:SCIENTIFIC_GUIDANCE.fruitVegetables.portions,unit:"portion",ratio:portions/SCIENTIFIC_GUIDANCE.fruitVegetables.portions,state:portions>=SCIENTIFIC_GUIDANCE.fruitVegetables.portions?"ok":"low"};
 }
 if(category==="salty"){
  const grams=same("g"); if(grams>0)return {value:grams,reference:SCIENTIFIC_GUIDANCE.salt.maxGrams,unit:"g",ratio:grams/SCIENTIFIC_GUIDANCE.salt.maxGrams,state:grams>SCIENTIFIC_GUIDANCE.salt.maxGrams?"high":"ok"};
 }
 return undefined;
}
export function foodCategorySignals(records:HabitRecord[],date:string){
 const items=dayFoodItems(records,date);const count=(category:string)=>items.filter(r=>r.data.category===category&&!r.data.deleted).reduce((n,r)=>n+r.data.quantity,0);
 return {tea:count("tea"),cereals:count("cereals"),protein:count("protein"),fats:count("fats"),sweets:count("sweets"),salty:count("salty"),fastFood:count("fastFood"),waterMl:items.filter(r=>r.data.category==="water").reduce((n,r)=>n+(itemVolume(r.data)??r.data.quantity*250),0)};
}
export function sleepSignal(records:HabitRecord[],date:string){const r=records.find(x=>x.kind==="sleep"&&x.date===date);return r?.kind==="sleep"?r.data:undefined;}
