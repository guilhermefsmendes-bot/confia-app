import React from "react";

interface PremiumSkyProps {
  isNight: boolean;
}

export default function PremiumSky({ isNight }: PremiumSkyProps) {
  return (
    <div className="absolute inset-0 pointer-events-none">

      {/* Céu */}
      <div
        className={`absolute inset-x-0 top-0 h-[380px] ${
          isNight
            ? "bg-gradient-to-b from-[#081225] via-[#172b4d] to-[#7892a3]"
            : "bg-gradient-to-b from-[#78c8ef] via-[#b8e4f4] to-[#dcebdc]"
        }`}
      />

      {/* Sol / Lua */}
      <div
        className={`absolute top-10 right-12 h-16 w-16 rounded-full ${
          isNight
            ? "bg-slate-100"
            : "bg-amber-100"
        }`}
      />

      {/* Transição para o terreno */}
      <div
        className="
          absolute
          inset-x-0
          bottom-[300px]
          h-24
          bg-gradient-to-t
          from-emerald-700/10
          to-transparent
        "
      />

    </div>
  );
}
