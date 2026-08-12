import React from "react";
import { useTranslation } from "react-i18next";
import { PatternCategory } from "./types";
import { PROFILE_INFO } from "./profileNames";

interface PatternResultsProps {
  dominant: PatternCategory;
  onContinue: () => void;
}

export const PatternResults: React.FC<PatternResultsProps> = ({
  dominant,
  onContinue,
}) => {
  const { t } = useTranslation();

  const profile = PROFILE_INFO[dominant];

  return (
    <div className="bg-white rounded-3xl shadow-lg p-6">

      <div className="text-center">

        <div className="text-6xl mb-4">
          {profile.emoji}
        </div>

        <h2 className="text-2xl font-black text-[#4E3B36]">
          {t(profile.nameKey)}
        </h2>

        <p className="mt-4 text-[#7A5E57] leading-relaxed">
          {t(profile.descriptionKey)}
        </p>

      </div>

      <div className="mt-8 bg-[#FFF8F5] rounded-2xl p-4">

        <h3 className="font-bold mb-2">
          💪 {t("patterns.strength")}
        </h3>

        <p>{t(profile.strengthKey)}</p>

      </div>

      <div className="mt-4 bg-[#FFF8F5] rounded-2xl p-4">

        <h3 className="font-bold mb-2">
          🌱 {t("patterns.challenge")}
        </h3>

        <p>{t(profile.challengeKey)}</p>

      </div>
      <button
        onClick={onContinue}
        className="mt-8 w-full rounded-2xl bg-[#C97B5E] py-4 text-white font-bold"
      >
        {t("patterns.continue")}
      </button>

    </div>
  );
};
