import { describe,it,before } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { habitStats,progressStage,nutritionWeek,exerciseWeek } from "../statistics";
import { localDay,shiftDay,secondsToMidnight,editableDay } from "../calendar";
import { buildLifestyleInsights } from "../../personal/lifestylePatterns";
import { buildPersonalInsights } from "../../personal/personalInsights";
import { makePersonalEvent,type PersonalEvent } from "../../personal/personalEvent";
import type { HabitRecord } from "../types";
const dayLog=(day:string,completed=true,id="one"):HabitRecord=>({id:id+"_"+day,kind:"habitLog",date:day,updatedAt:day+"T20:00:00.000Z",timezone:"UTC",data:{habitId:id,completed}});
const reset=(day:string):HabitRecord=>({id:"restart_"+day,kind:"restart",date:day,updatedAt:day+"T21:00:00.000Z",timezone:"UTC",data:{habitId:"one",reason:"once",bestBefore:3}});
describe("habit calendar and preserved history",()=>{
 it("does not award a day at midnight without confirmation",()=>assert.equal(habitStats([],"one","2026-09-28").current,0));
 it("allows a whole day to confirm yesterday without recording a failure",()=>{
  const logs=[dayLog("2026-09-25"),dayLog("2026-09-26")];
  assert.equal(habitStats(logs,"one","2026-09-28").current,4);
  assert.equal(habitStats(logs,"one","2026-09-28").awaitingYesterday,false);
  assert.equal(habitStats(logs,"one","2026-09-29").current,5);
  assert.equal(habitStats(logs,"one","2026-09-29").total,2);
 });
 it("recovers the full consecutive run after a previous-day confirmation",()=>{
  const logs=[dayLog("2026-09-25"),dayLog("2026-09-26"),dayLog("2026-09-28"),dayLog("2026-09-27")];
  assert.equal(habitStats(logs,"one","2026-09-28").current,4);
 });
 it("a legacy non-completion does not reset the automatic streak; restart is explicit",()=>{
  const stats=habitStats([dayLog("2026-09-26"),dayLog("2026-09-27"),dayLog("2026-09-28",false)],"one","2026-09-28");
  assert.equal(stats.current,3);assert.equal(stats.best,3);assert.equal(stats.total,2);
  const resetStats=habitStats([dayLog("2026-09-26"),dayLog("2026-09-27"),reset("2026-09-28")],"one","2026-09-28");
  assert.equal(resetStats.current,0);
 });
 it("restarts preserve the best run and total including a same-day confirmation",()=>{
  const records=[dayLog("2026-09-26"),dayLog("2026-09-27"),dayLog("2026-09-28"),reset("2026-09-28")];
  assert.equal(habitStats(records,"one","2026-09-28").current,0);
  assert.equal(habitStats(records,"one","2026-09-28").best,3);
  const newDay=dayLog("2026-09-28");newDay.updatedAt="2026-09-28T22:00:00.000Z";
  records[2]=newDay;
  const stats=habitStats(records,"one","2026-09-28");
  assert.equal(stats.current,1);assert.equal(stats.best,3);assert.equal(stats.total,3);
 });
 it("supports 100+ days and independent habits",()=>{
  const records=Array.from({length:110},(_,n)=>dayLog(shiftDay("2026-06-01",n)));
  const today=shiftDay("2026-06-01",109);
  assert.equal(habitStats(records,"one",today).current,110);
  assert.equal(habitStats(records,"two",today).current,0);
  assert.equal(progressStage(110),4);
 });
 it("retains long streaks with a paginated cloud history",()=>{
  const summary:HabitRecord={id:"summary_one",kind:"summary",date:"2026-09-28",updatedAt:"2026-09-28T21:00:00.000Z",timezone:"UTC",data:{habitId:"one",best:120,total:150,runStart:"2026-06-01",runEnd:"2026-09-28",cycleAt:"",cycleDate:""}};
  const stats=habitStats([summary,dayLog("2026-09-27"),dayLog("2026-09-28")],"one","2026-09-28");
  assert.equal(stats.current,120);assert.equal(stats.total,150);assert.equal(stats.best,120);
 });
 it("handles local calendar arithmetic across DST and year boundaries",()=>{
  const tz=process.env.TZ;
  process.env.TZ="Europe/Lisbon";
  assert.equal(shiftDay("2026-03-28",1),"2026-03-29");
  assert.equal(shiftDay("2026-12-31",1),"2027-01-01");
  assert.equal(secondsToMidnight(new Date(2026,2,29,0,0,0)),23*3600);
  assert.equal(secondsToMidnight(new Date(2026,9,25,0,0,0)),25*3600);
  assert.equal(secondsToMidnight(new Date(2026,8,28,23,59,59)),1);
  process.env.TZ=tz;
 });
 it("allows only today and yesterday for editing",()=>{
  assert.ok(editableDay("2026-09-27","2026-09-28"));assert.ok(!editableDay("2026-09-26","2026-09-28"));
 });
});
describe("nutrition, exercise and evidence",()=>{
 it("averages only recorded categories and preserves explicit zero",()=>{
  const records:HabitRecord[]=[{id:"a",kind:"nutrition",date:"2026-09-28",updatedAt:"2026-09-28T10:00:00Z",timezone:"UTC",data:{coffee:0}},{id:"b",kind:"nutrition",date:"2026-09-29",updatedAt:"2026-09-29T10:00:00Z",timezone:"UTC",data:{water:5}}];
  const week=nutritionWeek(records,"2026-09-28");
  assert.equal(week.find(r=>r.key==="coffee")?.average,0);
  assert.equal(week.find(r=>r.key==="coffee")?.recorded,1);
  assert.equal(week.find(r=>r.key==="fruit")?.average,undefined);
 });
 it("adds sessions but counts movement days once",()=>{
  const data={activity:"walk" as const,minutes:20};
  const records:HabitRecord[]=[{id:"a",kind:"exercise",date:"2026-09-28",updatedAt:"2026-09-28T10:00:00Z",timezone:"UTC",data},{id:"b",kind:"exercise",date:"2026-09-28",updatedAt:"2026-09-28T11:00:00Z",timezone:"UTC",data}];
  assert.equal(exerciseWeek(records,"2026-09-28").minutes,40);
  assert.equal(exerciseWeek(records,"2026-09-28").days,1);
 });
 const sample=(n:number,withComparison=true):PersonalEvent[]=>Array.from({length:n},(_,i)=>{
   const date=shiftDay("2026-09-01",i);return [
    makePersonalEvent({id:"m"+i,type:"mood",source:"daily_rating",timestamp:date+"T20:00:00Z",localDate:date,value:i%2?7:3}),
    ...(i%2 || withComparison?[makePersonalEvent({id:"n"+i,type:"nutrition",source:"habits",timestamp:date+"T19:00:00Z",localDate:date,value:null,metadata:{coffee:i%2?3:0}})]:[])];
 }).flat() as PersonalEvent[];
 it("requires at least five measured days in each comparison group",()=>{
  assert.equal(buildLifestyleInsights(sample(8),new Date("2026-09-28")).length,0);
  assert.equal(buildLifestyleInsights(sample(10,false),new Date("2026-09-28")).length,0);
 });
 it("emits cautious initial associations through the existing insight engine",()=>{
  const insights=buildPersonalInsights(sample(10),new Date("2026-09-28")).filter(i=>i.fingerprint.startsWith("lifestyle:"));
  assert.equal(insights.length,1);assert.equal(insights[0].status,"emerging");assert.equal(insights[0].confidence,"low");assert.equal(insights[0].evidenceCount,10);
 });
 it("does not multiply evidence from repeated ratings in the same day",()=>{
  const events=sample(8);const copies=events.filter(e=>e.type==="mood").flatMap(e=>Array.from({length:10},(_,i)=>({...e,id:e.id+"_"+i})));
  assert.equal(buildLifestyleInsights([...events,...copies],new Date("2026-09-28")).length,0);
 });
 it("ignores events outside the window and check-in scales",()=>{
  assert.equal(buildLifestyleInsights(sample(20),new Date("2026-12-01")).length,0);
  const events=sample(20).map(e=>e.type==="mood"?{...e,type:"checkin" as const}:e);
  assert.equal(buildLifestyleInsights(events,new Date("2026-09-28")).length,0);
 });
 it("compares explicit challenge completions and non-completions",()=>{
  const events=sample(12).map(e=>e.type==="nutrition"?makePersonalEvent({id:e.id,type:"habit_challenge",source:"habits",timestamp:e.timestamp,localDate:e.localDate,value:Number(e.metadata?.coffee)>0,metadata:{habitId:"one",habitType:"tobacco"}}):e) as PersonalEvent[];
  const result=buildLifestyleInsights(events,new Date("2026-09-28"));
  assert.equal(result[0]?.messageKey,"habitHub.insights.challenge_tobacco_up");
 });
 it("has matching translations and interpolation variables in all four languages",()=>{
  const flatten=(v:any,p=""):Record<string,string>=>Object.fromEntries(Object.entries(v).flatMap(([k,x])=>typeof x==="string"?[[p+k,x]]:Object.entries(flatten(x,p+k+"."))));
  const locales=["pt","en","es","fr"].map(l=>flatten(JSON.parse(readFileSync("src/locales/"+l+".json","utf8")).habitHub));
  for(const locale of locales.slice(1)){
   assert.deepEqual(Object.keys(locale).sort(),Object.keys(locales[0]).sort());
   for(const key of Object.keys(locale))assert.deepEqual((locale[key].match(/{{[^}]+}}/g)??[]).sort(),(locales[0][key].match(/{{[^}]+}}/g)??[]).sort(),key);
  }
 });
});
