import React, { memo } from "react";

const distantTrees = [
  { left: "4%", scale: 0.45 },
  { left: "18%", scale: 0.35 },
  { left: "32%", scale: 0.40 },
  { left: "52%", scale: 0.36 },
  { left: "68%", scale: 0.40 },
  { left: "88%", scale: 0.48 },
];

const foregroundGrass = [
  { left: "5%", height: 34, rotate: -10 },
  { left: "18%", height: 40, rotate: 8 },
  { left: "32%", height: 30, rotate: -6 },
  { left: "47%", height: 38, rotate: 7 },
  { left: "63%", height: 32, rotate: -8 },
  { left: "78%", height: 40, rotate: 8 },
  { left: "93%", height: 34, rotate: -7 },
];

function DistantTree({
  left,
  scale,
}: {
  left: string;
  scale: number;
}) {
  return (
    <div
      className="absolute pointer-events-none origin-bottom"
      style={{
        left,
        bottom: "34%",
        transform: `scale(${scale})`,
        opacity: 0.22,
      }}
    >
      <div className="relative h-24 w-24">
        <div className="absolute bottom-0 left-1/2 h-16 w-4 -translate-x-1/2 rounded-full bg-emerald-950/60" />

        <div className="absolute bottom-10 left-1/2 h-16 w-20 -translate-x-1/2 rounded-full bg-emerald-900/70" />

        <div className="absolute bottom-16 left-2 h-12 w-12 rounded-full bg-emerald-950/65" />

        <div className="absolute bottom-14 right-0 h-12 w-12 rounded-full bg-emerald-800/65" />
      </div>
    </div>
  );
}

function ForegroundGrass({
  left,
  height,
  rotate,
}: {
  left: string;
  height: number;
  rotate: number;
}) {
  return (
    <div
      className="absolute bottom-0 pointer-events-none origin-bottom z-[45]"
      style={{
        left,
        height,
        transform: `rotate(${rotate}deg)`,
      }}
    >
      <div className="h-full w-[3px] rounded-full bg-emerald-900/50" />
    </div>
  );
}

function PremiumDepth() {
  return (
    <>
      {distantTrees.map((tree, index) => (
        <DistantTree
          key={index}
          left={tree.left}
          scale={tree.scale}
        />
      ))}

      <div className="absolute bottom-[34%] left-0 right-0 h-16 pointer-events-none">
        {foregroundGrass.map((grass, index) => (
          <ForegroundGrass
            key={index}
            left={grass.left}
            height={grass.height}
            rotate={grass.rotate}
          />
        ))}
      </div>

      <div className="absolute bottom-[34%] left-0 right-0 h-16 bg-emerald-800/10 pointer-events-none" />
    </>
  );
}

export default memo(PremiumDepth);
