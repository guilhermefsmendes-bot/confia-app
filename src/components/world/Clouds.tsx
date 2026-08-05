import { motion } from "motion/react";

export default function Clouds() {
  return (
    <>
      <motion.div
        className="absolute top-6 -left-24 text-7xl opacity-80 pointer-events-none"
        animate={{
          x: ["0vw", "120vw"],
        }}
        transition={{
          duration: 70,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        ☁️
      </motion.div>

      <motion.div
        className="absolute top-20 -left-40 text-6xl opacity-70 pointer-events-none"
        animate={{
          x: ["0vw", "125vw"],
        }}
        transition={{
          duration: 95,
          repeat: Infinity,
          ease: "linear",
          delay: 10,
        }}
      >
        ☁️
      </motion.div>

      <motion.div
        className="absolute top-12 -left-56 text-5xl opacity-55 pointer-events-none"
        animate={{
          x: ["0vw", "130vw"],
        }}
        transition={{
          duration: 120,
          repeat: Infinity,
          ease: "linear",
          delay: 20,
        }}
      >
        ☁️
      </motion.div>

      <motion.div
        className="absolute top-32 -left-80 text-8xl opacity-45 pointer-events-none"
        animate={{
          x: ["0vw", "140vw"],
        }}
        transition={{
          duration: 150,
          repeat: Infinity,
          ease: "linear",
          delay: 35,
        }}
      >
        ☁️
      </motion.div>
    </>
  );
}
