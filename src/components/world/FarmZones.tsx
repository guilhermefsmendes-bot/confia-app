import React, { memo } from "react";
import { getRefugeLevel } from "../../data/refugeProgress";

interface Props {
  xp:number;
}

function FarmZones({xp}:Props){

const level = getRefugeLevel(xp).level;

return(
<>



</>
)

}

export default memo(FarmZones);
