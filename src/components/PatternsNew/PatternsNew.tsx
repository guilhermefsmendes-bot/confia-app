import React from "react";
import { useTranslation } from "react-i18next";

interface Props {
  onBack: () => void;
  onOpenAssessment: () => void;
  onOpenDaily: () => void;
  onOpenEvolution: () => void;
}

export default function PatternsNew({
  onBack,
  onOpenAssessment,
  onOpenDaily,
  onOpenEvolution,
}: Props) {

  const { t } = useTranslation();

  return (
    <div className="min-h-screen p-6 bg-white">

      <button
        onClick={onBack}
        className="mb-6 text-[#7A5E57]"
      >
        ← {t("back")}
      </button>

      <h1 className="text-2xl font-bold text-[#4A352F] mb-3">
        🌱 {t("patternsNew.title")}
      </h1>

      <p className="text-[#7A5E57] mb-8">
        {t("patternsNew.description")}
      </p>


      <div className="space-y-4">

        <button
          onClick={onOpenAssessment}
          className="w-full p-5 rounded-2xl bg-[#F7F1EA] text-left"
        >
          <h2 className="font-semibold text-lg">
            🧠 {t("patternsNew.assessment")}
          </h2>

          <p className="text-sm mt-2">
            {t("patternsNew.assessmentDesc")}
          </p>
        </button>


        <button
          onClick={onOpenDaily}
          className="w-full p-5 rounded-2xl bg-[#F7F1EA] text-left"
        >
          <h2 className="font-semibold text-lg">
            📅 {t("patternsNew.daily")}
          </h2>

          <p className="text-sm mt-2">
            {t("patternsNew.dailyDesc")}
          </p>
        </button>


        <button
          onClick={onOpenEvolution}
          className="w-full p-5 rounded-2xl bg-[#F7F1EA] text-left"
        >
          <h2 className="font-semibold text-lg">
            📊 {t("patternsNew.evolution")}
          </h2>

          <p className="text-sm mt-2">
            {t("patternsNew.evolutionDesc")}
          </p>
        </button>

      </div>

    </div>
  );
}
