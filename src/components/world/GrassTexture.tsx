import React from "react";

const patches = [
  { left: "8%", top: "72%", w: 220, h: 70, r: -6 },
  { left: "38%", top: "70%", w: 260, h: 80, r: 4 },
  { left: "68%", top: "76%", w: 240, h: 75, r: -5 },
  { left: "30%", top: "90%", w: 300, h: 90, r: 5 },
];

const grass = [
  { left: "10%", top: "78%", rotate: -8 },
  { left: "24%", top: "72%", rotate: 6 },
  { left: "39%", top: "82%", rotate: -5 },
  { left: "53%", top: "75%", rotate: 7 },
  { left: "66%", top: "84%", rotate: -6 },
  { left: "78%", top: "76%", rotate: 6 },
  { left: "89%", top: "86%", rotate: -7 },
  { left: "46%", top: "92%", rotate: 5 },
];

export default function GrassTexture() {
  return (
    <>
      {/* Variações simples do terreno */}
      {patches.map((patch, index) => (
        <div
          key={`patch-${index}`}
          className="absolute pointer-events-none rounded-[50%] bg-black/[0.035]"
          style={{
            left: patch.left,
            top: patch.top,
            width: patch.w,
            height: patch.h,
            transform: `rotate(${patch.r}deg)`,
          }}
        />
      ))}

      {/* Pequenos tufos de relva */}
      {grass.map((item, index) => (
        <div
          key={`grass-${index}`}
          className="absolute pointer-events-none z-[8]"
          style={{
            left: item.left,
            top: item.top,
            transform: `rotate(${item.rotate}deg)`,
          }}
        >
          <div className="h-6 w-[3px] rounded-full bg-emerald-950/35" />
        </div>
      ))}

      {/* Vinheta simples */}
      <div
        className="
          absolute
          inset-x-0
          bottom-0
          h-48
          pointer-events-none
          bg-gradient-to-t
          from-black/[0.08]
          via-black/[0.025]
          to-transparent
          z-[7]
        "
      />
    </>
  );
}
