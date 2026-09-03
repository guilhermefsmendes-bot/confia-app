from pathlib import Path

path = Path("src/components/world/PremiumGround.tsx")

content = r'''import React from "react";
import { motion } from "motion/react";

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
      <div className="absolute -bottom-1 left-1/2 h-2 w-12 -translate-x-1/2 rounded-full bg-black/20 blur-sm" />

      <div className="relative h-8 w-12 overflow-hidden rounded-[55%_45%_48%_52%] bg-gradient-to-br from-stone-400 via-stone-500 to-stone-800 shadow-md">
        <div className="absolute left-2 top-1 h-2 w-5 rounded-full bg-white/20 blur-[1px]" />
        <div className="absolute bottom-1 right-1 h-2 w-4 rounded-full bg-black/20 blur-[1px]" />
      </div>
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
    <motion.div
      className="absolute pointer-events-none origin-bottom z-[25]"
      style={{
        left,
        bottom,
        transform: `scale(${scale})`,
      }}
      animate={{
        rotate: [-1.5, 1.5, -1.5],
      }}
      transition={{
        duration: 4.5,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      <div className="relative h-12 w-10">
        <span className="absolute bottom-0 left-4 h-12 w-[3px] origin-bottom rotate-[-20deg] rounded-full bg-emerald-950/45" />
        <span className="absolute bottom-0 left-5 h-11 w-[3px] rounded-full bg-emerald-900/50" />
        <span className="absolute bottom-0 left-6 h-10 w-[3px] origin-bottom rotate-[20deg] rounded-full bg-emerald-950/40" />
        <span className="absolute bottom-0 left-2 h-7 w-[2px] origin-bottom rotate-[-38deg] rounded-full bg-green-950/30" />
        <span className="absolute bottom-0 left-8 h-7 w-[2px] origin-bottom rotate-[38deg] rounded-full bg-green-950/30" />
      </div>
    </motion.div>
  );
}

export default function PremiumGround() {
  return (
    <>
      {/* Base do terreno */}

      <div
        className="
          absolute
          inset-x-0
          bottom-0
          h-[58%]
          bg-gradient-to-b
          from-emerald-600/55
          via-emerald-700/70
          to-emerald-950/85
          pointer-events-none
          z-[2]
        "
      />

      {/* Segundo plano de terreno */}

      <div
        className="
          absolute
          left-[-8%]
          right-[-8%]
          bottom-[24%]
          h-[30%]
          rounded-[50%]
          bg-gradient-to-b
          from-emerald-500/25
          to-emerald-950/25
          blur-2xl
          pointer-events-none
          z-[3]
        "
      />

      {/* Grande zona de luz no centro */}

      <div
        className="
          absolute
          left-[12%]
          right-[12%]
          bottom-[4%]
          h-[48%]
          rounded-[50%]
          bg-emerald-300/10
          blur-3xl
          pointer-events-none
          z-[4]
        "
      />

      {/* Zona de sombra periférica */}

      <div
        className="
          absolute
          inset-x-0
          bottom-0
          h-[42%]
          bg-gradient-to-t
          from-black/20
          via-transparent
          to-transparent
          pointer-events-none
          z-[5]
        "
      />

      {/* Caminho orgânico */}

      <div
        className="
          absolute
          left-[38%]
          bottom-[-8%]
          w-[28%]
          h-[62%]
          rotate-[7deg]
          rounded-[48%]
          bg-gradient-to-b
          from-stone-300/20
          via-stone-400/30
          to-stone-500/15
          blur-[1px]
          pointer-events-none
          z-[7]
        "
      />

      {/* Luz sobre o caminho */}

      <div
        className="
          absolute
          left-[42%]
          bottom-[5%]
          w-[18%]
          h-[45%]
          rotate-[7deg]
          rounded-[50%]
          bg-amber-100/10
          blur-2xl
          pointer-events-none
          z-[8]
        "
      />

      {/* Zonas de contacto com o chão */}

      <div
        className="
          absolute
          left-[15%]
          right-[15%]
          bottom-[10%]
          h-10
          rounded-[50%]
          bg-black/10
          blur-2xl
          pointer-events-none
          z-[10]
        "
      />

      {/* Pedras naturais */}

      {stones.map((stone, index) => (
        <Stone key={index} {...stone} />
      ))}

      {/* Pequenos grupos de vegetação */}

      {grassClusters.map((cluster, index) => (
        <GrassCluster key={index} {...cluster} />
      ))}

      {/* Brilho muito subtil do terreno */}

      <div
        className="
          absolute
          left-[20%]
          right-[20%]
          bottom-[18%]
          h-24
          rounded-[50%]
          bg-white/5
          blur-3xl
          pointer-events-none
          z-[12]
        "
      />
    </>
  );
}
'''

path.write_text(content)
print("✓ PremiumGround.tsx criado.")
