import React from "react";

const patches = [
  { left: "4%", top: "68%", w: 180, h: 70, r: -8 },
  { left: "18%", top: "74%", w: 220, h: 85, r: 5 },
  { left: "38%", top: "68%", w: 260, h: 95, r: -3 },
  { left: "62%", top: "76%", w: 240, h: 90, r: 7 },
  { left: "82%", top: "68%", w: 190, h: 75, r: -6 },
  { left: "8%", top: "88%", w: 260, h: 100, r: 4 },
  { left: "35%", top: "91%", w: 300, h: 110, r: -5 },
  { left: "70%", top: "90%", w: 280, h: 105, r: 6 },
];

const grassLines = [
  { left: "7%", top: "76%", rotate: -8 },
  { left: "13%", top: "84%", rotate: 5 },
  { left: "22%", top: "71%", rotate: -4 },
  { left: "29%", top: "86%", rotate: 7 },
  { left: "37%", top: "78%", rotate: -6 },
  { left: "45%", top: "91%", rotate: 5 },
  { left: "53%", top: "73%", rotate: -7 },
  { left: "61%", top: "86%", rotate: 6 },
  { left: "69%", top: "79%", rotate: -4 },
  { left: "77%", top: "91%", rotate: 7 },
  { left: "86%", top: "75%", rotate: -6 },
  { left: "93%", top: "86%", rotate: 5 },
];

export default function GrassTexture() {
  return (
    <>
      {/* Variações suaves de terreno */}
      {patches.map((patch, index) => (
        <div
          key={`patch-${index}`}
          className="absolute pointer-events-none rounded-[50%] bg-black/[0.045] blur-xl"
          style={{
            left: patch.left,
            top: patch.top,
            width: patch.w,
            height: patch.h,
            transform: `rotate(${patch.r}deg)`,
          }}
        />
      ))}

      {/* Pequenas linhas de vegetação */}
      {grassLines.map((line, index) => (
        <div
          key={`grass-${index}`}
          className="absolute pointer-events-none z-[8]"
          style={{
            left: line.left,
            top: line.top,
            transform: `rotate(${line.rotate}deg)`,
          }}
        >
          <div className="relative h-7 w-5">
            <span className="absolute bottom-0 left-2 h-6 w-[2px] rounded-full bg-emerald-950/35" />
            <span className="absolute bottom-0 left-1 h-5 w-[2px] rounded-full bg-emerald-900/30 -rotate-[25deg]" />
            <span className="absolute bottom-0 left-3 h-5 w-[2px] rounded-full bg-emerald-950/25 rotate-[25deg]" />
          </div>
        </div>
      ))}

      {/* Vinheta natural junto ao fundo */}
      <div
        className="
          absolute
          inset-x-0
          bottom-0
          h-48
          pointer-events-none
          bg-gradient-to-t
          from-black/[0.10]
          via-black/[0.035]
          to-transparent
          z-[7]
        "
      />
    </>
  );
}
