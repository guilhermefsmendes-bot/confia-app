import { useState } from "react";
import { useTranslation } from "react-i18next";
import { HABIT_TYPES,HABIT_ICONS,type HabitType,type HabitDefinition } from "../../data/habits/types";
import { createHabit,setPrimaryHabit } from "../../data/habits/actions";
import { buttonClass,inputClass,primaryClass,type RunAction } from "./shared";
export default function HabitSetup({habits,primaryId,run,onDone}:{habits:HabitDefinition[];primaryId?:string;run:RunAction;onDone:()=>void}) {
  const {t}=useTranslation();const [type,setType]=useState<HabitType>("tobacco");const [name,setName]=useState("");const [goal,setGoal]=useState("");const [icon,setIcon]=useState("🌱");
  return <div className="space-y-6">
    {habits.length>0 && <fieldset className="space-y-2"><legend className="mb-2 font-bold">{t("habitHub.primary")}</legend>{habits.map(h=><button key={h.id} type="button" aria-pressed={primaryId===h.id} className={buttonClass+" mr-2 "+(primaryId===h.id?"ring-2 ring-[#647D55]":"")} onClick={()=>{if(run(()=>setPrimaryHabit(h.id),""))onDone();}}>{h.data.icon} {h.data.type==="custom"?h.data.name:t("habitHub.habits."+h.data.type)}</button>)}</fieldset>}
    <form className="space-y-4 rounded-[28px] border border-[#E8DDD7] bg-white p-5" onSubmit={e=>{e.preventDefault();if(run(()=>{createHabit({type,name:type==="custom"?name:"",icon:type==="custom"?icon:HABIT_ICONS[type],goal,active:true,createdAt:new Date().toISOString()});},t("habitHub.encouragement.created")))onDone();}}>
      <h3 className="text-lg font-black">{t("habitHub.choose")}</h3>
      <div className="grid grid-cols-2 gap-2">{HABIT_TYPES.map(k=><button type="button" key={k} aria-pressed={type===k} onClick={()=>setType(k)} className={buttonClass+" text-left "+(type===k?"ring-2 ring-[#A56843] bg-[#FFF2DF]":"")}>{HABIT_ICONS[k]} {t("habitHub.habits."+k)}</button>)}</div>
      {type==="custom" && <><label className="block text-sm font-bold">{t("habitHub.name")}<input required maxLength={60} className={inputClass} value={name} onChange={e=>setName(e.target.value)}/></label><label className="block text-sm font-bold">{t("habitHub.icon")}<select className={inputClass} value={icon} onChange={e=>setIcon(e.target.value)}>{["🌱","✨","🌙","📱","🎮","☕","🚬","🍬","🛒","💛"].map(i=><option key={i} value={i}>{i}</option>)}</select></label></>}
      <label className="block text-sm font-bold">{t("habitHub.goal")}<input required maxLength={180} className={inputClass} value={goal} onChange={e=>setGoal(e.target.value)} placeholder={t("habitHub.goalExample")}/></label>
      <p className="text-xs leading-5 text-[#6F5D51]">{t("habitHub.goalHelp")}</p><button className={primaryClass+" w-full"} type="submit">{t("habitHub.create")}</button>
    </form>
  </div>;
}
