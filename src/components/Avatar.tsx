import React, { useState, useEffect } from 'react';
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Flame, Heart, Sparkles, MessageCircleCode } from 'lucide-react';
import { AvatarState } from '../types';
interface AvatarProps {
  avatar: AvatarState;
  onPet: () => void;
  compact?: boolean;
  celebrating?: boolean;
  levelUpTrigger?: boolean;
  moodRating?: number;
  memoryMessage?: string;
  companionWorldMood?: "growing" | "settling" | "discovering" | "neutral";
}
const AvatarComponent: React.FC<AvatarProps> = ({
  avatar,
  onPet,
  compact,
  celebrating,
  levelUpTrigger,
  moodRating,
  memoryMessage,
  companionWorldMood = "neutral"
}) => {


const { t, i18n } = useTranslation();
const getRandomMessage = () => {
  const messages = t("avatarMessages", { returnObjects: true });

  if (Array.isArray(messages) && messages.length > 0) {
    return messages[Math.floor(Math.random() * messages.length)];
  }

  return memoryMessage || t("avatarWelcome");
};
const AFFIRMATIONS = [
  t("affirmation1"),
  t("affirmation2"),
  t("affirmation3"),
  t("affirmation4"),
  t("affirmation5"),
  t("affirmation6"),
  t("affirmation7"),
  t("affirmation8"),
];
  const [bubbleText, setBubbleText] = useState<string>("");
  const [showBubble, setShowBubble] = useState(false);
useEffect(() => {
  if (levelUpTrigger) {
setBubbleText(t("levelUpMessage"));
    setShowBubble(true);

    const timer = setTimeout(() => {
      setShowBubble(false);
    }, 5000);

    return () => clearTimeout(timer);
  }
}, [levelUpTrigger]);
  const [isJumping, setIsJumping] = useState(false);
  const [hearts, setHearts] = useState<{ id: number; x: number; y: number }[]>([]);

// Show a welcome message on mount
useEffect(() => {
const timer = window.setTimeout(() => {

if (moodRating !== undefined && moodRating <= 3) {
  setBubbleText(t("avatarLowMood"));
} else if (moodRating !== undefined && moodRating >= 8) {
  setBubbleText(t("avatarHighMood"));
} else if (stage === 1) {
  setBubbleText(t("avatarStageMessage1"));
} else if (stage >= 10) {
  setBubbleText(t("avatarStageMessage10"));
} else if (stage >= 5) {
  setBubbleText(t("avatarStageMessage5"));
} else {

const messages = t("avatarMessages", { returnObjects: true });

if (
  Array.isArray(messages) &&
  messages.length > 0 &&
  Math.random() < 0.2
) {
  const randomIdx = Math.floor(Math.random() * messages.length);
  setBubbleText(messages[randomIdx]);
} else {
  setBubbleText(memoryMessage || t("avatarWelcome"));
}
}
    setShowBubble(true);

  }, 1000);
return () => window.clearTimeout(timer);
}, [i18n.language, moodRating, memoryMessage, avatar.level]);


  const handleInteraction = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isJumping) return;
    setIsJumping(true);
    onPet();

    // Spawn heart animation
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const newHeart = { id: Date.now(), x, y };
    setHearts(prev => [...prev, newHeart]);

