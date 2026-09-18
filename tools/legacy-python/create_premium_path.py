from pathlib import Path

path = Path("src/components/world/PremiumPath.tsx")

content = r'''import React from "react";
import { motion } from "motion/react";

const stones = [
  { left: "18%", top: "76%", rotate: -12, scale: 0.7 },
  { left: "27%", top: "80%", rotate: 8, scale: 0.55 },
  { left: "38%", top: "84%", rotate: -5, scale: 0.65 },
  { left: "52%", top: "87%", rotate: 10, scale: 0.5 },
  { left: "64%", top: "84%", rotate: -8, scale: 0.7 },
  { left: "76%", top: "79%", rotate: 6, scale: 0.55 },
];

export default function PremiumPath() {
  return (
    <>
      {/* Sombra de contacto do caminho */}
      <div
        className="
          absolute
          left-[17%]
          bottom-[7%]
          w-[66%]
          h-[150px]
          rounded-[50%]
          bg-black/15
          blur-2xl
          pointer-events-none
          z-[13]
        "
      />

      {/* Caminho principal */}
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
        {/* Base de terra */}
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

        {/* Centro iluminado */}
        <div
          className="
            absolute
            inset-x-[20%]
            top-0
            bottom-0
            bg-gradient-to-b
            from-amber-100/80
            via-amber-200/40
            to-stone-400/20
            blur-md
          "
        />

        {/* Textura subtil */}
        <div
          className="
            absolute
            inset-0
            opacity-30
            bg-[radial-gradient(circle_at_20%_30%,rgba(90,70,45,.35)_0_2px,transparent_3px),
                radial-gradient(circle_at_65%_55%,rgba(90,70,45,.3)_0_2px,transparent_3px),
                radial-gradient(circle_at_40%_80%,rgba(255,255,255,.35)_0_2px,transparent_3px)]
            bg-[length:38px_34px,47px_41px,52px_45px]
          "
        />

        {/* Luz suave sobre o caminho */}
        <div
          className="
            absolute
            top-0
            left-1/2
            -translate-x-1/2
            w-32
            h-full
            rounded-full
            bg-white/20
            blur-2xl
          "
        />
      </div>

      {/* Pequenas pedras nas margens */}
      {stones.map((stone, index) => (
        <motion.div
          key={index}
          className="
            absolute
            z-[17]
            pointer-events-none
            w-5
            h-3
            rounded-[50%]
            bg-gradient-to-br
            from-stone-300
            via-stone-500
            to-stone-700
            shadow-sm
          "
          style={{
            left: stone.left,
            top: stone.top,
            transform: `rotate(${stone.rotate}deg) scale(${stone.scale})`,
          }}
          animate={{
            y: [0, -1, 0],
          }}
          transition={{
            duration: 3 + index * 0.4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </>
  );
}
'''

path.write_text(content)
print("✓ PremiumPath.tsx criado.")
