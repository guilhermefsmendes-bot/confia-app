import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Pencil, Check } from "lucide-react";
import { Avatar } from "./Avatar";
import { getEquipped } from "../storage/homeInventory";
import { getPositions, savePositions } from "../storage/homePositions";
import { homeItems } from "../data/homeItems";
import { getWeeklyTrophies } from "../storage/weeklyTrophies";
import Clouds from "./world/Clouds";
import Butterflies from "./world/Butterflies";
import { getRefugeLevel } from "../data/refugeProgress";
import PremiumRefuge from "./world/PremiumRefuge";
import { getWorld, careWorld } from "../storage/homeWorld";
import { getGrowth, careItem } from "../storage/homeGrowth";
import GrassDetails from "./world/GrassDetails";
import GrassTexture from "./world/GrassTexture";
import PremiumSky from "./world/PremiumSky";
import PremiumVegetation from "./world/PremiumVegetation";
import PremiumEnvironment from "./world/PremiumEnvironment";
import PremiumDepth from "./world/PremiumDepth";
import PremiumGround from "./world/PremiumGround";
import PremiumPath from "./world/PremiumPath";
import PremiumWater from "./world/PremiumWater";
import PremiumLighting from "./world/PremiumLighting";

interface Props {
  avatar: any;
  avatarCelebrating: boolean;
  avatarMemoryMessage: string;
  morningRating: number;
  afternoonRating?: number;
  handlePetAvatar: () => void;
  worldMood: "growing" | "settling" | "discovering" | "neutral";
}

