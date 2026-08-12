import React from "react";
import { motion } from "motion/react";

const GrassBlade = ({
  left,
  height,
  rotate,
}: {
  left: string;
  height: number;
  rotate: number;
}) => (
  <motion.div
    className="absolute bottom-0 origin-bottom pointer-events-none"
    style={{
      left,
      height,
      width: 8,
      transform: `rotate(${rotate}deg)`,
    }}
    animate={{
      rotate: [rotate - 2, rotate + 2, rotate - 2],
    }}
    transition={{
      duration: 3.5,
      repeat: Infinity,
      ease: "easeInOut",
    }}
  >
    <div className="absolute bottom-0 left-1/2 h-full w-[3px] -translate-x-1/2 rounded-full bg-gradient-to-t from-emerald-950/60 via-emerald-800/45 to-emerald-600/20" />
    <div className="absolute bottom-[25%] left-[35%] h-[65%] w-[2px] origin-bottom rotate-[28deg] rounded-full bg-emerald-900/35" />
    <div className="absolute bottom-[35%] left-[60%] h-[55%] w-[2px] origin-bottom -rotate-[25deg] rounded-full bg-emerald-950/30" />
  </motion.div>
);

const PremiumTree = ({
  left,
  bottom,
  scale = 1,
}: {
  left: string;
  bottom: string;
  scale?: number;
}) => (
  <div
    className="absolute pointer-events-none z-[18] origin-bottom"
    style={{
      left,
      bottom,
      transform: `scale(${scale})`,
    }}
  >
    {/* sombra */}
    <div className="absolute -bottom-2 left-1/2 h-5 w-32 -translate-x-1/2 rounded-full bg-black/20 blur-md" />

    {/* tronco */}
    <div className="absolute bottom-2 left-1/2 h-32 w-8 -translate-x-1/2 rounded-[45%] bg-gradient-to-r from-amber-950/80 via-stone-700 to-amber-900/70 shadow-lg" />

    {/* copa traseira */}
    <div className="absolute bottom-24 left-1/2 h-36 w-44 -translate-x-1/2 rounded-[48%] bg-gradient-to-br from-emerald-950 via-emerald-800 to-green-600 shadow-xl" />

    {/* copa lateral esquerda */}
    <div className="absolute bottom-28 left-[-20px] h-28 w-28 rounded-full bg-gradient-to-br from-emerald-900 to-green-600 shadow-lg" />

    {/* copa lateral direita */}
    <div className="absolute bottom-32 right-[-20px] h-32 w-32 rounded-full bg-gradient-to-br from-emerald-950 to-emerald-600 shadow-lg" />

    {/* folhas iluminadas */}
    <div className="absolute bottom-40 left-1/2 h-16 w-24 -translate-x-1/2 rounded-full bg-green-400/25 blur-md" />

    <div className="absolute bottom-44 left-8 h-4 w-8 rounded-full bg-lime-200/20 blur-sm" />
    <div className="absolute bottom-36 right-8 h-5 w-10 rounded-full bg-lime-200/15 blur-sm" />
  </div>
);

const PremiumRock = ({
  left,
  bottom,
  scale = 1,
}: {
  left: string;
  bottom: string;
  scale?: number;
}) => (
  <div
    className="absolute pointer-events-none z-[20] origin-bottom"
    style={{
      left,
      bottom,
      transform: `scale(${scale})`,
    }}
  >
    <div className="absolute -bottom-1 left-1/2 h-3 w-16 -translate-x-1/2 rounded-full bg-black/20 blur-sm" />

    <div className="relative h-10 w-16 rotate-[-8deg]">
      <div className="absolute inset-0 rounded-[45%_55%_40%_60%] bg-gradient-to-br from-slate-500 via-stone-500 to-stone-800 shadow-lg" />

      <div className="absolute left-3 top-2 h-2 w-7 rounded-full bg-white/20 blur-[2px]" />

      <div className="absolute bottom-1 right-2 h-2 w-5 rounded-full bg-black/15 blur-sm" />
    </div>
  </div>
);

export default function PremiumVegetation() {
  return (
    <>
      {/* árvore distante */}
      <PremiumTree left="7%" bottom="34%" scale={0.72} />

      {/* árvore principal */}
      <PremiumTree left="79%" bottom="34%" scale={0.9} />

      {/* pequenos tufos de relva junto ao horizonte */}
      <div className="absolute bottom-[34%] left-0 right-0 h-16 pointer-events-none z-[16]">
        <GrassBlade left="4%" height={30} rotate={-12} />
        <GrassBlade left="12%" height={42} rotate={8} />
        <GrassBlade left="21%" height={27} rotate={-6} />
        <GrassBlade left="31%" height={38} rotate={10} />
        <GrassBlade left="43%" height={31} rotate={-8} />
        <GrassBlade left="55%" height={43} rotate={7} />
        <GrassBlade left="67%" height={29} rotate={-10} />
        <GrassBlade left="76%" height={39} rotate={8} />
        <GrassBlade left="88%" height={32} rotate={-7} />
        <GrassBlade left="96%" height={40} rotate={6} />
      </div>

      {/* pedras junto ao lago */}
      <PremiumRock left="70%" bottom="19%" scale={0.9} />
      <PremiumRock left="86%" bottom="17%" scale={0.65} />
      <PremiumRock left="78%" bottom="16%" scale={0.5} />
    </>
  );
}
