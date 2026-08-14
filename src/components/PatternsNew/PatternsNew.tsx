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

  const habits = (() => {
    try {
      return JSON.parse(
        localStorage.getItem("confia_habits") || "[]"
      );
    } catch {
      return [];
    }
  })();

  const history = (() => {
    try {
      return JSON.parse(
        localStorage.getItem("confia_habits_daily_history") || "[]"
      );
    } catch {
      return [];
    }
  })();

  const ratingCount = (() => {
    try {
      const ratings = JSON.parse(
        localStorage.getItem("confia_ratings_v2") || "[]"
      );
      return Array.isArray(ratings) ? ratings.length : 0;
    } catch {
      return 0;
    }
  })();

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFF9F4] via-[#FAF5F0] to-[#F3ECE5] p-5 pb-12">

      <button
        onClick={onBack}
        className="mb-5 flex items-center gap-2 text-[#795B50] font-semibold"
      >
        ← {t("back")}
      </button>

      {/* HERO */}
      <div className="relative overflow-hidden rounded-[30px] p-6 mb-5 bg-gradient-to-br from-[#6F5148] via-[#87665A] to-[#B58A72] text-white shadow-xl">

        <div className="absolute -right-12 -top-12 w-36 h-36 rounded-full bg-white/10" />
        <div className="absolute -right-5 bottom-[-45px] w-32 h-32 rounded-full bg-white/10" />

        <div className="relative">
          <div className="text-4xl mb-3">🧠</div>

          <h1 className="text-2xl font-extrabold tracking-tight">
            {t("patternsNew.title")}
          </h1>

          <p className="mt-2 text-sm leading-6 text-white/85 max-w-md">
            {t("patternsNew.description")}
          </p>

          <div className="mt-5 grid grid-cols-3 gap-2">
            <div className="rounded-2xl bg-white/15 p-3">
              <div className="text-xl font-bold">{habits.length}</div>
              <div className="text-[10px] uppercase tracking-wide text-white/75">
                {t("patternsPremium.habits")}
              </div>
            </div>

            <div className="rounded-2xl bg-white/15 p-3">
              <div className="text-xl font-bold">{history.length}</div>
              <div className="text-[10px] uppercase tracking-wide text-white/75">
                {t("patternsPremium.days")}
              </div>
            </div>

            <div className="rounded-2xl bg-white/15 p-3">
              <div className="text-xl font-bold">{ratingCount}</div>
              <div className="text-[10px] uppercase tracking-wide text-white/75">
                {t("patternsPremium.wellbeing")}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN ACTION */}
      <button
        onClick={onOpenAssessment}
        className="w-full text-left rounded-[25px] p-5 mb-4 bg-white shadow-md border border-[#E8DDD4] active:scale-[0.99] transition"
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#F0E4DB] flex items-center justify-center text-2xl">
            🔎
          </div>

          <div className="flex-1">
            <h2 className="font-extrabold text-[#4A352F]">
              {t("patternsNew.assessment")}
            </h2>

            <p className="text-sm text-[#806D65] mt-1 leading-5">
              {t("patternsNew.assessmentDesc")}
            </p>
          </div>

          <span className="text-[#9B796B] text-xl">›</span>
        </div>
      </button>

      {/* DAILY */}
      <button
        onClick={onOpenDaily}
        className="w-full text-left rounded-[25px] p-5 mb-4 bg-white shadow-md border border-[#E8DDD4] active:scale-[0.99] transition"
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#E6EFE9] flex items-center justify-center text-2xl">
            📅
          </div>

          <div className="flex-1">
            <h2 className="font-extrabold text-[#4A352F]">
              {t("patternsNew.daily")}
            </h2>

            <p className="text-sm text-[#806D65] mt-1 leading-5">
              {t("patternsNew.dailyDesc")}
            </p>
          </div>

          <span className="text-[#9B796B] text-xl">›</span>
        </div>
      </button>

      {/* EVOLUTION */}
      <button
        onClick={onOpenEvolution}
        className="w-full text-left rounded-[25px] p-5 mb-5 bg-gradient-to-br from-[#FFFDFB] to-[#F2E9E1] shadow-md border border-[#E1D2C7] active:scale-[0.99] transition"
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#E9D9CC] flex items-center justify-center text-2xl">
            📈
          </div>

          <div className="flex-1">
            <h2 className="font-extrabold text-[#4A352F]">
              {t("patternsNew.evolution")}
            </h2>

            <p className="text-sm text-[#806D65] mt-1 leading-5">
              {t("patternsNew.evolutionDesc")}
            </p>
          </div>

          <span className="text-[#9B796B] text-xl">›</span>
        </div>
      </button>

      {/* EXPLANATION */}
      <div className="rounded-[24px] p-5 bg-[#6F5148] text-white shadow-lg">
        <div className="flex gap-3">
          <div className="text-2xl">💡</div>

          <div>
            <h3 className="font-extrabold">
              {t("patternsPremium.whyTitle")}
            </h3>

            <p className="text-sm text-white/80 mt-2 leading-6">
              {t("patternsPremium.whyDescription")}
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
