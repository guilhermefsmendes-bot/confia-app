import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { HabitRecord, FoodType } from "../../data/habits/types";
import { dayFoodItems, nutritionTotals } from "../../data/habits/nutrition";

type Tone = "favourable" | "mixed" | "unfavourable" | "unknown";
export function getHabitClockState(records: HabitRecord[], date: string) {
  const day = records.filter(record => record.date === date);
  const scores: number[] = [];
  const sleep = day.find((record): record is Extract<HabitRecord, { kind: "sleep" }> => record.kind === "sleep");
  if (sleep) scores.push(sleep.data.hours >= 7 && sleep.data.hours <= 9 ? 1 : sleep.data.hours < 7 ? -1 : 0);
  const movement = day.filter((record): record is Extract<HabitRecord, { kind: "exercise" }> => record.kind === "exercise" && record.data.minutes > 0);
  if (movement.length) {
    // Scale contribution by logged duration and intensity instead of treating
    // a few minutes as equivalent to a complete activity session.
    const movementScore = movement.reduce((sum, record) => {
      const target = record.data.intensity === "intense" ? 15 : record.data.intensity === "moderate" ? 30 : record.data.intensity === "light" ? 60 : 45;
      const intensityFactor = record.data.intensity === "intense" ? 1 : record.data.intensity === "moderate" ? 0.85 : record.data.intensity === "light" ? 0.35 : 0.55;
      return sum + Math.min(1, record.data.minutes / target) * intensityFactor;
    }, 0) / movement.length;
    scores.push(Math.min(1, movementScore));
  }

  const foods = dayFoodItems(records, date).filter(item => !item.data.deleted && item.data.quantity > 0);
  const totals = nutritionTotals(records, date);
  const hasFoodDomain = foods.length > 0 || day.some(record => record.kind === "nutrition");
  if (hasFoodDomain) {
    let favourable = 0, unfavourable = 0;
    const positive: FoodType[] = ["fruit", "vegetables", "water"];
    const negative: FoodType[] = ["alcohol", "tobacco", "fastFood", "sweets", "salty"];
    const categoryAmount = (category: FoodType) => Math.max(0, totals[category] ?? 0);
    for (const category of positive) {
      const amount = categoryAmount(category);
      if (amount > 0) favourable += category === "water" ? Math.min(1, amount / 6) : Math.min(1, amount / 3);
    }
    for (const category of negative) {
      const amount = categoryAmount(category);
      if (amount > 0) unfavourable += category === "alcohol" || category === "tobacco" ? Math.min(1, amount) : Math.min(1, amount / 2);
    }
    if (favourable + unfavourable > 0) scores.push(Math.max(-1, Math.min(1, (favourable - unfavourable) / 3)));
  }
  if (!scores.length) return { hasData: false, score: 50, domains: 0, tone: "unknown" as Tone };
  const balance = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  // Sparse logs should produce a gentler colour. Full colour intensity needs
  // coverage across all three domains, not one isolated positive or negative.
  const coverage = Math.min(1, scores.length / 3);
  const score = Math.round(Math.max(5, Math.min(95, 50 + balance * 45 * coverage)));
  const tone: Tone = score >= 68 ? "favourable" : score <= 32 ? "unfavourable" : "mixed";
  return { hasData: true, score, domains: scores.length, tone };
}
function clockColour(score: number) {
  // Orange (30°) -> yellow (55°) -> lettuce green (95°).
  const hue = 30 + (score / 100) * 65;
  return `hsl(${hue} 72% 43%)`;
}

export default function HabitClock({ records, date }: { records: HabitRecord[]; date: string }) {
  const { t } = useTranslation();
  const state = useMemo(() => getHabitClockState(records, date), [records, date]);
  const colour = state.hasData ? clockColour(state.score) : "#9A938D";
  return <section className="flex items-center gap-4 rounded-[28px] border border-[#E8DDD7] bg-white p-4" aria-labelledby="habit-clock-title">
    <div className="grid h-24 w-24 shrink-0 place-items-center rounded-full bg-[#F8F5F0]">
      <svg viewBox="0 0 100 100" role="img" aria-label={t("habitClock.symbolAlt")} className="h-20 w-20">
        <circle cx="50" cy="50" r="43" fill="none" stroke={colour} strokeWidth="4" opacity={state.hasData ? 0.9 : 0.35}/>
        <path d="M50 12v5 M50 83v5 M12 50h5 M83 50h5" stroke={colour} strokeWidth="3" strokeLinecap="round" opacity=".65"/>
        <circle cx="50" cy="31" r="7" fill={colour}/>
        <path d="M50 40 L50 59 M50 45 L37 53 M50 45 L63 53 M50 59 L40 75 M50 59 L60 75" fill="none" stroke={colour} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M50 31 L50 19 M50 31 L61 31" fill="none" stroke={colour} strokeWidth="2.5" strokeLinecap="round" opacity=".75"/>
      </svg>
    </div>
    <div className="min-w-0 flex-1">
      <h2 id="habit-clock-title" className="font-black">{t("habitClock.title")}</h2>
      <p className="mt-1 text-sm leading-5" style={{ color: colour }}>{t("habitClock.tones." + state.tone)}</p>
      <p className="mt-1 text-xs leading-5 text-[#6F5D51]">{state.hasData ? t("habitClock.coverage", { count: state.domains }) : t("habitClock.noData")}</p>
      {state.hasData && <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#EEE7E0]" role="img" aria-label={t("habitClock.scaleAlt")}>
        <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${state.score}%`, background: `linear-gradient(90deg, hsl(30 72% 43%), hsl(55 78% 46%), hsl(95 72% 43%))` }} />
      </div>}
      <p className="mt-2 text-[11px] leading-4 text-[#806F63]">{t("habitClock.disclaimer")}</p>
    </div>
  </section>;
}
