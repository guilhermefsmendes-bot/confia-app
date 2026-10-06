import {memo,useState} from "react";
import {ChevronDown,ChevronUp} from "lucide-react";
import {useTranslation} from "react-i18next";
import type {HabitRecord} from "../../data/habits/types";
import {dayFoodItems} from "../../data/habits/nutrition";
import {itemVolume} from "../../data/habits/catalog";
import {analyseFoodReference,estimateDailyCaffeine,weeklyExercise,SCIENTIFIC_GUIDANCE} from "../../data/reactive/scientificGuidance";
import {readMoodHistory} from "../../data/companionData";

const moodForDate=(date:string)=>{
  const mood=readMoodHistory().find(r=>r.date===date);
  const values=[mood?.morning,mood?.afternoon].filter(v=>typeof v==="number") as number[];
  return values.length?values.reduce((a,b)=>a+b,0)/values.length:undefined;
};

export const TodayMirror = memo(function TodayMirror({records,today,showHeader=true}:{records:HabitRecord[];today:string;showHeader?:boolean}) {
  const {t,i18n}=useTranslation();
  const [expanded,setExpanded]=useState(!showHeader);
  const items=dayFoodItems(records,today).filter(r=>!r.data.deleted);
  const byCategory=(category:string)=>items.filter(r=>r.data.category===category);
  const quantity=(category:string)=>byCategory(category).reduce((n,r)=>n+r.data.quantity,0);
  const firstUnit=(category:string)=>byCategory(category)[0]?.data.unit;
  const caffeine=estimateDailyCaffeine(records,today);
  const exerciseToday=records.filter((r):r is Extract<HabitRecord,{kind:"exercise"}>=>r.kind==="exercise"&&r.date===today&&r.data.minutes>0);
  const exerciseWeek=weeklyExercise(records,new Date(`${today}T12:00:00`));
  const sleep=records.find((r):r is Extract<HabitRecord,{kind:"sleep"}> =>r.kind==="sleep"&&r.date===today);
  const fmt=(n:number)=>new Intl.NumberFormat(i18n.language,{maximumFractionDigits:1}).format(n);
  const foodValue=(category:string)=>{
    const q=quantity(category), unit=firstUnit(category);
    if(category==='water'){
      const ml=byCategory(category).reduce((n,r)=>n+(itemVolume(r.data)??r.data.quantity*250),0);
      return `${fmt(ml)} ml`;
    }
    const unitKey=unit??'portion';
    return `${fmt(q)} ${t(`habitHub.detail.units.${unitKey}`,{count:q})}`;
  };
  type State="ok"|"high"|"low"|"neutral";
  type Row={key:string;icon:string;value:string;reference:string;state:State};
  const rows:Row[]=[];
  const addFood=(key:string,icon:string,state:State="neutral",reference?:string)=>{if(quantity(key)>0||byCategory(key).some(r=>r.data.quantity===0))rows.push({key,icon,value:foodValue(key),reference:reference??t("habitHub.nutrition.references.notComparable"),state});};
  if(caffeine.mg!==undefined&&caffeine.mg>0) rows.push({key:"coffee",icon:"☕",value:`${foodValue("coffee")} · ${fmt(caffeine.mg)} mg cafeína`,reference:`${t("habitHub.nutrition.references.caffeine",{value:SCIENTIFIC_GUIDANCE.caffeine.dailyMg})} · ${t("habitHub.nutrition.proportion",{value:Math.round(caffeine.mg/SCIENTIFIC_GUIDANCE.caffeine.dailyMg*100)})}`,state:caffeine.mg>SCIENTIFIC_GUIDANCE.caffeine.dailyMg?"high":"ok"}); else addFood("coffee","☕");
  if(quantity("tea")>0) rows.push({key:"tea",icon:"🍵",value:foodValue("tea"),reference:t("habitHub.nutrition.references.teaCaffeine",{value:SCIENTIFIC_GUIDANCE.caffeine.dailyMg}),state:"neutral"});
  if(quantity("energy")>0) rows.push({key:"energy",icon:"⚡",value:foodValue("energy")+(caffeine.mg!==undefined?` · ${fmt(caffeine.mg)} mg cafeína total`:''),reference:`${t("habitHub.nutrition.references.energyCaffeine",{value:SCIENTIFIC_GUIDANCE.caffeine.dailyMg})} · ${t("habitHub.nutrition.proportion",{value:caffeine.mg!==undefined?Math.round(caffeine.mg/SCIENTIFIC_GUIDANCE.caffeine.dailyMg*100):0})}`,state:caffeine.mg!==undefined&&caffeine.mg>SCIENTIFIC_GUIDANCE.caffeine.dailyMg?"high":"ok"});
  addFood("soda","🥤","neutral",t("habitHub.nutrition.references.sugar"));
  addFood("water","💧");
  addFood("alcohol","🍺","high",t("habitHub.nutrition.references.alcohol"));
  addFood("tobacco","🚬","high",t("habitHub.nutrition.references.tobacco"));
  addFood("fastFood","🍔");
  const produceAnalysis=analyseFoodReference("produce",items.filter(r=>r.data.category==="fruit"||r.data.category==="vegetables").map(r=>r.data));
  if(produceAnalysis){
    const a=produceAnalysis;
    const pct=Math.round(a.ratio*100);
    rows.push({key:"produce",icon:"🍎",value:`${fmt(a.value)} ${a.unit==="g"?t("habitHub.detail.units.g"):t("habitHub.detail.units.portion",{count:a.value})}`,reference:`${t("habitHub.nutrition.references.produce",{value:a.reference})} · ${t("habitHub.nutrition.proportion",{value:pct})}`,state:a.state});
  }
  addFood("cereals","🌾","neutral",t("habitHub.nutrition.references.wholegrain"));
  addFood("protein","🥚","neutral",t("habitHub.nutrition.references.protein"));
  addFood("fats","🫒","neutral",t("habitHub.nutrition.references.fat"));
  addFood("sweets","🍬","neutral",t("habitHub.nutrition.references.sugar"));
  addFood("salty","🧂","neutral",t("habitHub.nutrition.references.salt"));
  const typeTotals=exerciseWeek.byType as Record<string,{minutes:number;days:number}>;
  const activityRows=Object.entries(typeTotals).filter(([,v])=>v.minutes>0);
  if(activityRows.length) rows.push({key:"exercise",icon:"🏃",value:activityRows.map(([type,v])=>`${t(`habitHub.activities.${type}`)}: ${fmt(v.minutes)} min`).join(" · "),reference:`${t("habitHub.nutrition.references.exerciseWeekly",{value:SCIENTIFIC_GUIDANCE.activity.moderateMinutes})} · ${t("habitHub.nutrition.proportion",{value:Math.round((exerciseWeek.moderateMinutes/SCIENTIFIC_GUIDANCE.activity.moderateMinutes)*100)})}`,state:(exerciseWeek.moderateMinutes>=SCIENTIFIC_GUIDANCE.activity.moderateMinutes||exerciseWeek.vigorousMinutes>=SCIENTIFIC_GUIDANCE.activity.vigorousMinutes)?"ok":"low"});
  if(sleep) rows.push({key:"sleep",icon:"🌙",value:t("habitHub.nutrition.values.sleepHours",{value:sleep.data.hours}),reference:`${t("habitHub.nutrition.references.sleepHours")} · ${t("habitHub.nutrition.proportion",{value:Math.round(sleep.data.hours/SCIENTIFIC_GUIDANCE.sleep.typicalHoursMin*100)})}`,state:sleep.data.hours>=SCIENTIFIC_GUIDANCE.sleep.typicalHoursMin&&sleep.data.hours<=SCIENTIFIC_GUIDANCE.sleep.typicalHoursMax?"ok":"neutral"});
  const todayMood=moodForDate(today);
  if(todayMood!==undefined) rows.push({key:"wellbeing",icon:"❤️",value:fmt(todayMood)+"/10",reference:t("companionSynergy.wellbeingAverage"),state:"neutral"});
  if(!rows.length)return null;
  const statusClass=(state:State)=>state==="high"?"border-[#E8B4B4] bg-[#FFF1F1] text-[#B42318]":state==="low"?"border-[#E7D4A6] bg-[#FFF9E8] text-[#8A6400]":"border-[#E8DDD7] bg-white text-[#4E4039]";
  const body=<><p className="mt-1 text-xs leading-5 text-[#6F5D51]">{t("habitHub.nutrition.mirrorIntro")}</p><div className="mt-4 space-y-2">{rows.map(row=><div key={row.key} className={`rounded-2xl border p-3 ${statusClass(row.state)}`}><div className="grid grid-cols-[1fr_auto] gap-3"><div><p className="font-black">{row.icon} {t("habitHub.nutrition.mirrorLabels."+row.key)}</p><p className="mt-1 text-xs"><span className="font-semibold">{t("habitHub.nutrition.you")}:</span> {row.value}</p></div><div className="max-w-[190px] text-right"><p className="text-[10px] uppercase tracking-wide opacity-70">{t("habitHub.nutrition.referenceLabel")}</p><p className="text-xs font-bold">{row.reference}</p></div></div>{row.state!=="neutral"&&<p className="mt-2 text-xs font-bold">{t("habitHub.nutrition.status."+row.state)}</p>}{row.state==="neutral"&&<p className="mt-2 text-xs font-semibold">{t("habitHub.nutrition.status.neutral")}</p>}</div>)}</div></>;
  return <section className="rounded-[28px] border border-[#E8DDD7] bg-[#FBFAF7] p-5">{showHeader&&<button type="button" onClick={()=>setExpanded(v=>!v)} className="flex w-full items-center justify-between gap-3 text-left"><span className="text-xl font-black">{t("habitHub.nutrition.today")}</span><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#E8DDD7] bg-white" aria-label={expanded?"Minimizar":"Maximizar"}>{expanded?<ChevronUp size={20}/>:<ChevronDown size={20}/>}</span></button>}{expanded&&body}</section>;
});

export function LifestyleMirror({records,today}:{records:HabitRecord[];today:string}) {
 const {t}=useTranslation(); const [period,setPeriod]=useState<"day"|"7days"|"month">("day");
 const start=new Date(today+"T12:00:00"); const days=period==="day"?[today]:Array.from({length:period==="7days"?7:30},(_,i)=>{const d=new Date(start);d.setDate(d.getDate()-i);return d.toISOString().slice(0,10)});
 const tab=<div className="mb-3 flex gap-2 rounded-2xl bg-[#F1ECE8] p-1">{(["day","7days","month"] as const).map(x=><button key={x} type="button" onClick={()=>setPeriod(x)} className={period===x?"min-h-11 flex-1 rounded-xl bg-white px-2 text-xs font-black text-[#59445F] shadow-sm":"min-h-11 flex-1 rounded-xl px-2 text-xs font-black text-[#806D65]"}>{t("companionSynergy.periods."+x)}</button>)}</div>;
 if(period==="day") return <div>{tab}<TodayMirror records={records} today={today} showHeader={false}/></div>;
 const fmt=(n:number)=>new Intl.NumberFormat(undefined,{maximumFractionDigits:1}).format(n);
 const foodText=(date:string,category:string)=>{const items=dayFoodItems(records,date).filter(r=>!r.data.deleted&&r.data.category===category); if(!items.length)return "—"; const byUnit=new Map<string,number>(); items.forEach(r=>byUnit.set(r.data.unit,(byUnit.get(r.data.unit)??0)+r.data.quantity)); return [...byUnit.entries()].map(([u,n])=>`${fmt(n)} ${t("habitHub.detail.units."+u,{count:n})}`).join(" + ");};
 const daysLabel=(date:string)=>new Intl.DateTimeFormat(undefined,{day:"2-digit",month:"2-digit"}).format(new Date(date+"T12:00:00"));
 const dailyRows=days.map(date=>{const ex=records.filter(r=>r.kind==="exercise"&&r.date===date).reduce((n,r)=>n+(r.kind==="exercise"?r.data.minutes:0),0); const sl=records.find(r=>r.kind==="sleep"&&r.date===date); return {date,coffee:foodText(date,"coffee"),energy:foodText(date,"energy"),fast:foodText(date,"fastFood"),sweets:foodText(date,"sweets"),fats:foodText(date,"fats"),exercise:ex?`${fmt(ex)} min`:"—",sleep:sl&&sl.kind==="sleep"?`${fmt(sl.data.hours)} h`:"—",wellbeing:moodForDate(date)};});
 return <section className="rounded-[28px] border border-[#E8DDD7] bg-[#FBFAF7] p-5">{tab}<div className="mt-4 overflow-x-auto rounded-2xl border border-[#E8DDD7] bg-white"><table className="min-w-[760px] w-full text-xs"><thead className="bg-[#F7F3F0]"><tr><th className="px-3 py-3 text-left font-black">Dia</th><th className="px-3 py-3 text-left font-black">Café</th><th className="px-3 py-3 text-left font-black">Energéticas</th><th className="px-3 py-3 text-left font-black">Fast food</th><th className="px-3 py-3 text-left font-black">Doces</th><th className="px-3 py-3 text-left font-black">Gorduras</th><th className="px-3 py-3 text-left font-black">Exercício</th><th className="px-3 py-3 text-left font-black">Sono</th><th className="px-3 py-3 text-left font-black">{t("companionSynergy.wellbeing")}</th></tr></thead><tbody>{dailyRows.map((row,i)=><tr key={row.date} className={i%2?"bg-[#FCFAF8]":""}><td className="whitespace-nowrap px-3 py-3 font-black">{daysLabel(row.date)}</td><td className="px-3 py-3">{row.coffee}</td><td className="px-3 py-3">{row.energy}</td><td className="px-3 py-3">{row.fast}</td><td className="px-3 py-3">{row.sweets}</td><td className="px-3 py-3">{row.fats}</td><td className="px-3 py-3">{row.exercise}</td><td className="px-3 py-3">{row.sleep}</td><td className="px-3 py-3 font-bold">{row.wellbeing!==undefined?`${fmt(row.wellbeing)}/10`:"—"}</td></tr>)}</tbody></table></div></section>;
}
