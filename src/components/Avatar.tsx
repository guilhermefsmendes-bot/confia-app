import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Flame, Heart, Sparkles, MessageCircleCode } from 'lucide-react';
import { AvatarState } from '../types';

interface AvatarProps {
  avatar: AvatarState;
  onPet: () => void;
}

const AFFIRMATIONS = [
  "Estou muito orgulhoso do teu progresso hoje! 🌸",
  "Respira fundo comigo... Está tudo bem. 🌿",
  "Cada pequeno passo que dás é uma grande vitória! ✨",
  "Lembra-te de beber água e esticar os ombros hoje. 💧",
  "Fico tão feliz quando cuidamos um do outro! 🥰",
  "A ansiedade é apenas uma nuvem, tu és o céu inteiro. ☁️",
  "Não te cobres tanto. Estás a fazer o teu melhor. ☀️",
  "Que bom que estás aqui a cuidar da tua mente! 🧘‍♂️"
];

export const Avatar: React.FC<AvatarProps> = ({ avatar, onPet }) => {
  const [bubbleText, setBubbleText] = useState<string>("");
  const [showBubble, setShowBubble] = useState(false);
  const [isJumping, setIsJumping] = useState(false);
  const [hearts, setHearts] = useState<{ id: number; x: number; y: number }[]>([]);

  // Show a welcome message on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setBubbleText(`Olá! Eu sou o teu companheiro de calma. Vamos respirar juntos? 💚`);
      setShowBubble(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

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

    // Choose random affirmative speech bubble
    const randomIdx = Math.floor(Math.random() * AFFIRMATIONS.length);
    setBubbleText(AFFIRMATIONS[randomIdx]);
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
        name: "Ovo da Serenidade",
        color: "from-teal-100 to-emerald-200",
        borderColor: "border-teal-300",
        desc: "Um pequeno ovo luminoso que absorve a tua calma para chocar."
      };
    } else if (level === 2) {
      return {
        name: "Bebé Calmo",
        color: "from-emerald-200 to-green-300",
        borderColor: "border-emerald-300",
        desc: "Ainda pequenino, adora respirações profundas e água fresca."
      };
    } else if (level === 3) {
      return {
        name: "Criança Curiosa",
        color: "from-emerald-200 to-cyan-300",
        borderColor: "border-cyan-300",
        desc: "Cresceu asas de luz e adora explorar sentimentos calmos."
      };
    } else if (level === 4) {
      return {
        name: "Jovem Guardião",
        color: "from-sky-200 to-indigo-200",
        borderColor: "border-sky-300",
        desc: "Com orelhas mágicas e cauda fofa, protege-te de pensamentos agitados."
      };
    } else {
      return {
        name: "Sábio da Paz",
        color: "from-indigo-200 via-purple-200 to-pink-200",
        borderColor: "border-purple-300",
        desc: "Um guardião celestial meditando numa nuvem de tranquilidade."
      };
    }
  };

  const stage = getStageDetails(avatar.level);

  // SVG representation based on level
  const renderAvatarSVG = () => {
    const isLevel1 = avatar.level === 1;
    const isLevel2 = avatar.level === 2;
    const isLevel3 = avatar.level === 3;
    const isLevel4 = avatar.level === 4;
    const isLevel5 = avatar.level >= 5;

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
            {isLevel5 && (
              <>
                <stop offset="0%" stopColor="#818cf8" />
                <stop offset="50%" stopColor="#c084fc" />
                <stop offset="100%" stopColor="#f472b6" />
              </>
            )}
          </linearGradient>
        </defs>

        <circle cx="100" cy="110" r="80" fill="url(#glow)" />

        {/* Level 5 Cloud Base */}
        {isLevel5 && (
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
        <motion.g
          animate={{
            scaleY: [1, 1.04, 1],
            scaleX: [1, 0.98, 1],
            y: [0, -4, 0],
          }}
          transition={{
            duration: 6, // ultra-slow breathing rhythm
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{ transformOrigin: "100px 140px" }}
        >
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
              {(isLevel4 || isLevel5) && (
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

              {isLevel5 && (
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
    <div className="flex flex-col items-center justify-center pt-2 pb-4 px-4">
      {/* Speech Bubble / Balloon */}
      <div className="relative h-14 flex items-center justify-center mb-1 w-full">
        <AnimatePresence mode="wait">
          {showBubble && (
            <motion.div
              key={bubbleText}
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -5 }}
              className="absolute bg-white/95 backdrop-blur-sm px-5 py-2 rounded-2xl shadow-md border border-[#E5A88B]/25 w-full max-w-[280px] text-center text-xs font-bold text-[#4E3B36] leading-relaxed"
              style={{ bottom: 0 }}
            >
              {bubbleText}
              <div className="absolute left-1/2 -bottom-2 -translate-x-1/2 w-4 h-4 bg-white/95 rotate-45 border-r border-b border-[#E5A88B]/25" />
            </motion.div>
          )}
        </AnimatePresence>
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

      {/* Click instructions */}
      <p className="text-xs text-slate-500 mt-1 mb-4 flex items-center gap-1 bg-white px-3 py-1.5 rounded-full border border-[#E5A88B]/15 shadow-sm shadow-[#E5A88B]/5">
        <Sparkles size={12} className="text-[#E5A88B] animate-pulse" />
        Toca no teu companheiro para lhe dar carinho (+1 Ponto)
      </p>

      {/* Status Details */}
      <div className="w-full max-w-sm bg-white rounded-[24px] p-5 border border-[#E5A88B]/15 shadow-xl shadow-[#E5A88B]/5">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="font-bold text-[#4E3B36] text-base">{avatar.name}</h3>
            <p className="text-xs font-semibold text-[#C97B5E] flex items-center gap-1 mt-0.5">
              <ShieldCheck size={13} /> Estágio: {stage.name}
            </p>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-xs font-mono font-bold text-[#C97B5E] bg-[#E5A88B]/10 px-2.5 py-1 rounded-xl">
              Nível {avatar.level}
            </span>
            <span className="text-[10px] font-mono text-slate-400 mt-1 flex items-center gap-0.5">
              <Flame size={10} className="text-[#C97B5E]" /> {avatar.points} Pontos
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-500 mb-3 leading-relaxed">
          {stage.desc}
        </p>

        {/* Progress bar */}
        <div>
          <div className="flex justify-between text-[11px] font-mono font-medium text-slate-400 mb-1">
            <span>XP do Nível: {avatar.xp} / {avatar.maxXp}</span>
            <span>{Math.round(levelUpProgress)}%</span>
          </div>
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-[2px]">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-[#E5A88B] via-[#F1C3AF] to-[#E29A86] shadow-sm"
              initial={{ width: 0 }}
              animate={{ width: `${levelUpProgress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
