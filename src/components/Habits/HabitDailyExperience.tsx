import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { scheduleBackgroundWork } from "../../utils/scheduleBackgroundWork";
import { useTranslation } from "../../i18n/useFeatureTranslation";
import { MoonStar, Footprints, Apple, Sparkles, Printer, ChevronDown, ChevronUp, Waves } from "lucide-react";
import type { HabitDefinition, HabitRecord } from "../../data/habits/types";
import type { PersonalEvent } from "../../data/personal/personalEvent";
import { shiftDay } from "../../data/habits/calendar";
import { nutritionTotals } from "../../data/habits/nutrition";
import { createHabitDateIndex, createHabitWindowIndex, dailyMirrorStats, mirrorDateRange, averageRecordedValues } from "../../data/habits/dailyMirrorStats";
import { appendPersonalEvents } from "../../data/personal/personalEventStorage";
import { createMoodObservationEvent } from "../../data/personal/personalEvent";
import HabitImpactReaction from "./HabitImpactReaction";
import { LifestyleMirror } from "./LifestyleMirror";
import { collectLifestyleSynergyData } from "../../data/companionData";
import { buildLifestyleSynergyCandidate } from "../../data/reactive/companionBrain/lifestyleSynergy";
const LifestyleReview = lazy(() => import("./LifestyleReview"));
const HabitInsights = lazy(() => import("./HabitInsights"));
const PersonalLakeReflection = lazy(() => import("./PersonalLakeReflection"));

type Props = { records: HabitRecord[]; events: PersonalEvent[]; today: string; habit?: HabitDefinition; message?: string; error?: string; onOpen: (page: string) => void };
type DayStats = { sleep?: number; exercise: number; exerciseDays: number; food: number; habits: number; mood?: number; domains: string[]; hasAny: boolean };
function dayStats(records: HabitRecord[], events: PersonalEvent[], date: string, shared: ReturnType<ReturnType<typeof createHabitDateIndex>["dailyStatsForDate"]>): DayStats {
  const exerciseRows = records.filter((r): r is Extract<HabitRecord, {kind:"exercise"}> => r.kind === "exercise" && r.date === date && r.data.minutes > 0);
  const foodRows = records.filter((r): r is Extract<HabitRecord, {kind:"foodItem"}> => r.kind === "foodItem" && r.date === date && !r.data.deleted && r.data.quantity > 0);
  const nutritionRows = records.some(r => r.kind === "nutrition" && r.date === date) && Object.values(nutritionTotals(records, date)).some(v => typeof v === "number" && v > 0);
  const habitRows = records.filter(r => r.kind === "habitLog" && r.date === date);
  const mood = shared.mood;
  const sleep = shared.sleep;
  const domains = [sleep !== undefined ? "sleep" : "", exerciseRows.length ? "exercise" : "", foodRows.length || nutritionRows ? "nutrition" : "", mood !== undefined ? "mood" : ""].filter(Boolean);
  return { sleep, exercise: exerciseRows.reduce((sum, r) => sum + r.data.minutes, 0), exerciseDays: exerciseRows.length ? 1 : 0, food: foodRows.length + (nutritionRows ? 1 : 0), habits: habitRows.length, mood, domains, hasAny: domains.length > 0 || habitRows.length > 0 };
}
const average = (values: Array<number | undefined>) => averageRecordedValues(values);