// Choose random companion message
setBubbleText(getRandomMessage());
setShowBubble(true);
    setTimeout(() => {
      setIsJumping(false);
    }, 800);

    // Clean up heart after animation
    setTimeout(() => {
      setHearts(prev => prev.filter(h => h.id !== newHeart.id));
    }, 1200);
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
const companionStatus =
  companionWorldMood === "growing"
    ? {
        label: t("companionWorldStatus.growing"),
        className:
          "border-emerald-200/70 bg-emerald-50/85 text-emerald-700"
      }
    : companionWorldMood === "settling"
      ? {
          label: t("companionWorldStatus.settling"),
          className:
            "border-orange-200/70 bg-orange-50/85 text-orange-700"
        }
      : companionWorldMood === "discovering"
        ? {
            label: t("companionWorldStatus.discovering"),
            className:
              "border-sky-200/70 bg-sky-50/85 text-sky-700"
          }
        : {
            label: t("companionWorldStatus.neutral"),
            className:
              "border-white/65 bg-white/80 text-slate-600"
          };


  // SVG representation based on level
  const renderAvatarSVG = () => {
const stage = Math.min(10, avatar.level);

const isLevel1 = stage === 1;
const isLevel2 = stage === 2;
const isLevel3 = stage === 3;
const isLevel4 = stage === 4;
const isLevel5 = stage === 5;
const isLevel6 = stage === 6;
const isLevel7 = stage === 7;
const isLevel8 = stage === 8;
const isLevel9 = stage === 9;
const isLevel10 = stage === 10;
    return (
      <svg
        viewBox="0 0 200 200"
        className="w-48 h-48 drop-shadow-xl select-none"
        id="amigo-svg"
      >
        {/* Ambient background glow */}
        <defs>
          <radialGradient id="glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#c7d2fe" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            {isLevel1 && (
              <>
                <stop offset="0%" stopColor="#e2f1e8" />
                <stop offset="100%" stopColor="#a7f3d0" />
              </>
            )}
            {isLevel2 && (
              <>
                <stop offset="0%" stopColor="#a7f3d0" />
                <stop offset="100%" stopColor="#34d399" />
              </>
            )}
            {isLevel3 && (
              <>
                <stop offset="0%" stopColor="#6ee7b7" />
                <stop offset="100%" stopColor="#06b6d4" />
              </>
            )}
            {isLevel4 && (
              <>
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#6366f1" />
              </>
            )}
{(isLevel5 || isLevel6 || isLevel7 || isLevel8 || isLevel9 || isLevel10) && (
  <>
    <stop offset="0%" stopColor="#818cf8" />
    <stop offset="50%" stopColor="#c084fc" />
    <stop offset="100%" stopColor="#f472b6" />
  </>
)}
          </linearGradient>
        </defs>

        <circle cx="100" cy="110" r="80" fill="url(#glow)" />
{/* Level 5+ Cloud Base */}
{(isLevel5 || isLevel6 || isLevel7 || isLevel8 || isLevel9 || isLevel10) && (

          <motion.g
            animate={{
              y: [0, 4, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            {/* Soft meditative cloud */}
            <path
              d="M 50 145 C 40 145, 35 135, 45 128 C 40 115, 60 105, 75 115 C 85 100, 115 100, 125 115 C 140 105, 160 115, 155 128 C 165 135, 160 145, 150 145 Z"
              fill="#f1f5f9"
              opacity="0.9"
              stroke="#cbd5e1"
              strokeWidth="2"
            />
          </motion.g>
        )}

        {/* Level 4 Tail */}
        {isLevel4 && (
          <motion.path
            d="M 50 120 C 20 110, 15 80, 35 70 C 45 75, 45 95, 55 105 Z"
            fill="url(#bodyGrad)"
            stroke="#475569"
            strokeWidth="3"
            animate={{
              rotate: [-10, 15, -10],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{ transformOrigin: "50px 110px" }}
          />
        )}

        {/* Level 3 & 4 & 5 Wings */}
        {(isLevel3 || isLevel4 || isLevel5) && (
          <g>
            {/* Left Wing */}
            <motion.path
              d="M 60 100 C 30 90, 20 60, 45 60 C 55 60, 58 80, 65 90 Z"
              fill={isLevel5 ? "#e9d5ff" : "#a5f3fc"}
              stroke="#475569"
              strokeWidth="2"
              animate={{
                rotate: [0, -15, 0],
              }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              style={{ transformOrigin: "65px 95px" }}
            />
            {/* Right Wing */}
            <motion.path
              d="M 140 100 C 170 90, 180 60, 155 60 C 145 60, 142 80, 135 90 Z"
              fill={isLevel5 ? "#e9d5ff" : "#a5f3fc"}
              stroke="#475569"
              strokeWidth="2"
              animate={{
                rotate: [0, 15, 0],
              }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              style={{ transformOrigin: "135px 95px" }}
            />
          </g>
        )}

        {/* Core Body Container - with breathing motion */}
{celebrating && (
  <motion.circle
    cx="100"
    cy="110"
    r="90"
    fill="none"
    stroke="#fef08a"
    strokeWidth="4"
    animate={{
      opacity: [0, 1, 0],
      scale: [0.8, 1.2, 0.8],
    }}
    transition={{
      duration: 1,
      repeat: Infinity,
    }}
  />
)}


{celebrating && (
  <>
    <motion.text
      x="55"
      y="45"
      fontSize="18"
    >
      ⭐
    </motion.text>
  </>
)}
        <motion.g
animate={{
  scaleY: celebrating ? [1, 1.15, 1] : [1, 1.04, 1],
  scaleX: celebrating ? [1, 1.08, 1] : [1, 0.98, 1],
  y: celebrating ? [0, -20, 0] : [0, -4, 0],
}}          transition={{
            duration: 6, // ultra-slow breathing rhythm
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{ transformOrigin: "100px 140px" }}
        >

          {/* Level 6+ Backpack */}
          {(isLevel6 || isLevel7 || isLevel8 || isLevel9 || isLevel10) && (
            <g>
              <path
                d="M55 95 Q45 110 55 150 Q100 165 145 150 Q155 110 145 95"
                fill="#92400e"
                stroke="#451a03"
                strokeWidth="3"
              />
              <path
                d="M65 100 Q100 85 135 100"
                fill="none"
                stroke="#fbbf24"
                strokeWidth="4"
              />
            </g>
          )}

          {/* Main Body Shapes */}
          {/* Main Body Shapes */}

          {isLevel1 ? (
            /* LEVEL 1: EGG */
            <g>
              <ellipse
                cx="100"
                cy="110"
                rx="50"
                ry="65"
                fill="url(#bodyGrad)"
                stroke="#34d399"
                strokeWidth="3.5"
              />
              {/* Cracks showing inner light */}
              <path
                d="M 90 55 L 100 68 L 105 58 L 115 72 L 120 62"
                fill="none"
                stroke="#6ee7b7"
                strokeWidth="3"
                strokeLinecap="round"
              />
              {/* Cute sleeping eyelids */}
              <path
                d="M 75 110 Q 85 118 95 110"
                fill="none"
                stroke="#064e3b"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <path
                d="M 105 110 Q 115 118 125 110"
                fill="none"
                stroke="#064e3b"
                strokeWidth="3"
                strokeLinecap="round"
              />
              {/* Blushing cheeks */}
              <circle cx="70" cy="118" r="6" fill="#f87171" opacity="0.4" />
              <circle cx="130" cy="118" r="6" fill="#f87171" opacity="0.4" />
            </g>
          ) : (
            /* LEVELS 2, 3, 4, 5: CREATURE BODY */
            <g>
              {/* Ears for levels 4 & 5 */}
{(isLevel4 || isLevel5 || isLevel6 || isLevel7 || isLevel8 || isLevel9 || isLevel10) && (
                <g>
                  {/* Left Long Ear */}
                  <path
                    d="M 65 75 Q 35 25 55 20 Q 75 25 75 70"
                    fill="url(#bodyGrad)"
                    stroke="#334155"
                    strokeWidth="3"
                  />
                  <path
                    d="M 68 68 Q 45 32 55 30 Q 68 32 70 65"
                    fill="#fecdd3"
                  />
                  {/* Right Long Ear */}
                  <path
                    d="M 135 75 Q 165 25 145 20 Q 125 25 125 70"
                    fill="url(#bodyGrad)"
                    stroke="#334155"
                    strokeWidth="3"
                  />
                  <path
                    d="M 132 68 Q 155 32 145 30 Q 132 32 130 65"
                    fill="#fecdd3"
                  />
                </g>
              )}

              {/* Ears for level 3 */}
              {isLevel3 && (
                <g>
                  {/* Left pointed ear */}
                  <path
                    d="M 70 70 L 55 45 L 82 62 Z"
                    fill="url(#bodyGrad)"
                    stroke="#475569"
                    strokeWidth="2"
                  />
                  {/* Right pointed ear */}
                  <path
                    d="M 130 70 L 145 45 L 118 62 Z"
                    fill="url(#bodyGrad)"
                    stroke="#475569"
                    strokeWidth="2"
                  />
                </g>
              )}

              {/* Main Rounded body */}
              <rect
                x="55"
                y="65"
                width="90"
                height="80"
                rx="40"
                fill="url(#bodyGrad)"
                stroke="#334155"
                strokeWidth="3"
              />

              {/* Sprouts/Accessories on Head */}
              {isLevel2 && (
                /* Level 2 leaf sprout */
                <g>
                  <path
                    d="M 100 65 Q 95 45 85 45 Q 98 47 100 60"
                    fill="#10b981"
                    stroke="#047857"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M 100 65 Q 105 45 115 45 Q 102 47 100 60"
                    fill="#10b981"
                    stroke="#047857"
                    strokeWidth="1.5"
                  />
                </g>
              )}

              {isLevel3 && (
                /* Level 3 single glowing antenae/star */
                <g>
                  <line x1="100" y1="65" x2="100" y2="40" stroke="#0891b2" strokeWidth="2" />
                  <circle cx="100" cy="40" r="5" fill="#fef08a" />
                </g>
              )}

{(isLevel5 || isLevel6 || isLevel7 || isLevel8 || isLevel9 || isLevel10) && (
                /* Level 5 Angelic Halo */
                <ellipse
                  cx="100"
                  cy="35"
                  rx="30"
                  ry="8"
                  fill="none"
                  stroke="#fef08a"
                  strokeWidth="3"
                  strokeDasharray="2,2"
                />
              )}

              {/* Level 7+ Star */}
              {(isLevel7 || isLevel8 || isLevel9 || isLevel10) && (
                <g>
                  <path
                    d="M100 45 L104 57 L117 57 L107 65 L111 78 L100 70 L89 78 L93 65 L83 57 L96 57 Z"
                    fill="#facc15"
                    stroke="#ca8a04"
                    strokeWidth="2"
                  />
                </g>
              )}
              {/* Level 8+ Butterfly */}
              {(isLevel8 || isLevel9 || isLevel10) && (
                <g>
                  <ellipse
                    cx="150"
                    cy="70"
                    rx="10"
                    ry="16"
                    fill="#c084fc"
                    stroke="#7e22ce"
                    strokeWidth="2"
                  />
                  <ellipse
                    cx="165"
                    cy="70"
                    rx="10"
                    ry="16"
                    fill="#f9a8d4"
                    stroke="#be185d"
                    strokeWidth="2"
                  />
                  <circle
                    cx="157"
                    cy="70"
                    r="3"
                    fill="#1f2937"
                  />
                </g>
              )}
    {/* Level 9+ Aura */}
              {(isLevel9 || isLevel10) && (
                <circle
                  cx="100"
                  cy="110"
                  r="88"
                  fill="none"
                  stroke="#fef08a"
                  strokeWidth="4"
                  opacity="0.5"
                />
              )}
   {/* Level 10 Crown */}
              {isLevel10 && (
                <g>
                  <path
                    d="M75 45 L85 25 L100 40 L115 25 L125 45 Z"
                    fill="#facc15"
                    stroke="#ca8a04"
                    strokeWidth="3"
                  />
                  <circle cx="85" cy="32" r="3" fill="#ef4444" />
                  <circle cx="100" cy="40" r="3" fill="#3b82f6" />
                  <circle cx="115" cy="32" r="3" fill="#22c55e" />
                </g>
              )}
              {/* Eyes with blinking action */}
              <g>
                {/* Left Eye */}
                <motion.ellipse
                  cx="85"
                  cy="100"
                  rx="6"
                  ry="8"
                  fill="#1e293b"
                  animate={{
                    scaleY: [1, 1, 0.1, 1, 1, 1],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    times: [0, 0.45, 0.5, 0.55, 0.6, 1],
                  }}
                  style={{ transformOrigin: "85px 100px" }}
                />
                {/* Right Eye */}
                <motion.ellipse
                  cx="115"
                  cy="100"
                  rx="6"
                  ry="8"
                  fill="#1e293b"
                  animate={{
                    scaleY: [1, 1, 0.1, 1, 1, 1],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    times: [0, 0.45, 0.5, 0.55, 0.6, 1],
                  }}
                  style={{ transformOrigin: "115px 100px" }}
                />
                {/* Shiny eye spots */}
                <circle cx="83" cy="97" r="2" fill="#ffffff" />
                <circle cx="113" cy="97" r="2" fill="#ffffff" />
              </g>

              {/* Smiling Mouth */}
              <path
                d="M 94 110 Q 100 116 106 110"
                fill="none"
                stroke="#1e293b"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Blushing cheeks */}
              <circle cx="73" cy="108" r="6" fill="#f43f5e" opacity="0.4" />
              <circle cx="127" cy="108" r="6" fill="#f43f5e" opacity="0.4" />

              {/* Cute little feet */}
              <g>
                <circle cx="75" cy="143" r="8" fill="#475569" />
                <circle cx="125" cy="143" r="8" fill="#475569" />
              </g>
            </g>
          )}
        </motion.g>

        {/* Floating sparkles for level 3, 4, 5 */}
        {(isLevel3 || isLevel4 || isLevel5) && (
          <g>
            <motion.path
              d="M 40 40 L 42 45 L 47 47 L 42 49 L 40 54 L 38 49 L 33 47 L 38 45 Z"
              fill="#fef08a"
              animate={{ opacity: [0.2, 0.9, 0.2], scale: [0.8, 1.2, 0.8] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.path
              d="M 160 50 L 161 54 L 165 55 L 161 56 L 160 60 L 159 56 L 155 55 L 159 54 Z"
              fill="#fef08a"
              animate={{ opacity: [0.9, 0.2, 0.9], scale: [1.1, 0.8, 1.1] }}
              transition={{ duration: 2.5, repeat: Infinity }}
            />
            <motion.path
              d="M 100 20 L 101 23 L 104 24 L 101 25 L 100 28 L 99 25 L 96 24 L 99 23 Z"
              fill="#fef08a"
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.9, 1.3, 0.9] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </g>
        )}
      </svg>
    );
  };

  const levelUpProgress = (avatar.xp / avatar.maxXp) * 100;

return (
  <div className="relative flex flex-col items-center justify-center pt-2 pb-4 px-4">

      {/* CONFIA 4C — ESTADO VISÍVEL DO COMPANION */}
      <div
        aria-hidden="true"
        className={`
          pointer-events-none
          absolute left-1/2 top-2 z-40
          -translate-x-1/2
          whitespace-nowrap
          rounded-full border
          px-3 py-1
          text-[9px] font-black
          tracking-[0.02em]
          shadow-[0_5px_16px_rgba(70,50,40,0.06)]
          ${companionStatus.className}
        `}
      >
        {companionStatus.label}
      </div>

    <div
      className="
        absolute
        top-2
        left-2
        z-30
        flex items-center gap-1.5
        rounded-full
        border border-white/60
        bg-white/80
        px-2.5 py-1.5
        text-[11px] font-bold
        text-[#A9583E]
        shadow-[0_6px_18px_rgba(80,60,50,0.10)]
        backdrop-blur-md
      "
    >
      <span
        className="
          flex h-5 w-5
          items-center justify-center
          rounded-full
          bg-[#FFF1E8]
          text-[#C97B5E]
        "
        aria-hidden="true"
      >
        <Sparkles size={11} strokeWidth={2} />
      </span>

      <span>
        {t("level")} {avatar.level}
      </span>
    </div>

      {/* Interactive Avatar Container */}
      <div
        onClick={handleInteraction}
        className="relative cursor-pointer transition-transform hover:scale-105 active:scale-95 flex items-center justify-center p-4"
        style={{ touchAction: 'manipulation' }}
      >
<motion.div
  animate={isJumping ? {
    y: [-30, 0],
    scaleY: [0.9, 1.1, 1],
    scaleX: [1.1, 0.9, 1]
  } : {}}
  transition={{ duration: 0.6, ease: "easeOut" }}
  className="flex flex-col items-center"
>
  {renderAvatarSVG()}
</motion.div>

        {/* Petting heart particles */}
        <AnimatePresence>
          {hearts.map(heart => (
            <motion.div
              key={heart.id}
              initial={{ opacity: 1, scale: 0.5, y: heart.y, x: heart.x }}
              animate={{ opacity: 0, scale: 1.5, y: heart.y - 100, x: heart.x + (Math.random() * 40 - 20) }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="absolute pointer-events-none text-[#C97B5E]"
            >
              <Heart fill="currentColor" size={24} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

   <p className="text-xs text-slate-500 mt-1 mb-4 flex items-center gap-1 bg-white px-3 py-1.5 rounded-full border border-[#E5A88B]/15 shadow-sm shadow-[#E5A88B]/5">
          <Sparkles size={12} className="text-[#E5A88B] animate-pulse" />
          {t("petCompanion")}
        </p>

    </div>
  );
};

export const Avatar = React.memo(AvatarComponent);
export default Avatar;
