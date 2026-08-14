import React, { memo } from "react";

interface PremiumLightingProps {
  isNight: boolean;
}

function PremiumLighting({
  isNight,
}: PremiumLightingProps) {
  return (
    <div className="absolute inset-0 pointer-events-none">

      {/* Luz ambiente simples */}
      <div
        className={`absolute inset-x-0 top-0 h-[300px] ${
          isNight
            ? "bg-indigo-900/10"
            : "bg-yellow-100/10"
        }`}
      />

      {/* Luz solar / lunar */}
      <div
        className={`absolute top-8 right-10 h-14 w-14 rounded-full ${
          isNight
            ? "bg-slate-200/30"
            : "bg-yellow-200/30"
        }`}
      />

    </div>
  );
}

export default memo(PremiumLighting);
