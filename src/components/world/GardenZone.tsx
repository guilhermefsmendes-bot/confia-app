import React,{useState} from "react";
import {getGarden,plant,harvest} from "../../data/farmGarden";


export default function GardenZone(){

const [refresh,setRefresh]=useState(0);

const garden=getGarden();

const growing =
garden.plantedAt &&
(Date.now()-garden.plantedAt)>10000;


function action(){

if(!garden.plantedAt){

 plant();

}else if(growing){

 harvest();

}

setRefresh(v=>v+1);

}


return(

<div
onClick={action}
className="absolute bottom-20 right-1/4 cursor-pointer text-5xl"
>

{
!garden.plantedAt
?
"🟫"
:
growing
?
"🌽"
:
"🌱"
}

</div>

)

}
