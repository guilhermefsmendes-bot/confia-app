import React, { memo, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

interface Props {
  onBack: () => void;
}

type Habit = {
  id: string;
  name: string;
  category: string;
};

type DailyHistory = {
  date: string;
  ratings: Record<string, number>;
};

type Wellbeing = {
  date: string;
  morning: number | null;
  afternoon: number | null;
};

function average(values: number[]) {
  if (!values.length) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function correlation(a: number[], b: number[]) {
  if (a.length < 4 || b.length < 4) return null;

  const avgA = average(a) ?? 0;
  const avgB = average(b) ?? 0;

  let numerator = 0;
  let denA = 0;
  let denB = 0;

  for (let i = 0; i < a.length; i++) {
    const da = a[i] - avgA;
    const db = b[i] - avgB;

    numerator += da * db;
    denA += da * da;
    denB += db * db;
  }

  if (!denA || !denB) return 0;

  return numerator / Math.sqrt(denA * denB);
}

function MiniLineChart({
  values,
  max,
}: {
  values: number[];
  max: number;
}) {
  if (values.length < 2) {
    return (
      <div className="h-24 flex items-center justify-center text-xs text-[#967E74]">
        —
      </div>
    );
  }

  const width = 320;
  const height = 100;

  const points = values.map((value, index) => {
    const x =
      (index / Math.max(values.length - 1, 1)) *
      (width - 12) + 6;

    const y =
      height -
      8 -
      (value / max) * (height - 16);

    return `${x},${y}`;
  }).join(" ");

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-28"
      preserveAspectRatio="none"
    >
      <line
        x1="6"
        y1="92"
        x2="314"
        y2="92"
        stroke="#E5DAD2"
        strokeWidth="1"
      />

      <polyline
        points={points}
        fill="none"
        stroke="#806457"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {values.map((value, index) => {
        const x =
          (index / Math.max(values.length - 1, 1)) *
          (width - 12) + 6;

        const y =
          height -
          8 -
          (value / max) * (height - 16);

        return (
          <circle
            key={index}
            cx={x}
            cy={y}
            r="3.5"
            fill="#806457"
          />
        );
      })}
    </svg>
  );
}

function HabitEvolution({ onBack }: Props) {
  const { t } = useTranslation();

  const [habits, setHabits] = useState<Habit[]>([]);
  const [history, setHistory] = useState<DailyHistory[]>([]);
  const [wellbeing, setWellbeing] = useState<Wellbeing[]>([]);
  const [period, setPeriod] = useState(14);

  useEffect(() => {
    try {
      const h = JSON.parse(
        localStorage.getItem("confia_habits") || "[]"
      );

      const historyData = JSON.parse(
        localStorage.getItem("confia_habits_daily_history") || "[]"
      );

      const ratings = JSON.parse(
        localStorage.getItem("confia_ratings_v2") || "[]"
      );

      if (Array.isArray(h)) setHabits(h);
      if (Array.isArray(historyData)) setHistory(historyData);
      if (Array.isArray(ratings)) setWellbeing(ratings);
    } catch {
      setHabits([]);
      setHistory([]);
      setWellbeing([]);
    }
  }, []);

  const visibleHistory = useMemo(
    () => history.slice(-period),
    [history, period]
  );

  const wellbeingMap = useMemo(() => {
    const map: Record<string, number> = {};

    wellbeing.forEach(item => {
      const values = [
        item.morning,
        item.afternoon,
      ].filter(
        (v): v is number =>
          typeof v === "number"
      );

      const avg = average(values);

      if (avg !== null) {
        map[item.date] = avg;
      }
    });

    return map;
  }, [wellbeing]);

  const wellbeingValues = visibleHistory
    .map(item => wellbeingMap[item.date])
    .filter(
      (v): v is number =>
        typeof v === "number"
    );

  const overallWellbeing = average(wellbeingValues);

  const analyses = habits.map(habit => {
    const points = visibleHistory
      .filter(item =>
        typeof item.ratings?.[habit.id] === "number"
      )
      .map(item => ({
        date: item.date,
        habit: item.ratings[habit.id],
        wellbeing: wellbeingMap[item.date],
      }));

    const habitValues = points.map(p => p.habit);

    const first = habitValues.slice(0, Math.max(1, Math.floor(habitValues.length / 2)));
    const last = habitValues.slice(Math.max(1, Math.floor(habitValues.length / 2)));

    const firstAvg = average(first);
    const lastAvg = average(last);

    const trend =
      firstAvg !== null && lastAvg !== null
        ? lastAvg - firstAvg
        : 0;

    const paired = points.filter(
      p => typeof p.wellbeing === "number"
    );

    const c = correlation(
      paired.map(p => p.habit),
      paired.map(p => p.wellbeing as number)
    );

    return {
      habit,
      points,
      values: habitValues,
      firstAvg,
      lastAvg,
      trend,
      correlation: c,
    };
  });

  const strongestPositive = analyses
    .filter(a => a.correlation !== null)
    .sort(
      (a, b) =>
        (b.correlation || 0) - (a.correlation || 0)
    )[0];

  const strongestNegative = analyses
    .filter(a => a.correlation !== null)
    .sort(
      (a, b) =>
        (a.correlation || 0) - (b.correlation || 0)
    )[0];

  const getTrendLabel = (trend: number) => {
    if (trend < -0.4) return t("patternsPremium.trendDown");
    if (trend > 0.4) return t("patternsPremium.trendUp");
    return t("patternsPremium.trendStable");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFF9F4] via-[#F8F1EC] to-[#EFE6DF] p-5 pb-12">

      <button
        onClick={onBack}
        className="mb-5 text-[#795B50] font-semibold"
      >
        ← {t("back")}
      </button>

      {/* HERO */}
      <div className="rounded-[30px] p-6 bg-gradient-to-br from-[#76564B] via-[#92705F] to-[#C09A82] text-white shadow-xl mb-5">

        <div className="text-4xl mb-3">📈</div>

        <h1 className="text-2xl font-extrabold">
          {t("patternsPremium.evolutionTitle")}
        </h1>

        <p className="text-sm text-white/80 mt-2 leading-6">
          {t("patternsPremium.evolutionDescription")}
        </p>

        <div className="mt-5 grid grid-cols-3 gap-2">
          <div className="bg-white/15 rounded-2xl p-3">
            <div className="font-extrabold text-xl">
              {visibleHistory.length}
            </div>
            <div className="text-[10px] uppercase text-white/70">
              {t("patternsPremium.days")}
            </div>
          </div>

          <div className="bg-white/15 rounded-2xl p-3">
            <div className="font-extrabold text-xl">
              {habits.length}
            </div>
            <div className="text-[10px] uppercase text-white/70">
              {t("patternsPremium.habits")}
            </div>
          </div>

          <div className="bg-white/15 rounded-2xl p-3">
            <div className="font-extrabold text-xl">
              {overallWellbeing !== null
                ? overallWellbeing.toFixed(1)
                : "—"}
            </div>
            <div className="text-[10px] uppercase text-white/70">
              {t("patternsPremium.avgWellbeing")}
            </div>
          </div>
        </div>
      </div>

      {/* PERIOD */}
      <div className="bg-white rounded-2xl p-3 shadow-sm border border-[#E8DDD4] mb-5">
        <div className="grid grid-cols-3 gap-2">
          {[7, 14, 30].map(value => (
            <button
              key={value}
              onClick={() => setPeriod(value)}
              className={`rounded-xl py-2 text-sm font-bold ${
                period === value
                  ? "bg-[#76564B] text-white"
                  : "bg-[#F3ECE7] text-[#76564B]"
              }`}
            >
              {value} {t("patternsPremium.daysShort")}
            </button>
          ))}
        </div>
      </div>

      {habits.length === 0 && (
        <div className="rounded-[25px] bg-white p-6 shadow-md text-center">
          <div className="text-5xl mb-3">🌱</div>

          <h2 className="font-extrabold text-[#4A352F]">
            {t("patternsPremium.noHabitsTitle")}
          </h2>

          <p className="text-sm text-[#806D65] mt-2">
            {t("patternsPremium.noHabitsDescription")}
          </p>
        </div>
      )}

      {habits.length > 0 && history.length === 0 && (
        <div className="rounded-[25px] bg-white p-6 shadow-md text-center">
          <div className="text-5xl mb-3">📅</div>

          <h2 className="font-extrabold text-[#4A352F]">
            {t("patternsPremium.notEnoughDataTitle")}
          </h2>

          <p className="text-sm text-[#806D65] mt-2 leading-6">
            {t("patternsPremium.notEnoughDataDescription")}
          </p>
        </div>
      )}

      {/* WELLBEING */}
      {wellbeingValues.length > 1 && (
        <div className="rounded-[25px] bg-white p-5 shadow-md border border-[#E8DDD4] mb-5">

          <div className="flex items-center gap-3 mb-2">
            <div className="w-11 h-11 rounded-2xl bg-[#E5EFE8] flex items-center justify-center">
              💚
            </div>

            <div>
              <h2 className="font-extrabold text-[#4A352F]">
                {t("patternsPremium.wellbeingChart")}
              </h2>

              <p className="text-xs text-[#8B756C]">
                {t("patternsPremium.wellbeingChartDesc")}
              </p>
            </div>
          </div>

          <MiniLineChart
            values={wellbeingValues}
            max={10}
          />
        </div>
      )}

      {/* HABIT CARDS */}
      <div className="space-y-4">

        {analyses.map(item => (
          <div
            key={item.habit.id}
            className="rounded-[25px] bg-white p-5 shadow-md border border-[#E8DDD4]"
          >

            <div className="flex items-start justify-between mb-3">

              <div>
                <h2 className="font-extrabold text-[#4A352F]">
                  {item.habit.name}
                </h2>

                <div className="text-xs text-[#8B756C] mt-1">
                  {item.points.length} {t("patternsPremium.records")}
                </div>
              </div>

              <div className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                item.trend < -0.4
                  ? "bg-[#E3F0E6] text-[#55745E]"
                  : item.trend > 0.4
                  ? "bg-[#F3E5E0] text-[#93614F]"
                  : "bg-[#F1ECE8] text-[#77655D]"
              }`}>
                {getTrendLabel(item.trend)}
              </div>

            </div>

            {item.values.length > 1 && (
              <MiniLineChart
                values={item.values}
                max={5}
              />
            )}

            <div className="grid grid-cols-2 gap-3 mt-3">

              <div className="rounded-2xl bg-[#F7F2EE] p-3">
                <div className="text-[10px] uppercase text-[#927D73]">
                  {t("patternsPremium.startAverage")}
                </div>
                <div className="text-xl font-extrabold text-[#5D4941] mt-1">
                  {item.firstAvg !== null
                    ? item.firstAvg.toFixed(1)
                    : "—"}
                </div>
              </div>

              <div className="rounded-2xl bg-[#F7F2EE] p-3">
                <div className="text-[10px] uppercase text-[#927D73]">
                  {t("patternsPremium.currentAverage")}
                </div>
                <div className="text-xl font-extrabold text-[#5D4941] mt-1">
                  {item.lastAvg !== null
                    ? item.lastAvg.toFixed(1)
                    : "—"}
                </div>
              </div>

            </div>

            {item.correlation !== null && (
              <div className="mt-4 rounded-2xl bg-[#FBF7F3] p-4">

                <div className="text-xs font-bold text-[#76564B] mb-1">
                  {t("patternsPremium.relationship")}
                </div>

                <div className="text-sm text-[#66534C] leading-5">
                  {item.correlation < -0.35
                    ? t("patternsPremium.negativeRelationship")
                    : item.correlation > 0.35
                    ? t("patternsPremium.positiveRelationship")
                    : t("patternsPremium.noClearRelationship")}
                </div>

              </div>
            )}

          </div>
        ))}

      </div>

      {/* ANALYSIS */}
      {visibleHistory.length >= 4 && (
        <div className="mt-5 rounded-[28px] p-6 bg-gradient-to-br from-[#5E7867] to-[#789985] text-white shadow-xl">

          <div className="text-3xl mb-3">✨</div>

          <h2 className="text-xl font-extrabold">
            {t("patternsPremium.analysisTitle")}
          </h2>

          <p className="text-sm text-white/80 mt-2 leading-6">
            {t("patternsPremium.analysisIntro")}
          </p>

          {strongestNegative && strongestNegative.correlation !== null && strongestNegative.correlation < -0.35 && (
            <div className="mt-5 rounded-2xl bg-white/15 p-4">
              <div className="font-extrabold">
                🔎 {t("patternsPremium.attention")}
              </div>

              <p className="text-sm text-white/80 mt-2 leading-5">
                {t("patternsPremium.negativeInsight", {
                  habit: strongestNegative.habit.name,
                })}
              </p>
            </div>
          )}

          {strongestPositive && strongestPositive.correlation !== null && strongestPositive.correlation > 0.35 && (
            <div className="mt-4 rounded-2xl bg-white/15 p-4">
              <div className="font-extrabold">
                🌱 {t("patternsPremium.positiveInsightTitle")}
              </div>

              <p className="text-sm text-white/80 mt-2 leading-5">
                {t("patternsPremium.positiveInsight", {
                  habit: strongestPositive.habit.name,
                })}
              </p>
            </div>
          )}

          {(!strongestNegative ||
            strongestNegative.correlation === null ||
            strongestNegative.correlation >= -0.35) &&
            (!strongestPositive ||
            strongestPositive.correlation === null ||
            strongestPositive.correlation <= 0.35) && (
              <div className="mt-5 rounded-2xl bg-white/15 p-4">
                <div className="font-extrabold">
                  🌿 {t("patternsPremium.stillLearningTitle")}
                </div>

                <p className="text-sm text-white/80 mt-2 leading-5">
                  {t("patternsPremium.stillLearningDescription")}
                </p>
              </div>
          )}

          <p className="text-[10px] text-white/60 mt-5 leading-4">
            {t("patternsPremium.analysisDisclaimer")}
          </p>

        </div>
      )}

    </div>
  );
}

export default memo(HabitEvolution);
