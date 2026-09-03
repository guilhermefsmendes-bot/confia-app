import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface Props {
  onBack: () => void;
}

type Habit = {
  id: string;
  name: string;
  category: string;
  baseline: number;
  motivation: number;
};

const categories = [
  { id: "digital", icon: "📱" },
  { id: "gaming", icon: "🎮" },
  { id: "checking", icon: "🔎" },
  { id: "mental", icon: "🧠" },
  { id: "avoidance", icon: "🚪" },
  { id: "sleep", icon: "😴" },
  { id: "body", icon: "🧍" },
  { id: "other", icon: "✨" },
];

export default function HabitAssessment({ onBack }: Props) {
  const { t } = useTranslation();

  const [habits, setHabits] = useState<Habit[]>([]);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("other");
  const [baseline, setBaseline] = useState(3);
  const [motivation, setMotivation] = useState(3);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const savedHabits = JSON.parse(
        localStorage.getItem("confia_habits") || "[]"
      );

      if (Array.isArray(savedHabits)) {
        if (
          savedHabits.length > 0 &&
          typeof savedHabits[0] === "string"
        ) {
          setHabits(
            savedHabits.map((item: string, index: number) => ({
              id: `legacy-${index}-${Date.now()}`,
              name: item,
              category: "other",
              baseline: 3,
              motivation: 3,
            }))
          );
        } else {
          setHabits(savedHabits);
        }
      }
    } catch {
      setHabits([]);
    }
  }, []);

  function addHabit() {
    const clean = name.trim();

    if (!clean) return;

    const habit: Habit = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: clean,
      category,
      baseline,
      motivation,
    };

    const next = [...habits, habit];

    setHabits(next);
    localStorage.setItem("confia_habits", JSON.stringify(next));

    setName("");
    setCategory("other");
    setBaseline(3);
    setMotivation(3);
  }

  function removeHabit(id: string) {
    const next = habits.filter(h => h.id !== id);
    setHabits(next);
    localStorage.setItem("confia_habits", JSON.stringify(next));
  }

  function save() {
    localStorage.setItem("confia_habits", JSON.stringify(habits));

    const assessment: Record<string, {
      baseline: number;
      motivation: number;
      category: string;
    }> = {};

    habits.forEach(h => {
      assessment[h.id] = {
        baseline: h.baseline,
        motivation: h.motivation,
        category: h.category,
      };
    });

    localStorage.setItem(
      "confia_habit_assessment",
      JSON.stringify(assessment)
    );

    setSaved(true);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFF9F4] to-[#F2EBE5] p-5 pb-12">

      <button
        onClick={onBack}
        className="mb-5 text-[#795B50] font-semibold"
      >
        ← {t("back")}
      </button>

      <div className="rounded-[28px] p-6 bg-gradient-to-br from-[#6F5148] to-[#AA806A] text-white shadow-xl mb-5">
        <div className="text-3xl mb-2">🔎</div>

        <h1 className="text-2xl font-extrabold">
          {t("patterns.assessmentTitle")}
        </h1>

        <p className="text-sm text-white/80 mt-2 leading-6">
          {t("patternsPremium.assessmentIntro")}
        </p>
      </div>

      {/* NEW HABIT */}
      <div className="rounded-[25px] bg-white p-5 shadow-md border border-[#E8DDD4]">

        <label className="block text-sm font-bold text-[#5B4740] mb-2">
          {t("patternsPremium.habitName")}
        </label>

        <input
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter") addHabit();
          }}
          placeholder={t("patterns.writeHabit")}
          className="w-full rounded-2xl border border-[#E2D6CE] bg-[#FBF8F5] p-4 outline-none focus:ring-2 focus:ring-[#C9A38E]"
        />

        <div className="mt-5">
          <div className="text-sm font-bold text-[#5B4740] mb-3">
            {t("patternsPremium.category")}
          </div>

          <div className="grid grid-cols-2 gap-2">
            {categories.map(item => (
              <button
                key={item.id}
                onClick={() => setCategory(item.id)}
                className={`p-3 rounded-2xl text-left border transition ${
                  category === item.id
                    ? "bg-[#EBDDD3] border-[#B9937D]"
                    : "bg-[#FAF7F4] border-[#E8DDD4]"
                }`}
              >
                <span className="mr-2">{item.icon}</span>
                {t(`patternsPremium.categories.${item.id}`)}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5">
          <div className="text-sm font-bold text-[#5B4740] mb-2">
            {t("patternsPremium.baseline")}
          </div>

          <div className="grid grid-cols-6 gap-2">
            {[0,1,2,3,4,5].map(value => (
              <button
                key={value}
                onClick={() => setBaseline(value)}
                className={`h-11 rounded-xl font-bold ${
                  baseline === value
                    ? "bg-[#76564B] text-white"
                    : "bg-[#F3ECE7] text-[#76564B]"
                }`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5">
          <div className="text-sm font-bold text-[#5B4740] mb-2">
            {t("patternsPremium.motivation")}
          </div>

          <div className="grid grid-cols-5 gap-2">
            {[1,2,3,4,5].map(value => (
              <button
                key={value}
                onClick={() => setMotivation(value)}
                className={`h-11 rounded-xl font-bold ${
                  motivation === value
                    ? "bg-[#76564B] text-white"
                    : "bg-[#F3ECE7] text-[#76564B]"
                }`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={addHabit}
          className="w-full mt-5 rounded-2xl p-4 bg-gradient-to-r from-[#76564B] to-[#A67B68] text-white font-extrabold shadow-md"
        >
          + {t("patternsPremium.addHabit")}
        </button>
      </div>

      {/* HABIT LIST */}
      {habits.length > 0 && (
        <div className="mt-5">

          <div className="flex items-center justify-between mb-3">
            <h2 className="font-extrabold text-[#4A352F]">
              {t("patternsPremium.yourHabits")}
            </h2>

            <span className="text-xs font-bold bg-[#EADDD3] text-[#76564B] px-3 py-1 rounded-full">
              {habits.length}
            </span>
          </div>

          <div className="space-y-3">
            {habits.map(habit => (
              <div
                key={habit.id}
                className="bg-white rounded-2xl p-4 border border-[#E8DDD4] shadow-sm"
              >
                <div className="flex items-start gap-3">

                  <div className="w-10 h-10 rounded-xl bg-[#F0E4DB] flex items-center justify-center">
                    {categories.find(c => c.id === habit.category)?.icon || "✨"}
                  </div>

                  <div className="flex-1">
                    <div className="font-bold text-[#4A352F]">
                      {habit.name}
                    </div>

                    <div className="text-xs text-[#806D65] mt-1">
                      {t(`patternsPremium.categories.${habit.category}`)}
                      {" · "}
                      {t("patternsPremium.baselineShort")} {habit.baseline}/5
                    </div>
                  </div>

                  <button
                    onClick={() => removeHabit(habit.id)}
                    className="text-[#B08B7D] text-lg"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={save}
            className="w-full mt-5 p-4 rounded-2xl bg-[#76564B] text-white font-extrabold shadow-lg"
          >
            ✓ {t("patterns.save")}
          </button>

          {saved && (
            <div className="mt-3 text-center text-sm font-semibold text-[#52765B]">
              {t("patterns.saved")}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
