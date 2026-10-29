import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Leaf, MoonStar, Footprints, Apple, Sparkles, Printer } from "lucide-react";
import type { HabitRecord } from "../../data/habits/types";
import type { PersonalEvent } from "../../data/personal/personalEvent";
import { shiftDay } from "../../data/habits/calendar";
import { nutritionTotals } from "../../data/habits/nutrition";
import { appendPersonalEvents } from "../../data/personal/personalEventStorage";
import { createPersonalEventId, makePersonalEvent } from "../../data/personal/personalEvent";

type Props = { records: HabitRecord[]; events: PersonalEvent[]; today: string; onOpen: (page: string) => void; onSelectDate: (date: string) => void };
type DayStats = { sleep?: number; exercise: number; exerciseDays: number; food: number; habits: number; mood?: number; domains: string[]; hasAny: boolean };
function dayStats(records: HabitRecord[], events: PersonalEvent[], date: string): DayStats {
  const sleepRows = records.filter((r): r is Extract<HabitRecord, {kind:"sleep"}> => r.kind === "sleep" && r.date === date);
  const exerciseRows = records.filter((r): r is Extract<HabitRecord, {kind:"exercise"}> => r.kind === "exercise" && r.date === date && r.data.minutes > 0);
  const foodRows = records.filter((r): r is Extract<HabitRecord, {kind:"foodItem"}> => r.kind === "foodItem" && r.date === date && !r.data.deleted && r.data.quantity > 0);
  const nutritionRows = records.some(r => r.kind === "nutrition" && r.date === date) && Object.values(nutritionTotals(records, date)).some(v => typeof v === "number" && v > 0);
  const habitRows = records.filter(r => r.kind === "habitLog" && r.date === date);
  const moodRows = events.filter(e => e.type === "mood" && e.localDate === date && typeof e.value === "number" && Number.isFinite(e.value));
  const mood = moodRows.length ? moodRows.reduce((sum, e) => sum + Number(e.value), 0) / moodRows.length : undefined;
  const sleep = sleepRows.length ? sleepRows.reduce((sum, r) => sum + r.data.hours, 0) / sleepRows.length : undefined;
  const domains = [sleep !== undefined ? "sleep" : "", exerciseRows.length ? "exercise" : "", foodRows.length || nutritionRows ? "nutrition" : "", mood !== undefined ? "mood" : ""].filter(Boolean);
  return { sleep, exercise: exerciseRows.reduce((sum, r) => sum + r.data.minutes, 0), exerciseDays: exerciseRows.length ? 1 : 0, food: foodRows.length + (nutritionRows ? 1 : 0), habits: habitRows.length, mood, domains, hasAny: domains.length > 0 || habitRows.length > 0 };
}
const average = (values: number[]) => values.length ? values.reduce((sum, v) => sum + v, 0) / values.length : undefined;
const fmt = (value: number | undefined, digits = 1) => value === undefined ? "—" : new Intl.NumberFormat(undefined, { maximumFractionDigits: digits }).format(value);

