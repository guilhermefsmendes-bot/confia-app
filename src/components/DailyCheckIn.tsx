import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  saveDailyCheckIn,
  getDailyCheckInHistory,
} from "../storage/dailyCheckInStorage";

interface Props {
  onComplete: () => void;
}

export default function DailyCheckIn({ onComplete }: Props) {
  const { t } = useTranslation();

  const [mood, setMood] = useState(5);
  const [need, setNeed] = useState("");
  const [response, setResponse] = useState("");

  const needs = [
    { id: "calm", emoji: "🌿" },
    { id: "mind", emoji: "🧠" },
    { id: "energy", emoji: "⚡" },
    { id: "support", emoji: "🤝" },
    { id: "well", emoji: "✨" },
  ];

  function handleContinue() {
    if (!need) return;

    const level = mood <= 4 ? "low" : "high";

    const key = `dailyCheckIn.responses.${level}${need.charAt(0).toUpperCase()}${need.slice(1)}`;

    setResponse(t(key));
  }

  function handleFinish() {
    saveDailyCheckIn(mood, need);
    onComplete();
  }

  const history = getDailyCheckInHistory();

  const last7 = history.slice(-7);

  const average =
    last7.length > 0
      ? (
          last7.reduce((sum, item) => sum + item.mood, 0) /
          last7.length
        ).toFixed(1)
      : "0";

  function formatDay(date: string) {
    const d = new Date(`${date}T12:00:00`);

    return d.toLocaleDateString(undefined, {
      weekday: "short",
    });
  }

  return (
    <div className="fixed inset-0 z-[1000] bg-black/30 flex items-center justify-center p-5">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">

        {response ? (
          <div>

            <div className="text-center">

              <div className="text-5xl mb-4">
                🌱
              </div>

              <h2 className="text-2xl font-black text-slate-800 mb-4">
                {t("dailyCheckIn.completed.title")}
              </h2>

              <p className="text-lg leading-relaxed text-slate-600 mb-7">
                {response}
              </p>

            </div>

            {/* Evolução */}
            <div className="rounded-3xl bg-green-50 p-5 mb-6">

              <div className="text-center mb-5">

                <h3 className="font-black text-slate-800 text-lg">
                  {t("dailyCheckIn.progressTitle")}
                </h3>

                <p className="text-sm text-slate-500 mt-1">
                  {t("dailyCheckIn.progressSubtitle")}
                </p>

              </div>

              <div className="relative h-40">

                {/* Linhas de referência */}
                <div className="absolute inset-0 flex flex-col justify-between text-xs text-slate-400">
                  <span>10</span>
                  <span>7.5</span>
                  <span>5</span>
                  <span>2.5</span>
                  <span>0</span>
                </div>

                <div className="absolute left-7 right-0 top-0 bottom-0 flex items-end justify-around">

                  {last7.map((item) => (
                    <div
                      key={item.date}
                      className="h-full flex flex-col justify-end items-center"
                    >

                      <div className="flex-1 flex items-end">

                        <div
                          className="w-3 rounded-full bg-green-500 shadow-sm transition-all"
                          style={{
                            height: `${Math.max(item.mood * 10, 4)}%`,
                          }}
                        />

                      </div>

                      <span className="text-xs text-slate-500 mt-2">
                        {formatDay(item.date)}
                      </span>

                    </div>
                  ))}

                </div>

              </div>

              <div className="text-center mt-4">

                <span className="text-sm text-slate-500">
                  {t("dailyCheckIn.weekAverage")}
                </span>

                <span className="ml-2 text-xl font-black text-green-600">
                  {average}/10
                </span>

              </div>

            </div>

            <button
              onClick={handleFinish}
              className="w-full rounded-2xl py-4 bg-green-500 text-white font-black text-lg shadow-lg shadow-green-200"
            >
              {t("dailyCheckIn.continue")}
            </button>

          </div>
        ) : (

          <>

            <div className="text-center mb-6">

              <div className="text-5xl mb-3">
                🌱
              </div>

              <h2 className="text-2xl font-black text-slate-800">
                {t("dailyCheckIn.title")}
              </h2>

              <p className="mt-2 text-slate-500">
                {t("dailyCheckIn.subtitle")}
              </p>

            </div>

            <div className="mb-7">

              <p className="font-bold text-slate-700 mb-4">
                {t("dailyCheckIn.moodQuestion")}
              </p>

              <div className="flex items-center gap-4">

                <span className="text-2xl">
                  😔
                </span>

                <input
                  type="range"
                  min="0"
                  max="10"
                  value={mood}
                  onChange={(e) => setMood(Number(e.target.value))}
                  className="flex-1 accent-green-500"
                />

                <span className="text-2xl">
                  😊
                </span>

              </div>

              <div className="text-center mt-2 text-lg font-black text-green-600">
                {mood}/10
              </div>

            </div>

            <div className="mb-7">

              <p className="font-bold text-slate-700 mb-4">
                {t("dailyCheckIn.needQuestion")}
              </p>

              <div className="grid grid-cols-2 gap-3">

                {needs.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setNeed(item.id)}
                    className={`rounded-2xl p-3 text-sm font-bold transition-all border-2 ${
                      need === item.id
                        ? "border-green-500 bg-green-50 text-green-700 scale-[1.02]"
                        : "border-slate-100 bg-slate-50 text-slate-600"
                    }`}
                  >

                    <div className="text-2xl mb-1">
                      {item.emoji}
                    </div>

                    {t(`dailyCheckIn.needs.${item.id}`)}

                  </button>
                ))}

              </div>

            </div>

            <button
              onClick={handleContinue}
              disabled={!need}
              className={`w-full rounded-2xl py-4 font-black text-lg transition-all ${
                need
                  ? "bg-green-500 text-white shadow-lg shadow-green-200"
                  : "bg-slate-200 text-slate-400"
              }`}
            >
              {t("dailyCheckIn.continue")}
            </button>

          </>

        )}

      </div>
    </div>
  );
}
