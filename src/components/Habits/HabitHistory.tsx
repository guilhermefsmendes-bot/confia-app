import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { HabitDefinition,HabitRecord } from "../../data/habits/types";
import { habitStats } from "../../data/habits/statistics";
import { shiftDay } from "../../data/habits/calendar";
import { hasOlderHabits,loadOlderHabits } from "../../data/habits/sync";
import { buttonClass,formatDay } from "./shared";
export default function HabitHistory({habit,records,today}:{habit:HabitDefinition;records:HabitRecord[];today:string}) {
  const {t,i18n}=useTranslation();const [month,setMonth]=useState(0);const [error,setError]=useState(false);const [busy,setBusy]=useState(false);
  const stats=habitStats(records,habit.id,today);
  const end=shiftDay(today,-month*30);const days=Array.from({length:30},(_,n)=>shiftDay(end,-n)).filter(d=>d>=habit.date);
  const logs=new Map(records.filter(r=>r.kind==="habitLog" && r.data.habitId===habit.id).map(r=>[r.date,r]));
  const restarts=records.filter(r=>r.kind==="restart" && r.data.habitId===habit.id);
  return <div className="space-y-4">
    <dl className="grid grid-cols-2 gap-3">{([["current",stats.current],["best",stats.best],["last30",stats.last30],["total",stats.total]] as const).map(([key,value])=><div key={key} className="rounded-2xl border border-[#E8DDD7] bg-white p-4"><dt className="text-xs">{t("habitHub."+key)}</dt><dd className="mt-1 text-2xl font-black">{value}</dd></div>)}</dl>
    <p className="text-xs leading-5">{t("habitHub.historyNote")}</p>
    <ul className="divide-y divide-[#E8DDD7] rounded-2xl border border-[#E8DDD7] bg-white px-4">{days.map(day=>{const log=logs.get(day);return <li key={day} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"><time dateTime={day}>{formatDay(day,i18n.language)}</time><span>{t("habitHub.status."+(log?.kind==="habitLog"?(log.data.completed?"done":"notDone"):"unknown"))}</span>{restarts.filter(r=>r.date===day).map(r=><small className="w-full text-[#6E6158]" key={r.id}>{t("habitHub.restart")} · {r.kind==="restart"?t("habitHub.reasons."+r.data.reason):""}</small>)}</li>;})}</ul>
    <div className="flex flex-wrap gap-2"><button type="button" disabled={month===0} className={buttonClass} onClick={()=>setMonth(n=>n-1)}>{t("habitHub.newer")}</button><button type="button" disabled={days.at(-1)===habit.date || !days.length} className={buttonClass} onClick={()=>setMonth(n=>n+1)}>{t("habitHub.older")}</button>
    {hasOlderHabits() && <button type="button" disabled={busy} className={buttonClass} onClick={async()=>{setBusy(true);try{await loadOlderHabits();setError(false);}catch{setError(true);}finally{setBusy(false);}}}>{t("habitHub.loadOlder")}</button>}</div>
    {error && <p role="alert">{t("habitHub.sync.error")}</p>}
  </div>;
}
