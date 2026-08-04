import { motion } from "motion/react";

export default function AmbientParticles() {

const particles = Array.from({length:12});

return (
<>
{particles.map((_,i)=>(
<motion.div
key={i}
className="absolute text-yellow-200 text-xl"
style={{
left:`${Math.random()*100}%`,
top:`${20+Math.random()*50}%`
}}
animate={{
y:[0,-30,0],
opacity:[0.2,1,0.2]
}}
transition={{
duration:3+Math.random()*3,
repeat:Infinity,
delay:i*0.4
}}
>
✨
</motion.div>
))}
</>
);

}
