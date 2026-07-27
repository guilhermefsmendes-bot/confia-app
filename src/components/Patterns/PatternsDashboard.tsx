import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { PatternEvolution } from "./PatternEvolution";
import { PatternWellbeingComparison } from "./PatternWellbeingComparison";

export const PatternsDashboard: React.FC = () => {
  const storedHabits = localStorage.getItem(
    "confia_patterns_habits_v1"
  );

  const habitData = storedHabits
    ? JSON.parse(storedHabits)
    : null;

  const mainHabit = habitData?.habits?.[0];
const daysSinceStart = habitData?.startedAt
  ? Math.floor(
      (new Date().getTime() -
        new Date(habitData.startedAt).getTime()) /
        (1000 * 60 * 60 * 24)
    ) + 1
  : 0;

  const { t } = useTranslation();

  const [today, setToday] = useState<string | null>(null);


const saveToday = (value:string) => {

  setToday(value);

  const existing =
    JSON.parse(
      localStorage.getItem(
        "confia_patterns_history_v1"
      ) || "[]"
    );


  const newEntry = {
    date: new Date().toISOString(),
    habit: mainHabit,
    value
  };


  localStorage.setItem(
    "confia_patterns_history_v1",
    JSON.stringify([
      ...existing,
      newEntry
    ])
  );

};

  return (

    <div className="bg-white rounded-3xl shadow-lg p-6">


      <div className="text-center">

        <div className="text-5xl">
          🌱
        </div>

        <h2 className="text-2xl font-black text-[#4E3B36] mt-3">
          {t("patterns.dashboard.title")}
        </h2>


        <p className="mt-3 text-[#7A5E57]">
          {t("patterns.dashboard.subtitle")}
        </p>

      </div>

<div className="mt-6 bg-[#FFF8F5] rounded-2xl p-5">

  <h3 className="font-bold">
    🎯 {t("patterns.dashboard.goal")}
  </h3>

  <p className="mt-2 text-[#7A5E57]">
    {mainHabit
      ? t(`patterns.habits.${mainHabit}`)
      : ""}
  </p>

</div>

      <div className="mt-6 bg-[#FFF8F5] rounded-2xl p-5">

        <h3 className="font-bold">
          🎯 {t("patterns.dashboard.today")}
        </h3>

{daysSinceStart > 0 && (
  <p className="mt-3 font-bold text-[#C97B5E]">
    🔥 {daysSinceStart} {t("patterns.dashboard.days")}
  </p>
)}

        <div className="mt-4 space-y-3">

          {[
            "better",
            "same",
            "harder"
          ].map((item)=>(

            <button
              key={item}
              onClick={() => saveToday(item)}
              className={`w-full p-4 rounded-xl border ${
                today === item
                ? "bg-[#FFF1EA] border-[#C97B5E]"
                : "bg-white border-[#E5D4CB]"
              }`}
            >

              {t(`patterns.dashboard.${item}`)}

            </button>

          ))}

        </div>

      </div>

<PatternEvolution />
<PatternWellbeingComparison />  
  </div>

  );
};
