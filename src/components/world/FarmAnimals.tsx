import React from "react";
import { getRefugeLevel } from "../../data/refugeProgress";

interface Props {
  xp: number;
}

export default function FarmAnimals({ xp }: Props) {
  const level = getRefugeLevel(xp).level;

  return (
    <>
      {level >= 2 && (
        <div className="absolute top-36 right-20 text-3xl pointer-events-none">
          🐦
        </div>
      )}

      {level >= 3 && (
        <div className="absolute bottom-24 left-20 text-4xl pointer-events-none">
          🐿️
        </div>
      )}

      {level >= 5 && (
        <div className="absolute bottom-28 right-10 text-4xl pointer-events-none">
          🐇
        </div>
      )}
    </>
  );
}