export default function HabitDailyExperience({ records, events, today, habit, message, error, onOpen }: Props) {
  const { t, i18n } = useTranslation("habits");
  const fmt = (value: number | undefined, digits = 1) => value === undefined ? "—" : new Intl.NumberFormat(i18n.language, { maximumFractionDigits: digits }).format(value);
  const [view, setView] = useState<"mirror" | "calendar" | "report">("mirror");
  const [collapsed, setCollapsed] = useState(false);
  const [selectedDate, setSelectedDate] = useState(today);
  const [savedMood, setSavedMood] = useState<number | null>(null);
  const [synergyData, setSynergyData] = useState<ReturnType<typeof collectLifestyleSynergyData> | null>(null);
  const [synergy, setSynergy] = useState<ReturnType<typeof buildLifestyleSynergyCandidate> | null>(null);

  // These cross-domain analyses are useful context, but they are not needed
  // to paint the daily mirror. Run them in idle time so opening/scrolling into
  // the habit panel does not synchronously scan the personal history.
  useEffect(() => {
    setSynergyData(null);
    setSynergy(null);
    if (collapsed || view !== "mirror") return;
    let cancelled = false;
    const cancel = scheduleBackgroundWork(() => {
      try {
        const next = collectLifestyleSynergyData(new Date(`${selectedDate}T12:00:00`));
        if (!cancelled) setSynergyData(next);
      } catch {
        if (!cancelled) setSynergyData(null);
      }
    }, 120, 900);
    return () => { cancelled = true; cancel(); };
  }, [selectedDate, collapsed, view]);

  useEffect(() => {
    if (!synergyData) {
      setSynergy(null);
      return;
    }
    let cancelled = false;
    const cancel = scheduleBackgroundWork(() => {
      try {
        const next = buildLifestyleSynergyCandidate(records, synergyData, new Date(`${selectedDate}T12:00:00`));
        if (!cancelled) setSynergy(next);
      } catch {
        if (!cancelled) setSynergy(null);
      }
    }, 120, 900);
    return () => { cancelled = true; cancel(); };
  }, [records, selectedDate, synergyData]);
  const synergyText = synergy?.translationKey ? t(synergy.translationKey, synergy.translationValues) : null;
  useEffect(() => setSelectedDate(today), [today]);
  // A vista diária só lê o dia selecionado e a janela curta usada na comparação.
  // O índice histórico completo só nasce quando a pessoa abre calendário/relatório.
  const dateIndex = useMemo(() => collapsed || view === "mirror" ? null : createHabitDateIndex(records, events), [collapsed, view, records, events]);
  const recordsByDate = dateIndex?.recordsByDate;
  const eventsByDate = dateIndex?.eventsByDate;
  const dailyStatsForDate = dateIndex?.dailyStatsForDate;
  const days = useMemo(() => mirrorDateRange(selectedDate, 7), [selectedDate]);
  // The daily mirror groups the complete source arrays in one pass, retaining
  // only the seven requested dates. Per-day aggregation then touches only that
  // day's records rather than filtering the full history seven separate times.
  const weekWindowIndex = useMemo(() => view === "mirror" && !collapsed ? createHabitWindowIndex(records, events, days) : null, [view, collapsed, records, events, days]);
  const week = useMemo(() => {
    if (collapsed) return [];
    if (view !== "mirror") {
      return days.map(date => {
        const dayRecords = recordsByDate?.get(date) ?? [];
        const dayEvents = eventsByDate?.get(date) ?? [];
        const summary = dailyStatsForDate?.(date) ?? dailyMirrorStats(dayRecords, dayEvents, date, []);
        return { date, stats: dayStats(dayRecords, dayEvents, date, summary) };
      });
    }
    const recordsByDay = weekWindowIndex?.recordsByDate;
    const eventsByDay = weekWindowIndex?.eventsByDate;
    const hasLegacyMoodGap = days.some(date => !(eventsByDay?.get(date) ?? []).some(event => event.type === "mood" && typeof event.value === "number" && Number.isFinite(event.value) && event.value >= 1 && event.value <= 10));
    const legacyMoodHistory = hasLegacyMoodGap ? synergyData?.mood ?? [] : [];
    return days.map(date => {
      const dayRecords = recordsByDay?.get(date) ?? [];
      const dayEvents = eventsByDay?.get(date) ?? [];
      const summary = dailyMirrorStats(dayRecords, dayEvents, date, legacyMoodHistory);
      return { date, stats: dayStats(dayRecords, dayEvents, date, summary) };
    });
  }, [view, collapsed, days, records, events, recordsByDate, eventsByDate, dailyStatsForDate, weekWindowIndex, synergyData]);
  const getDayStats = (date: string) => {
    const dayRecords = recordsByDate?.get(date) ?? records.filter(record => record.date === date);
    const dayEvents = eventsByDate?.get(date) ?? events.filter(event => event.localDate === date);
    const summary = dailyStatsForDate?.(date) ?? dailyMirrorStats(dayRecords, dayEvents, date);
    return dayStats(dayRecords, dayEvents, date, summary);
  };
  const stats = useMemo(() => week.find(item => item.date === selectedDate)?.stats ?? (collapsed ? { exercise: 0, exerciseDays: 0, food: 0, habits: 0, domains: [], hasAny: false } : getDayStats(selectedDate)), [week, selectedDate, records, events, recordsByDate, eventsByDate, dailyStatsForDate, collapsed]);
  const monthDays = useMemo(() => !collapsed && view !== "mirror" ? mirrorDateRange(selectedDate, 30) : [], [collapsed, view, selectedDate]);
  const previousMonthDays = useMemo(() => !collapsed && view === "report" ? mirrorDateRange(shiftDay(selectedDate, -30), 30) : [], [collapsed, view, selectedDate]);
  const monthStats = useMemo(() => monthDays.map(date => getDayStats(date)), [monthDays, records, events, recordsByDate, eventsByDate, dailyStatsForDate]);
  const previousMonthStats = useMemo(() => previousMonthDays.map(date => getDayStats(date)), [previousMonthDays, records, events, recordsByDate, eventsByDate, dailyStatsForDate]);
  const comparisonWeek = week;
  const sleepWeek = average(comparisonWeek.filter(x => x.date !== selectedDate).map(x => x.stats.sleep).filter((v): v is number => v !== undefined));
  const moodWeek = average(comparisonWeek.filter(x => x.date !== selectedDate).map(x => x.stats.mood).filter((v): v is number => v !== undefined));
  const observedDays = week.filter(x => x.stats.hasAny).length;
  const activeDates = monthStats.filter(x => x.hasAny).length;
  const progressMilestone = [30, 14, 7, 3].find(target => activeDates >= target) ?? 0;
  const sleepAverage = average(monthStats.map(x => x.sleep).filter((v): v is number => v !== undefined));
  const previousSleepAverage = average(previousMonthStats.map(x => x.sleep).filter((v): v is number => v !== undefined));
  const moodAverage = average(monthStats.map(x => x.mood).filter((v): v is number => v !== undefined));
  const previousMoodAverage = average(previousMonthStats.map(x => x.mood).filter((v): v is number => v !== undefined));
  const pairedDays = (view === "report" ? monthStats : week.map(item => item.stats)).filter(x => x.sleep !== undefined && x.mood !== undefined);
  const pairedSleepAverage = average(pairedDays.map(x => x.sleep as number));
  const pairedMoodAverage = average(pairedDays.map(x => x.mood as number));
  const exerciseMinutes = monthStats.reduce((sum, x) => sum + x.exercise, 0);
  const previousExerciseMinutes = previousMonthStats.reduce((sum, x) => sum + x.exercise, 0);
  const domains = [
    { key: "sleep", icon: MoonStar, label: t("habitDailyExperience.domains.sleep"), value: stats.sleep === undefined ? t("habitDailyExperience.notRecorded") : t("habitDailyExperience.sleepValue", { value: fmt(stats.sleep) }), action: "sleep", recorded: stats.sleep !== undefined },
    { key: "exercise", icon: Footprints, label: t("habitDailyExperience.domains.exercise"), value: stats.exercise ? t("habitDailyExperience.minutesValue", { value: stats.exercise }) : t("habitDailyExperience.notRecorded"), action: "exercise", recorded: stats.exercise > 0 },
    { key: "nutrition", icon: Apple, label: t("habitDailyExperience.domains.nutrition"), value: stats.food ? t("habitDailyExperience.entriesValue", { value: stats.food }) : t("habitDailyExperience.notRecorded"), action: "nutrition", recorded: stats.food > 0 },
    { key: "mood", icon: Sparkles, label: t("habitDailyExperience.domains.mood"), value: stats.mood === undefined ? t("habitDailyExperience.notRecorded") : t("habitDailyExperience.moodValue", { value: fmt(stats.mood) }), action: "home", recorded: stats.mood !== undefined },
  ];
  const firstMissing = domains.find(x => !x.recorded && x.key !== "mood");
  const dateLabel = (date: string) => new Intl.DateTimeFormat(i18n.language, { day: "2-digit", month: "short", year: "numeric" }).format(new Date(date + "T12:00:00"));
  const chooseDate = (date: string) => { if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date > today) return; setSelectedDate(date); setSavedMood(null); setView("mirror"); };
  const saveMood = (value: number) => {
    appendPersonalEvents([createMoodObservationEvent(selectedDate, value)]);
    setSavedMood(value);
  };
  const report = <div className="habit-report-print space-y-3">
    <div><h3 className="text-lg font-black">{t("habitDailyExperience.reportTitle")}</h3><p className="text-xs text-[#6F5D51]">{t("habitDailyExperience.reportSubtitle", { date: dateLabel(selectedDate) })}</p></div>
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {[{label:t("habitDailyExperience.report.activeDays"),value:t("habitDailyExperience.daysValue",{value:activeDates})},{label:t("habitDailyExperience.report.sleep"),value:sleepAverage===undefined?"—":t("habitDailyExperience.sleepValue",{value:fmt(sleepAverage)})},{label:t("habitDailyExperience.report.exercise"),value:t("habitDailyExperience.minutesValue",{value:exerciseMinutes})},{label:t("habitDailyExperience.report.mood"),value:moodAverage===undefined?"—":t("habitDailyExperience.moodValue",{value:fmt(moodAverage)})}].map(item=><div key={item.label} className="rounded-2xl border border-[#E8DDD7] bg-white p-3"><p className="text-xs text-[#6F5D51]">{item.label}</p><p className="mt-1 text-xl font-black">{item.value}</p></div>)}
    </div>
    <div className="rounded-2xl bg-[#F7F3EE] p-3 text-xs leading-5 text-[#6F5D51]">
      <p>{t("habitDailyExperience.report.comparison", { sleep: sleepAverage === undefined || previousSleepAverage === undefined ? "—" : `${sleepAverage >= previousSleepAverage ? "+" : ""}${fmt(sleepAverage - previousSleepAverage)} h`, exercise: `${exerciseMinutes - previousExerciseMinutes >= 0 ? "+" : ""}${exerciseMinutes - previousExerciseMinutes} min`, mood: moodAverage === undefined || previousMoodAverage === undefined ? "—" : `${moodAverage - previousMoodAverage >= 0 ? "+" : ""}${fmt(moodAverage - previousMoodAverage)}/10` })}</p>
      <p className="mt-2">{t("habitDailyExperience.report.caution")}</p>
    </div>
    <button type="button" onClick={() => window.print()} className="no-print flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#D9C6B8] bg-white px-4 py-2 text-sm font-bold"><Printer size={16}/>{t("habitDailyExperience.printReport")}</button>
  </div>;
  return <section className={`habit-daily-experience habit-lake-reflection ${collapsed ? "is-collapsed" : ""} rounded-[30px] border border-[#A7C5C7] p-4 shadow-[0_12px_32px_rgba(42,105,117,0.13)] sm:p-5`}>
    <style>{`.habit-lake-reflection{position:relative;overflow:hidden;background:linear-gradient(165deg,#d7e8e8 0%,#a8c9cb 24%,#d5e3dd 48%,#9bbdc2 68%,#e6eee7 100%);border-color:#a7c5c7}.habit-lake-reflection:before{content:"";position:absolute;inset:0;pointer-events:none;opacity:.42;background:repeating-linear-gradient(176deg,transparent 0 13px,rgba(255,255,255,.62) 14px,rgba(255,255,255,.12) 17px,transparent 21px 35px),linear-gradient(180deg,rgba(255,255,255,.34),transparent 38%,rgba(42,105,117,.12));background-size:100% 100%,100% 100%;animation:lake-shimmer 12s ease-in-out infinite alternate}.habit-lake-reflection:after{content:"";position:absolute;left:-10%;right:-10%;top:5.2rem;height:3.8rem;pointer-events:none;opacity:.34;background:repeating-linear-gradient(178deg,rgba(255,255,255,.8) 0 2px,transparent 3px 10px);filter:blur(2px);transform:scaleY(.72)}.habit-lake-reflection>*{position:relative;z-index:1}.habit-lake-reflection .habit-lake-glass{background:rgba(250,255,252,.72);border-color:rgba(255,255,255,.78);backdrop-filter:blur(5px)}@media(max-width:768px){.habit-lake-reflection:before{animation:none}.habit-lake-reflection:after{filter:none;opacity:.18}.habit-lake-reflection .habit-lake-glass{background:rgba(250,255,252,.9);backdrop-filter:none}}@keyframes lake-shimmer{from{background-position:0 0,0 0}to{background-position:0 28px,0 0}}.habit-lake-reflection.is-collapsed:before{animation-play-state:paused}.confia-document-hidden .habit-lake-reflection:before,[hidden] .habit-lake-reflection:before{animation-play-state:paused!important}@media(prefers-reduced-motion:reduce){.habit-lake-reflection:before{animation:none}}@media print { body * { visibility: hidden !important; } .habit-report-print, .habit-report-print * { visibility: visible !important; } .habit-report-print { position: absolute !important; inset: 0 auto auto 0 !important; width: 100% !important; padding: 24px !important; background: white !important; } .habit-report-print .no-print { display: none !important; } }`}</style>
    <header className="flex items-start gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/80 text-[#356D78]"><Waves size={22}/></span><div className="flex-1"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#52777C]">{t("habitDailyExperience.eyebrow")}</p><h2 className="mt-1 text-xl font-black tracking-tight text-[#234E58]">{t("habitDailyExperience.title")}</h2><p className="mt-1 text-sm leading-5 text-[#355F65]">{t("habitDailyExperience.subtitle")}</p></div><button type="button" onClick={()=>setCollapsed(v=>!v)} aria-expanded={!collapsed} aria-label={t(collapsed?"habitDailyExperience.maximize":"habitDailyExperience.minimize")} className="flex min-h-10 shrink-0 items-center gap-1 rounded-full border border-white/90 bg-white/85 px-3 text-xs font-bold text-[#234E58] shadow-md transition hover:bg-white">{collapsed?<ChevronDown size={17}/>:<ChevronUp size={17}/>}<span className="hidden sm:inline">{t(collapsed?"habitDailyExperience.maximize":"habitDailyExperience.minimize")}</span></button></header>
    {message && <p role="status" className="mt-3 rounded-2xl border border-white/90 bg-white/80 p-3 text-sm font-semibold leading-5 text-[#365B36]">{message}</p>}
    {error && <p role="alert" className="mt-3 rounded-2xl border border-[#D9BD97] bg-[#FFF7E9]/90 p-3 text-sm leading-5 text-[#80603A]">{error}</p>}
    {!collapsed && <><nav className="mt-4 grid grid-cols-3 gap-1 rounded-2xl bg-white/55 p-1" aria-label={t("habitDailyExperience.views")}>{(["mirror","calendar","report"] as const).map(key=><button key={key} type="button" onClick={()=>setView(key)} aria-pressed={view===key} className={view===key?"min-h-10 rounded-xl bg-white/90 px-2 text-xs font-black shadow-sm":"min-h-10 rounded-xl px-2 text-xs font-bold text-[#355F65]"}>{t("habitDailyExperience.tabs."+key)}</button>)}</nav>
    {view === "mirror" && <div className="mt-4 space-y-3">
      <div className="habit-lake-glass rounded-2xl border p-4 sm:p-5"><div className="flex items-start justify-between gap-3"><div className="min-w-0 flex-1"><label className="block text-xs font-bold uppercase tracking-wide text-[#355F65]" htmlFor="habit-lake-selected-date">{t("habitDailyExperience.selectedDay", { date: dateLabel(selectedDate) })}</label><input id="habit-lake-selected-date" type="date" value={selectedDate} max={today} onChange={event => chooseDate(event.target.value)} aria-label={t("habitDailyExperience.chooseDate")} className="mt-2 min-h-11 w-full max-w-full rounded-xl border border-white bg-white/90 px-3 text-sm font-bold text-[#234E58] sm:w-auto"/><h3 className="mt-2 text-lg font-black text-[#234E58]">{t(selectedDate===today ? "habitDailyExperience.dayTitle" : "habitDailyExperience.dayPastTitle")}</h3></div><div className="shrink-0 rounded-2xl bg-white/90 px-3 py-2 text-center"><p className="text-xl font-black leading-none text-[#234E58]">{stats.domains.length}/4</p><p className="mt-1 text-[10px] leading-4 text-[#355F65]">{t("habitDailyExperience.domainsRecorded")}</p></div></div><p className="mt-2 text-xs leading-5 text-[#355F65]">{stats.hasAny ? t("habitDailyExperience.mirror.hasRecords", { count: stats.domains.length + (stats.habits ? 1 : 0) }) : t("habitDailyExperience.mirror.empty")}</p>
        <div className="mt-4 grid grid-cols-2 gap-2">{domains.map(item=>{const Icon=item.icon;return <button key={item.key} type="button" onClick={()=>onOpen(item.action)} className="flex min-h-[88px] items-start gap-3 rounded-xl border border-white/80 bg-white/75 p-3 text-left transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#356D78]"><Icon size={18} className="mt-0.5 shrink-0 text-[#356D78]"/><span className="min-w-0"><span className="block text-xs font-bold text-[#355F65]">{item.label}</span><span className="mt-1 block text-sm font-semibold text-[#332824]">{item.recorded ? item.value : t("habitDailyExperience.notRecorded")}</span><span className="mt-1 block text-[11px] text-[#6F5D51]">{item.recorded ? t("habitDailyExperience.recordedToday") : t("habitDailyExperience.noPressure")}</span></span></button>})}</div>
      </div>
      <HabitImpactReaction records={records} events={events} date={selectedDate}/>
      <div className="habit-lake-glass rounded-2xl border p-4 sm:p-5"><h3 className="text-base font-black text-[#234E58]">{t("habitDailyExperience.learningTitle")}</h3>{stats.sleep !== undefined && stats.mood !== undefined && pairedDays.length >= 5 ? <p className="mt-2 text-sm leading-6 text-[#355F65]">{t("habitDailyExperience.insight.sleepMoodHistory", { date: dateLabel(selectedDate), count: pairedDays.length, sleep: fmt(pairedSleepAverage), mood: fmt(pairedMoodAverage), currentSleep: fmt(stats.sleep), currentMood: fmt(stats.mood) })}</p> : stats.sleep !== undefined && stats.mood !== undefined ? <p className="mt-2 text-sm leading-6 text-[#355F65]">{t("habitDailyExperience.insight.sleepMood", { date: dateLabel(selectedDate), sleep: fmt(stats.sleep), mood: fmt(stats.mood), count: pairedDays.length })}</p> : stats.sleep !== undefined ? <p className="mt-2 text-sm leading-6 text-[#355F65]">{t("habitDailyExperience.insight.sleepOnly", { date: dateLabel(selectedDate), sleep: fmt(stats.sleep) })}</p> : stats.mood !== undefined ? <p className="mt-2 text-sm leading-6 text-[#355F65]">{t("habitDailyExperience.insight.moodOnly", { date: dateLabel(selectedDate), mood: fmt(stats.mood) })}</p> : <p className="mt-2 text-sm leading-6 text-[#355F65]">{t("habitDailyExperience.insight.empty")}</p>}{(stats.sleep !== undefined && sleepWeek !== undefined) || (stats.mood !== undefined && moodWeek !== undefined) ? <details className="mt-3 rounded-xl border border-white/90 bg-white/55 p-3"><summary className="min-h-10 cursor-pointer py-2 text-xs font-bold text-[#234E58]">{t("habitDailyExperience.comparisonDetails")}</summary>{stats.sleep !== undefined && sleepWeek !== undefined && <p className="mt-2 text-xs leading-5 text-[#6F5D51]">{t("habitDailyExperience.sleepCompare", { date: dateLabel(selectedDate), current: fmt(stats.sleep), average: fmt(sleepWeek) })}</p>}{stats.mood !== undefined && moodWeek !== undefined && <p className="mt-2 text-xs leading-5 text-[#6F5D51]">{t("habitDailyExperience.moodCompare", { date: dateLabel(selectedDate), current: fmt(stats.mood), average: fmt(moodWeek) })}</p>}</details> : null}<p className="mt-3 flex items-start gap-2 border-t border-white/80 pt-3 text-xs leading-5 text-[#52656A]"><Sparkles size={15} className="mt-0.5 shrink-0"/>{t("habitDailyExperience.insight.caution")}</p>
        {firstMissing && <button type="button" onClick={()=>onOpen(firstMissing.action)} className="mt-4 min-h-11 rounded-xl bg-[#E4EDD9] px-4 py-2 text-left text-sm font-bold text-[#365B36] transition hover:bg-[#D8E7CC]">{t("habitDailyExperience.quickCheckin", { domain: firstMissing.label })} →</button>}
        {(stats.mood === undefined || savedMood !== null) && <div className="mt-4 border-t border-white/80 pt-3"><p className="text-sm font-bold">{t("habitDailyExperience.moodCheckinTitle")}</p>{savedMood===null&&<><p className="mt-1 text-xs leading-5 text-[#6F5D51]">{t("habitDailyExperience.moodScaleLabel")}</p><div className="mt-2 grid grid-cols-5 gap-1 sm:grid-cols-10">{Array.from({length:10},(_,i)=>i+1).map(value=><button key={value} type="button" onClick={()=>saveMood(value)} aria-label={t("habitDailyExperience.moodValue",{value})} className="min-h-10 rounded-lg border border-[#D7E2E2] bg-white/90 text-xs font-black transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#356D78]">{value}</button>)}</div></>}{savedMood!==null&&<p role="status" className="mt-2 text-xs font-bold text-[#365B36]">{t("habitDailyExperience.moodSaved",{value:savedMood})}</p>}</div>}
      </div>
      <section className="space-y-4 rounded-2xl border border-white/80 bg-white/35 p-3 sm:p-4" aria-labelledby="habit-evolution-title">
        <header><h3 id="habit-evolution-title" className="text-lg font-black text-[#234E58]">{t("habitDailyExperience.evolutionTitle")}</h3><p className="mt-1 text-sm leading-5 text-[#355F65]">{t("habitDailyExperience.evolutionSubtitle")}</p></header>
        <div className="habit-lake-glass rounded-2xl border p-3 sm:p-4"><p className="mb-3 text-sm font-bold text-[#234E58]">{t("companionSynergy.eyebrow")}</p><LifestyleMirror records={records} events={events} today={selectedDate}/></div>
        <section className="habit-lake-glass rounded-2xl border p-4"><h4 className="font-bold text-[#234E58]">{t("companionSynergy.analysisTitle")}</h4><p className="mt-2 whitespace-pre-line text-sm leading-6 text-[#355F65]">{synergyText ?? t("companionSynergy.waiting")}</p>{synergy && <p className="mt-3 rounded-xl bg-white/75 p-3 text-xs leading-5 text-[#52654A]">{t("companionSynergy.hypothesis")}</p>}</section>
        <Suspense fallback={<p className="text-xs">{t("loading")}</p>}><div className="space-y-4"><LifestyleReview records={records} date={selectedDate} today={selectedDate} compact/><HabitInsights events={events} today={selectedDate}/><PersonalLakeReflection events={events} onOpenDate={chooseDate}/></div></Suspense>
      </section>
    </div>}
    {view === "calendar" && <div className="mt-4 space-y-3">{progressMilestone > 0 && <p className="rounded-2xl border border-[#D7E2CB] bg-[#F0F6E9] p-3 text-xs font-bold leading-5 text-[#3F6240]">{t("habitDailyExperience.progressMilestone", { count: progressMilestone })}</p>}<p className="text-xs leading-5 text-[#6F5D51]">{t("habitDailyExperience.calendarIntro")}</p><div className="grid grid-cols-7 gap-1">{week.map(({date,stats: item})=><button key={date} type="button" onClick={()=>chooseDate(date)} aria-pressed={selectedDate===date} className={`min-h-[74px] rounded-xl border p-1 text-center ${selectedDate===date?"border-[#68805B] bg-[#E4EDD9]":"border-[#E8DDD7] bg-white"}`}><span className="block text-[10px] font-bold">{dateLabel(date)}</span><span className="mt-2 flex justify-center gap-0.5" aria-label={t("habitDailyExperience.observedDomains", {count:item.domains.length})}>{item.domains.slice(0,4).map((domain,i)=><span key={domain} className="h-1.5 w-1.5 rounded-full bg-[#6F8D5D]" style={{opacity:0.6+i*0.1}}/>)}{!item.hasAny&&<span className="h-1.5 w-1.5 rounded-full bg-[#D8D1C8]"/>}</span><span className="mt-1 block text-[9px] text-[#6F5D51]">{item.hasAny?t("habitDailyExperience.recorded"):t("habitDailyExperience.rest")}</span></button>)}</div><div className="rounded-2xl bg-white p-4"><p className="text-sm font-black">{t("habitDailyExperience.gardenTitle")}</p><p className="mt-1 text-xs text-[#6F5D51]">{t("habitDailyExperience.gardenText", {count:observedDays})}</p><div className="mt-3 flex items-end justify-around rounded-xl bg-gradient-to-b from-[#EFF4E9] to-[#DDE9D3] p-3">{week.map(({date,stats:item},i)=><span key={date} className="flex min-w-0 flex-col items-center"><span className="text-xl" aria-hidden="true">{item.hasAny?(i%3===0?"🌼":i%3===1?"🌿":"🌱"):"·"}</span><span className="mt-1 text-[9px] text-[#52654A]">{i+1}</span></span>)}</div></div></div>}
    {view === "report" && <div className="mt-4">{report}</div>}</>}
  </section>;
}
