import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { savePatternProfile } from "./storage";

interface HabitSelectionProps {
  onFinish: () => void;
  onBack?: () => void;
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
  "other",
];

export const HabitSelection: React.FC<HabitSelectionProps> = ({
  onFinish,
  onBack,
}) => {
  const { t } = useTranslation();

  const [selected, setSelected] = useState<string[]>([]);

  const toggleHabit = (habit: string) => {
    setSelected((prev) =>
      prev.includes(habit)
        ? prev.filter((item) => item !== habit)
        : [...prev, habit]
    );
  };

  const handleContinue = () => {
    savePatternProfile({
      habits: selected,
    });

    onFinish();
  };

  return (
    <div className="bg-[#FFF8F5] rounded-2xl p-5">

      <button
        onClick={onBack}
        className="text-sm text-[#7A5E57] mb-4"
      >
        ← {t("common.back")}
      </button>

      <h2 className="text-xl font-black text-[#4E3B36] mb-2">
t("patterns.home.habits.title")
      </h2>

      <p className="text-sm text-[#7A5E57] mb-6">
{t("patterns.home.habits.description")}
      </p>

      <div className="space-y-3">

        {HABITS.map((habit) => (
          <button
            key={habit}
            onClick={() => toggleHabit(habit)}
            className={`w-full rounded-xl border p-4 text-left transition ${
              selected.includes(habit)
                ? "bg-[#FFF3EE] border-[#7A5E57]"
                : "bg-white border-gray-200"
            }`}
          >
t(`patterns.home.habits.${habit}`)
          </button>
        ))}

      </div>

      <button
        onClick={handleContinue}
        className="w-full mt-6 rounded-2xl bg-[#7A5E57] text-white p-4 font-bold"
      >
t("patterns.home.habits.continue")
      </button>

    </div>
  );
};
