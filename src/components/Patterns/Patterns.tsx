import React, { useMemo, useState } from "react";
import { PatternQuestionnaire } from "./PatternQuestionnaire";
import { PatternResults } from "./PatternResults";
import { HabitSelection } from "./HabitSelection";
import { PatternsDashboard } from "./PatternsDashboard";
import { PatternEvolution } from "./PatternEvolution";
import { calculateScores, analysePatterns } from "./analysis";
import { loadPatternProfile } from "./storage";
import { useTranslation } from "react-i18next";

type Step =
  | "home"
  | "assessment"
  | "questionnaire"
  | "results"
  | "habits"
  | "evolution"
  | "library"
  | "plan";

export const Patterns: React.FC = () => {
  const { t } = useTranslation();

const [step, setStep] = useState<Step>("home");

  const profile = loadPatternProfile();

  const analysis = useMemo(() => {
    if (!profile) return null;

    const scores = calculateScores(profile.answers);

    return analysePatterns(scores);
  }, [profile]);

  if (step === "questionnaire") {
    return (
      <PatternQuestionnaire
        onFinish={() => setStep("results")}
      />
    );
  }

  if (step === "results" && analysis) {
    return (
      <PatternResults
        dominant={analysis.dominant}
      />
    );
  }
if (step === "habits") {
  return (
    <HabitSelection
      onFinish={() => setStep("dashboard")}
    />
  );
}
if (step === "dashboard") {
  return (
    <PatternsDashboard />
  );
}
if (step === "evolution") {
  return <PatternEvolution />;
}

return (
  <div className="bg-white rounded-3xl shadow-lg p-6">

    <div className="text-center mb-8">

      <div className="text-5xl">🌱</div>

      <h2 className="text-2xl font-black mt-3">
        {t("patterns.home.title")}
      </h2>

      <p className="mt-3 text-[#7A5E57]">
        {t("patterns.home.subtitle")}
      </p>

    </div>

    <div className="space-y-4">

      <button
        onClick={() => setStep("questionnaire")}
        className="w-full rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm hover:shadow-md transition"
      >
        <div className="flex justify-between items-center">
          <div>
            <div className="font-bold text-lg">
              🧠 {t("patterns.home.assessment.title")}
            </div>

            <div className="text-sm text-[#7A5E57] mt-1">
              {t("patterns.home.assessment.description")}
            </div>
          </div>

          <div className="text-2xl">›</div>
        </div>
      </button>

      <button
        onClick={() => setStep("habits")}
        className="w-full rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm hover:shadow-md transition"
      >
        <div className="flex justify-between items-center">
          <div>
            <div className="font-bold text-lg">
              🌱 {t("patterns.home.habits.title")}
            </div>

            <div className="text-sm text-[#7A5E57] mt-1">
              {t("patterns.home.habits.description")}
            </div>
          </div>

          <div className="text-2xl">›</div>
        </div>
      </button>

<button
  onClick={() => setStep("evolution")}
  className="w-full rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm hover:shadow-md transition"
>
        <div className="flex justify-between items-center">
          <div>
            <div className="font-bold text-lg">
              📈 {t("patterns.home.evolution.title")}
            </div>

            <div className="text-sm text-[#7A5E57] mt-1">
              {t("patterns.home.evolution.description")}
            </div>
          </div>

          <div className="text-2xl">›</div>
        </div>
      </button>

      <button
        className="w-full rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm opacity-70"
      >
        <div className="flex justify-between items-center">
          <div>
            <div className="font-bold text-lg">
              📚 {t("patterns.home.library.title")}
            </div>

            <div className="text-sm text-[#7A5E57] mt-1">
              {t("patterns.home.library.description")}
            </div>
          </div>

          <div className="text-2xl">›</div>
        </div>
      </button>

<button
onClick={() => setStep("plan")}
  className="w-full rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm hover:shadow-md transition"
>
        <div className="flex justify-between items-center">
          <div>
            <div className="font-bold text-lg">
              🎯 {t("patterns.home.plan.title")}
            </div>

            <div className="text-sm text-[#7A5E57] mt-1">
              {t("patterns.home.plan.description")}
            </div>
          </div>

          <div className="text-2xl">›</div>
        </div>
      </button>

    </div>

  </div>
);

};
