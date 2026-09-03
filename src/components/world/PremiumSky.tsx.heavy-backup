import React from "react";

interface PremiumSkyProps {
  isNight: boolean;
}

export default function PremiumSky({ isNight }: PremiumSkyProps) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">

      {/* Céu base */}
      <div
        className={`absolute inset-x-0 top-0 h-[380px] transition-all duration-[3000ms] ${
          isNight
            ? "bg-gradient-to-b from-[#081225] via-[#172b4d] to-[#7892a3]"
            : "bg-gradient-to-b from-[#78c8ef] via-[#b8e4f4] to-[#dcebdc]"
        }`}
      />

      {/* Brilho atmosférico junto ao horizonte */}
      <div
        className={`absolute left-[-15%] right-[-15%] top-[190px] h-[190px] rounded-[50%] blur-3xl ${
          isNight
            ? "bg-indigo-300/10"
            : "bg-white/45"
        }`}
      />

      {/* Luz principal */}
      {!isNight && (
        <>
          <div
            className="
              absolute
              -top-24
              -right-20
              h-80
              w-80
              rounded-full
              bg-amber-100/25
              blur-3xl
            "
          />

          <div
            className="
              absolute
              -top-8
              right-12
              h-24
              w-24
              rounded-full
              bg-white/35
              blur-xl
            "
          />
        </>
      )}

      {/* Lua atmosférica */}
      {isNight && (
        <>
          <div
            className="
              absolute
              top-10
              right-12
              h-16
              w-16
              rounded-full
              bg-slate-100/90
              shadow-[0_0_45px_rgba(220,230,255,0.35)]
            "
          />

          <div
            className="
              absolute
              top-7
              right-16
              h-16
              w-16
              rounded-full
              bg-[#172b4d]
            "
          />
        </>
      )}

      {/* Neblina distante */}
      <div
        className="
          absolute
          left-[-10%]
          right-[-10%]
          bottom-[205px]
          h-24
          rounded-[50%]
          bg-white/20
          blur-2xl
        "
      />

      {/* Pequenas partículas atmosféricas */}
      <div className="absolute inset-0">
        {[...Array(10)].map((_, index) => (
          <span
            key={index}
            className={`absolute h-1 w-1 rounded-full ${
              isNight
                ? "bg-white/30"
                : "bg-white/25"
            }`}
            style={{
              left: `${8 + index * 9}%`,
              top: `${18 + ((index * 17) % 38)}%`,
            }}
          />
        ))}
      </div>

      {/* Transição para o terreno */}
      <div
        className="
          absolute
          inset-x-0
          bottom-[300px]
          h-32
          bg-gradient-to-t
          from-emerald-700/20
          via-emerald-400/5
          to-transparent
        "
      />

    </div>
  );
}
