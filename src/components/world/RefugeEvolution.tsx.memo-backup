import React from "react";
import { getRefugeLevel } from "../../data/refugeProgress";

interface Props {
  xp: number;
}

export default function RefugeEvolution({ xp }: Props) {

  const level = getRefugeLevel(xp).level;

  return (
    <>

      {/* Vegetação extra */}
      {level >= 2 && (
        <>
          <div className="absolute bottom-20 left-10 text-5xl">
            🌿
          </div>

          <div className="absolute bottom-24 right-16 text-4xl">
            🌱
          </div>
        </>
      )}


      {/* Pequeno lago */}
      {level >= 3 && (
        <div className="absolute bottom-10 right-1/3 text-6xl">
          💧
        </div>
      )}


      {/* Quinta desenvolvida */}
      {level >= 4 && (
        <>
          <div className="absolute bottom-32 left-1/4 text-5xl">
            🌻
          </div>

          <div className="absolute bottom-16 right-20 text-5xl">
            🐿️
          </div>
        </>
      )}


      {/* Estado mágico */}
      {level >= 5 && (
        <>
          <div className="absolute top-10 left-1/2 text-5xl">
            ✨
          </div>

          <div className="absolute top-20 right-1/4 text-4xl">
            🌈
          </div>
        </>
      )}

    </>
  );
}
