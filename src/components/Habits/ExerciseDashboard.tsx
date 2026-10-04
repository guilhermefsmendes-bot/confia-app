import { PERIODS,type DayPeriod } from "../../data/habits/catalog";
import LifestyleReview from "./LifestyleReview";
import HabitEvolution from "./HabitEvolution";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ACTIVITY_TYPES,ACTIVITY_ICONS,type ActivityType,type HabitRecord } from "../../data/habits/types";
import { recordExercise } from "../../data/habits/actions";
import { exerciseWeek } from "../../data/habits/statistics";
import { DayPicker,buttonClass,inputClass,primaryClass,type RunAction,formatDay } from "./shared";
import { weekStart } from "../../data/habits/calendar";
export default function ExerciseDashboard({records,today,run,onDone}:{records:HabitRecord[];today:string;run:RunAction;onDone:()=>void}) {
  const {t,i18n}=useTranslation();const [date,setDate]=useState(today);const [activity,setActivity]=useState<ActivityType>("walk");const [minutes,setMinutes]=useState(20);const [intensity,setIntensity]=useState<""|"light"|"moderate"|"intense">("");
  const [period,setPeriod]=useState<DayPeriod|"">("");
  const week=exerciseWeek(records,weekStart(today),today);
  const daily=records.filter((r):r is Extract<HabitRecord,{kind:"exercise"}>=>r.kind==="exercise" && r.date===date);
  return <div className="space-y-6"><form className="space-y-4 rounded-[28px] border border-[#CECADF] bg-[#F4F1F8] p-5" onSubmit={e=>{e.preventDefault();run(()=>recordExercise(date,activity,minutes,intensity||undefined,period||undefined),t("habitHub.encouragement.movement"));}}>
    <DayPicker value={date} onChange={setDate}/>
    <fieldset><legend className="mb-2 text-sm font-bold">{t("habitHub.exercise.what")}</legend><div className="grid grid-cols-2 gap-2">{ACTIVITY_TYPES.map(key=><button key={key} type="button" aria-pressed={activity===key} className={buttonClass+(activity===key?" ring-2 ring-[#87739F]":"")} onClick={()=>setActivity(key)}>{ACTIVITY_ICONS[key]} {t("habitHub.activities."+key)}</button>)}</div></fieldset>
    <fieldset><legend className="mb-2 text-sm font-bold">{t("habitHub.exercise.duration")}</legend><div className="flex flex-wrap gap-2">{[5,10,20,30,45,60].map(n=><button key={n} type="button" aria-pressed={minutes===n} className={buttonClass} onClick={()=>setMinutes(n)}>{t("habitHub.minutes",{count:n})}</button>)}</div><label className="mt-3 block text-sm">{t("habitHub.exercise.exactMinutes")}<input required min="1" max="1440" type="number" inputMode="numeric" className={inputClass} value={minutes||""} onChange={e=>setMinutes(Number(e.target.value))}/></label></fieldset>
    <label className="block text-sm font-bold">{t("habitHub.exercise.intensity")}<select className={inputClass} value={intensity} onChange={e=>setIntensity(e.target.value as typeof intensity)}><option value="">{t("habitHub.optional")}</option>{(["light","moderate","intense"] as const).map(k=><option key={k} value={k}>{t("habitHub.intensity."+k)}</option>)}</select></label>
    <label className="block text-sm font-bold">{t("habitHub.detail.period")}<select className={inputClass} value={period} onChange={e=>setPeriod(e.target.value as DayPeriod)}><option value="">{t("habitHub.optional")}</option>{PERIODS.filter(p=>p!=="lunch").map(k=><option key={k} value={k}>{t("habitHub.detail.periods."+k)}</option>)}</select></label>
    <button type="submit" className={primaryClass+" w-full"}>{t("habitHub.save")}</button>
    {daily.length===0 && <button type="button" className={buttonClass+" w-full"} onClick={()=>{run(()=>recordExercise(date,"other",0),t("habitHub.encouragement.noted"));}}>{t("habitHub.exercise.noMovement")}</button>}
    {daily.length>0 && <ul className="space-y-2 text-sm">{daily.map(r=><li key={r.id}>{r.data.minutes===0?t("habitHub.exercise.noMovementRecorded"):t("habitHub.exercise.session",{activity:t("habitHub.activities."+r.data.activity),minutes:r.data.minutes})}</li>)}</ul>}
    <button type="button" className={buttonClass+" w-full"} onClick={onDone}>{t("habitHub.detail.finish")}</button>
  </form>
  <section className="rounded-[28px] border border-[#E8DDD7] bg-white p-5"><h3 className="text-lg font-black">{t("habitHub.week")}</h3><p className="mt-1 text-xs">{t("habitHub.weekDates",{start:formatDay(weekStart(today),i18n.language),end:formatDay(today,i18n.language)})}</p>{week.days ? <><p className="mt-4 text-2xl font-black">{t("habitHub.minutes",{count:week.minutes})}</p><p className="mt-2 text-sm">{t("habitHub.exercise.days",{count:new Set(records.filter(r=>r.kind==="exercise" && r.data.minutes>0 && r.date>=weekStart(today) && r.date<=today).map(r=>r.date)).size})}</p><ul className="mt-3 space-y-1 text-sm">{week.activities.map(item=><li key={item.activity}>{ACTIVITY_ICONS[item.activity]} {t("habitHub.activities."+item.activity)} · {item.count}</li>)}</ul><p className="mt-4 text-sm leading-6">{t("habitHub.exercise.kind")}</p></> : <p className="mt-3 text-sm">{t("habitHub.exercise.empty")}</p>}</section><HabitEvolution records={records} today={today} kind="exercise"/>
  <LifestyleReview records={records} date={date} today={today}/></div>;
}
