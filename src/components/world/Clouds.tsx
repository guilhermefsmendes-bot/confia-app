import { motion } from "motion/react";

export default function Clouds() {
  return (
    <>
      <motion.div
        className="absolute top-10 left-10 text-6xl opacity-80"
        animate={{
          x: [0, 80, 0],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        ☁️
      </motion.div>

      <motion.div
        className="absolute top-24 right-10 text-5xl opacity-60"
        animate={{
          x: [0, -100, 0],
        }}
        transition={{
          duration: 40,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        ☁️
      </motion.div>
    </>
  );
}
