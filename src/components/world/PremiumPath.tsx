import React, { memo } from "react";

const stones = [
  { left: "18%", top: "76%", rotate: -12, scale: 0.7 },
  { left: "27%", top: "80%", rotate: 8, scale: 0.55 },
  { left: "38%", top: "84%", rotate: -5, scale: 0.65 },
  { left: "52%", top: "87%", rotate: 10, scale: 0.5 },
  { left: "64%", top: "84%", rotate: -8, scale: 0.7 },
  { left: "76%", top: "79%", rotate: 6, scale: 0.55 },
];

function PremiumPath() {
  return (
    <>
      {/* Caminho */}
      <div
        className="
          absolute
          left-[18%]
          bottom-[5%]
          w-[64%]
          h-[190px]
          pointer-events-none
          z-[14]
          overflow-hidden
        "
        style={{
          clipPath:
            "polygon(40% 0%, 60% 0%, 72% 22%, 82% 45%, 94% 72%, 100% 100%, 0% 100%, 6% 72%, 18% 45%, 28% 22%)",
        }}
      >
        <div
          className="
            absolute
            inset-0
            bg-gradient-to-b
            from-stone-300
            via-amber-200
            to-stone-400
          "
        />

        {/* Centro do caminho */}
        <div
          className="
            absolute
            inset-x-[25%]
            top-0
            bottom-0
            bg-amber-100/30
          "
        />
      </div>

      {/* Pedras */}
      {stones.map((stone, index) => (
        <div
          key={index}
          className="
            absolute
            z-[17]
            pointer-events-none
            w-5
            h-3
            rounded-full
            bg-stone-500
          "
          style={{
            left: stone.left,
            top: stone.top,
            transform: `rotate(${stone.rotate}deg) scale(${stone.scale})`,
          }}
        />
      ))}
    </>
  );
}

export default memo(PremiumPath);
