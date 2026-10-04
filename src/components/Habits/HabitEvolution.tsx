import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { HabitRecord } from "../../data/habits/types";
import { shiftDay, weekStart } from "../../data/habits/calendar";

type Kind = "nutrition" | "exercise" | "sleep";
function weeks(today:string){return [3,2,1,0].map(i=>{const end=shiftDay(today,-i*7);return {start:weekStart(end),end};});}
function average(values:number[]){return values.length?values.reduce((a,b)=>a+b,0)/values.length:undefined;}
function trend(a:number|undefined,b:number|undefined){return a===undefined||b===undefined?undefined:Math.round((a-b)*10)/10;}
export default function HabitEvolution({records,today,kind}:{records:HabitRecord[];today:string;kind:Kind}){
 const {t,i18n}=useTranslation();
 const data=useMemo(()=>weeks(today).map(w=>{const rows=records.filter(r=>r.date>=w.start&&r.date<=w.end);
  if(kind==="exercise"){const logs=rows.filter((r):r is Extract<HabitRecord,{kind:"exercise"}>=>r.kind==="exercise"&&r.data.minutes>0);return {w,primary:logs.reduce((n,r)=>n+r.data.minutes,0),secondary:new Set(logs.map(r=>r.date)).size};}
  if(kind==="sleep"){const logs=rows.filter((r):r is Extract<HabitRecord,{kind:"sleep"}>=>r.kind==="sleep");return {w,primary:average(logs.map(r=>r.data.hours)),secondary:average(logs.map(r=>r.data.quality))};}
  const food=rows.filter((r):r is Extract<HabitRecord,{kind:"foodItem"}>=>r.kind==="foodItem"&&!r.data.deleted);
  const days=[...new Set(food.map(r=>r.date))];
  const caffeine=days.map(d=>food.filter(r=>r.date===d).reduce((n,r)=>{const x=r.data;if(x.category==="coffee"&&x.subtype!=="decaf")return n+x.quantity*80;if(x.category==="tea"&&(x.subtype==="black"||x.subtype==="green"))return n+x.quantity*50;if(x.category==="energy")return n+x.quantity*80;if(x.category==="soda"&&x.caffeine==="yes")return n+x.quantity*40;return n;},0));
  const produce=days.map(d=>food.filter(r=>r.date===d&&(r.data.category==="fruit"||r.data.category==="vegetables")).reduce((n,r)=>n+(r.data.unit==="portion"?r.data.quantity:1),0));
  return {w,primary:average(caffeine),secondary:average(produce)};
 }),[records,today,kind]);
 const current=data[3],previous=data[2];
 const fmt=(n:number|undefined,d=1)=>n===undefined?"—":new Intl.NumberFormat(i18n.language,{maximumFractionDigits:d}).format(n);
 const labels=kind==="exercise"?[t("habitHub.evolution.exerciseMinutes"),t("habitHub.evolution.activeDays")]:kind==="sleep"?[t("habitHub.evolution.sleepHours"),t("habitHub.evolution.sleepQuality")]:[t("habitHub.evolution.caffeine"),t("habitHub.evolution.produce")];
 const values=[current.primary,current.secondary], prev=[previous.primary,previous.secondary];
 const hasData=data.some(x=>x.primary!==undefined||x.secondary!==undefined); const max=Math.max(...data.map(x=>x.primary??0),1);
 return <section className="rounded-[28px] border border-[#DCD4C8] bg-[#FFFDF8] p-5" aria-label={t("habitHub.evolution.title")}><h3 className="text-xl font-black">{t("habitHub.evolution.title")}</h3><p className="mt-1 text-xs leading-5 text-[#6F5D51]">{t("habitHub.evolution.intro")}</p>{!hasData?<p className="mt-4 text-sm">{t("habitHub.evolution.empty")}</p>:<><div className="mt-4 grid grid-cols-2 gap-3">{values.map((v,i)=>{const d=trend(v,prev[i]);return <div key={labels[i]} className="rounded-2xl bg-white p-4"><p className="text-xs text-[#6F5D51]">{labels[i]}</p><p className="mt-1 text-2xl font-black">{fmt(v,i===0&&kind!=="sleep"?0:1)}</p><p className="mt-1 text-[11px] text-[#6F5D51]">{t("habitHub.evolution.previous",{value:fmt(prev[i],i===0&&kind!=="sleep"?0:1)})}</p>{d!==undefined&&<span className="text-xs font-bold">{d>0?"↗":d<0?"↘":"→"} {d>0?"+":""}{d}</span>}</div>})}</div><div className="mt-4 grid grid-cols-4 gap-1" aria-label={t("habitHub.evolution.lastWeeks")}>{data.map((x,i)=><div key={x.w.start}><div className="h-10 rounded-lg bg-[#EEE8DD] overflow-hidden flex items-end"><span className="block w-full rounded-t-lg bg-[#B9A78D]" style={{height:`${Math.max(8,Math.min(100,((x.primary??0)/max)*100))}%`}}/></div><p className="mt-1 truncate text-center text-[10px]">{i===3?t("habitHub.evolution.current"):t("habitHub.evolution.weekNumber",{n:4-i})}</p></div>)}</div></>}</section>;
}
