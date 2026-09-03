from pathlib import Path

content = r'''import { motion } from "motion/react";

interface PremiumLightingProps {
  isNight: boolean;
}

export default function PremiumLighting({
  isNight,
}: PremiumLightingProps) {
  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden z-[25]"
      aria-hidden="true"
    >

      {/* Luz quente direcional durante o dia */}
      {!isNight && (
        <>
          <div
            className="
              absolute
              -top-[18%]
              -right-[12%]
              w-[65%]
              h-[65%]
              rounded-full
              bg-amber-200/[0.12]
              blur-[80px]
            "
          />

          {/* Feixe de luz atmosférico */}
          <div
            className="
              absolute
              top-[-8%]
              right-[12%]
              w-[22%]
              h-[80%]
              rotate-[18deg]
              origin-top
              bg-gradient-to-b
              from-white/[0.10]
              via-amber-100/[0.045]
              to-transparent
              blur-[35px]
            "
          />
        </>
      )}

      {/* Ambiente noturno */}
      {isNight && (
        <>
          <div
            className="
              absolute
              inset-0
              bg-indigo-950/[0.10]
              mix-blend-multiply
            "
          />

          <div
            className="
              absolute
              top-[-10%]
              right-[-5%]
              w-[55%]
              h-[55%]
              rounded-full
              bg-blue-300/[0.08]
              blur-[90px]
            "
          />
        </>
      )}

      {/* Haze atmosférico no horizonte */}
      <div
        className="
          absolute
          left-[-15%]
          right-[-15%]
          top-[32%]
          h-[24%]
          rounded-[50%]
          bg-white/[0.055]
          blur-[45px]
        "
      />

      {/* Sombra ambiental junto ao chão */}
      <div
        className="
          absolute
          inset-x-0
          bottom-0
          h-[38%]
          bg-gradient-to-t
          from-black/[0.16]
          via-black/[0.045]
          to-transparent
        "
      />

      {/* Vinheta cinematográfica */}
      <div
        className="
          absolute
          inset-0
          bg-[radial-gradient(ellipse_at_center,transparent_42%,rgba(0,0,0,0.16)_100%)]
        "
      />

      {/* Pequenos pontos de luz atmosféricos */}
      {!isNight && (
        <div className="absolute inset-0">
          {[...Array(7)].map((_, index) => (
            <motion.span
              key={index}
              className="
                absolute
                h-[2px]
                w-[2px]
                rounded-full
                bg-white/30
                blur-[1px]
              "
              style={{
                left: `${12 + index * 13}%`,
                top: `${42 + ((index * 11) % 20)}%`,
              }}
              animate={{
                opacity: [0.15, 0.45, 0.15],
                y: [-2, 2, -2],
              }}
              transition={{
                duration: 4 + index * 0.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      )}

    </div>
  );
}
'''

Path("src/components/world/PremiumLighting.tsx").write_text(content)

print("✓ PremiumLighting.tsx criado.")
