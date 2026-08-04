import React from "react";
import { getRefugeLevel } from "../../data/refugeProgress";

interface Props {
  xp:number;
}

export default function HouseEvolution({xp}:Props){

const level = getRefugeLevel(xp).level;


return(

<div
className="absolute bottom-28 left-1/2 -translate-x-1/2"
>

{
level === 1 &&
<div className="text-7xl">
🛖
</div>
}


{
level === 2 &&
<div className="text-7xl">
🏡
</div>
}


{
level === 3 &&
<div className="text-8xl">
🏠
</div>
}


{
level >=4 &&
<div className="text-8xl">
🏰
</div>
}


</div>

)

}
