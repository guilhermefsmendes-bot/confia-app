const WellbeingPlans=lazy(()=>import("./WellbeingPlans"));
import { lazy,Suspense,useEffect,useMemo,useState,useSyncExternalStore } from "react";
import { useTranslation } from "react-i18next";
import { getHabitSnapshot,getHabitRevision,subscribeHabits } from "../../data/habits/store";
import { startHabitSync,syncHabits } from "../../data/habits/sync";
import { recordHabitDay,restartHabit } from "../../data/habits/actions";
import { habitStats } from "../../data/habits/statistics";
import { readPersonalEvents,PERSONAL_EVENTS_UPDATED_EVENT } from "../../data/personal/personalEventStorage";
import { type HabitDefinition,type HabitRecord } from "../../data/habits/types";
import { recordPersonalAnalytics,recordPersonalScreenView } from "../../data/personal/personalAnalytics";
import { buttonClass,primaryClass,DayPicker,Panel,useLocalDay,type RunAction } from "./shared";
import HabitChallengeCard from "./HabitChallengeCard";
import HabitDailyExperience from "./HabitDailyExperience";
const HabitSetup=lazy(()=>import("./HabitSetup"));
const HabitHistory=lazy(()=>import("./HabitHistory"));
const NutritionDashboard=lazy(()=>import("./NutritionDashboard"));
const ExerciseDashboard=lazy(()=>import("./ExerciseDashboard"));
const SleepDashboard=lazy(()=>import("./SleepDashboard"));
const Support=lazy(()=>import("../ImpulsoSOS").then(m=>({default:m.ImpulsoSOS})));
export default function HabitDashboard({onAddXp,openSupport=false,initialPage="home",navigationKey=0,embedded=false}:{onAddXp:(n:number)=>void;openSupport?:boolean;initialPage?:string;navigationKey?:number;embedded?:boolean}) {
  const {t}=useTranslation();const today=useLocalDay();
  const revision=useSyncExternalStore(subscribeHabits,getHabitRevision,getHabitRevision);
  const [expanded,setExpanded]=useState(!embedded);
  const [eventRevision,setEventRevision]=useState(0);
  const [page,setPage]=useState(openSupport?"support":"home");
  useEffect(()=>{if(embedded)recordPersonalScreenView(page==="home"?"home":"home_habits_"+page);},[embedded,page]);
  const [message,setMessage]=useState("");const [error,setError]=useState("");
  const [logDate,setLogDate]=useState(today);
  useEffect(()=>{startHabitSync();},[]);
  useEffect(()=>{setPage(openSupport?"support":"home");},[openSupport]);
  useEffect(()=>{const update=()=>setEventRevision(n=>n+1);window.addEventListener(PERSONAL_EVENTS_UPDATED_EVENT,update);return()=>window.removeEventListener(PERSONAL_EVENTS_UPDATED_EVENT,update);},[]);
  const records=getHabitSnapshot().records;
  const habits=useMemo(()=>records.filter((r):r is HabitDefinition=>r.kind==="habit" && r.data.active),[records]);
  const settings=records.find(r=>r.kind==="settings");
  const primary=habits.find(r=>settings?.kind==="settings" && r.id===settings.data.primaryId)??habits[0];
  useEffect(()=>{if(navigationKey>0&&!openSupport){setPage(initialPage==="plans"?"home":initialPage==="log"&&!primary?"setup":initialPage);if(initialPage==="plans")setExpanded(true);}},[initialPage,navigationKey]);
  const events=useMemo(()=>readPersonalEvents(),[revision,eventRevision]);
  const run:RunAction=(action,success)=>{try{action();setError("");setMessage(success);return true;}catch{setMessage("");setError(t("habitHub.error"));return false;}};
  const go=(target:string)=>{if(target==="plans"){setPage("home");setExpanded(true);return;}setPage(target);setError("");setMessage("");setLogDate(today);};
  const back=()=>{setPage("home");};
  useEffect(()=>{if(page==="home"&&!embedded)document.getElementById("habits-title")?.focus();},[page,embedded]);
  const finishDay=(completed:boolean)=>{
    if(!primary)return;
    const before=habitStats(records,primary.id,today);
    if(run(()=>recordHabitDay(primary.id,logDate,completed),"")){
      const after=habitStats(getHabitSnapshot().records,primary.id,today);
      const milestone=[3,7,14,30].includes(after.current) && after.current>before.current;
      const key=!completed?"restart":milestone?"day"+after.current:after.best>before.best && before.best>0?"record":("done"+(after.total%3));
      setMessage(t("habitHub.encouragement."+key));if(milestone)recordPersonalAnalytics("habit_milestone_reached");back();
    }
  };
  return <div className="mx-auto max-w-2xl space-y-5 pb-6 text-[#332824]">
    <header className={page==="home"?"text-center":""}>
      <h1 id="habits-title" tabIndex={-1} className={page==="home"?"sr-only":"font-display text-3xl font-black outline-none"}>{t("habitHub.title")}</h1>
    </header>
    {page!=="home" && message && <p role="status" className="rounded-2xl border border-[#BFCDAF] bg-[#F1F7E8] p-4 text-sm leading-6">{message}</p>}
    {page!=="home" && error && <p role="alert" className="rounded-2xl border border-[#D9BD97] bg-[#FFF7E9] p-4 text-sm">{error}</p>}
    {page==="home" ? <>
      <HabitChallengeCard habit={primary} records={records} today={today} onOpen={go}/>
      <HabitDailyExperience records={records} events={events} today={today} habit={primary} message={message} error={error} onOpen={go}/>
      {!embedded && <>
        <details open={expanded} onToggle={e=>setExpanded(e.currentTarget.open)} className="rounded-2xl border border-[#E8DDD7] bg-white p-4">
          <summary className="min-h-11 cursor-pointer font-semibold">{t("homeDaily.more")}</summary>
          {expanded && <Suspense fallback={<p>{t("loading")}</p>}><div className="space-y-4 pt-3">
        <WellbeingPlans records={records} today={today} run={run} events={events}/>
          </div></Suspense>}
        </details>
        <button className={buttonClass+" w-full"} type="button" onClick={()=>go("support")}>{t("habitHub.support")}</button>
      </>}
    </> : <Panel title={t("habitHub.pages."+page)} onBack={back}><Suspense fallback={<p role="status">{t("loading")}</p>}>
      {page==="setup" && <HabitSetup habits={habits} primaryId={primary?.id} run={run} onDone={back}/>}
      {page==="history" && primary && <HabitHistory habit={primary} records={records} today={today}/>}
      {page==="log" && primary && <div className="space-y-4 rounded-[28px] border border-[#E8DDD7] bg-white p-5"><p className="text-lg font-bold">{primary.data.goal}</p><DayPicker value={logDate} onChange={setLogDate} min={primary.date}/><p className="text-sm leading-6">{t("habitHub.confirmHelp")}</p><button type="button" className={primaryClass+" w-full"} onClick={()=>finishDay(true)}>{t("habitHub.confirm")}</button><button type="button" className={buttonClass+" w-full"} onClick={()=>finishDay(false)}>{t(logDate===today?"habitHub.notToday":"habitHub.notThatDay")}</button></div>}
      {page==="restart" && primary && <div className="space-y-4 rounded-[28px] border border-[#E8DDD7] bg-white p-5"><h3 className="text-lg font-bold">{t("habitHub.restartQuestion")}</h3><p className="text-sm leading-6">{t("habitHub.restartHelp")}</p>{(["once","several","fresh"] as const).map(reason=><button key={reason} className={buttonClass+" w-full"} type="button" onClick={()=>{if(run(()=>restartHabit(primary.id,reason),t("habitHub.encouragement.restart")))back();}}>{t("habitHub.reasons."+reason)}</button>)}</div>}
      {page==="nutrition" && <NutritionDashboard records={records} events={events} today={today} run={run} onDone={back}/>}
      {page==="exercise" && <ExerciseDashboard records={records} events={events} today={today} run={run} onDone={back}/>}
      {page==="sleep" && <SleepDashboard records={records} events={events} today={today} run={run} onDone={back}/>}
      {page==="support" && <Support onAddXp={onAddXp}/>}
    </Suspense></Panel>}
  </div>;
}
