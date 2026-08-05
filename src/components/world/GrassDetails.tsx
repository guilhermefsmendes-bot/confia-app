import { motion } from "motion/react";

export default function GrassDetails() {
  const details = [
    { left: "8%", top: "70%", emoji: "🌱" },
    { left: "18%", top: "82%", emoji: "🌿" },
    { left: "32%", top: "75%", emoji: "🌱" },
    { left: "48%", top: "88%", emoji: "🍃" },
    { left: "62%", top: "72%", emoji: "🌱" },
    { left: "76%", top: "84%", emoji: "🌿" },
    { left: "90%", top: "76%", emoji: "🌱" },
  ];

  return (
    <>
      {details.map((item, index) => (
        <motion.div
          key={index}
          className="absolute z-10 text-lg opacity-40 pointer-events-none"
          style={{
            left: item.left,
            top: item.top,
          }}
          animate={{
            rotate: [-3, 3, -3],
          }}
          transition={{
            duration: 3 + index,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {item.emoji}
        </motion.div>
      ))}
    </>
  );
}
