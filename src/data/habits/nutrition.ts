import type { HabitRecord,FoodType } from './types';
import { itemCount,foodProperties,type FoodItem } from './catalog';
export type FoodRecord=Extract<HabitRecord,{kind:'foodItem'}>;
export function dayFoodItems(records:HabitRecord[],date:string):FoodRecord[] {return records.filter((r):r is FoodRecord=>r.kind==='foodItem'&&r.date===date&&!r.data.deleted);}
export function nutritionTotals(records:HabitRecord[],date:string):Partial<Record<FoodType,number>> {
 const old=records.find(r=>r.kind==='nutrition'&&r.date===date);
 const totals=old?.kind==='nutrition'?{...old.data}:{};
 // Detailed categories supersede their legacy totals; untouched legacy values survive.
 const detailed=records.filter((r):r is FoodRecord=>r.kind==='foodItem'&&r.date===date);
 for(const category of new Set(detailed.map(r=>r.data.category)))totals[category]=0;
 for(const r of detailed)if(!r.data.deleted)totals[r.data.category]=(totals[r.data.category]??0)+itemCount(r.data);
 return totals;
}
export function lateCaffeine(items:FoodItem[]):boolean|undefined {
 const caffeine=items.filter(i=>i.quantity>0&&foodProperties(i).caffeine==='yes');
 if(!caffeine.length)return undefined;
 const late=caffeine.some(i=>i.time?i.time>='16:00':i.period==='afternoon'||i.period==='evening');
 if(late)return true;
 return caffeine.every(i=>i.time||i.period)?false:undefined;
}
export function nutritionSignals(records:HabitRecord[],date:string) {
 const items=dayFoodItems(records,date).map(r=>r.data),totals=nutritionTotals(records,date);
 return {...totals,lateCaffeine:lateCaffeine(items),items};
}
