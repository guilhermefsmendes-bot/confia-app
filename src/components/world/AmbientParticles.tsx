import React from "react";

const particles = [
  { left: "8%", top: "32%", opacity: 0.45, size: "text-lg" },
  { left: "17%", top: "48%", opacity: 0.65, size: "text-xl" },
  { left: "25%", top: "38%", opacity: 0.35, size: "text-lg" },
  { left: "34%", top: "55%", opacity: 0.55, size: "text-xl" },
  { left: "43%", top: "30%", opacity: 0.4, size: "text-lg" },
  { left: "51%", top: "46%", opacity: 0.6, size: "text-xl" },
  { left: "60%", top: "35%", opacity: 0.35, size: "text-lg" },
  { left: "68%", top: "52%", opacity: 0.5, size: "text-xl" },
  { left: "76%", top: "40%", opacity: 0.4, size: "text-lg" },
  { left: "84%", top: "57%", opacity: 0.6, size: "text-xl" },
  { left: "91%", top: "34%", opacity: 0.35, size: "text-lg" },
  { left: "12%", top: "62%", opacity: 0.5, size: "text-lg" },
];

export default function AmbientParticles() {
  return (
    <>
      {particles.map((particle, index) => (
        <div
          key={index}
          className={`absolute ${particle.size} pointer-events-none`}
          style={{
            left: particle.left,
            top: particle.top,
            opacity: particle.opacity,
          }}
        >
          ✨
        </div>
      ))}
    </>
  );
}
