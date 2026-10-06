import { MoonStar, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import HabitEvolution from "./HabitEvolution";
import type { HabitRecord } from "../../data/habits/types";
import { recordSleep } from "../../data/habits/actions";
import { shiftDay } from "../../data/habits/calendar";
import { DayPicker,buttonClass,inputClass,primaryClass,type RunAction } from "./shared";

export default function SleepDashboard({records,today,run,onDone}:{records:HabitRecord[];today:string;run:RunAction;onDone:()=>void}) {
 const {t,i18n}=useTranslation(); const [date,setDate]=useState(today);
 const locale=i18n.language.startsWith("pt")?"pt-PT":i18n.language.startsWith("es")?"es-ES":i18n.language.startsWith("fr")?"fr-FR":"en-US";
 const formatDate=(value:string)=>new Date(`${value}T12:00:00`).toLocaleDateString(locale,{day:"numeric",month:"long",year:"numeric"});
 const current=useMemo(()=>records.find(r=>r.kind==="sleep"&&r.date===date),[records,date]);
 const [hours,setHours]=useState(current?.kind==="sleep"?current.data.hours:8);
 const [quality,setQuality]=useState(current?.kind==="sleep"?current.data.quality:4);
 const [awakenings,setAwakenings]=useState(current?.kind==="sleep"?(current.data.awakenings??0):0);
 const history=records.filter((r):r is Extract<HabitRecord,{kind:"sleep"}> => r.kind==="sleep"&&r.date<=today&&r.date>=shiftDay(today,-6)).sort((a,b)=>a.date.localeCompare(b.date));
 return <div className="space-y-5">
  <section className="relative overflow-hidden rounded-[32px] border border-[#D7D1E6] bg-gradient-to-br from-[#E9E4F3] via-[#F7F4FA] to-[#FFFDF8] p-6">
   <div className="absolute -right-6 -top-8 opacity-20"><MoonStar size={150} strokeWidth={1}/></div>
   <div className="relative flex items-center gap-3"><span className="grid h-14 w-14 place-items-center rounded-full bg-white/80 shadow-sm"><MoonStar size={30} aria-hidden="true"/></span><div><h2 className="text-xl font-black">{t("habitHub.sleep.title")}</h2><p className="text-sm leading-5 text-[#6F5D51]">{t("habitHub.sleep.intro")}</p></div></div>
  </section>
  <form className="space-y-4 rounded-[28px] border border-[#E8DDD7] bg-white p-5" onSubmit={e=>{e.preventDefault();run(()=>recordSleep(date,hours,quality,awakenings),t("habitHub.sleep.saved"));}}>
   <DayPicker value={date} onChange={d=>{setDate(d);const r=records.find(x=>x.kind==="sleep"&&x.date===d);if(r?.kind==="sleep"){setHours(r.data.hours);setQuality(r.data.quality);setAwakenings(r.data.awakenings??0);}}}/>
   <label className="block text-sm font-bold">{t("habitHub.sleep.hours")}<input className={inputClass} type="number" min="0" max="24" step="0.5" value={hours} onChange={e=>setHours(Number(e.target.value))}/></label>
   <fieldset><legend className="mb-2 text-sm font-bold">{t("habitHub.sleep.quality")}</legend><div className="grid grid-cols-5 gap-2">{[1,2,3,4,5].map(n=><button type="button" key={n} aria-pressed={quality===n} className={buttonClass+(quality===n?" ring-2 ring-[#87739F]":"")} onClick={()=>setQuality(n)}>{n}</button>)}</div><p className="mt-2 text-xs text-[#6F5D51]">{t("habitHub.sleep.qualityHelp")}</p></fieldset>
   <label className="block text-sm font-bold">{t("habitHub.sleep.awakenings")}<input className={inputClass} type="number" min="0" max="100" step="1" value={awakenings} onChange={e=>setAwakenings(Number(e.target.value))}/></label>
   <button type="submit" className={primaryClass+" w-full"}><Sparkles size={17} className="inline mr-2" aria-hidden="true"/>{t("habitHub.sleep.save")}</button>
   <button type="button" className={buttonClass+" w-full"} onClick={onDone}>{t("habitHub.detail.finish")}</button>
  </form>
  <HabitEvolution records={records} today={today} kind="sleep"/>
  <section className="rounded-[28px] border border-[#E8DDD7] bg-[#FFFDF7] p-5"><h3 className="text-lg font-black">{t("habitHub.sleep.history")}</h3>{history.length===0?<p className="mt-3 text-sm">{t("habitHub.sleep.empty")}</p>:<ul className="mt-3 space-y-2 text-sm">{history.map(r=><li key={r.id} className="rounded-xl bg-white p-3">{formatDate(r.date)} · {t("habitHub.sleep.hoursShort",{hours:r.data.hours})} · {t("habitHub.sleep.qualityShort",{quality:r.data.quality})}</li>)}</ul>}<p className="mt-4 text-xs leading-5 text-[#6F5D51]">{t("habitHub.sleep.disclaimer")}</p></section>
 </div>;
}
