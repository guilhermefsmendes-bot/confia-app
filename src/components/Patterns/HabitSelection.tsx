import React, { useState } from "react";
import { useTranslation } from "react-i18next";

interface HabitSelectionProps {
  onFinish: () => void;
}

const HABITS = [
  "symptomSearch",
  "socialMedia",
  "series",
  "videoGames",
  "shopping",
  "checkingMessages",
  "food",
  "caffeine",
  "avoidance",
  "reassurance",
  "other"
];

export const HabitSelection: React.FC<HabitSelectionProps> = ({
  onFinish,
}) => {

  const { t } = useTranslation();

  const [selected, setSelected] = useState<string[]>([]);


  const toggleHabit = (habit: string) => {

    if (selected.includes(habit)) {

      setSelected(
        selected.filter((item) => item !== habit)
      );

    } else {

      setSelected([
        ...selected,
        habit
      ]);

    }

  };


  const saveHabits = () => {

localStorage.setItem(
  "confia_patterns_habits_v1",
  JSON.stringify({
    habits: selected,
    startedAt: new Date().toISOString()
  })
);
    onFinish();

  };


  return (

    <div className="bg-white rounded-3xl shadow-lg p-6">

      <h2 className="text-xl font-black text-[#4E3B36]">
        {t("patterns.habits.title")}
      </h2>

      <p className="mt-3 text-[#7A5E57]">
        {t("patterns.habits.subtitle")}
      </p>


      <div className="mt-6 space-y-3">

        {HABITS.map((habit) => (

          <button
            key={habit}
            onClick={() => toggleHabit(habit)}
            className={`w-full p-4 rounded-xl text-left border ${
              selected.includes(habit)
              ? "bg-[#FFF1EA] border-[#C97B5E]"
              : "bg-white border-[#E5D4CB]"
            }`}
          >

            {t(`patterns.habits.${habit}`)}

          </button>

        ))}

      </div>


      <button
        disabled={selected.length === 0}
        onClick={saveHabits}
        className="mt-8 w-full bg-[#C97B5E] text-white py-4 rounded-2xl font-bold disabled:opacity-40"
      >
        {t("patterns.habits.continue")}

      </button>


    </div>

  );
};
