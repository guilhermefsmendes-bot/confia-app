import React, { useMemo } from "react";
import { Activity, Info } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { DailyRating } from "../types";

interface Props {
  ratings: DailyRating[];
}

const WINDOW = 14;

function average(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

export default function PredictiveMoodCurve({ ratings }: Props) {
  const { t } = useTranslation();

  const model = useMemo(() => {
    const recent = ratings
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-WINDOW)
      .map((rating) => {
        const values = [rating.morning, rating.afternoon].filter((value): value is number => typeof value === "number");
        return { date: rating.date, value: average(values) };
      })
      .filter((item): item is { date: string; value: number } => item.value !== null);

    if (recent.length < 4) return null;

    const first = average(recent.slice(0, Math.ceil(recent.length / 2)).map((item) => item.value)) ?? 0;
    const second = average(recent.slice(-Math.ceil(recent.length / 2)).map((item) => item.value)) ?? 0;
    const delta = second - first;
    const baseline = average(recent.map((item) => item.value)) ?? 0;
    const confidence = recent.length >= 10 ? "high" : "moderate";

    return { recent, first, second, delta, baseline, confidence };
  }, [ratings]);

  if (!model) return null;

  const width = 320;
  const height = 112;
  const pad = 12;
  const min = 0;
  const max = 10;
  const points = model.recent.map((item, index) => {
    const x = pad + (index / Math.max(1, model.recent.length - 1)) * (width - pad * 2);
    const y = height - pad - ((item.value - min) / (max - min)) * (height - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");

  const direction = model.delta > 0.45 ? "up" : model.delta < -0.45 ? "down" : "steady";
  const directionLabel = t(`moodCurve.direction.${direction}`);

  return (
    <section aria-labelledby="mood-curve-title" className="overflow-hidden rounded-[28px] border border-[#D9E5E2] bg-white shadow-sm">
      <div className="p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#EEF7F4] text-[#5C8C80]">
            <Activity size={19} aria-hidden="true" />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#5C8C80]">{t("moodCurve.eyebrow")}</p>
            <h2 id="mood-curve-title" className="mt-1 text-base font-black text-[#3F514C]">{t("moodCurve.title")}</h2>
            <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{t("moodCurve.description")}</p>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-[#E1ECE9] bg-[#FBFEFD] p-3">
          <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label={t("moodCurve.chartLabel")}>
            <line x1={pad} x2={width - pad} y1={height / 2} y2={height / 2} stroke="currentColor" strokeOpacity="0.08" />
            <polyline points={points} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-[#6B9B90]" />
          </svg>
          <div className="flex items-center justify-between text-[9px] font-bold text-slate-400">
            <span>{t("moodCurve.older")}</span><span>{t("moodCurve.recent")}</span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-2xl bg-[#F5FAF8] p-3">
            <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">{t("moodCurve.signal")}</p>
            <p className="mt-1 text-sm font-black text-[#4C7168]">{directionLabel}</p>
          </div>
          <div className="rounded-2xl bg-[#F5FAF8] p-3">
            <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">{t("moodCurve.baseline")}</p>
            <p className="mt-1 text-sm font-black text-[#4C7168]">{model.baseline.toFixed(1)}/10</p>
          </div>
        </div>

        <div className="mt-3 flex items-start gap-2 text-[10px] font-semibold leading-4 text-slate-400">
          <Info size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
          {t("moodCurve.caveat", { confidence: t(`moodCurve.confidence.${model.confidence}`) })}
        </div>
      </div>
    </section>
  );
}
