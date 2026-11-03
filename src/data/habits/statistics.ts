import { nutritionTotals } from "./nutrition";
import type { HabitRecord, FoodType } from "./types";
import { FOOD_TYPES } from "./types";
import { localDay, shiftDay, weekStart } from "./calendar";
export function habitStats(records: HabitRecord[], habitId: string, today = localDay()) {
  const logs = records
    .filter((r): r is Extract<HabitRecord,{kind:"habitLog"}> => r.kind === "habitLog" && r.data.habitId === habitId && r.date <= today)
    .sort((a,b)=>a.date.localeCompare(b.date));
  const restarts = records
    .filter((r): r is Extract<HabitRecord,{kind:"restart"}> => r.kind === "restart" && r.data.habitId === habitId && r.date <= today)
    .sort((a,b)=>a.updatedAt.localeCompare(b.updatedAt));
  const summary = records.find(r=>r.kind==="summary" && r.data.habitId===habitId);
  const saved = summary?.kind==="summary" ? summary.data : undefined;
  const lastRestart = restarts.at(-1);
  const restartAt = lastRestart?.updatedAt ?? "";
  const savedCycleAt = saved?.cycleAt ?? "";
  const cycleAt = restartAt > savedCycleAt ? restartAt : savedCycleAt;
  const cycleDate = restartAt === cycleAt ? lastRestart?.date : saved?.cycleDate;

  const eligible = logs.filter(r => !cycleAt || r.updatedAt > cycleAt);
  const completed = eligible.filter(r => r.data.completed);
  const successes = logs.filter(r => r.data.completed);
  const byDay = new Map(eligible.map(r=>[r.date,r]));
  const cycleStart = lastRestart
    ? (completed[0]?.date ?? "")
    : [completed[0]?.date, saved?.runStart].filter((value): value is string => Boolean(value)).sort().at(0) ?? "";
  const current = cycleStart
    ? Math.max(0, Math.floor((new Date(today+"T12:00:00").getTime()-new Date(cycleStart+"T12:00:00").getTime())/86400000)+1)
    : 0;
  const runEnd = current > 0 ? today : "";

  // Walk the ordered log and restart streams once. The former implementation
  // searched every restart for every log (O(logs × restarts)).
  let run = 0;
  let best = saved?.best ?? 0;
  for (const restart of restarts) best = Math.max(best, restart.data.bestBefore ?? 0);
  const logsHaveOrderedTimestamps = logs.every((log, index) => index === 0 || logs[index - 1].updatedAt <= log.updatedAt);
  let previous: typeof logs[number] | undefined;
  let restartCursor = 0;
  for (const log of logs) {
    let resetBetween = false;
    if (previous && logsHaveOrderedTimestamps) {
      while (restartCursor < restarts.length && restarts[restartCursor].updatedAt <= previous.updatedAt) restartCursor++;
      for (let index = restartCursor; index < restarts.length && restarts[index].updatedAt < log.updatedAt; index++) {
        const restart = restarts[index];
        if (restart.date >= previous.date && restart.date <= log.date) { resetBetween = true; break; }
      }
    } else if (previous) {
      // Retroactive edits can make update timestamps non-monotonic by day.
      // Preserve the original exact semantics for that uncommon case.
      resetBetween = restarts.some(restart => restart.updatedAt > previous!.updatedAt && restart.updatedAt < log.updatedAt && restart.date >= previous!.date && restart.date <= log.date);
    }
    run = log.data.completed
      ? (previous && shiftDay(previous.date,1) === log.date && !resetBetween ? run+1 : 1)
      : 0;
    best = Math.max(best,run);
    previous = log;
  }

  let last30 = 0;
  for (const log of successes) if (log.date >= shiftDay(today,-29)) last30++;
  return {
    current,
    best: Math.max(best,current),
    total: Math.max(saved?.total ?? 0, successes.length),
    runStart: current && runEnd ? shiftDay(runEnd,1-current) : "",
    runEnd,
    cycleAt,
    cycleDate: cycleDate ?? "",
    last30,
    today: byDay.get(today)?.data.completed,
    yesterday: byDay.get(shiftDay(today,-1))?.data.completed,
    cycleStart: lastRestart?.date,
    awaitingYesterday: false,
  };
}
export function progressStage(days: number): number { return days >= 30 ? 4 : days >= 14 ? 3 : days >= 7 ? 2 : days >= 3 ? 1 : 0; }
export function nutritionWeek(records: HabitRecord[], start = weekStart(), end = shiftDay(start,6)) {
  const byDate = new Map<string, HabitRecord[]>();
  const recordedDates = new Set<string>();
  for (const record of records) {
    if (record.date < start || record.date > end) continue;
    if (record.kind === "nutrition") recordedDates.add(record.date);
    const rows = byDate.get(record.date) ?? [];
    rows.push(record);
    byDate.set(record.date, rows);
  }
  const totalsByDate = new Map<string, Partial<Record<FoodType,number>>>();
  for (const date of recordedDates) totalsByDate.set(date, nutritionTotals(byDate.get(date) ?? [], date));
  return FOOD_TYPES.map(key => {
    const values = [...totalsByDate.values()].map(totals => totals[key]).filter((n): n is number => typeof n === "number");
    return { key: key as FoodType, recorded: values.length, positive: values.filter(n=>n>0).length, average: values.length ? values.reduce((a,b)=>a+b,0)/values.length : undefined };
  });
}
export function exerciseWeek(records: HabitRecord[], start = weekStart(), end = shiftDay(start,6)) {
  let minutes = 0;
  const days = new Set<string>();
  const activityCounts = new Map<string,number>();
  for (const record of records) {
    if (record.kind !== "exercise" || record.date < start || record.date > end) continue;
    minutes += record.data.minutes;
    days.add(record.date);
    if (record.data.minutes <= 0) continue;
    activityCounts.set(record.data.activity, (activityCounts.get(record.data.activity) ?? 0) + 1);
  }
  return { minutes, days: days.size, activities: [...activityCounts].map(([activity,count])=>({activity,count})) };
}
