import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { HabitRecord } from "../../data/habits/types";
import type { PersonalEvent } from "../../data/personal/personalEvent";
import { shiftDay } from "../../data/habits/calendar";

function summarize(records: HabitRecord[], events: PersonalEvent[], today: string, days: number) {
  const start = shiftDay(today, -(days - 1));
  const inWindow = (date: string) => date >= start && date <= today;
  const measured = records.filter(record => inWindow(record.date) && ["sleep", "exercise", "nutrition", "foodItem", "habitLog"].includes(record.kind) &&
    !(record.kind === "foodItem" && record.data.deleted));
  const sleep = measured.filter((record): record is Extract<HabitRecord, { kind: "sleep" }> => record.kind === "sleep");
  const exercise = measured.filter((record): record is Extract<HabitRecord, { kind: "exercise" }> => record.kind === "exercise");
  const moodByDay = new Map<string, number[]>();
  for (const event of events) {
    if (event.type !== "mood" || typeof event.value !== "number" || !Number.isFinite(event.value) || !inWindow(event.localDate)) continue;
    moodByDay.set(event.localDate, [...(moodByDay.get(event.localDate) ?? []), event.value]);
  }
  const moodValues = [...moodByDay.values()].map(values => values.reduce((sum, value) => sum + value, 0) / values.length);
  const mean = (values: number[]) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : undefined;
  return {
    daysWithRecords: new Set(measured.map(record => record.date)).size,
    sleepAverage: mean(sleep.map(record => record.data.hours)),
    sleepDays: sleep.length,
    exerciseMinutes: exercise.reduce((sum, record) => sum + record.data.minutes, 0),
    exerciseDays: new Set(exercise.filter(record => record.data.minutes > 0).map(record => record.date)).size,
    moodAverage: mean(moodValues),
    moodDays: moodValues.length,
  };
}
function value(value: number | undefined, digits = 1) { return value === undefined ? "—" : value.toFixed(digits); }

export default function HabitTrends({ records, events, today }: { records: HabitRecord[]; events: PersonalEvent[]; today: string }) {
  const { t } = useTranslation();
  const week = useMemo(() => summarize(records, events, today, 7), [records, events, today]);
  const weekPrevious = useMemo(() => summarize(records, events, shiftDay(today, -7), 7), [records, events, today]);
  const month = useMemo(() => summarize(records, events, today, 30), [records, events, today]);
  const monthPrevious = useMemo(() => summarize(records, events, shiftDay(today, -30), 30), [records, events, today]);
  const delta = (current: number | undefined, previous: number | undefined, suffix: string) => {
    if (current === undefined || previous === undefined) return t("habitTrends.noComparison");
    const difference = Math.round((current - previous) * 10) / 10;
    return t("habitTrends.comparison", { value: `${difference > 0 ? "+" : ""}${difference.toFixed(1)}${suffix}` });
  };
  return <section className="space-y-3" aria-labelledby="habit-trends-title">
    <div><h2 id="habit-trends-title" className="text-lg font-black">{t("habitTrends.title")}</h2><p className="mt-1 text-xs leading-5 text-[#6F5D51]">{t("habitTrends.subtitle")}</p></div>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {([{ key: "week", days: 7, data: week, previous: weekPrevious }, { key: "month", days: 30, data: month, previous: monthPrevious }] as const).map(period => <article key={period.key} className="rounded-[24px] border border-[#E8DDD7] bg-white p-4">
        <h3 className="font-black">{t("habitTrends.period", { days: period.days })}</h3>
        <p className="mt-1 text-xs text-[#806F63]">{t("habitTrends.daysWithRecords", { count: period.data.daysWithRecords })}</p>
        <dl className="mt-3 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-[#F6F2EC] p-3"><dt className="text-xs leading-4 text-[#6F5D51]">{t("habitTrends.sleep")}</dt><dd className="mt-1 text-xl font-black">{value(period.data.sleepAverage)}<span className="ml-1 text-xs font-medium">{t("habitTrends.hours")}</span></dd><p className="mt-1 text-[11px] text-[#806F63]">{t("habitTrends.measuredDays", { count: period.data.sleepDays })}</p><p className="mt-1 text-[11px] text-[#806F63]">{delta(period.data.sleepAverage, period.previous.sleepAverage, " h")}</p></div>
          <div className="rounded-xl bg-[#F6F2EC] p-3"><dt className="text-xs leading-4 text-[#6F5D51]">{t("habitTrends.exercise")}</dt><dd className="mt-1 text-xl font-black">{period.data.exerciseMinutes}<span className="ml-1 text-xs font-medium">{t("habitTrends.minutes")}</span></dd><p className="mt-1 text-[11px] text-[#806F63]">{t("habitTrends.activeDays", { count: period.data.exerciseDays })}</p><p className="mt-1 text-[11px] text-[#806F63]">{delta(period.data.exerciseMinutes, period.previous.exerciseMinutes, " min")}</p></div>
          <div className="col-span-2 rounded-xl bg-[#F6F2EC] p-3"><dt className="text-xs leading-4 text-[#6F5D51]">{t("habitTrends.mood")}</dt><dd className="mt-1 text-xl font-black">{value(period.data.moodAverage)}<span className="ml-1 text-xs font-medium">/10</span></dd><p className="mt-1 text-[11px] text-[#806F63]">{t("habitTrends.measuredDays", { count: period.data.moodDays })}</p><p className="mt-1 text-[11px] text-[#806F63]">{delta(period.data.moodAverage, period.previous.moodAverage, "")}</p></div>
        </dl>
      </article>)}
    </div>
    <p className="text-xs leading-5 text-[#806F63]">{t("habitTrends.disclaimer")}</p>
  </section>;
}
