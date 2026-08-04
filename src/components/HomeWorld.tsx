import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Avatar } from "./Avatar";
import { getEquipped } from "../storage/homeInventory";
import { getPositions, savePositions } from "../storage/homePositions";
import { homeItems } from "../data/homeItems";
const AmbientParticles = () => {
  return (
    <>
      {[...Array(15)].map((_, i) => (
        <div
          key={i}
          className="absolute text-white/70 animate-pulse pointer-events-none"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 60}%`,
            animationDelay: `${i * 0.3}s`,
          }}
        >
          ✨
        </div>
      ))}
    </>
  );
};
import AtmosphereLayer from "./AtmosphereLayer";
import Clouds from "./world/Clouds";
import Butterflies from "./world/Butterflies";
import { getRefugeLevel } from "../data/refugeProgress";
import RefugeEvolution from "./world/RefugeEvolution";
import FarmZones from "./world/FarmZones";
import FarmCare from "./world/FarmCare";
import GardenZone from "./world/GardenZone";
import FarmAnimals from "./world/FarmAnimals";
import HouseEvolution from "./world/HouseEvolution";
import { getWorld, careWorld } from "../storage/homeWorld";
import { getGrowth, careItem } from "../storage/homeGrowth";

interface Props {
  avatar: any;
  avatarCelebrating: boolean;
  avatarMemoryMessage: string;
  morningRating: number;
  afternoonRating?: number;
  handlePetAvatar: () => void;
}

const HomeWorld: React.FC<Props> = ({
  avatar,
  avatarCelebrating,
  avatarMemoryMessage,
  morningRating,
  afternoonRating,
  handlePetAvatar,
}) => {

  const { t } = useTranslation();
  const [editMode, setEditMode] = useState(false);
const [avatarPosition, setAvatarPosition] = useState({
  x: 0,
  y: 0
});

const [draggingAvatar, setDraggingAvatar] = useState(false);
const [world, setWorld] = useState(getWorld());
const [growth, setGrowth] = useState(getGrowth());
  const [objectPositions, setObjectPositions] = useState(
    getPositions()
  );

  const [dragging, setDragging] = useState<string | null>(null);

const hour = new Date().getHours();

const isNight = hour >= 21 || hour < 7;

  const equipped = getEquipped();

  const equippedItems = homeItems.filter(item =>
    equipped.includes(item.id)
  );


  const defaultPositions: Record<string, React.CSSProperties> = {

    flower1: { left: "18%", bottom: "10%" },
    flower2: { left: "26%", bottom: "10%" },
    flower3: { left: "34%", bottom: "10%" },

    tree1: { left: "8%", bottom: "18%" },
    tree2: { left: "80%", bottom: "18%" },

    rock1: { left: "55%", bottom: "8%" },

    bench1: { left: "40%", bottom: "12%" },

    lantern: { left: "25%", bottom: "15%" },

    butterfly: { left: "60%", top: "20%" },

    sun: { right: "8%", top: "5%" },

    rainbow: { left: "30%", top: "3%" }

  };


  return (

    <div
      className="relative overflow-hidden rounded-3xl h-[600px] bg-gradient-to-b from-sky-300 via-sky-100 to-sky-50"
onDoubleClick={() => {
  const updated = careWorld(5);
  setWorld(updated);
}}

      onPointerMove={(e) => {

        if (!dragging) return;

        const rect =
          e.currentTarget.getBoundingClientRect();

        const left =
          ((e.clientX - rect.left) / rect.width) * 100;

        const top =
          ((e.clientY - rect.top) / rect.height) * 100;


        setObjectPositions(prev => ({

          ...prev,

          [dragging]: {
            left: `${left}%`,
            top: `${top}%`
          }

        }));

      }}


      onPointerUp={() => {

        if (dragging) {

          savePositions(objectPositions);

        }

        setDragging(null);

      }}

    >

      <div className="absolute top-4 right-4 z-50">

        <button

          onClick={() => {

            if (editMode) {

              savePositions(objectPositions);

            }

            setEditMode(!editMode);

          }}

          className={`px-4 py-2 rounded-xl font-bold shadow ${
            editMode
              ? "bg-green-500 text-white"
              : "bg-white"
          }`}

        >

          {editMode
            ? `✅ ${t("save")}`
            : `✏️ ${t("edit")}`
          }

        </button>

      </div>


      {/* Céu */}
<Clouds />

<AmbientParticles />

<Butterflies />
<GardenZone />
<HouseEvolution xp={avatar.xp}/>
<RefugeEvolution xp={avatar.xp} />
<FarmZones xp={avatar.xp} />
      <div className="absolute inset-0 bg-gradient-to-b from-sky-300 via-sky-100 to-sky-50" />
<FarmCare />
{/* Céu dinâmico */}

<div
  className={`absolute top-0 left-0 right-0 h-56 transition-all duration-1000 ${
    isNight
      ? "bg-gradient-to-b from-indigo-900 to-slate-700"
      : "bg-gradient-to-b from-sky-300 to-sky-100"
  }`}
/>

{isNight ? (
  <div className="absolute top-6 right-10 text-5xl animate-pulse">
    🌙
  </div>
) : (
  <div className="absolute top-6 right-10 text-5xl animate-pulse">
    ☀️
  </div>
)}
<AtmosphereLayer />
{/* Relva evolutiva */}

<div
  className={`absolute bottom-0 left-0 right-0 h-64 transition-all duration-1000 ${
    world.health > 70
      ? "bg-gradient-to-b from-green-400 to-green-600"
      : world.health > 40
      ? "bg-gradient-to-b from-lime-300 to-green-500"
      : "bg-gradient-to-b from-yellow-300 to-green-400"
  }`}
/>


      {/* Objetos */}

{equippedItems.map(item => {

  const itemGrowth = growth[item.id]?.stage || 1;

  const scale =
    itemGrowth === 1
      ? "scale-100"
      : itemGrowth === 2
      ? "scale-125"
      : "scale-150";


  return (

    <div
      key={item.id}

      className={`absolute z-30 text-5xl select-none transition-transform duration-700 ${
        editMode
          ? "cursor-move scale-110"
          : "hover:scale-110"
      } ${scale}`}


      style={
        objectPositions[item.id]
        ??
        defaultPositions[item.id]
        ??
        {
          left: "50%",
          bottom: "10%"
        }
      }


      onPointerDown={(e) => {

        if (!editMode) return;

        setDragging(item.id);

        e.currentTarget.setPointerCapture(
          e.pointerId
        );

      }}


      onPointerMove={(e) => {

        if (dragging !== item.id) return;


        setObjectPositions(prev => {

          const current =
            prev[item.id]
            ??
            defaultPositions[item.id]
            ??
            {
              left: "50%",
              bottom: "10%"
            };


          const updated = {

            ...current,

            transform:
              `translate(${e.movementX}px, ${e.movementY}px)`

          };


          savePositions({
            ...prev,
            [item.id]: updated
          });


          return {
            ...prev,
            [item.id]: updated
          };

        });

      }}


      onPointerUp={() => {

        setDragging(null);

      }}


      onDoubleClick={() => {

        const updated = careItem(item.id);

        setGrowth(updated);

      }}

    >

      {item.emoji}

    </div>

  );

})}

      {/* Avatar */}

<div
className="absolute z-20 cursor-move"
  style={{
    left: `calc(50% + ${avatarPosition.x}px)`,
    top: `calc(50% + ${avatarPosition.y}px)`,
    transform: "translate(-50%, -50%) scale(0.5)"
  }}

  onPointerDown={(e)=>{

    setDraggingAvatar(true);

    e.currentTarget.setPointerCapture(
      e.pointerId
    );

  }}

  onPointerMove={(e)=>{

    if(!draggingAvatar) return;

    setAvatarPosition(prev => ({
      x: prev.x + e.movementX,
      y: prev.y + e.movementY
    }));

  }}

  onPointerUp={()=>{

    setDraggingAvatar(false);

  }}
>

<Avatar
  onPet={handlePetAvatar}
  avatar={avatar}
/>

</div>



      {editMode && (

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 px-5 py-2 rounded-full shadow font-semibold">

          {t("dragObjects")}

        </div>

      )}


    </div>

  );

};


export default HomeWorld;
