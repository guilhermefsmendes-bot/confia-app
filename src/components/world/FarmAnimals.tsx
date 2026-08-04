import React from "react";
import { getRefugeLevel } from "../../data/refugeProgress";
import { motion } from "motion/react";

interface Props {
  xp:number;
}

export default function FarmAnimals({xp}:Props){

const level = getRefugeLevel(xp).level;

return(
<>

{level >= 2 && (

<motion.div
className="absolute top-36 right-20 text-3xl"
animate={{
y:[0,-5,0]
}}
transition={{
duration:3,
repeat:Infinity
}}
>
🐦
</motion.div>

)}


{level >= 3 && (

<motion.div
className="absolute bottom-24 left-20 text-4xl"
animate={{
x:[0,15,0]
}}
transition={{
duration:6,
repeat:Infinity
}}
>
🐿️
</motion.div>

)}


{level >= 5 && (

<motion.div
className="absolute bottom-28 right-10 text-4xl"
animate={{
y:[0,-8,0]
}}
transition={{
duration:4,
repeat:Infinity
}}
>
🐇
</motion.div>

)}

</>
)

}
