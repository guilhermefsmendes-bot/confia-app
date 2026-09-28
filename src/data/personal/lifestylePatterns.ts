import type { PersonalEvent } from "./personalEvent";
import type { PersonalInsight } from "./personalInsights";
import { calculateInsightConfidence } from "./personalInsights";
import { localDay, shiftDay } from "../habits/calendar";
const mean=(n:number[])=>n.reduce((a,b)=>a+b,0)/n.length;
// Only measured comparisons; absence of food/exercise entries never means zero.
export function buildLifestyleInsights(events:PersonalEvent[],now=new Date()):PersonalInsight[] {
  const end=localDay(now), start=shiftDay(end,-29);
  const recent=events.filter(e=>e.localDate>=start && e.localDate<=end);
  const moodDays=new Map<string,number[]>();
  // Daily ratings use one consistent scale. Do not mix legacy check-in scales.
  const latest=new Map<string,PersonalEvent>();
  recent.filter(e=>e.type==="mood" && typeof e.value==="number").forEach(e=>{
    const k=e.localDate+":"+String(e.metadata?.moment??"daily");const old=latest.get(k);
    if(!old || e.timestamp>old.timestamp)latest.set(k,e);
  });
  latest.forEach(e=>moodDays.set(e.localDate,[...(moodDays.get(e.localDate)??[]),Number(e.value)]));
  const output:PersonalInsight[]=[];
  const challenges=[...new Set(recent.filter(e=>e.type==="habit_challenge").map(e=>String(e.metadata?.habitId??"")))].filter(Boolean);
  for(const metric of ["coffee","movement","fruit","lateCaffeine",...challenges.map(id=>"challenge:"+id)]) {
    const challenge=metric.startsWith("challenge:");
    const habitId=challenge?metric.slice(10):"";

    const values=new Map<string,number>();
    const ids=new Map<string,string[]>();
    const relevant=recent.filter(e=>challenge?e.type==="habit_challenge" && e.metadata?.habitId===habitId:metric==="movement"?e.type==="exercise":e.type==="nutrition");
    for(const e of relevant) {
      const value=challenge && typeof e.value==="boolean"?Number(e.value):metric==="movement"?e.value:e.metadata?.[metric];
      const measured=metric==="lateCaffeine"&&typeof value==="boolean"?Number(value):value;
      if(typeof measured!=="number" || !Number.isFinite(measured))continue;
      values.set(e.localDate,metric==="movement"?(values.get(e.localDate)??0)+measured:measured);
      ids.set(e.localDate,[...(ids.get(e.localDate)??[]),e.id]);
    }
    const pairs=[...values].filter(([day])=>moodDays.has(day));
    if(pairs.length<10)continue;
    const threshold=metric==="coffee"?2:metric==="movement"?20:1;
    const high=pairs.filter(([,n])=>n>=threshold),low=pairs.filter(([,n])=>n<threshold);
    if(high.length<5 || low.length<5)continue;
    const effect=mean(high.map(([day])=>mean(moodDays.get(day)!)))-mean(low.map(([day])=>mean(moodDays.get(day)!)));
    if(Math.abs(effect)<0.8)continue;
    const dates=pairs.map(([day])=>day).sort(), direction=effect>0?"up":"down";
    const evidence=high.length+low.length;
    const confident=high.length>=10 && low.length>=10;
    const habitType=String(relevant.at(-1)?.metadata?.habitType??"custom");
    const key="habitHub.insights."+(challenge?"challenge_"+habitType:metric)+"_"+direction;
    output.push({id:"lifestyle_"+metric, type:"habit_association",generatedAt:now.toISOString(),
      periodStart:dates[0],periodEnd:dates.at(-1)!,evidenceCount:evidence,
      confidence:confident?calculateInsightConfidence(evidence,Math.min(1,Math.abs(effect)/3),.8,.8,Math.abs(effect)/3,evidence/30):"low",
      direction,variables:[metric,"mood"],status:confident?"possible":"emerging",
      fingerprint:"lifestyle:"+metric+":"+direction,firstSeen:dates[0],lastSeen:dates.at(-1)!,
      timesShown:0,novelty:"new",actionability:"low",
      supportingEventIds:dates.flatMap(d=>[...(ids.get(d)??[]),...[...latest.values()].filter(e=>e.localDate===d).map(e=>e.id)]),
      message:"",messageKey:key,messageValues:{habitName:String(relevant.at(-1)?.metadata?.habitName??""),high:high.length,low:low.length,first:dates[0],last:dates.at(-1)!}});
  }
  return output.slice(0,3);
}
