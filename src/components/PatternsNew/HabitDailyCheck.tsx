import React, { useEffect, useState } from "react";
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

const icons: Record<string, string> = {
  digital: "📱",
  gaming: "🎮",
  checking: "🔎",
  mental: "🧠",
  avoidance: "🚪",
  sleep: "😴",
  body: "🧍",
  other: "✨",
};

export default function HabitDailyCheck({ onBack }: Props) {
  const { t } = useTranslation();

  const [habits, setHabits] = useState<Habit[]>([]);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [saved, setSaved] = useState(false);
  const [today, setToday] = useState("");

  useEffect(() => {
    const todayDate = new Date().toISOString().split("T")[0];
    setToday(todayDate);

    try {
      const raw = JSON.parse(
        localStorage.getItem("confia_habits") || "[]"
      );

      if (Array.isArray(raw)) {
        if (
          raw.length > 0 &&
          typeof raw[0] === "string"
        ) {
          setHabits(
            raw.map((name: string, index: number) => ({
              id: `legacy-${index}`,
              name,
              category: "other",
            }))
          );
        } else {
          setHabits(raw);
        }
      }

      const history: DailyHistory[] = JSON.parse(
        localStorage.getItem("confia_habits_daily_history") || "[]"
      );

      const existing = history.find(r => r.date === todayDate);

      if (existing) {
        setRatings(existing.ratings || {});
      }
    } catch {
      setHabits([]);
    }
  }, []);

  function selectLevel(id: string, level: number) {
    setRatings(prev => ({
      ...prev,
      [id]: level,
    }));
    setSaved(false);
  }

  function saveRecord() {
    const todayDate = today || new Date().toISOString().split("T")[0];

    const history: DailyHistory[] = (() => {
      try {
        return JSON.parse(
          localStorage.getItem("confia_habits_daily_history") || "[]"
        );
      } catch {
        return [];
      }
    })();

    const next = history.filter(item => item.date !== todayDate);

    next.push({
      date: todayDate,
      ratings,
    });

    next.sort((a, b) => a.date.localeCompare(b.date));

    localStorage.setItem(
      "confia_habits_daily_history",
      JSON.stringify(next)
    );

    // Compatibilidade com a versão anterior
    localStorage.setItem(
      "confia_habits_daily",
      JSON.stringify({
        date: todayDate,
        ratings,
      })
    );

    setSaved(true);
  }

  if (habits.length === 0) {
    return (
      <div className="min-h-screen bg-[#F7F1EA] p-5">
        <button
          onClick={onBack}
          className="mb-6 text-[#795B50] font-semibold"
        >
          ← {t("back")}
        </button>

        <div className="rounded-[28px] bg-white p-7 shadow-md text-center">
          <div className="text-5xl mb-4">🌱</div>

          <h1 className="text-xl font-extrabold text-[#4A352F]">
            {t("patternsPremium.noHabitsTitle")}
          </h1>

          <p className="text-sm text-[#806D65] mt-3 leading-6">
            {t("patternsPremium.noHabitsDescription")}
          </p>
        </div>
      </div>
    );
  }

  const completed = Object.keys(ratings).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFF9F4] to-[#F1EAE4] p-5 pb-12">

      <button
        onClick={onBack}
        className="mb-5 text-[#795B50] font-semibold"
      >
        ← {t("back")}
      </button>

      <div className="rounded-[28px] p-6 bg-gradient-to-br from-[#587563] to-[#769784] text-white shadow-xl mb-5">

        <div className="flex justify-between items-start">
          <div>
            <div className="text-3xl mb-2">📅</div>

            <h1 className="text-2xl font-extrabold">
              {t("patterns.dailyTitle")}
            </h1>

            <p className="text-sm text-white/80 mt-2">
              {t("patternsPremium.dailyIntro")}
            </p>
          </div>

          <div className="rounded-2xl bg-white/15 px-3 py-2 text-center">
            <div className="font-extrabold">
              {completed}/{habits.length}
            </div>
            <div className="text-[9px] uppercase text-white/70">
              {t("patternsPremium.done")}
            </div>
          </div>
        </div>

        <div className="mt-5 h-2 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-all"
            style={{
              width: `${Math.min(
                100,
                (completed / habits.length) * 100
              )}%`,
            }}
          />
        </div>
      </div>

      <div className="space-y-4">

        {habits.map(habit => (
          <div
            key={habit.id}
            className="rounded-[24px] bg-white p-5 shadow-md border border-[#E8DDD4]"
          >

            <div className="flex items-start gap-3 mb-4">
              <div className="w-11 h-11 rounded-2xl bg-[#F0E5DE] flex items-center justify-center text-xl">
                {icons[habit.category] || "✨"}
              </div>

              <div>
                <div className="font-extrabold text-[#4A352F]">
                  {habit.name}
                </div>

                <div className="text-xs text-[#8A746B] mt-1">
                  {t("patternsPremium.intensityQuestion")}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-6 gap-2">
              {[0,1,2,3,4,5].map(level => (
                <button
                  key={level}
                  onClick={() => selectLevel(habit.id, level)}
                  className={`h-12 rounded-xl font-extrabold transition ${
                    ratings[habit.id] === level
                      ? "bg-[#6B8B78] text-white scale-105 shadow-md"
                      : "bg-[#F3ECE7] text-[#73594F]"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>

            <div className="flex justify-between text-[10px] text-[#967E74] mt-2">
              <span>{t("patternsPremium.none")}</span>
              <span>{t("patternsPremium.veryHigh")}</span>
            </div>

          </div>
        ))}

      </div>

      {completed === habits.length && (
        <button
          onClick={saveRecord}
          className="w-full mt-6 p-4 rounded-2xl bg-gradient-to-r from-[#587563] to-[#769784] text-white font-extrabold shadow-xl"
        >
          ✓ {t("patterns.save")}
        </button>
      )}

      {saved && (
        <div className="mt-4 rounded-2xl bg-[#E4F0E7] p-4 text-center text-sm font-bold text-[#52705D]">
          ✓ {t("patterns.recordSaved")}
        </div>
      )}

    </div>
  );
}
