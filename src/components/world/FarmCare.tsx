import React, {useState} from "react";
import { canCareToday, completeDailyCare } from "../../data/farmDaily";

export default function FarmCare(){

const [effect,setEffect] = useState(false);


function handleCare(){

if(!canCareToday()){
  return;
}

completeDailyCare();

setEffect(true);

setTimeout(()=>{
 setEffect(false);
},1500);

}


return(

<div
onClick={handleCare}
className="absolute bottom-10 left-1/2 -translate-x-1/2 cursor-pointer"
>

<div className="text-5xl">
🌱
</div>


{effect && (

<div className="absolute -top-16 text-4xl">
✨🌿✨
</div>

)}

</div>

)

}
