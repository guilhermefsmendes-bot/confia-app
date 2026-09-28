import test from "node:test";
import assert from "node:assert/strict";
import type { PersonalEvent } from "../personalEvent";
import { buildPersonalSignalSnapshot, clearPersonalSignalCache } from "../personalSignalEngine";

const now = new Date("2026-09-28T20:00:00");
const day = (offset:number) => {
  const d = new Date("2026-09-28T12:00:00");
  d.setDate(d.getDate()+offset);
  return d.toISOString().slice(0,10);
};
const mood = (i:number,date:string,value:number):PersonalEvent => ({
  id:"m"+i,type:"mood",source:"daily_rating",schemaVersion:1,
  timestamp:date+"T20:00:00",localDate:date,value,metadata:{moment:"evening"}
});
const exercise = (i:number,date:string,minutes:number,extra:Record<string,unknown>={}):PersonalEvent => ({
  id:"e"+i,type:"exercise",source:"habits",schemaVersion:1,
  timestamp:date+"T18:00:00",localDate:date,value:minutes,metadata:{activity:"walk",...extra}
});
const nutrition = (i:number,date:string,metadata:Record<string,unknown>):PersonalEvent => ({
  id:"n"+i,type:"nutrition",source:"habits",schemaVersion:1,
  timestamp:date+"T19:00:00",localDate:date,value:null,metadata
});

test("empty or sparse data does not manufacture lifestyle patterns",()=>{
  clearPersonalSignalCache();
  const result=buildPersonalSignalSnapshot([mood(1,day(0),6)],now);
  assert.equal(result.patterns.length,0);
  assert.equal(result.experimentCandidate,undefined);
});

test("detects a repeated same-day movement association only with measured comparison groups",()=>{
  clearPersonalSignalCache();
  const events:PersonalEvent[]=[];
  for(let i=0;i<12;i++){
    const date=day(-11+i),active=i>=6;
    events.push(exercise(i,date,active?40:5));
    events.push(mood(i,date,active?8:5));
  }
  const result=buildPersonalSignalSnapshot(events,now);
  const pattern=result.patterns.find(s=>s.metric==="movement"&&s.timing==="same_day"&&s.kind==="association");
  assert.ok(pattern);
  assert.equal(pattern.direction,"up");
  assert.ok(pattern.evidenceCount>=10);
  assert.ok(pattern.confidence>=0.55);
});

test("can detect next-day associations without treating them as same-day causality",()=>{
  clearPersonalSignalCache();
  const events:PersonalEvent[]=[];
  for(let i=0;i<12;i++){
    const date=day(-12+i),late=i>=6;
    events.push(nutrition(i,date,{lateCaffeine:late,coffee:late?3:1}));
    events.push(mood(i,day(-11+i),late?4:7));
  }
  const result=buildPersonalSignalSnapshot(events,now);
  const next=result.patterns.find(s=>s.metric==="lateCaffeine"&&s.timing==="next_day");
  assert.ok(next);
  assert.equal(next.direction,"down");
  assert.ok(Math.abs(next.effect??0)>=0.8);
});

test("baseline change compares today with the person's own measured history",()=>{
  clearPersonalSignalCache();
  const events:PersonalEvent[]=[];
  for(let i=0;i<8;i++)events.push(nutrition(i,day(-8+i),{coffee:1}));
  events.push(nutrition(99,day(0),{coffee:4}));
  const result=buildPersonalSignalSnapshot(events,now);
  const baseline=result.patterns.find(s=>s.metric==="coffee"&&s.kind==="baseline_change");
  assert.ok(baseline);
  assert.equal(baseline.direction,"up");
  assert.equal(baseline.observedValue,4);
  assert.equal(baseline.baselineValue,1);
});

test("explicit exercise intensity and time-of-day become analyzable signals",()=>{
  clearPersonalSignalCache();
  const events:PersonalEvent[]=[];
  for(let i=0;i<12;i++){
    const date=day(-11+i),high=i>=6;
    events.push(exercise(i,date,high?35:5,{intensity:high?"intense":"light",period:high?"evening":"morning"}));
    events.push(mood(i,date,high?8:5));
  }
  const result=buildPersonalSignalSnapshot(events,now);
  assert.ok(result.patterns.some(s=>s.metric==="intensity:intense"&&s.kind==="association"));
  assert.ok(result.patterns.some(s=>s.metric==="period:evening"&&s.kind==="association"));
});

test("a supported modifiable pattern can become an optional experiment candidate",()=>{
  clearPersonalSignalCache();
  const events:PersonalEvent[]=[];
  for(let i=0;i<20;i++){
    const date=day(-19+i),late=i>=10;
    events.push(nutrition(i,date,{lateCaffeine:late,coffee:late?3:1}));
    events.push(mood(i,date,late?4:7));
  }
  const result=buildPersonalSignalSnapshot(events,now);
  assert.ok(result.experimentCandidate);
  assert.ok(["lateCaffeine","coffee"].includes(result.experimentCandidate!.metric));
});

test("cache reuses the same snapshot when source data has not changed",()=>{
  clearPersonalSignalCache();
  const events=[nutrition(1,day(0),{coffee:1})];
  const a=buildPersonalSignalSnapshot(events,now);
  const b=buildPersonalSignalSnapshot(events,now);
  assert.equal(a,b);
});

test("cross-module signals can relate lifestyle records with explicit challenge outcomes",()=>{
  clearPersonalSignalCache();
  const events:PersonalEvent[]=[];
  for(let i=0;i<12;i++){
    const date=day(-11+i),active=i>=6;
    events.push(exercise(i,date,active?45:5));
    events.push({
      id:"h"+i,type:"habit_challenge",source:"habits",schemaVersion:1,
      timestamp:date+"T21:00:00",localDate:date,value:active,
      metadata:{habitId:"checking",habitType:"checking",habitName:""}
    });
  }
  const result=buildPersonalSignalSnapshot(events,now);
  const cross=result.patterns.find(s=>s.id.startsWith("cross:movement:challenge:checking"));
  assert.ok(cross);
  assert.equal(cross.direction,"up");
  assert.ok(cross.evidenceCount>=10);
});