export default function HabitDailyExperience({ records, events, today, onOpen, onSelectDate }: Props) {
  const { t, i18n } = useTranslation();
  const [view, setView] = useState<"mirror" | "calendar" | "report">("mirror");
  const [selectedDate, setSelectedDate] = useState(today);
  const [savedMood, setSavedMood] = useState<number | null>(null);
  useEffect(() => setSelectedDate(today), [today]);
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => shiftDay(today, i - 6)), [today]);
  const stats = useMemo(() => dayStats(records, events, selectedDate), [records, events, selectedDate]);
  const week = useMemo(() => days.map(date => ({ date, stats: dayStats(records, events, date) })), [days, records, events]);
  const monthDays = useMemo(() => Array.from({ length: 30 }, (_, i) => shiftDay(today, i - 29)), [today]);
  const previousMonthDays = useMemo(() => monthDays.map(date => shiftDay(date, -30)), [monthDays]);
  const monthStats = useMemo(() => monthDays.map(date => dayStats(records, events, date)), [monthDays, records, events]);
  const previousMonthStats = useMemo(() => previousMonthDays.map(date => dayStats(records, events, date)), [previousMonthDays, records, events]);
  const sleepWeek = average(week.filter(x => x.date !== selectedDate).map(x => x.stats.sleep).filter((v): v is number => v !== undefined));
  const moodWeek = average(week.filter(x => x.date !== selectedDate).map(x => x.stats.mood).filter((v): v is number => v !== undefined));
  const observedDays = week.filter(x => x.stats.hasAny).length;
  const activeDates = monthStats.filter(x => x.hasAny).length;
  const progressMilestone = [30, 14, 7, 3].find(target => activeDates >= target) ?? 0;
  const sleepAverage = average(monthStats.map(x => x.sleep).filter((v): v is number => v !== undefined));
  const previousSleepAverage = average(previousMonthStats.map(x => x.sleep).filter((v): v is number => v !== undefined));
  const moodAverage = average(monthStats.map(x => x.mood).filter((v): v is number => v !== undefined));
  const previousMoodAverage = average(previousMonthStats.map(x => x.mood).filter((v): v is number => v !== undefined));
  const exerciseMinutes = monthStats.reduce((sum, x) => sum + x.exercise, 0);
  const previousExerciseMinutes = previousMonthStats.reduce((sum, x) => sum + x.exercise, 0);
  const domains = [
    { key: "sleep", icon: MoonStar, label: t("habitDailyExperience.domains.sleep"), value: stats.sleep === undefined ? t("habitDailyExperience.notRecorded") : t("habitDailyExperience.sleepValue", { value: fmt(stats.sleep) }), action: "sleep", recorded: stats.sleep !== undefined },
    { key: "exercise", icon: Footprints, label: t("habitDailyExperience.domains.exercise"), value: stats.exercise ? t("habitDailyExperience.minutesValue", { value: stats.exercise }) : t("habitDailyExperience.notRecorded"), action: "exercise", recorded: stats.exercise > 0 },
    { key: "nutrition", icon: Apple, label: t("habitDailyExperience.domains.nutrition"), value: stats.food ? t("habitDailyExperience.entriesValue", { value: stats.food }) : t("habitDailyExperience.notRecorded"), action: "nutrition", recorded: stats.food > 0 },
    { key: "mood", icon: Sparkles, label: t("habitDailyExperience.domains.mood"), value: stats.mood === undefined ? t("habitDailyExperience.notRecorded") : t("habitDailyExperience.moodValue", { value: fmt(stats.mood) }), action: "home", recorded: stats.mood !== undefined },
  ];
  const firstMissing = domains.find(x => !x.recorded && x.key !== "mood");
  const dateLabel = (date: string) => new Intl.DateTimeFormat(i18n.language, { day: "2-digit", month: "short" }).format(new Date(date + "T12:00:00"));
  const chooseDate = (date: string) => { setSelectedDate(date); setSavedMood(null); onSelectDate(date); setView("mirror"); };
  const saveMood = (value: number) => {
    const timestamp = new Date().toISOString();
    appendPersonalEvents([makePersonalEvent({ id: createPersonalEventId("mood", timestamp), type: "mood", source: "daily_rating", timestamp, localDate: selectedDate, value, metadata: { moment: "evening", source: "habit_quick_checkin" } })]);
    setSavedMood(value);
  };
  const report = <div className="habit-report-print space-y-3">
    <div><h3 className="text-lg font-black">{t("habitDailyExperience.reportTitle")}</h3><p className="text-xs text-[#6F5D51]">{t("habitDailyExperience.reportSubtitle", { date: dateLabel(today) })}</p></div>
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {[{label:t("habitDailyExperience.report.activeDays"),value:t("habitDailyExperience.daysValue",{value:activeDates})},{label:t("habitDailyExperience.report.sleep"),value:sleepAverage===undefined?"—":t("habitDailyExperience.sleepValue",{value:fmt(sleepAverage)})},{label:t("habitDailyExperience.report.exercise"),value:t("habitDailyExperience.minutesValue",{value:exerciseMinutes})},{label:t("habitDailyExperience.report.mood"),value:moodAverage===undefined?"—":t("habitDailyExperience.moodValue",{value:fmt(moodAverage)})}].map(item=><div key={item.label} className="rounded-2xl border border-[#E8DDD7] bg-white p-3"><p className="text-xs text-[#6F5D51]">{item.label}</p><p className="mt-1 text-xl font-black">{item.value}</p></div>)}
    </div>
    <div className="rounded-2xl bg-[#F7F3EE] p-3 text-xs leading-5 text-[#6F5D51]">
      <p>{t("habitDailyExperience.report.comparison", { sleep: sleepAverage === undefined || previousSleepAverage === undefined ? "—" : `${sleepAverage >= previousSleepAverage ? "+" : ""}${fmt(sleepAverage - previousSleepAverage)} h`, exercise: `${exerciseMinutes - previousExerciseMinutes >= 0 ? "+" : ""}${exerciseMinutes - previousExerciseMinutes} min`, mood: moodAverage === undefined || previousMoodAverage === undefined ? "—" : `${moodAverage - previousMoodAverage >= 0 ? "+" : ""}${fmt(moodAverage - previousMoodAverage)}/10` })}</p>
      <p className="mt-2">{t("habitDailyExperience.report.caution")}</p>
    </div>
    <button type="button" onClick={() => window.print()} className="no-print flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#D9C6B8] bg-white px-4 py-2 text-sm font-bold"><Printer size={16}/>{t("habitDailyExperience.printReport")}</button>
  </div>;
  return <section className="rounded-[28px] border border-[#D8D0C2] bg-gradient-to-br from-[#FFFEFA] to-[#F7F4EC] p-4 sm:p-5">
    <style>{`@media print { body * { visibility: hidden !important; } .habit-report-print, .habit-report-print * { visibility: visible !important; } .habit-report-print { position: absolute !important; inset: 0 auto auto 0 !important; width: 100% !important; padding: 24px !important; background: white !important; } .habit-report-print .no-print { display: none !important; } }`}</style>
    <header className="flex items-start gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white text-[#5B7652]"><Leaf size={22}/></span><div className="flex-1"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#68805B]">{t("habitDailyExperience.eyebrow")}</p><h2 className="text-lg font-black">{t("habitDailyExperience.title")}</h2><p className="mt-1 text-xs leading-5 text-[#6F5D51]">{t("habitDailyExperience.subtitle")}</p></div></header>
    <nav className="mt-4 grid grid-cols-3 gap-1 rounded-2xl bg-[#EEE9DF] p-1" aria-label={t("habitDailyExperience.views")}>{(["mirror","calendar","report"] as const).map(key=><button key={key} type="button" onClick={()=>setView(key)} aria-pressed={view===key} className={view===key?"min-h-10 rounded-xl bg-white px-2 text-xs font-black shadow-sm":"min-h-10 rounded-xl px-2 text-xs font-bold text-[#6F5D51]"}>{t("habitDailyExperience.tabs."+key)}</button>)}</nav>
    {view === "mirror" && <div className="mt-4 space-y-3">
      {progressMilestone > 0 && <p className="rounded-2xl border border-[#D7E2CB] bg-[#F0F6E9] p-3 text-xs font-bold leading-5 text-[#3F6240]">{t("habitDailyExperience.progressMilestone", { count: progressMilestone })}</p>}
      <div className="rounded-2xl border border-[#E8DDD7] bg-white p-4"><p className="text-xs font-bold text-[#6F5D51]">{t("habitDailyExperience.selectedDay", { date: dateLabel(selectedDate) })}</p><p className="mt-1 text-sm font-black">{stats.hasAny ? t("habitDailyExperience.mirror.hasRecords", { count: stats.domains.length + (stats.habits ? 1 : 0) }) : t("habitDailyExperience.mirror.empty")}</p>
        <div className="mt-3 grid grid-cols-2 gap-2">{domains.map(item=>{const Icon=item.icon;return <button key={item.key} type="button" onClick={()=>onOpen(item.action)} className="flex min-h-[82px] items-start gap-2 rounded-xl bg-[#F8F6F1] p-3 text-left"><Icon size={17} className="mt-0.5 shrink-0 text-[#68805B]"/><span><span className="block text-xs font-black">{item.label}</span><span className="mt-1 block text-xs text-[#6F5D51]">{item.value}</span></span></button>})}</div>
      </div>
      <div className="rounded-2xl bg-white p-4"><h3 className="text-sm font-black">{t("habitDailyExperience.learningTitle")}</h3>{stats.sleep !== undefined && sleepWeek !== undefined ? <p className="mt-2 text-xs leading-5 text-[#6F5D51]">{t("habitDailyExperience.sleepCompare", { current: fmt(stats.sleep), average: fmt(sleepWeek) })}</p> : <p className="mt-2 text-xs leading-5 text-[#6F5D51]">{t("habitDailyExperience.learningEmpty")}</p>}{stats.mood !== undefined && moodWeek !== undefined && <p className="mt-2 text-xs leading-5 text-[#6F5D51]">{t("habitDailyExperience.moodCompare", { current: fmt(stats.mood), average: fmt(moodWeek) })}</p>}
        {firstMissing && <button type="button" onClick={()=>onOpen(firstMissing.action)} className="mt-3 min-h-11 rounded-xl bg-[#E4EDD9] px-4 py-2 text-left text-xs font-black text-[#365B36]">{t("habitDailyExperience.quickCheckin", { domain: firstMissing.label })} →</button>}
        {(stats.mood === undefined || savedMood !== null) && <div className="mt-4 border-t border-[#E8DDD7] pt-3"><p className="text-xs font-black">{t("habitDailyExperience.moodCheckinTitle")}</p>{savedMood===null&&<><p className="mt-1 text-[11px] text-[#6F5D51]">{t("habitDailyExperience.moodScaleLabel")}</p><div className="mt-2 grid grid-cols-5 gap-1 sm:grid-cols-10">{Array.from({length:10},(_,i)=>i+1).map(value=><button key={value} type="button" onClick={()=>saveMood(value)} aria-label={t("habitDailyExperience.moodValue",{value})} className="min-h-9 rounded-lg border border-[#E8DDD7] bg-white text-xs font-black">{value}</button>)}</div></>}{savedMood!==null&&<p role="status" className="mt-2 text-xs font-bold text-[#365B36]">{t("habitDailyExperience.moodSaved",{value:savedMood})}</p>}</div>}
      </div>
    </div>}
    {view === "calendar" && <div className="mt-4 space-y-3"><p className="text-xs leading-5 text-[#6F5D51]">{t("habitDailyExperience.calendarIntro")}</p><div className="grid grid-cols-7 gap-1">{week.map(({date,stats: item})=><button key={date} type="button" onClick={()=>chooseDate(date)} aria-pressed={selectedDate===date} className={`min-h-[74px] rounded-xl border p-1 text-center ${selectedDate===date?"border-[#68805B] bg-[#E4EDD9]":"border-[#E8DDD7] bg-white"}`}><span className="block text-[10px] font-bold">{dateLabel(date)}</span><span className="mt-2 flex justify-center gap-0.5" aria-label={t("habitDailyExperience.observedDomains", {count:item.domains.length})}>{item.domains.slice(0,4).map((domain,i)=><span key={domain} className="h-1.5 w-1.5 rounded-full bg-[#6F8D5D]" style={{opacity:0.6+i*0.1}}/>)}{!item.hasAny&&<span className="h-1.5 w-1.5 rounded-full bg-[#D8D1C8]"/>}</span><span className="mt-1 block text-[9px] text-[#6F5D51]">{item.hasAny?t("habitDailyExperience.recorded"):t("habitDailyExperience.rest")}</span></button>)}</div><div className="rounded-2xl bg-white p-4"><p className="text-sm font-black">{t("habitDailyExperience.gardenTitle")}</p><p className="mt-1 text-xs text-[#6F5D51]">{t("habitDailyExperience.gardenText", {count:observedDays})}</p><div className="mt-3 flex items-end justify-around rounded-xl bg-gradient-to-b from-[#EFF4E9] to-[#DDE9D3] p-3">{week.map(({date,stats:item},i)=><span key={date} className="flex min-w-0 flex-col items-center"><span className="text-xl" aria-hidden="true">{item.hasAny?(i%3===0?"🌼":i%3===1?"🌿":"🌱"):"·"}</span><span className="mt-1 text-[9px] text-[#52654A]">{i+1}</span></span>)}</div></div></div>}
    {view === "report" && <div className="mt-4">{report}</div>}
  </section>;
}
