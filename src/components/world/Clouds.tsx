import { motion } from "motion/react";

export default function Clouds() {
  return (
    <>
      <motion.div
        className="absolute top-4 -left-32 text-8xl opacity-70 pointer-events-none"
        animate={{ x: ["0vw", "130vw"] }}
        transition={{
          duration: 140,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        ☁️
      </motion.div>


      <motion.div
        className="absolute top-24 -left-48 text-6xl opacity-60 pointer-events-none"
        animate={{ x: ["0vw", "120vw"] }}
        transition={{
          duration: 110,
          repeat: Infinity,
          ease: "linear",
          delay: 15,
        }}
      >
        ☁️
      </motion.div>


      <motion.div
        className="absolute top-14 -left-64 text-5xl opacity-45 pointer-events-none"
        animate={{ x: ["0vw", "140vw"] }}
        transition={{
          duration: 170,
          repeat: Infinity,
          ease: "linear",
          delay: 35,
        }}
      >
        ☁️
      </motion.div>


      <motion.div
        className="absolute top-36 -left-80 text-7xl opacity-50 pointer-events-none"
        animate={{ x: ["0vw", "150vw"] }}
        transition={{
          duration: 190,
          repeat: Infinity,
          ease: "linear",
          delay: 60,
        }}
      >
        ☁️
      </motion.div>


      <motion.div
        className="absolute top-8 -left-96 text-4xl opacity-35 pointer-events-none"
        animate={{ x: ["0vw", "160vw"] }}
        transition={{
          duration: 220,
          repeat: Infinity,
          ease: "linear",
          delay: 90,
        }}
      >
        ☁️
      </motion.div>


      <motion.div
        className="absolute top-44 -left-40 text-5xl opacity-30 pointer-events-none"
        animate={{ x: ["0vw", "130vw"] }}
        transition={{
          duration: 200,
          repeat: Infinity,
          ease: "linear",
          delay: 120,
        }}
      >
        ☁️
      </motion.div>
    </>
  );
}
