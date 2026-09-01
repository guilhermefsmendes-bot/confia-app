import React, { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { collectCompanionData } from "../data/companionData";
import {
  analyzeReactiveState,
} from "../data/reactive/reactiveEngine";
import {
  recordReactiveResponse,
} from "../data/reactive/reactiveHistoryStorage";

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

export default function HomeProgressSummary() {
  const { t } = useTranslation();

  /**
   * A análise reativa é calculada quando este resumo entra
   * no ecrã. O motor escolhe situação, intenção e resposta.
   */
  const reactiveResult = useMemo(
    () => analyzeReactiveState(),
    []
  );

  /**
   * Registar apenas respostas realmente apresentadas.
   *
   * sessionStorage impede que remontagens do componente
   * contem repetidamente a mesma resposta no mesmo dia.
   */
  useEffect(() => {
    const response = reactiveResult.response;

    if (!response) {
      return;
    }

    const today = new Date()
      .toISOString()
      .split("T")[0];

    const seenKey =
      `confia_reactive_seen_${today}_${response.id}`;

    try {
      if (
        typeof window !== "undefined" &&
        window.sessionStorage.getItem(seenKey)
      ) {
        return;
      }

      recordReactiveResponse({
        responseId: response.id,
        situation: reactiveResult.situation,
        intent: reactiveResult.intent,
        timestamp: new Date().toISOString(),
      });

      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(
          seenKey,
          "1"
        );
      }
    } catch {
      /**
       * Mesmo que sessionStorage esteja indisponível,
       * a interface da Confia deve continuar a funcionar.
       */
    }
  }, [reactiveResult]);


  const analysis = useMemo(() => {
    const data = collectCompanionData();
    const dates = getLast7Days();

    const moodByDate = new Map<string, number>();
    data.mood.forEach((item) => {
      const values = [item.morning, item.afternoon].filter(
        (value): value is number => typeof value === "number"
      );

      if (values.length > 0) {
        moodByDate.set(
          item.date,
          values.reduce((sum, value) => sum + value, 0) / values.length
        );
      }
    });

    const objectivesByDate = new Map<
      string,
      { completed: number; total: number }
    >();

    data.objectives.forEach((item) => {
      objectivesByDate.set(item.date, {
        completed: item.completed,
        total: item.total,
      });
    });

    const days: DayData[] = dates.map((date) => {
      const objectives = objectivesByDate.get(date);
      const mood = moodByDate.get(date);

      return {
        date,
        mood,
        completedObjectives: objectives?.completed ?? 0,
        totalObjectives: objectives?.total ?? 0,
        active:
          typeof mood === "number" ||
          Boolean(objectives && objectives.total > 0),
      };
    });

    const moodValues = days
      .map((day) => day.mood)
      .filter((value): value is number => typeof value === "number");

    const averageMood =
      moodValues.length > 0
        ? moodValues.reduce((sum, value) => sum + value, 0) /
          moodValues.length
        : null;

    const activeDays = days.filter((day) => day.active).length;

    const objectivesCompleted = days.reduce(
      (sum, day) => sum + day.completedObjectives,
      0
    );

    const objectivesTotal = days.reduce(
      (sum, day) => sum + day.totalObjectives,
      0
    );

    let trend: "up" | "down" | "stable" | "none" = "none";

    if (moodValues.length >= 2) {
      const half = Math.max(1, Math.floor(moodValues.length / 2));
      const first = moodValues.slice(0, half);
      const second = moodValues.slice(-half);

      const firstAverage =
        first.reduce((sum, value) => sum + value, 0) / first.length;
      const secondAverage =
        second.reduce((sum, value) => sum + value, 0) / second.length;

      const difference = secondAverage - firstAverage;

      if (difference >= 0.6) trend = "up";
      else if (difference <= -0.6) trend = "down";
      else trend = "stable";
    }

    let feedbackKey = "homeProgress.feedback.noData";

    if (trend === "up") {
      feedbackKey = "homeProgress.feedback.improving";
    } else if (trend === "down") {
      feedbackKey = "homeProgress.feedback.difficult";
    } else if (trend === "stable") {
      feedbackKey = "homeProgress.feedback.stable";
    } else if (activeDays > 0) {
      feedbackKey = "homeProgress.feedback.active";
    }

    return {
      averageMood,
      activeDays,
      objectivesCompleted,
      objectivesTotal,
      trend,
      feedbackKey,
      xp: data.xp,
    };
  }, []);

  const moodText =
    analysis.averageMood !== null
      ? analysis.averageMood.toFixed(1)
      : "—";

  const objectiveText =
    analysis.objectivesTotal > 0
      ? `${analysis.objectivesCompleted}/${analysis.objectivesTotal}`
      : "—";

  const trendIcon =
    analysis.trend === "up"
      ? "↗"
      : analysis.trend === "down"
        ? "↘"
        : analysis.trend === "stable"
          ? "→"
          : "•";

  return (
    <section className="mx-1 mt-4 mb-4 rounded-[30px] border border-[#E8DDD7] bg-white/90 p-5 shadow-sm">
      <div className="mb-4">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#C97B5E]">
          {t("homeProgress.eyebrow")}
        </p>

        <h3 className="mt-1 text-xl font-black tracking-tight text-[#4E3B36]">
          {t("homeProgress.title")}
        </h3>

        <p className="mt-1 text-xs font-medium leading-relaxed text-slate-500">
          {t("homeProgress.subtitle")}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-2xl bg-[#FFF7F2] p-3 text-center">
          <div className="text-lg font-black text-[#4E3B36]">
            {moodText}
          </div>
          <div className="mt-1 text-[9px] font-bold uppercase tracking-wide text-slate-500">
            {t("homeProgress.mood")}
          </div>
        </div>

        <div className="rounded-2xl bg-[#F4F8F1] p-3 text-center">
          <div className="text-lg font-black text-[#4E3B36]">
            {analysis.activeDays}/7
          </div>
          <div className="mt-1 text-[9px] font-bold uppercase tracking-wide text-slate-500">
            {t("homeProgress.activeDays")}
          </div>
        </div>

        <div className="rounded-2xl bg-[#F4F5FA] p-3 text-center">
          <div className="text-lg font-black text-[#4E3B36]">
            {objectiveText}
          </div>
          <div className="mt-1 text-[9px] font-bold uppercase tracking-wide text-slate-500">
            {t("homeProgress.objectives")}
          </div>
        </div>
      </div>

      <div className="mt-3 rounded-2xl bg-[#FAF7F5] p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-lg shadow-sm">
            {trendIcon}
          </div>

          <div>
            <p className="text-xs font-black text-[#4E3B36]">
              {t("homeProgress.feedbackTitle")}
            </p>

            <p className="mt-1 text-xs font-medium leading-relaxed text-slate-600">
              {t(reactiveResult.response.translationKey)}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between px-1">
        <span className="text-[10px] font-bold text-slate-400">
          {t("homeProgress.period")}
        </span>

        <span className="text-[10px] font-black text-[#C97B5E]">
          ⭐ {analysis.xp} XP
        </span>
      </div>
    </section>
  );
}
