import { useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "../../i18n/useFeatureTranslation";
import { localDay, secondsToMidnight, shiftDay } from "../../data/habits/calendar";
export const buttonClass="min-h-11 rounded-2xl border border-[#D9C6B8] bg-white/80 px-4 py-3 text-sm font-bold text-[#513B30] transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#934A38] disabled:opacity-50";
export const primaryClass=buttonClass+" !bg-[#754734] !text-white !border-[#754734]";
export const inputClass="mt-1 min-h-11 w-full rounded-xl border border-[#CFC1B5] bg-white px-3 py-2 text-base text-[#332824] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#934A38]";
export function useLocalDay() {
  const [day,setDay]=useState(localDay);
  useEffect(()=>{
    let midnight:ReturnType<typeof setTimeout>;
    let check:ReturnType<typeof setInterval>|undefined;
    const update=()=>{setDay(localDay());clearTimeout(midnight);midnight=setTimeout(update,secondsToMidnight()*1000+60);};
    const resume=()=>{
      update();
      if(document.visibilityState!=="hidden"&&!check)check=setInterval(update,60000);
    };
    const handleVisibility=()=>{
      if(document.visibilityState==="hidden"){
        if(check)clearInterval(check);
        check=undefined;
        return;
      }
      resume();
    };
    resume();
    document.addEventListener("visibilitychange",handleVisibility);
    window.addEventListener("focus",resume);
    return ()=>{
      clearTimeout(midnight);
      if(check)clearInterval(check);
      document.removeEventListener("visibilitychange",handleVisibility);
      window.removeEventListener("focus",resume);
    };
  },[]);
  return day;
}
export function Panel({title,onBack,children}:{title:string;onBack:()=>void;children:ReactNode}) {
  const {t}=useTranslation("habits");
  useEffect(()=>{document.getElementById("habit-panel-title")?.focus();},[title]);
  return <section className="space-y-5"><button className={buttonClass} onClick={onBack} type="button">← {t("back")}</button><h2 id="habit-panel-title" tabIndex={-1} className="text-2xl font-black outline-none">{title}</h2>{children}</section>;
}
export function DayPicker({value,onChange,min}:{value:string;onChange:(v:string)=>void;min?:string}) {
  const {t}=useTranslation("habits"); const today=useLocalDay();
  useEffect(()=>{if(value!==today && value!==shiftDay(today,-1))onChange(today);},[today,value,onChange]);
  return <label className="block text-sm font-bold">{t("habitHub.date")}<select className={inputClass} value={value} onChange={e=>onChange(e.target.value)}><option value={today}>{t("habitHub.today")}</option>{(!min || shiftDay(today,-1)>=min) && <option value={shiftDay(today,-1)}>{t("habitHub.yesterday")}</option>}</select></label>;
}
export function formatDay(day:string,language:string){return new Intl.DateTimeFormat(language,{day:"numeric",month:"short"}).format(new Date(day+"T12:00:00"));}
export type RunAction = (action:()=>void,message:string)=>boolean;
