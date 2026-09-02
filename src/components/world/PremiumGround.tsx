import React, { memo } from "react";

const stones = [
  { left: "12%", bottom: "13%", scale: 0.55, rotate: -12 },
  { left: "20%", bottom: "9%", scale: 0.38, rotate: 8 },
  { left: "32%", bottom: "16%", scale: 0.45, rotate: -5 },
  { left: "47%", bottom: "8%", scale: 0.32, rotate: 12 },
  { left: "59%", bottom: "14%", scale: 0.48, rotate: -8 },
  { left: "73%", bottom: "9%", scale: 0.36, rotate: 7 },
  { left: "91%", bottom: "14%", scale: 0.50, rotate: -10 },
];

const grassClusters = [
  { left: "6%", bottom: "20%", scale: 0.7 },
  { left: "15%", bottom: "17%", scale: 0.9 },
  { left: "26%", bottom: "21%", scale: 0.65 },
  { left: "38%", bottom: "18%", scale: 0.8 },
  { left: "51%", bottom: "21%", scale: 0.7 },
  { left: "64%", bottom: "18%", scale: 0.9 },
  { left: "78%", bottom: "20%", scale: 0.72 },
  { left: "90%", bottom: "18%", scale: 0.85 },
];

function Stone({
  left,
  bottom,
  scale,
  rotate,
}: {
  left: string;
  bottom: string;
  scale: number;
  rotate: number;
}) {
  return (
    <div
      className="absolute pointer-events-none origin-bottom z-[24]"
      style={{
        left,
        bottom,
        transform: `scale(${scale}) rotate(${rotate}deg)`,
      }}
    >
      <div
        className="
          h-7
          w-11
          rounded-[55%_45%_48%_52%]
          bg-stone-500
        "
      />
    </div>
  );
}

function GrassCluster({
  left,
  bottom,
  scale,
}: {
  left: string;
  bottom: string;
  scale: number;
}) {
  return (
    <div
      className="absolute pointer-events-none origin-bottom z-[25]"
      style={{
        left,
        bottom,
        transform: `scale(${scale})`,
      }}
    >
      <div className="relative h-10 w-9">
        <span className="absolute bottom-0 left-4 h-10 w-[3px] rotate-[-20deg] rounded-full bg-emerald-950/50" />
        <span className="absolute bottom-0 left-5 h-9 w-[3px] rounded-full bg-emerald-900/55" />
        <span className="absolute bottom-0 left-6 h-8 w-[3px] rotate-[20deg] rounded-full bg-emerald-950/45" />
      </div>
    </div>
  );
}

function PremiumGround() {
  return (
    <>
      {/* Terreno base */}
      <div
        className="
          absolute
          inset-x-0
          bottom-0
          h-[58%]
          bg-gradient-to-b
          from-emerald-600/60
          via-emerald-700/75
          to-emerald-950/90
          pointer-events-none
          z-[2]
        "
      />

      {/* Variação simples do terreno */}
      <div
        className="
          absolute
          inset-x-0
          bottom-[22%]
          h-[25%]
          bg-emerald-500/15
          pointer-events-none
          z-[3]
        "
      />

      {/* Sombra inferior */}
      <div
        className="
          absolute
          inset-x-0
          bottom-0
          h-[35%]
          bg-gradient-to-t
          from-black/15
          to-transparent
          pointer-events-none
          z-[5]
        "
      />


      {/* Pedras */}
      {stones.map((stone, index) => (
        <React.Fragment key={index}>
          <Stone
            left={stone.left}
            bottom={stone.bottom}
            scale={stone.scale}
            rotate={stone.rotate}
          />
        </React.Fragment>
      ))}

      {/* Vegetação */}
      {grassClusters.map((cluster, index) => (
        <React.Fragment key={index}>
          <GrassCluster
            left={cluster.left}
            bottom={cluster.bottom}
            scale={cluster.scale}
          />
        </React.Fragment>
      ))}
    </>
  );
}

export default memo(PremiumGround);
