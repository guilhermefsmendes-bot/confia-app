import React from "react";

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
    {/* Tronco */}
    <div className="absolute bottom-2 left-1/2 h-32 w-8 -translate-x-1/2 rounded-[45%] bg-amber-950/80" />

    {/* Copa principal */}
    <div className="absolute bottom-24 left-1/2 h-36 w-44 -translate-x-1/2 rounded-[48%] bg-emerald-800" />

    {/* Copa esquerda */}
    <div className="absolute bottom-28 left-[-20px] h-28 w-28 rounded-full bg-emerald-700" />

    {/* Copa direita */}
    <div className="absolute bottom-32 right-[-20px] h-32 w-32 rounded-full bg-emerald-800" />

    {/* Zona iluminada */}
    <div className="absolute bottom-36 left-1/2 h-14 w-20 -translate-x-1/2 rounded-full bg-green-500/30" />
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
    <div className="h-10 w-16 rotate-[-8deg] rounded-[45%_55%_40%_60%] bg-stone-600" />
  </div>
);

const GrassBlade = ({
  left,
  height,
  rotate,
}: {
  left: string;
  height: number;
  rotate: number;
}) => (
  <div
    className="absolute bottom-0 pointer-events-none origin-bottom"
    style={{
      left,
      height,
      transform: `rotate(${rotate}deg)`,
    }}
  >
    <div className="h-full w-[3px] rounded-full bg-emerald-800/60" />
  </div>
);

export default function PremiumVegetation() {
  return (
    <>
      {/* Árvores */}
      <PremiumTree left="7%" bottom="34%" scale={0.72} />
      <PremiumTree left="79%" bottom="34%" scale={0.9} />

      {/* Relva estática */}
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

      {/* Pedras */}
      <PremiumRock left="70%" bottom="19%" scale={0.9} />
      <PremiumRock left="86%" bottom="17%" scale={0.65} />
      <PremiumRock left="78%" bottom="16%" scale={0.5} />
    </>
  );
}
