import { motion } from "motion/react";

export default function Butterflies(){

return(
<>
<motion.div
className="absolute text-3xl"
style={{
left:"65%",
top:"35%"
}}
animate={{
x:[0,40,0],
y:[0,-20,0],
rotate:[0,20,-20,0]
}}
transition={{
duration:8,
repeat:Infinity
}}
>
🦋
</motion.div>


<motion.div
className="absolute text-2xl"
style={{
left:"30%",
top:"45%"
}}
animate={{
x:[0,-50,0],
y:[0,20,0]
}}
transition={{
duration:10,
repeat:Infinity
}}
>
🦋
</motion.div>

</>
)

}
