import { nutritionTotals } from "./nutrition";
import type { HabitRecord, FoodType } from "./types";
import { FOOD_TYPES } from "./types";
import { localDay, shiftDay, weekStart } from "./calendar";
export function habitStats(records: HabitRecord[], habitId: string, today = localDay()) {
  const logs = records.filter((r): r is Extract<HabitRecord,{kind:"habitLog"}> => r.kind === "habitLog" && r.data.habitId === habitId && r.date <= today).sort((a,b)=>a.date.localeCompare(b.date));
  const restarts = records.filter((r): r is Extract<HabitRecord,{kind:"restart"}> => r.kind === "restart" && r.data.habitId === habitId && r.date <= today).sort((a,b)=>a.updatedAt.localeCompare(b.updatedAt));
  const summary = records.find(r=>r.kind==="summary" && r.data.habitId===habitId);
  const saved = summary?.kind==="summary" ? summary.data : undefined;
  const lastRestart = restarts.at(-1);
  const cycleAt = [lastRestart?.updatedAt??"",saved?.cycleAt??""].sort().at(-1)!;
  const cycleDate = lastRestart?.updatedAt===cycleAt ? lastRestart.date : saved?.cycleDate;

  const eligible = logs.filter(r => !cycleAt || (r.date >= (cycleDate??"") && r.updatedAt > cycleAt));
  const byDay = new Map(eligible.map(r=>[r.date,r]));
  let anchor = today;
  if (!byDay.has(anchor)) anchor = shiftDay(anchor,-1);
  // One full local day to confirm yesterday. Missing entries never become failures.
  if (!byDay.has(anchor) && anchor === shiftDay(today,-1)) anchor = shiftDay(anchor,-1);
  const runEnd = byDay.get(anchor)?.data.completed ? anchor : "";
  let current = 0;
  while (byDay.get(anchor)?.data.completed) { current++; anchor = shiftDay(anchor,-1); }
  if (!byDay.has(anchor) && saved?.runStart && saved.cycleAt===cycleAt && anchor>=saved.runStart && anchor<=saved.runEnd && current>0) {
    let day=anchor;
    while(day>=saved.runStart){current++;day=shiftDay(day,-1);}
  }
  let run = 0, best = Math.max(saved?.best??0,...restarts.map(r=>r.data.bestBefore??0)), previous: typeof logs[number] | undefined;
  for (const log of logs) {
    const resetBetween = previous && restarts.some(r=>r.updatedAt > previous!.updatedAt && r.updatedAt < log.updatedAt && r.date >= previous!.date && r.date <= log.date);
    run = log.data.completed ? (previous && shiftDay(previous.date,1) === log.date && !resetBetween ? run+1 : 1) : 0;
    best = Math.max(best,run); previous = log;
  }
  const successes = logs.filter(r=>r.data.completed);
  return { current, best: Math.max(best,current), total: Math.max(saved?.total??0,successes.length),
    runStart: current && runEnd ? shiftDay(runEnd,1-current) : "", runEnd, cycleAt, cycleDate:cycleDate??"",
    last30: successes.filter(r=>r.date >= shiftDay(today,-29)).length,
    today: byDay.get(today)?.data.completed,
    yesterday: byDay.get(shiftDay(today,-1))?.data.completed,
    cycleStart: lastRestart?.date,
    awaitingYesterday: !byDay.has(shiftDay(today,-1)) && current > 0 };
}
export function progressStage(days: number): number { return days >= 30 ? 4 : days >= 14 ? 3 : days >= 7 ? 2 : days >= 3 ? 1 : 0; }
export function nutritionWeek(records: HabitRecord[], start = weekStart(), end = shiftDay(start,6)) {
  const days = records.filter((r): r is Extract<HabitRecord,{kind:"nutrition"}> => r.kind === "nutrition" && r.date >= start && r.date <= end);
  return FOOD_TYPES.map(key => {
    const values = days.map(r=>nutritionTotals(records,r.date)[key]).filter((n): n is number => typeof n === "number");
    return { key: key as FoodType, recorded: values.length, positive: values.filter(n=>n>0).length, average: values.length ? values.reduce((a,b)=>a+b,0)/values.length : undefined };
  });
}
export function exerciseWeek(records: HabitRecord[], start = weekStart(), end = shiftDay(start,6)) {
  const logs = records.filter((r): r is Extract<HabitRecord,{kind:"exercise"}> => r.kind === "exercise" && r.date >= start && r.date <= end);
  return { minutes: logs.reduce((n,r)=>n+r.data.minutes,0), days: new Set(logs.map(r=>r.date)).size,
    activities: [...new Set(logs.filter(r=>r.data.minutes>0).map(r=>r.data.activity))].map(activity=>({ activity, count: logs.filter(r=>r.data.activity===activity && r.data.minutes>0).length })) };
}
