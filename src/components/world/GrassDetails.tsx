import { memo } from "react";
const tufts = [
  { left: "5%", top: "69%", scale: 0.7 },
  { left: "11%", top: "81%", scale: 1.0 },
  { left: "19%", top: "73%", scale: 0.8 },
  { left: "27%", top: "86%", scale: 1.15 },
  { left: "35%", top: "76%", scale: 0.65 },
  { left: "44%", top: "90%", scale: 1.0 },
  { left: "52%", top: "72%", scale: 0.75 },
  { left: "60%", top: "84%", scale: 1.1 },
  { left: "69%", top: "75%", scale: 0.7 },
  { left: "77%", top: "88%", scale: 1.0 },
  { left: "86%", top: "72%", scale: 0.8 },
  { left: "93%", top: "84%", scale: 0.95 },
];

function GrassTuft({
  scale,
}: {
  scale: number;
}) {
  return (
    <div
      className="relative h-10 w-8 origin-bottom"
      style={{ transform: `scale(${scale})` }}
    >
      <span className="absolute bottom-0 left-3 h-9 w-[2px] rounded-full bg-emerald-950/40 -rotate-[18deg]" />
      <span className="absolute bottom-0 left-4 h-10 w-[2px] rounded-full bg-emerald-900/35" />
      <span className="absolute bottom-0 left-5 h-8 w-[2px] rounded-full bg-emerald-950/30 rotate-[18deg]" />

      <span className="absolute bottom-0 left-2 h-6 w-[2px] rounded-full bg-green-950/25 -rotate-[38deg]" />
      <span className="absolute bottom-0 left-6 h-6 w-[2px] rounded-full bg-green-950/25 rotate-[38deg]" />
    </div>
  );
}

function GrassDetails() {
  return (
    <>
      {tufts.map((item, index) => (
        <div
          key={index}
          className="absolute z-[12] pointer-events-none origin-bottom"
          style={{
            left: item.left,
            top: item.top,
          }}
        >
          <GrassTuft scale={item.scale} />
        </div>
      ))}
    </>
  );
}

export default memo(GrassDetails);
