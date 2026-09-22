import type { PersonalEvent } from "./personalEvent";
import { buildReplayMoments } from "./confiaReplay";
type Confidence = "low" | "moderate" | "high";
export type ForecastSignal = { id:string; confidence:Confidence; evidenceCount:number; recentCount:number; need?:string; weekday?:number; dates:string[] };
export type CounterfactualSignal = { id:string; factor:string; withCount:number; withoutCount:number; withDelta:number; withoutDelta:number; confidence:Confidence };
const mood=(e:PersonalEvent)=>(e.type==="mood"||e.type==="checkin")&&typeof e.value==="number"?e.value:undefined;
const mean=(xs:number[])=>xs.length?xs.reduce((a,b)=>a+b,0)/xs.length:0;
const day=(s:string)=>new Date(s+"T12:00:00").getDay();
export function buildForecastSignals(events:PersonalEvent[],now=new Date()):ForecastSignal[]{
 const moods=events.filter(e=>mood(e)!==undefined).sort((a,b)=>a.timestamp.localeCompare(b.timestamp)); if(moods.length<8)return[]; const recent=moods.slice(-4); const needs=new Map<string,{count:number,dates:string[]}>();
 for(const e of moods.slice(-30)){const n=typeof e.metadata?.need==="string"?e.metadata.need:"";if(!n)continue;const v=needs.get(n)??{count:0,dates:[]};v.count++;v.dates.push(e.localDate);needs.set(n,v)}
 const out:ForecastSignal[]=[]; for(const [need,v] of needs){const recentCount=recent.filter(e=>e.metadata?.need===need).length;if(v.count>=3&&recentCount>=2)out.push({id:"forecast_need_"+need,confidence:v.count>=6?"high":"moderate",evidenceCount:v.count,recentCount,need,dates:v.dates.slice(-6)})}
 const wd=now.getDay(),same=moods.filter(e=>day(e.localDate)===wd).map(e=>mood(e)!).slice(-8),all=moods.slice(-30).map(e=>mood(e)!);if(same.length>=3&&all.length>=8&&mean(same)<=mean(all)-.8)out.push({id:"forecast_weekday_"+wd,confidence:same.length>=5?"high":"moderate",evidenceCount:same.length,recentCount:same.length,weekday:wd,dates:moods.filter(e=>day(e.localDate)===wd).slice(-6).map(e=>e.localDate)});return out.slice(0,2)
}
export function buildRecall(events:PersonalEvent[]){return buildReplayMoments(events,3).filter(x=>x.recovery)}
export function buildCounterfactualSignals(events:PersonalEvent[]):CounterfactualSignal[]{const moods=events.filter(e=>mood(e)!==undefined).sort((a,b)=>a.timestamp.localeCompare(b.timestamp));if(moods.length<10)return[];const interventions=events.filter(e=>e.type==="intervention"),yes:number[]=[],no:number[]=[];for(let i=0;i<moods.length-1;i++){const a=moods[i],b=moods[i+1],start=new Date(a.timestamp).getTime(),end=new Date(b.timestamp).getTime();if(end-start>3*86400000)continue;const has=interventions.some(x=>{const t=new Date(x.timestamp).getTime();return t>=start&&t<=end});(has?yes:no).push(mood(b)!-mood(a)!)}if(yes.length<3||no.length<3)return[];const yd=mean(yes),nd=mean(no);if(Math.abs(yd-nd)<.5)return[];return[{id:"counterfactual_impulso",factor:"impulso",withCount:yes.length,withoutCount:no.length,withDelta:Number(yd.toFixed(1)),withoutDelta:Number(nd.toFixed(1)),confidence:yes.length+no.length>=12?"high":"moderate"}]}
