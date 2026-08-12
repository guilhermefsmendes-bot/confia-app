import React from "react";
import { motion } from "motion/react";

const distantTrees = [
  { left: "2%", bottom: "34%", scale: 0.55, opacity: 0.28 },
  { left: "14%", bottom: "35%", scale: 0.42, opacity: 0.20 },
  { left: "27%", bottom: "34%", scale: 0.50, opacity: 0.22 },
  { left: "42%", bottom: "35%", scale: 0.38, opacity: 0.18 },
  { left: "57%", bottom: "34%", scale: 0.48, opacity: 0.21 },
  { left: "71%", bottom: "35%", scale: 0.42, opacity: 0.19 },
  { left: "88%", bottom: "34%", scale: 0.58, opacity: 0.26 },
];

const foregroundGrass = [
  { left: "3%", height: 38, rotate: -12 },
  { left: "9%", height: 48, rotate: 8 },
  { left: "16%", height: 34, rotate: -6 },
  { left: "24%", height: 44, rotate: 10 },
  { left: "33%", height: 36, rotate: -8 },
  { left: "41%", height: 50, rotate: 7 },
  { left: "50%", height: 32, rotate: -9 },
  { left: "59%", height: 46, rotate: 8 },
  { left: "68%", height: 36, rotate: -7 },
  { left: "77%", height: 49, rotate: 9 },
  { left: "87%", height: 35, rotate: -8 },
  { left: "95%", height: 45, rotate: 7 },
];

function DistantTree({
  left,
  bottom,
  scale,
  opacity,
}: {
  left: string;
  bottom: string;
  scale: number;
  opacity: number;
}) {
  return (
    <div
      className="absolute pointer-events-none origin-bottom"
      style={{
        left,
        bottom,
        transform: `scale(${scale})`,
        opacity,
        filter: "blur(1.2px)",
      }}
    >
      <div className="absolute -bottom-2 left-1/2 h-3 w-24 -translate-x-1/2 rounded-full bg-black/20 blur-md" />

      <div className="relative h-32 w-32">
        <div className="absolute bottom-0 left-1/2 h-24 w-5 -translate-x-1/2 rounded-full bg-emerald-950/70" />

        <div className="absolute bottom-16 left-1/2 h-24 w-28 -translate-x-1/2 rounded-[48%] bg-emerald-900/80" />

        <div className="absolute bottom-24 left-2 h-20 w-20 rounded-full bg-emerald-950/75" />

        <div className="absolute bottom-28 right-0 h-20 w-20 rounded-full bg-emerald-800/70" />
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
    <motion.div
      className="absolute bottom-0 pointer-events-none origin-bottom z-[45]"
      style={{
        left,
        transform: `rotate(${rotate}deg)`,
      }}
      animate={{
        rotate: [rotate - 2, rotate + 2, rotate - 2],
      }}
      transition={{
        duration: 4.5,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      <div
        className="relative"
        style={{
          width: 12,
          height,
        }}
      >
        <span className="absolute bottom-0 left-5 h-full w-[3px] rounded-full bg-emerald-950/45" />

        <span
          className="absolute bottom-0 left-3 w-[3px] rounded-full bg-emerald-900/35"
          style={{ height: height * 0.72 }}
        />

        <span
          className="absolute bottom-0 left-7 w-[3px] rounded-full bg-emerald-950/30"
          style={{ height: height * 0.64 }}
        />

        <span
          className="absolute bottom-0 left-1 w-[2px] rounded-full bg-green-950/25"
          style={{ height: height * 0.48 }}
        />

        <span
          className="absolute bottom-0 left-9 w-[2px] rounded-full bg-green-950/25"
          style={{ height: height * 0.52 }}
        />
      </div>
    </motion.div>
  );
}

export default function PremiumDepth() {
  return (
    <>
      {/* Distância atmosférica */}

      <div
        className="
          absolute
          left-[-10%]
          right-[-10%]
          bottom-[300px]
          h-32
          rounded-[50%]
          bg-white/12
          blur-3xl
          pointer-events-none
          z-[5]
        "
      />

      {/* Linha distante do terreno */}

      <div
        className="
          absolute
          left-0
          right-0
          bottom-[300px]
          h-20
          bg-gradient-to-t
          from-emerald-950/15
          via-emerald-900/8
          to-transparent
          pointer-events-none
          z-[6]
        "
      />

      {/* Árvores no plano distante */}

      {distantTrees.map((tree, index) => (
        <DistantTree
          key={index}
          {...tree}
        />
      ))}

      {/* Sombras ambientais no terreno */}

      <div
        className="
          absolute
          left-[8%]
          right-[8%]
          bottom-[70px]
          h-32
          rounded-[50%]
          bg-black/10
          blur-3xl
          pointer-events-none
          z-[9]
        "
      />

      <div
        className="
          absolute
          left-[35%]
          bottom-[110px]
          w-[30%]
          h-20
          rounded-[50%]
          bg-black/10
          blur-2xl
          pointer-events-none
          z-[9]
        "
      />

      {/* Luz suave atravessando o mundo */}

      <div
        className="
          absolute
          -top-20
          right-[18%]
          w-40
          h-[520px]
          rotate-[18deg]
          bg-gradient-to-b
          from-white/12
          via-white/5
          to-transparent
          blur-2xl
          pointer-events-none
          z-[11]
        "
      />

      {/* Partículas de pó iluminadas */}

      <div className="absolute inset-0 pointer-events-none z-[30]">
        {[...Array(14)].map((_, index) => (
          <motion.span
            key={index}
            className="absolute h-1 w-1 rounded-full bg-white/20"
            style={{
              left: `${7 + ((index * 13) % 88)}%`,
              top: `${38 + ((index * 17) % 45)}%`,
            }}
            animate={{
              y: [-4, 4, -4],
              opacity: [0.15, 0.4, 0.15],
            }}
            transition={{
              duration: 4 + index * 0.2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: index * 0.25,
            }}
          />
        ))}
      </div>

      {/* Vegetação muito próxima da câmara */}

      {foregroundGrass.map((grass, index) => (
        <ForegroundGrass
          key={index}
          {...grass}
        />
      ))}

      {/* Vinheta cinematográfica */}

      <div
        className="
          absolute
          inset-0
          pointer-events-none
          z-[60]
          bg-[radial-gradient(ellipse_at_center,transparent_48%,rgba(15,23,42,0.10)_100%)]
        "
      />
    </>
  );
}
