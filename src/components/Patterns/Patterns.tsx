import React, { useMemo, useState } from "react";
import { motion } from "motion/react";
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
      onBack={() => setStep("home")}
    />
  );
}

if (step === "results") {
  const currentProfile = loadPatternProfile();

  if (!currentProfile) {
    return (
      <div className="p-6 text-center">
        Sem dados de avaliação.
      </div>
    );
  }

  const scores = calculateScores(currentProfile.answers);
  const currentAnalysis = analysePatterns(scores);

  return (
    <PatternResults
      dominant={currentAnalysis.dominant}
    />
  );
}
if (step === "habits") {
  return (
    <HabitSelection
      onFinish={() => setStep("dashboard")}
      onBack={() => setStep("home")}
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
if (step === "evolution") {
  return <PatternEvolution />;
}
if (step === "evolution") {
  return <PatternEvolution />;
}

if (step === "library") {
  return (
    <div className="space-y-4">

      <button
        onClick={() => setStep("home")}
        className="text-sm text-[#7A5E57]"
      >
        ← {t("common.back")}
      </button>

      <h2 className="text-2xl font-bold">
        📚 {t("patterns.library.title")}
      </h2>

      <p className="text-[#7A5E57]">
        {t("patterns.library.description")}
      </p>

      <div className="space-y-3">

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="font-bold text-lg">
            🧠 {t("patterns.library.brain.title")}
          </div>

          <p className="text-sm text-[#7A5E57] mt-2">
            {t("patterns.library.brain.description")}
          </p>
        </div>


        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="font-bold text-lg">
            🔍 {t("patterns.library.confirmation.title")}
          </div>

          <p className="text-sm text-[#7A5E57] mt-2">
            {t("patterns.library.confirmation.description")}
          </p>
        </div>


        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="font-bold text-lg">
            🔄 {t("patterns.library.cycle.title")}
          </div>

          <p className="text-sm text-[#7A5E57] mt-2">
            {t("patterns.library.cycle.description")}
          </p>
        </div>

      </div>

    </div>
  );
}
if (step === "plan") {
  return (
    <div className="space-y-4">

      <button
        onClick={() => setStep("home")}
        className="text-sm text-[#7A5E57]"
      >
        ← {t("common.back")}
      </button>

      <h2 className="text-2xl font-bold">
t("patterns.plan.title")
      </h2>

      <p className="text-[#7A5E57]">
t("patterns.plan.description")
      </p>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        🌱 O teu plano personalizado será criado com base nos teus padrões identificados.
      </div>

    </div>
  );
}

return (
  <div className="bg-gradient-to-b from-[#FFF8F5] to-white rounded-3xl shadow-lg p-6">

    <div className="text-center mb-8">

      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="text-6xl"
      >
        🌱
      </motion.div>

      <h2 className="text-3xl font-black mt-4 text-[#4E3B36]">
        {t("patterns.home.title")}
      </h2>

      <p className="mt-4 text-[#7A5E57] leading-relaxed">
        {t("patterns.home.premiumDescription")}
      </p>

    </div>

    <div className="bg-white rounded-3xl p-5 shadow-sm border border-[#F2E5DE] mb-6">

      <div className="space-y-3 text-[#5B4540]">

        <p>🧠 {t("patterns.home.featureMind")}</p>

        <p>💭 {t("patterns.home.featurePatterns")}</p>

        <p>🌱 {t("patterns.home.featureGrowth")}</p>

      </div>

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
t("patterns.home.habits.title")
            </div>

            <div className="text-sm text-[#7A5E57] mt-1">
t("patterns.home.habits.description")
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
  onClick={() => setStep("library")}
  className="w-full rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm hover:shadow-md transition"
>
        <div className="flex justify-between items-center">
          <div>
            <div className="font-bold text-lg">
t("patterns.home.library.title")
            </div>

            <div className="text-sm text-[#7A5E57] mt-1">
t("patterns.home.library.description")
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
t("patterns.home.plan.title")
            </div>

            <div className="text-sm text-[#7A5E57] mt-1">
t("patterns.home.plan.description")
            </div>
          </div>

          <div className="text-2xl">›</div>
        </div>
      </button>

    </div>

  </div>
);

};
