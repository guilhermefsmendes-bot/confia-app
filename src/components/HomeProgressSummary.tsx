import React, { useMemo } from "react";
import {
  Activity,
  Minus,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { collectCompanionData } from "../data/companionData";

interface DayData {
  date: string;
  mood?: number;
  completedObjectives: number;
  totalObjectives: number;
  active: boolean;
}

function getLast7Days(): string[] {
  const days: string[] = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() - i);
    days.push(date.toISOString().split("T")[0]);
  }

  return days;
}

interface HomeProgressSummaryProps {
  onOpenProgress: () => void;
}

export default function HomeProgressSummary({
  onOpenProgress,
}: HomeProgressSummaryProps) {
  const { t } = useTranslation();

  /*
   * O resumo é recalculado em cada render.
   * Não adicionamos listeners nem novo storage.
   *
   * Isto permite que, quando o App volta a renderizar após
   * um registo, "Hoje" reflita os dados mais recentes.
   */
  const analysis = (() => {
    const data = collectCompanionData();
    const dates = getLast7Days();

    const moodByDate = new Map<string, number>();

    data.mood.forEach((item) => {
      const values = [item.morning, item.afternoon].filter(
        (value): value is number =>
          typeof value === "number"
      );

      if (values.length > 0) {
        moodByDate.set(
          item.date,
          values.reduce(
            (sum, value) => sum + value,
            0
          ) / values.length
        );
      }
    });

    const objectivesByDate = new Map<
      string,
      {
        completed: number;
        total: number;
      }
    >();

    data.objectives.forEach((item) => {
      objectivesByDate.set(item.date, {
        completed: item.completed,
        total: item.total,
      });
    });

    const days: DayData[] = dates.map((date) => {
      const objectives =
        objectivesByDate.get(date);

      const mood =
        moodByDate.get(date);

      return {
        date,
        mood,
        completedObjectives:
          objectives?.completed ?? 0,
        totalObjectives:
          objectives?.total ?? 0,
        active:
          typeof mood === "number" ||
          Boolean(
            objectives &&
              objectives.total > 0
          ),
      };
    });

    const moodValues = days
      .map((day) => day.mood)
      .filter(
        (value): value is number =>
          typeof value === "number"
      );

    const averageMood =
      moodValues.length > 0
        ? moodValues.reduce(
            (sum, value) => sum + value,
            0
          ) / moodValues.length
        : null;

    const activeDays =
      days.filter((day) => day.active).length;

    const objectivesCompleted =
      days.reduce(
        (sum, day) =>
          sum + day.completedObjectives,
        0
      );

    const objectivesTotal =
      days.reduce(
        (sum, day) =>
          sum + day.totalObjectives,
        0
      );

    let trend:
      | "up"
      | "down"
      | "stable"
      | "none" = "none";

    if (moodValues.length >= 2) {
      const half = Math.max(
        1,
        Math.floor(moodValues.length / 2)
      );

      const first =
        moodValues.slice(0, half);

      const second =
        moodValues.slice(-half);

      const firstAverage =
        first.reduce(
          (sum, value) => sum + value,
          0
        ) / first.length;

      const secondAverage =
        second.reduce(
          (sum, value) => sum + value,
          0
        ) / second.length;

      const difference =
        secondAverage - firstAverage;

      if (difference >= 0.6) {
        trend = "up";
      } else if (difference <= -0.6) {
        trend = "down";
      } else {
        trend = "stable";
      }
    }

    return {
      averageMood,
      moodRecordCount: moodValues.length,
      activeDays,
      objectivesCompleted,
      objectivesTotal,
      trend,
      xp: data.xp,
    };
  })();

  const moodText =
    analysis.averageMood !== null
      ? analysis.averageMood.toFixed(1)
      : "—";

  const objectiveText =
    analysis.objectivesTotal > 0
      ? `${analysis.objectivesCompleted}/${analysis.objectivesTotal}`
      : "—";

  /*
   * Prioridade editorial:
   *
   * 1. Sem dados suficientes -> não fingir padrão.
   * 2. Tendência emocional -> interpretação principal.
   * 3. Presença/atividade -> reconhecimento neutro.
   *
   * Estabilidade não é chamada de progresso.
   */
  const feedbackKey =
    analysis.moodRecordCount < 2
      ? analysis.activeDays >= 3
        ? "homeProgress.feedback.active"
        : "homeProgress.feedback.noData"
      : analysis.trend === "up"
      ? "homeProgress.feedback.improving"
      : analysis.trend === "down"
      ? "homeProgress.feedback.difficult"
      : "homeProgress.feedback.stable";

  const TrendIcon =
    analysis.trend === "up"
      ? TrendingUp
      : analysis.trend === "down"
      ? TrendingDown
      : analysis.trend === "stable"
      ? Minus
      : Activity;

  const trendLabelKey =
    analysis.moodRecordCount < 2
      ? "homeProgress.trend.learning"
      : analysis.trend === "up"
      ? "homeProgress.trend.improving"
      : analysis.trend === "down"
      ? "homeProgress.trend.difficult"
      : "homeProgress.trend.stable";

  return (
    <section className="relative overflow-hidden rounded-t-[30px] border border-b-0 border-[#E8DDD7]/70 bg-gradient-to-b from-[#FFFDFC] via-[#FFF9F5] to-[#FFF7F2] px-5 pb-5 pt-5">
      {/* Identidade */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#C97B5E]">
            {t("homeToday.title")}
          </p>

          <h3 className="mt-1 text-lg font-black tracking-tight text-[#4E3B36]">
            {t("homeProgress.title")}
          </h3>

          <p className="mt-1 text-[11px] font-medium leading-relaxed text-slate-400">
            {t("homeProgress.subtitle")}
          </p>
        </div>

        <span className="shrink-0 rounded-full border border-[#E8DDD7]/60 bg-white/80 px-2.5 py-1 text-[9px] font-bold text-slate-400">
          {t("homeProgress.period")}
        </span>
      </div>

      {/* Leitura principal da CONFIA */}
      <div className="relative mt-4 overflow-hidden rounded-[22px] border border-[#E5A88B]/20 bg-gradient-to-br from-white via-white to-[#FFF5EF] p-4 shadow-[0_10px_28px_rgba(107,78,67,0.055)]">
        <div
          aria-hidden="true"
          className="absolute left-0 top-4 h-10 w-[3px] rounded-r-full bg-[#E5A88B]/55"
        />
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[#FFF0E8] text-[#C97B5E]">
            <TrendIcon size={17} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[9px] font-black uppercase tracking-[0.15em] text-[#C97B5E]">
                {t("homeProgress.feedbackTitle")}
              </p>

              <span className="rounded-full bg-[#FAF5F0] px-2 py-0.5 text-[8px] font-bold text-[#8B6F65]">
                {t(trendLabelKey)}
              </span>
            </div>

            <p className="mt-2 text-[12px] font-semibold leading-relaxed text-[#5F4A43]">
              {t(feedbackKey)}
            </p>
          </div>
        </div>
      </div>

      {/* Indicadores */}
      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="rounded-[18px] border border-[#E8DDD7]/60 bg-white/70 px-2 py-3 text-center shadow-[0_5px_16px_rgba(92,64,52,0.035)]">
          <div className="text-lg font-black text-[#4E3B36]">
            {moodText}
          </div>

          <div className="mt-0.5 text-[8px] font-bold uppercase tracking-wide text-slate-400">
            {t("homeProgress.mood")}
          </div>
        </div>

        <div className="rounded-[18px] border border-[#E8DDD7]/60 bg-white/70 px-2 py-3 text-center shadow-[0_5px_16px_rgba(92,64,52,0.035)]">
          <div className="text-lg font-black text-[#4E3B36]">
            {analysis.activeDays}/7
          </div>

          <div className="mt-0.5 text-[8px] font-bold uppercase tracking-wide text-slate-400">
            {t("homeProgress.activeDays")}
          </div>
        </div>

        <div className="rounded-[18px] border border-[#E8DDD7]/60 bg-white/70 px-2 py-3 text-center shadow-[0_5px_16px_rgba(92,64,52,0.035)]">
          <div className="text-lg font-black text-[#4E3B36]">
            {objectiveText}
          </div>

          <div className="mt-0.5 text-[8px] font-bold uppercase tracking-wide text-slate-400">
            {t("homeProgress.objectives")}
          </div>
        </div>
      </div>

      {/* Evolução + XP — ações secundárias */}
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-[#E8DDD7]/50 pt-3">
        <button
          type="button"
          onClick={onOpenProgress}
          className="group inline-flex min-h-9 items-center gap-2 rounded-xl px-1 text-left text-[10px] font-black text-[#C97B5E] transition-opacity active:opacity-70"
        >
          <span>
            {t("homeProgress.openEvolution")}
          </span>

          <span
            aria-hidden="true"
            className="transition-transform group-active:translate-x-0.5"
          >
            →
          </span>
        </button>

        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#E5A88B]/15 bg-white/80 px-2.5 py-1.5 text-[9px] font-black tracking-wide text-[#C97B5E]">
          <Sparkles size={11} />
          {analysis.xp} XP
        </span>
      </div>
    </section>
  );
}
