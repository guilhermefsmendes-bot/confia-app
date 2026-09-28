import { it } from 'node:test';
import assert from 'node:assert/strict';
import { activateHabitOwner,getHabitSnapshot,saveHabitRecord,makeRecord } from '../store';
import { saveFoodItem,recordNutrition,recordExercise } from '../actions';
import { startWellbeingPlan,changeWellbeingPlan,recordPlanCheck } from '../planActions';
import { eligiblePlans,planDay,planAction,samplePlan,type PlanRecord } from '../plans';
import { nutritionTotals,nutritionSignals,lateCaffeine } from '../nutrition';
import { foodProperties,type FoodItem } from '../catalog';
import { dailyLifestyleReview,weeklyLifestyleReview } from '../../personal/lifestyleReview';
import { localDay,shiftDay } from '../calendar';
import type { HabitRecord } from '../types';
const data=new Map<string,string>();let quota=false;
const local={getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>{if(quota&&k.startsWith('confia_habits'))throw Error('quota');data.set(k,v);},removeItem:(k:string)=>data.delete(k)};
Object.defineProperty(globalThis,'localStorage',{value:local,configurable:true});Object.defineProperty(globalThis,'window',{value:Object.assign(new EventTarget(),{localStorage:local}),configurable:true});
const item=(category:FoodItem['category'],subtype:string,quantity=1):FoodItem=>({category,subtype,quantity,unit:'item',deleted:false});
const today=localDay(),records=()=>getHabitSnapshot().records;
const foodRecords=()=>records().filter((r):r is Extract<HabitRecord,{kind:'foodItem'}>=>r.kind==='foodItem');
it('multiple fruits, edits and tombstones retain independent items and legacy categories',()=>{
 activateHabitOwner('food-detail');recordNutrition(today,{coffee:3,water:6});
 saveFoodItem(today,item('fruit','apple',2));saveFoodItem(today,item('fruit','banana'));
 assert.deepEqual(nutritionTotals(records(),today),{coffee:3,water:6,fruit:3});
 const apple=foodRecords()[0];saveFoodItem(today,{...apple.data,quantity:4},apple.id);
 assert.equal(nutritionTotals(records(),today).fruit,5);
 saveFoodItem(today,{...apple.data,deleted:true},apple.id);
 assert.equal(nutritionTotals(records(),today).fruit,1);assert.equal(foodRecords().length,2);
});
it('coffee time takes precedence, unknown time is not morning, decaf has no exact dose',()=>{
 const coffee={...item('coffee','filter',3),period:'morning' as const,time:'17:30',intensity:'strong' as const};
 assert.equal(lateCaffeine([coffee]),true);assert.equal(lateCaffeine([item('coffee','espresso')]),undefined);
 assert.equal(lateCaffeine([{...coffee,time:'09:30'}]),false);assert.equal(lateCaffeine([item('coffee','decaf')]),undefined);
 assert.equal(foodProperties(coffee).caffeine,'yes');assert.equal('mg' in foodProperties(coffee),false);
});
it('water volume, brand-independent properties and explicit zero stay structured',()=>{
 activateHabitOwner('drinks');saveFoodItem(today,{...item('water','still',3),unit:'bottle',servingMl:500});
 saveFoodItem(today,{...item('soda','cocaCola'),unit:'can',servingMl:330,caffeine:'yes',sugar:'yes'});
 saveFoodItem(today,item('sweets','occasion',0));
 assert.equal(nutritionTotals(records(),today).water,6);assert.equal(nutritionTotals(records(),today).sweets,0);
 assert.equal(nutritionTotals(records(),today).fruit,undefined);assert.equal(foodProperties(foodRecords()[1].data).caffeine,'yes');
});
it('invalid times, quantities, subtypes and cross-day edits fail before writing',()=>{
 activateHabitOwner('invalid-detail');const before=JSON.stringify(getHabitSnapshot());
 for(const bad of [{...item('coffee','espresso'),time:'25:99'},{...item('fruit','apple'),quantity:-1},item('fruit','espresso')])assert.throws(()=>saveFoodItem(today,bad));
 assert.throws(()=>saveFoodItem(shiftDay(today,-3),item('fruit','apple')));
 assert.equal(JSON.stringify(getHabitSnapshot()),before);
});
it('food detail and aggregate survive together or neither on storage failure',()=>{
 activateHabitOwner('detail-quota');const before=JSON.stringify(getHabitSnapshot());quota=true;
 assert.throws(()=>saveFoodItem(today,item('fruit','apple')));quota=false;
 assert.equal(JSON.stringify(getHabitSnapshot()),before);
});
it('daily and seven-day review use real entries, not inferred mood or missing zeros',()=>{
 activateHabitOwner('reviews');saveFoodItem(today,{...item('coffee','espresso',5),period:'afternoon'});recordExercise(today,'walk',30,'light','morning');
 const daily=dailyLifestyleReview(records(),today);assert.equal(daily.late,true);assert.equal(daily.minutes,30);assert.equal(daily.idea,'caffeine');
 const week=weeklyLifestyleReview(records(),today);assert.equal(week.activeDays,1);assert.equal(week.recordedDays,1);assert.equal(week.food.find(r=>r.key==='coffee')?.average,5);
 assert.equal(dailyLifestyleReview([],today).hasData,false);
});
function seed(n=5) {for(let i=1;i<=n;i++)saveHabitRecord(makeRecord({id:'baseline_'+i,kind:'nutrition',data:{coffee:4,fruit:1,water:5}},shiftDay(today,-i)));}
it('plan invitations require five measured days; no implicit plan enrollment',()=>{
 activateHabitOwner('plan-threshold');seed(2);assert.deepEqual(eligiblePlans(records()),[]);assert.throws(()=>startWellbeingPlan('caffeine'));
 seed();assert.ok(eligiblePlans(records()).includes('caffeine'));assert.ok(!records().some(r=>r.kind==='wellbeingPlan'));
 startWellbeingPlan('caffeine');const p=records().find(r=>r.kind==='wellbeingPlan') as PlanRecord;
 assert.equal(p.data.baseline.days,5);assert.equal(p.data.baseline.mean,4);assert.equal(planDay(p.data),1);
 assert.throws(()=>startWellbeingPlan('hydration'));
});
it('plan progress, adaptive action, pause, continue and abandonment preserve history',()=>{
 activateHabitOwner('plan-lifecycle');seed();startWellbeingPlan('caffeine');const p=records().find(r=>r.kind==='wellbeingPlan') as PlanRecord;
 recordPlanCheck(p.id,true);recordPlanCheck(p.id,false);
 assert.equal(records().filter(r=>r.kind==='planCheck').length,1);
 changeWellbeingPlan(p.id,'adjust');const gentle=records().find(r=>r.id===p.id) as PlanRecord;
 assert.equal(planAction(gentle,records(),shiftDay(today,1)).easier,true);
 changeWellbeingPlan(p.id,'pause');assert.throws(()=>recordPlanCheck(p.id,true));changeWellbeingPlan(p.id,'resume');
 changeWellbeingPlan(p.id,'abandon');assert.equal((records().find(r=>r.id===p.id) as PlanRecord).data.status,'abandoned');
 assert.equal(records().filter(r=>r.kind==='planCheck').length,1);assert.equal(records().filter(r=>r.kind==='nutrition').length,5);
});
it('15-day completion stores real comparison, respects partial records and absent emotional data',()=>{
 activateHabitOwner('plan-complete');seed();startWellbeingPlan('caffeine');const p=records().find(r=>r.kind==='wellbeingPlan') as PlanRecord;
 assert.throws(()=>changeWellbeingPlan(p.id,'complete'));
 const prior={...p.data,startDate:shiftDay(today,-16),endDate:shiftDay(today,-2)};
 saveHabitRecord(makeRecord({id:p.id,kind:'wellbeingPlan',data:prior}));changeWellbeingPlan(p.id,'complete');
 const result=(records().find(r=>r.id===p.id) as PlanRecord).data;
 assert.equal(result.status,'completed');assert.equal(result.result?.days,4);assert.equal(result.result?.moodDays,0);
 assert.equal(samplePlan([],[],'caffeine',shiftDay(today,-15),today).days,0);
 assert.equal(planDay({...prior,status:'paused',pausedAt:shiftDay(prior.startDate,3)},today),4);
});

it('upgrading a legacy category keeps its old total as an unspecified item',()=>{
 activateHabitOwner('legacy-upgrade');recordNutrition(today,{coffee:3});saveFoodItem(today,item('coffee','espresso',1));
 assert.equal(nutritionTotals(records(),today).coffee,4);
 assert.equal(foodRecords().find(r=>r.data.subtype==='unspecified')?.data.quantity,3);
});
