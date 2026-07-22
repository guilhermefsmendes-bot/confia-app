import React from "react";
import { useTranslation } from "react-i18next";
interface StopModeProps {
  onStartImpulse: () => void;
}

export function StopMode({ onStartImpulse }: StopModeProps) {
  const { t } = useTranslation(); 
 return (
<div className="fixed inset-0 z-[999] bg-[#FFF8F2] p-6 flex flex-col items-center justify-center text-center">
      <div className="text-6xl mb-6">
        🔴
      </div>

      <h1 className="text-3xl font-extrabold text-[#4E3B36] mb-6">
       {t("stopTitle")}
      </h1>

      <p className="text-lg text-[#4E3B36] mb-4">
       {t("stopPause")}
      </p>

      <p className="text-lg text-[#4E3B36] mb-8">
       {t("stopBreathe")}
      </p>

      <p className="text-base text-[#4E3B36] mb-8">
       {t("stopQuestion")}
      </p>

      <button
        onClick={onStartImpulse}
        className="bg-[#C97B5E] text-white px-8 py-4 rounded-full font-bold"
      >
       {t("startExercise")}
      </button>

    </div>
  );
}