const HomeWorld: React.FC<Props> = ({
  avatar,
  avatarCelebrating,
  avatarMemoryMessage,
  morningRating,
  afternoonRating,
  handlePetAvatar,
  worldMood,
}) => {

  const { t } = useTranslation();
  const [editMode, setEditMode] = useState(false);
const [avatarPosition, setAvatarPosition] = useState(() => {
  const saved = getPositions().__avatar__;

  return {
    left: saved?.left ?? "50%",
    top: saved?.top ?? "50%"
  };
});

const [draggingAvatar, setDraggingAvatar] = useState(false);
const [world, setWorld] = useState(getWorld());
const [growth, setGrowth] = useState(getGrowth());
  const [objectPositions, setObjectPositions] = useState(
    getPositions()
  );

  const [dragging, setDragging] = useState<string | null>(null);

const refugeLevel = getRefugeLevel(avatar.xp).level;

const hour = new Date().getHours();

const isNight = hour >= 21 || hour < 7;

  const equipped = getEquipped();

  const equippedItems = homeItems.filter(item =>
    equipped.includes(item.id)
  );

  const weeklyTrophies = getWeeklyTrophies();

  const equippedTrophies = weeklyTrophies.filter(trophy =>
    equipped.includes(trophy.id)
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
  style={{ touchAction: "none" }}
  onDoubleClick={() => {
    const updated = careWorld(5);
    setWorld(updated);
  }}
>
<div className="absolute top-4 right-4 z-50">
  <button
    type="button"
    onClick={() => {
      if (editMode) {
        savePositions(objectPositions);
      }

      setEditMode(!editMode);
    }}
    aria-pressed={editMode}
    className={`
      flex items-center gap-2
      rounded-2xl border
      px-3.5 py-2.5
      text-xs font-bold
      backdrop-blur-md
      transition-all duration-200
      active:scale-[0.97]
      ${
        editMode
          ? "border-[#D99A7C]/45 bg-[#FFF5EF]/90 text-[#A9583E] shadow-[0_8px_24px_rgba(115,72,55,0.14)]"
          : "border-white/60 bg-white/75 text-[#5E4840] shadow-[0_8px_24px_rgba(80,60,50,0.10)]"
      }
    `}
  >
    <span
      className={`
        flex h-7 w-7
        items-center justify-center
        rounded-xl
        ${
          editMode
            ? "bg-[#F6DDCF] text-[#B86448]"
            : "bg-[#FFF3EC] text-[#C97B5E]"
        }
      `}
    >
      {editMode ? (
        <Check size={15} strokeWidth={2} />
      ) : (
        <Pencil size={14} strokeWidth={1.9} />
      )}
    </span>

    <span>{editMode ? t("save") : t("edit")}</span>
  </button>
</div>

{/* ======================================================
    CONFIA 4B — ATMOSFERA REATIVA

    Uma única camada visual estática.
    Não anima, não captura eventos e não mantém estado.
====================================================== */}
<div
  aria-hidden="true"
  className={`pointer-events-none absolute inset-0 z-[1] ${
    worldMood === "growing"
      ? "bg-gradient-to-b from-amber-50/10 via-transparent to-emerald-50/10"
      : worldMood === "settling"
        ? "bg-gradient-to-b from-rose-50/10 via-transparent to-orange-50/10"
        : worldMood === "discovering"
          ? "bg-gradient-to-b from-sky-50/10 via-transparent to-violet-50/10"
          : "bg-transparent"
  }`}
/>

<Clouds />
<GrassTexture />
<Butterflies />
<PremiumRefuge xp={avatar.xp} />
<GrassDetails />

{/* Céu cinematográfico premium */}
<PremiumSky isNight={isNight} />
<PremiumLighting isNight={isNight} />

{/* Vegetação cinematográfica */}
<PremiumDepth />
<PremiumGround />
<PremiumPath />
{refugeLevel >= 3 && <PremiumWater />}
<PremiumVegetation />
<PremiumEnvironment level={refugeLevel} />

{/* Relva evolutiva */}

{equippedItems.map(item => {

  const itemGrowth = growth[item.id]?.stage || 1;

  const scale =
    itemGrowth === 1
      ? "scale-100"
      : itemGrowth === 2
      ? "scale-125"
      : "scale-150";

  const animation =
    item.id.includes("flower")
      ? "animate-[wiggle_4s_ease-in-out_infinite]"
      : item.id.includes("tree")
      ? "animate-[wiggle_6s_ease-in-out_infinite]"
      : "";

  return (
    <div
      key={item.id}
      className={`absolute z-30 text-3xl select-none transition-transform duration-700 ${
        editMode
          ? "cursor-move scale-110"
          : "hover:scale-110"
      } ${scale} ${animation}`}
      style={{
        touchAction: "none",
        ...(objectPositions[item.id] ??
          defaultPositions[item.id] ?? {
            left: "50%",
            bottom: "10%"
          })
      }}

      onPointerDown={(e) => {
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        setDragging(item.id);
      }}

      onPointerMove={(e) => {

        if (dragging !== item.id) return;

        e.preventDefault();

        const rect =
          e.currentTarget.parentElement!.getBoundingClientRect();

        const left =
          ((e.clientX - rect.left) / rect.width) * 100;

        const top =
          ((e.clientY - rect.top) / rect.height) * 100;

        setObjectPositions(prev => ({
          ...prev,
          [item.id]: {
            left: `${left}%`,
            top: `${top}%`
          }
        }));

      }}

      onPointerUp={(e) => {

        e.currentTarget.releasePointerCapture(
          e.pointerId
        );

        if (dragging === item.id) {

          savePositions(objectPositions);
          setDragging(null);

        }

      }}

      onDoubleClick={() => {

        const updated = careItem(item.id);
        setGrowth(updated);

      }}
    >

      <div
        className="absolute left-1/2 bottom-1 -translate-x-1/2 w-8 h-2 rounded-full bg-black/20 blur-sm"
      />

      <div className="relative">
        {item.emoji}
      </div>

    </div>
  );

})}


{/* Weekly Trophies */}

{equippedTrophies.map(trophy => {

  return (
    <div
      key={trophy.id}
      className={`absolute z-30 select-none text-5xl transition-transform duration-300 ${
        editMode
          ? "cursor-move scale-110"
          : "hover:scale-110"
      }`}
      style={{
        touchAction: "none",
        ...(objectPositions[trophy.id] ?? {
          left: "65%",
          bottom: "15%"
        })
      }}

      onPointerDown={(e) => {

        e.preventDefault();

        e.currentTarget.setPointerCapture(
          e.pointerId
        );

        setDragging(trophy.id);

      }}

      onPointerMove={(e) => {

        if (dragging !== trophy.id) return;

        e.preventDefault();

        const rect =
          e.currentTarget.parentElement!.getBoundingClientRect();

        const left =
          ((e.clientX - rect.left) / rect.width) * 100;

        const top =
          ((e.clientY - rect.top) / rect.height) * 100;

        setObjectPositions(prev => ({
          ...prev,
          [trophy.id]: {
            left: `${left}%`,
            top: `${top}%`
          }
        }));

      }}

      onPointerUp={(e) => {

        e.currentTarget.releasePointerCapture(
          e.pointerId
        );

        if (dragging === trophy.id) {

          savePositions({
            ...objectPositions,
            [trophy.id]: objectPositions[trophy.id]
          });

          setDragging(null);

        }

      }}
    >

      <div className="absolute left-1/2 bottom-0 -translate-x-1/2 w-10 h-2 rounded-full bg-black/20 blur-sm" />

      <div
        className="relative"
        title={trophy.title}
      >
        {trophy.emoji}
      </div>

    </div>
  );

})}


{/* Avatar */}

<div
  className={`absolute z-[35] ${
    editMode ? "cursor-move" : "cursor-pointer"
  }`}
  style={{
    left: avatarPosition.left,
    top: avatarPosition.top,
    transform: "translate(-50%, -50%) scale(0.5)",
    touchAction: editMode ? "none" : "manipulation"
  }}

  onPointerDown={(e) => {
    if (!editMode) return;

    e.preventDefault();

    e.currentTarget.setPointerCapture(
      e.pointerId
    );

    setDraggingAvatar(true);
  }}

  onPointerMove={(e) => {
    if (!editMode || !draggingAvatar) return;

    e.preventDefault();

    const rect =
      e.currentTarget.parentElement!.getBoundingClientRect();

    const left = Math.max(
      8,
      Math.min(
        92,
        ((e.clientX - rect.left) / rect.width) * 100
      )
    );

    const top = Math.max(
      18,
      Math.min(
        82,
        ((e.clientY - rect.top) / rect.height) * 100
      )
    );

    setAvatarPosition({
      left: `${left}%`,
      top: `${top}%`
    });
  }}

  onPointerUp={(e) => {
    if (!editMode || !draggingAvatar) return;

    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(
        e.pointerId
      );
    }

    const nextPositions = {
      ...objectPositions,
      __avatar__: {
        left: avatarPosition.left,
        top: avatarPosition.top
      }
    };

    setObjectPositions(nextPositions);
    savePositions(nextPositions);
    setDraggingAvatar(false);
  }}
>
<div
  className="
    absolute
    bottom-1
    left-[45%]
    translate-x-[-60%]
    w-10
    h-3
    rounded-full
    bg-black/20
    blur-sm
    pointer-events-none
  "
/>


  <Avatar
    onPet={handlePetAvatar}
    avatar={avatar}
  companionWorldMood={worldMood}
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


export default React.memo(HomeWorld);