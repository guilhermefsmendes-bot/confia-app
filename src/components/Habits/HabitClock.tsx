import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { HabitRecord, FoodType } from "../../data/habits/types";
import { dayFoodItems, nutritionTotals } from "../../data/habits/nutrition";
import { ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import HabitImpactReaction from "./HabitImpactReaction";
import { LifestyleMirror } from "./LifestyleMirror";
import { collectCompanionData } from "../../data/companionData";
import { buildLifestyleSynergyCandidate } from "../../data/reactive/companionBrain/lifestyleSynergy";
import { localDay } from "../../data/habits/calendar";
import type { PersonalEvent } from "../../data/personal/personalEvent";

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

export default function HabitClock({ records, events, date }: { records: HabitRecord[]; events: PersonalEvent[]; date: string }) {
  const { t } = useTranslation();
  const state = useMemo(() => getHabitClockState(records, date), [records, date]);
  const [impactExpanded, setImpactExpanded] = useState(false);
  const today = localDay(new Date());
  const synergy = useMemo(() => { try { return buildLifestyleSynergyCandidate(records, collectCompanionData(), new Date()); } catch { return undefined; } }, [records, date]);
  const synergyText = synergy?.translationKey ? t(synergy.translationKey, synergy.translationValues) : null;
  const colour = state.hasData ? clockColour(state.score) : "#9A938D";
  return <section className="overflow-hidden rounded-[30px] border border-[#C8D8C4] bg-gradient-to-br from-[#F8FCF5] via-white to-[#E7F0E3] shadow-[0_12px_32px_rgba(54,82,47,0.10)]" aria-labelledby="habit-clock-title">
    <div className="flex items-center gap-4 p-4 sm:p-5">
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
    </div>
    <div className="border-t border-[#D8E4D3] bg-white/55 p-3 sm:px-5 sm:py-4">
      <button type="button" onClick={() => setImpactExpanded(value => !value)} aria-expanded={impactExpanded} aria-controls="habit-impact-submenu" className="flex min-h-12 w-full items-center gap-3 rounded-2xl border border-[#D5E2CF] bg-gradient-to-r from-white/95 to-[#EEF5E9] px-4 py-3 text-left shadow-sm transition hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#587044]">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#DDEBD5] text-[#41613C]"><Sparkles size={18}/></span>
        <span className="min-w-0 flex-1"><span className="block text-sm font-black text-[#304D2F]">{t("habitImpact.title")}</span><span className="mt-0.5 block text-xs leading-5 text-[#667761]">{t("habitImpact.submenuHint")}</span></span>
        <span className="shrink-0 rounded-full border border-[#D5E2CF] bg-white p-1.5 text-[#41613C]">{impactExpanded ? <ChevronUp size={17}/> : <ChevronDown size={17}/>}</span>
      </button>
      {impactExpanded && <div id="habit-impact-submenu" className="mt-3 space-y-4 rounded-[24px] border border-[#D9E5D4] bg-gradient-to-br from-white to-[#F7FAF4] p-3 shadow-inner sm:p-4"><HabitImpactReaction records={records} events={events} date={date}/><section className="rounded-2xl border border-[#D9E5D4] bg-white/90 p-4"><h3 className="font-black text-[#304D2F]">{t("companionSynergy.analysisTitle")}</h3><p className="mt-2 whitespace-pre-line text-sm leading-6 text-[#52654A]">{synergyText ?? t("companionSynergy.waiting")}</p>{synergy && <p className="mt-3 rounded-xl bg-[#F2F6ED] p-3 text-xs leading-5 text-[#667761]">{t("companionSynergy.hypothesis")}</p>}</section><div><p className="mb-2 text-sm font-black text-[#304D2F]">{t("companionSynergy.eyebrow")}</p><LifestyleMirror records={records} today={today}/></div></div>}
    </div>
  </section>;
}
