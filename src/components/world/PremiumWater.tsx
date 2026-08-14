import React, { memo } from "react";

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

function PremiumWater() {
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
      {/* Margem do lago */}
      <div
        className="
          absolute
          inset-[-3%]
          rounded-[48%_52%_46%_54%]
          bg-stone-400/60
        "
      />

      {/* Água */}
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
        "
      >
        {/* Zona mais profunda */}
        <div
          className="
            absolute
            inset-x-0
            bottom-0
            h-[60%]
            bg-[#064a5b]/25
          "
        />

        {/* Reflexos estáticos */}
        <div
          className="
            absolute
            left-[12%]
            top-[18%]
            w-[48%]
            h-[3px]
            rounded-full
            bg-white/25
          "
        />

        <div
          className="
            absolute
            left-[28%]
            top-[38%]
            w-[34%]
            h-[2px]
            rounded-full
            bg-white/20
          "
        />

        <div
          className="
            absolute
            right-[12%]
            top-[55%]
            w-[26%]
            h-[2px]
            rounded-full
            bg-white/15
          "
        />

        {/* Pequenas ondas */}
        <div className="absolute left-[18%] bottom-[25%] h-[7px] w-[22px] rounded-[50%] border border-white/20" />
        <div className="absolute left-[58%] bottom-[18%] h-[5px] w-[16px] rounded-[50%] border border-white/15" />
        <div className="absolute right-[14%] top-[36%] h-[6px] w-[20px] rounded-[50%] border border-white/15" />
      </div>

      {/* Pedras */}
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
            to-stone-700
          "
          style={{
            left: rock.left,
            bottom: rock.bottom,
            transform: `scale(${rock.scale}) rotate(${rock.rotate}deg)`,
          }}
        />
      ))}

      {/* Vegetação junto à água */}
      {reeds.map((reed, index) => (
        <div
          key={index}
          className="absolute bottom-0 w-5 h-16 origin-bottom"
          style={{
            left: reed.left,
            bottom: reed.bottom,
            transform: `scale(${reed.scale})`,
          }}
        >
          <span className="absolute bottom-0 left-2 h-full w-[2px] rounded-full bg-emerald-950/65 -rotate-[12deg]" />
          <span className="absolute bottom-[18%] left-1 h-[45%] w-[2px] rounded-full bg-emerald-900/50 -rotate-[32deg]" />
          <span className="absolute bottom-[28%] left-3 h-[40%] w-[2px] rounded-full bg-emerald-950/50 rotate-[28deg]" />
        </div>
      ))}
    </div>
  );
}

export default memo(PremiumWater);
