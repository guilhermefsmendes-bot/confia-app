import React, { memo } from "react";
import { getRefugeLevel } from "../../data/refugeProgress";

interface Props {
  xp:number;
}

function FarmZones({xp}:Props){

const level = getRefugeLevel(xp).level;

return(
<>

{/* Casa */}
<div className="absolute bottom-28 left-1/2 -translate-x-1/2 text-7xl">
🏡
</div>


{/* Jardim */}
{level >= 2 && (
<>
<div className="absolute bottom-20 left-12 text-5xl">
🌷
</div>

<div className="absolute bottom-16 left-28 text-5xl">
🌼
</div>
</>
)}


{/* Lago */}
{level >= 3 && (
<div className="absolute bottom-16 right-32 text-7xl">
💧
</div>
)}


{/* Horta */}
{level >= 4 && (
<>
<div className="absolute bottom-20 right-10 text-5xl">
🥕
</div>

<div className="absolute bottom-28 right-5 text-5xl">
🌽
</div>
</>
)}


{/* Floresta */}
{level >= 5 && (
<>
<div className="absolute top-40 left-10 text-7xl">
🌳
</div>

<div className="absolute top-44 left-28 text-7xl">
🌲
</div>
</>
)}


</>
)

}

export default memo(FarmZones);
