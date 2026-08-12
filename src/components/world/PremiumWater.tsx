import React from "react";
import { motion } from "motion/react";

const shorelineRocks = [
  { left: "8%", bottom: "14%", scale: 0.65, rotate: -12 },
  { left: "18%", bottom: "5%", scale: 0.45, rotate: 8 },
  { left: "76%", bottom: "4%", scale: 0.55, rotate: -6 },
  { left: "88%", bottom: "15%", scale: 0.7, rotate: 10 },
];

const reeds = [
  { left: "5%", bottom: "28%", scale: 0.8 },
  { left: "14%", bottom: "19%", scale: 0.6 },
  { left: "87%", bottom: "23%", scale: 0.75 },
  { left: "94%", bottom: "30%", scale: 0.55 },
];

export default function PremiumWater() {
  return (
    <div
      className="
        absolute
        right-[5%]
        bottom-[14%]
        w-[34%]
        h-[23%]
        z-[15]
        pointer-events-none
      "
    >
      {/* Shadow beneath the water */}
      <div
        className="
          absolute
          inset-x-[-5%]
          bottom-[-8%]
          h-[35%]
          rounded-[50%]
          bg-black/25
          blur-xl
        "
      />

      {/* Natural shoreline */}
      <div
        className="
          absolute
          inset-[-4%]
          rounded-[48%_52%_46%_54%]
          bg-gradient-to-br
          from-stone-500/70
          via-amber-700/35
          to-emerald-950/40
          blur-[1px]
        "
      />

      {/* Water body */}
      <div
        className="
          absolute
          inset-0
          overflow-hidden
          rounded-[48%_52%_44%_56%]
          bg-gradient-to-br
          from-[#b8e2e2]
          via-[#4da7ad]
          to-[#176274]
          shadow-[inset_0_8px_18px_rgba(255,255,255,0.22),inset_0_-14px_24px_rgba(4,45,58,0.38)]
        "
      >
        {/* Sky reflection */}
        <div
          className="
            absolute
            left-[12%]
            top-[8%]
            w-[65%]
            h-[38%]
            rounded-full
            bg-white/20
            blur-xl
          "
        />

        {/* Deep water gradient */}
        <div
          className="
            absolute
            inset-x-0
            bottom-0
            h-[65%]
            bg-gradient-to-t
            from-[#064a5b]/55
            via-[#147586]/15
            to-transparent
          "
        />

        {/* Long water reflections */}
        <motion.div
          className="
            absolute
            left-[8%]
            top-[28%]
            w-[52%]
            h-[3px]
            rounded-full
            bg-white/35
            blur-[1px]
          "
          animate={{
            scaleX: [0.8, 1.15, 0.8],
            opacity: [0.25, 0.5, 0.25],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        <motion.div
          className="
            absolute
            left-[24%]
            top-[43%]
            w-[40%]
            h-[2px]
            rounded-full
            bg-white/25
          "
          animate={{
            scaleX: [1, 0.7, 1],
            opacity: [0.15, 0.4, 0.15],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        <motion.div
          className="
            absolute
            right-[8%]
            top-[58%]
            w-[32%]
            h-[2px]
            rounded-full
            bg-white/20
          "
          animate={{
            scaleX: [0.7, 1, 0.7],
          }}
          transition={{
            duration: 4.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Tiny ripples */}
        <div className="absolute left-[18%] bottom-[25%] h-[8px] w-[24px] rounded-[50%] border border-white/20" />
        <div className="absolute left-[58%] bottom-[18%] h-[6px] w-[18px] rounded-[50%] border border-white/15" />
        <div className="absolute right-[14%] top-[36%] h-[7px] w-[22px] rounded-[50%] border border-white/15" />

        {/* Soft foreground reflection */}
        <div
          className="
            absolute
            left-[20%]
            bottom-[8%]
            w-[60%]
            h-[20%]
            rounded-full
            bg-white/10
            blur-md
          "
        />
      </div>

      {/* Shoreline rocks */}
      {shorelineRocks.map((rock, index) => (
        <div
          key={index}
          className="
            absolute
            w-7
            h-4
            rounded-[50%]
            bg-gradient-to-br
            from-stone-300
            via-stone-500
            to-stone-800
            shadow-md
          "
          style={{
            left: rock.left,
            bottom: rock.bottom,
            transform: `scale(${rock.scale}) rotate(${rock.rotate}deg)`,
          }}
        />
      ))}

      {/* Reeds */}
      {reeds.map((reed, index) => (
        <motion.div
          key={index}
          className="
            absolute
            bottom-0
            w-5
            h-16
            origin-bottom
          "
          style={{
            left: reed.left,
            bottom: reed.bottom,
            transform: `scale(${reed.scale})`,
          }}
          animate={{
            rotate: [-3, 3, -3],
          }}
          transition={{
            duration: 4 + index * 0.4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <span className="absolute bottom-0 left-2 h-full w-[2px] rounded-full bg-emerald-950/65 -rotate-[12deg]" />
          <span className="absolute bottom-[18%] left-1 h-[45%] w-[2px] rounded-full bg-emerald-900/50 -rotate-[32deg]" />
          <span className="absolute bottom-[28%] left-3 h-[40%] w-[2px] rounded-full bg-emerald-950/50 rotate-[28deg]" />
        </motion.div>
      ))}
    </div>
  );
}
