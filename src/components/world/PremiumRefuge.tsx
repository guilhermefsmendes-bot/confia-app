import React, { memo } from "react";
import { getRefugeLevel } from "../../data/refugeProgress";

interface Props {
  xp: number;
}

function PremiumRefuge({ xp }: Props) {
  const level = getRefugeLevel(xp).level;

  return (
    <div
      className="
        absolute
        left-1/2
        bottom-[31%]
        z-[22]
        w-[168px]
        -translate-x-1/2
        pointer-events-none
      "
      aria-hidden="true"
    >
      {/* Sombra de contacto */}
      <div
        className="
          absolute
          left-1/2
          bottom-[-5px]
          h-4
          w-[78%]
          -translate-x-1/2
          rounded-full
          bg-black/15
          blur-md
        "
      />

      <svg
        viewBox="0 0 220 180"
        className="relative block h-auto w-full overflow-visible"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="confiaWall" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F8E9D7" />
            <stop offset="100%" stopColor="#DDBD9E" />
          </linearGradient>

          <linearGradient id="confiaRoof" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#9C5E49" />
            <stop offset="100%" stopColor="#684238" />
          </linearGradient>

          <linearGradient id="confiaWood" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#9A6B4D" />
            <stop offset="100%" stopColor="#684634" />
          </linearGradient>

          <linearGradient id="confiaGlass" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFE6A8" />
            <stop offset="100%" stopColor="#E8A95B" />
          </linearGradient>
        </defs>

        {/* Corpo principal */}
        <path
          d="M48 84 L172 84 L172 158 Q172 164 166 164 L54 164 Q48 164 48 158 Z"
          fill="url(#confiaWall)"
        />

        {/* Telhado */}
        <path
          d="M31 88 L104 29 Q110 24 116 29 L189 88 Q193 92 187 94 L174 94 L110 45 L46 94 L33 94 Q27 92 31 88 Z"
          fill="url(#confiaRoof)"
        />

        {/* Beiral */}
        <path
          d="M43 94 L110 42 L177 94"
          fill="none"
          stroke="#5C3B33"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.7"
        />

        {/* Porta */}
        <path
          d="M91 112 Q91 105 98 105 H122 Q129 105 129 112 V164 H91 Z"
          fill="url(#confiaWood)"
        />

        <circle
          cx="120"
          cy="136"
          r="2.5"
          fill="#E7C88B"
        />

        {/* Janela principal */}
        <rect
          x="59"
          y="108"
          width="25"
          height="27"
          rx="5"
          fill="url(#confiaGlass)"
        />
        <path
          d="M71.5 108 V135 M59 121.5 H84"
          stroke="#9B765A"
          strokeWidth="2"
          opacity="0.75"
        />

        {/* Nível 2 — segunda janela */}
        {level >= 2 && (
          <>
            <rect
              x="136"
              y="108"
              width="25"
              height="27"
              rx="5"
              fill="url(#confiaGlass)"
            />
            <path
              d="M148.5 108 V135 M136 121.5 H161"
              stroke="#9B765A"
              strokeWidth="2"
              opacity="0.75"
            />

            {/* Floreira */}
            <path
              d="M136 138 H161 L158 145 H139 Z"
              fill="#865D43"
            />
            <circle cx="142" cy="137" r="4" fill="#C97B5E" />
            <circle cx="149" cy="135" r="4" fill="#E5A88B" />
            <circle cx="156" cy="137" r="4" fill="#D49A72" />
          </>
        )}

        {/* Nível 3 — pequena extensão */}
        {level >= 3 && (
          <>
            <path
              d="M169 111 L198 111 L198 160 Q198 164 194 164 H169 Z"
              fill="#D6B18E"
            />
            <path
              d="M164 110 L184 92 L204 110 Z"
              fill="#81503F"
            />
            <rect
              x="178"
              y="126"
              width="12"
              height="18"
              rx="3"
              fill="#F5D795"
            />
          </>
        )}

        {/* Nível 4 — vegetação integrada */}
        {level >= 4 && (
          <>
            <path
              d="M42 162 C30 151 28 139 36 132 C43 141 47 150 48 162 Z"
              fill="#527A58"
            />
            <path
              d="M176 163 C182 148 191 143 199 145 C196 156 188 162 176 163 Z"
              fill="#456D4F"
            />
            <circle cx="36" cy="148" r="8" fill="#6F946A" />
            <circle cx="190" cy="151" r="9" fill="#62855F" />
          </>
        )}

        {/* Nível 5 — detalhe de santuário */}
        {level >= 5 && (
          <>
            <circle
              cx="110"
              cy="67"
              r="7"
              fill="#F6D895"
              opacity="0.9"
            />
            <circle
              cx="110"
              cy="67"
              r="14"
              fill="#F6D895"
              opacity="0.12"
            />

            <path
              d="M80 97 Q110 88 140 97"
              fill="none"
              stroke="#E8C98D"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.75"
            />
          </>
        )}
      </svg>
    </div>
  );
}

export default memo(PremiumRefuge);
