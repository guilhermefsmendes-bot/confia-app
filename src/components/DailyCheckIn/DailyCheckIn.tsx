import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { saveDailyCheckIn } from "../../storage/dailyCheckInStorage";

interface Props {
  onComplete?: () => void;
}

const DailyCheckIn: React.FC<Props> = ({ onComplete }) => {
  const { t } = useTranslation();

  const [mood, setMood] = useState<number | null>(null);
  const [need, setNeed] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);

  const needs = [
    {
      id: "calm",
      emoji: "🧘",
      label: t("dailyCheckIn.needs.calm"),
    },
    {
      id: "mind",
      emoji: "🧠",
      label: t("dailyCheckIn.needs.mind"),
    },
    {
      id: "energy",
      emoji: "⚡",
      label: t("dailyCheckIn.needs.energy"),
    },
    {
      id: "support",
      emoji: "❤️",
      label: t("dailyCheckIn.needs.support"),
    },
    {
      id: "well",
      emoji: "🌱",
      label: t("dailyCheckIn.needs.well"),
    },
  ];

  const handleComplete = () => {
    if (mood === null || need === null) return;

    saveDailyCheckIn(mood, need);
    setCompleted(true);

    setTimeout(() => {
      onComplete?.();
    }, 1200);
  };

  if (completed) {
    return (
      <div className="flex min-h-[calc(100vh-80px)] items-center justify-center px-5">
        <div className="w-full max-w-md rounded-3xl bg-white/90 p-8 text-center shadow-xl backdrop-blur">
          <div className="mb-4 text-5xl">🌱</div>

          <h2 className="text-2xl font-bold text-slate-800">
            {t("dailyCheckIn.completed.title")}
          </h2>

          <p className="mt-3 text-slate-600">
            {t("dailyCheckIn.completed.text")}
          </p>

          <div className="mt-6 inline-flex rounded-full bg-emerald-100 px-5 py-2 font-bold text-emerald-700">
            +20 XP
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-80px)] items-center justify-center px-5 py-8">
      <div className="w-full max-w-md rounded-3xl bg-white/90 p-6 shadow-xl backdrop-blur">

        <div className="text-center">
          <div className="text-5xl">🌅</div>

          <h1 className="mt-3 text-3xl font-bold text-slate-800">
            {t("dailyCheckIn.title")}
          </h1>

          <p className="mt-2 text-slate-600">
            {t("dailyCheckIn.subtitle")}
          </p>
        </div>

        <div className="mt-8">
          <h2 className="text-center text-lg font-semibold text-slate-800">
            {t("dailyCheckIn.moodQuestion")}
          </h2>

          <div className="mt-5 flex justify-between gap-2">
            {[0, 2, 4, 6, 8, 10].map((value) => (
              <button
                key={value}
                onClick={() => setMood(value)}
                className={`flex h-11 w-11 items-center justify-center rounded-full font-bold transition ${
                  mood === value
                    ? "scale-110 bg-emerald-500 text-white shadow-lg"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {value}
              </button>
            ))}
          </div>

          <div className="mt-2 flex justify-between text-xs text-slate-400">
            <span>{t("dailyCheckIn.moodLow")}</span>
            <span>{t("dailyCheckIn.moodHigh")}</span>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-center text-lg font-semibold text-slate-800">
            {t("dailyCheckIn.needQuestion")}
          </h2>

          <div className="mt-4 grid grid-cols-2 gap-3">
            {needs.map((item) => (
              <button
                key={item.id}
                onClick={() => setNeed(item.id)}
                className={`rounded-2xl border p-4 text-left transition ${
                  need === item.id
                    ? "border-emerald-500 bg-emerald-50 shadow-md"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                <div className="text-2xl">{item.emoji}</div>

                <div className="mt-2 text-sm font-semibold text-slate-700">
                  {item.label}
                </div>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleComplete}
          disabled={mood === null || need === null}
          className="mt-8 w-full rounded-2xl bg-emerald-500 py-4 font-bold text-white shadow-lg transition disabled:cursor-not-allowed disabled:opacity-40"
        >
          {t("dailyCheckIn.continue")}
        </button>
      </div>
    </div>
  );
};

export default DailyCheckIn;
