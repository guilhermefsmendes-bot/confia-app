import React, { useState } from "react";
import { useTranslation } from "react-i18next";

interface Props {
  onBack: () => void;
}

const levels = [1, 2, 3, 4, 5];

export default function HabitDailyCheck({ onBack }: Props) {
  const { t } = useTranslation();

  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [saved, setSaved] = useState(false);

  const habits: string[] = JSON.parse(
    localStorage.getItem("confia_habits") || "[]"
  );

  function selectLevel(habit: string, level: number) {
    setRatings(prev => ({
      ...prev,
      [habit]: level
    }));
  }

  function saveRecord() {
    const today = new Date().toISOString().split("T")[0];

    localStorage.setItem(
      "confia_habits_daily",
      JSON.stringify({
        date: today,
        ratings
      })
    );

    setSaved(true);
  }

  return (
    <div className="min-h-screen p-6 bg-white">

      <button
        onClick={onBack}
        className="mb-6 text-[#7A5E57]"
      >
        ← {t("patterns.back")}
      </button>

      <h1 className="text-2xl font-bold text-[#4A352F] mb-4">
        📅 {t("patterns.dailyTitle")}
      </h1>

      <p className="text-[#7A5E57] mb-6">
        {t("patterns.dailyDescription")}
      </p>
<div className="space-y-6">

  {habits.map((habit) => (

    <div key={habit}>

      <p className="mb-3 font-medium text-[#4A352F]">
        {habit}
      </p>

      <div className="flex gap-3">

        {levels.map((level) => (

          <button
            key={level}
            onClick={() => selectLevel(habit, level)}
            className={`w-12 h-12 rounded-full font-semibold transition ${
              ratings[habit] === level
                ? "bg-[#7A5E57] text-white"
                : "bg-[#F7F1EA] text-[#7A5E57]"
            }`}
          >
            {level}
          </button>

        ))}

      </div>

    </div>

  ))}

</div>

{Object.keys(ratings).length === habits.length && habits.length > 0 && (

  <button
    onClick={saveRecord}
    className="w-full mt-8 p-4 rounded-xl bg-[#7A5E57] text-white font-semibold"
  >
    {t("patterns.save")}
  </button>

)}

{saved && (

  <p className="mt-4 text-center text-green-700 font-medium">
    {t("patterns.recordSaved")}
  </p>

)}

    </div>
  );
}
