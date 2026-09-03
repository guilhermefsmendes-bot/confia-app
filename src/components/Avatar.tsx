import React, { useState, useEffect } from 'react';
import { useTranslation } from "react-i18next";
import { motion } from 'motion/react';
import { ShieldCheck, Flame, Sparkles, MessageCircleCode } from 'lucide-react';
import { AvatarState } from '../types';
import ConfiaCreature, { type ConfiaCreatureState } from "./Companheiro/ConfiaCreature";
import type {
  CompanionReactionState,
} from "../data/reactive/companionReactionEngine";
interface AvatarProps {
  avatar: AvatarState;
  onPet: () => void;
  compact?: boolean;
  celebrating?: boolean;
  levelUpTrigger?: boolean;
  moodRating?: number;
  memoryMessage?: string;
  companionWorldMood?: "growing" | "settling" | "discovering" | "neutral";
  reactionState?: CompanionReactionState;
  equippedAccessoryIds?: string[];
}
const AvatarComponent: React.FC<AvatarProps> = ({
  avatar,
  onPet,
  compact,
  celebrating,
  levelUpTrigger,
  moodRating,
  memoryMessage,
  companionWorldMood = "neutral",
  reactionState,
  equippedAccessoryIds = []
}) => {


const { t } = useTranslation();
  const [isJumping, setIsJumping] = useState(false);




  const handleInteraction = () => {
    if (isJumping) return;
    setIsJumping(true);
    onPet();

    setTimeout(() => {
      setIsJumping(false);
    }, 800);

  };

  // Determine colors and stage details
  const getStageDetails = (level: number) => {
    if (level === 1) {
      return {
      name: t("stage1Name"),
        color: "from-teal-100 to-emerald-200",
        borderColor: "border-teal-300",
       desc: t("stage1Desc")
      };
    } else if (level === 2) {
      return {
       name: t("stage2Name"),

        color: "from-emerald-200 to-green-300",
        borderColor: "border-emerald-300",
       desc: t("stage2Desc")
      };
    } else if (level === 3) {
      return {
       name: t("stage3Name"),
        color: "from-emerald-200 to-cyan-300",
        borderColor: "border-cyan-300",
       desc: t("stage3Desc")
      };
    } else if (level === 4) {
      return {
       name: t("stage4Name"),
        color: "from-sky-200 to-indigo-200",
        borderColor: "border-sky-300",
       desc: t("stage4Desc")
      };
    } else {
      return {
       name: t("stage5Name"),
        color: "from-indigo-200 via-purple-200 to-pink-200",
        borderColor: "border-purple-300",
       desc: t("stage5Desc")
      };
    }
  };
const stageDetails = getStageDetails(avatar.level);
const stage = Math.min(10, avatar.level);

/**
 * ==========================================================
 * CONFIA 4C — COMPANION VIVO
 * ==========================================================
 *
 * Estado puramente visual derivado do worldMood existente.
 * Não interpreta, não guarda e não cria comportamento.
 */
/**
 * ==========================================================
 * A4.4 — MOMENTO DE GRANDE EVOLUÇÃO
 * ==========================================================
 *
 * Reutiliza levelUpTrigger já existente.
 * Não cria estado nem timer.
 *
 * Novas formas começam nos níveis 2, 4, 6 e 9.
 */
const isMajorEvolution =
  Boolean(levelUpTrigger) &&
  (
    avatar.level === 2 ||
    avatar.level === 4 ||
    avatar.level === 6 ||
    avatar.level === 9
  );

const creatureState: ConfiaCreatureState =
    levelUpTrigger || celebrating
      ? "celebrating"
      : reactionState ??
        (
          moodRating !== undefined && moodRating <= 3
            ? "supportive"
            : companionWorldMood === "discovering"
              ? "curious"
              : companionWorldMood === "growing"
                ? "welcoming"
                : "neutral"
        );



return (
  <div className="relative flex items-center justify-center">

      {/* Interactive Avatar Container */}

      <div
        onClick={handleInteraction}
        className="relative flex items-center justify-center cursor-pointer select-none"
        style={{ touchAction: 'manipulation' }}
      >
<motion.div
  animate={
    isJumping
      ? {
          y: [-30, 0],
          scaleY: [0.9, 1.1, 1],
          scaleX: [1.1, 0.9, 1]
        }
      : isMajorEvolution
        ? {
            y: [0, -10, -4, 0],
            scale: [1, 1.08, 1.035, 1],
            rotate: [0, -1.5, 1.5, 0]
          }
        : levelUpTrigger || celebrating
          ? {
              y: [0, -5, 0],
              scale: [1, 1.035, 1]
            }
          : {}
  }
  transition={
    isMajorEvolution
      ? {
          duration: 1.15,
          ease: "easeOut"
        }
      : {
          duration: 0.6,
          ease: "easeOut"
        }
  }
  className="relative flex flex-col items-center"
>
  {isMajorEvolution && (
    <motion.div
      aria-hidden="true"
      initial={{
        opacity: 0,
        scale: 0.72
      }}
      animate={{
        opacity: [0, 0.34, 0.18],
        scale: [0.72, 1.08, 1]
      }}
      transition={{
        duration: 1.1,
        ease: "easeOut"
      }}
      className="
        pointer-events-none
        absolute
        left-1/2
        top-1/2
        h-[205px]
        w-[205px]
        -translate-x-1/2
        -translate-y-1/2
        rounded-full
        bg-[radial-gradient(circle,rgba(255,238,190,0.62)_0%,rgba(229,168,139,0.22)_48%,rgba(255,255,255,0)_72%)]
        blur-[2px]
      "
    />
  )}

  {/* A4.4 — halo de evolução */}
  <ConfiaCreature
    level={avatar.level}
    state={creatureState}
    reacting={isJumping}
    equippedAccessoryIds={equippedAccessoryIds}
  />
</motion.div>


      </div>



    </div>
  );
};

export const Avatar = React.memo(AvatarComponent);
export default Avatar;
