import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, RotateCcw, Heart, Sparkles, Smile, ShieldAlert } from 'lucide-react';
import { SOOTHING_PHRASES } from '../data/initialData';
import { useTranslation } from "react-i18next";
interface AbracoTimerProps {
  onAddXp: (amount: number) => void;
}

export const AbracoTimer: React.FC<AbracoTimerProps> = ({ onAddXp }) => {
const { t } = useTranslation();
  const TOTAL_SECONDS = 300; // 5 minutes
  const [secondsLeft, setSecondsLeft] = useState(TOTAL_SECONDS);
  const [isActive, setIsActive] = useState(false);
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [breatheState, setBreatheState] = useState<'Inalar' | 'Exalar'>('Inalar');
  const [completed, setCompleted] = useState(false);
const [selectedSound, setSelectedSound] = useState("rain");
const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  // Phrase rotation timer (every 15 seconds)
  useEffect(() => {
    if (!isActive) return;

    const phraseTimer = setInterval(() => {
      setPhraseIdx(prev => (prev + 1) % SOOTHING_PHRASES.length);
    }, 15000);

    return () => clearInterval(phraseTimer);
  }, [isActive]);

  // Main countdown timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft(prev => prev - 1);
      }, 1000);
} else if (secondsLeft === 0 && isActive) {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
        setAudio(null);
      }

      setIsActive(false);
      setCompleted(true);
      onAddXp(30); // Great effort gets +30 XP!
}
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, secondsLeft]);

  // Breathing pulse controller (every 5 seconds)
  useEffect(() => {
    if (!isActive) return;

    const breatheTimer = setInterval(() => {
      setBreatheState(prev => (prev === 'Inalar' ? 'Exalar' : 'Inalar'));
    }, 5000);

    return () => clearInterval(breatheTimer);
  }, [isActive]);

const handleToggle = () => {
  if (!isActive) {
    const sound = new Audio(`/audio/${selectedSound}.mp3`);
    sound.loop = true;
    sound.play();

    setAudio(sound);
  } else {
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  }

  setIsActive(!isActive);
  setCompleted(false);
};
const handleReset = () => {
  if (audio) {
    audio.pause();
    audio.currentTime = 0;
    setAudio(null);
  }

  setIsActive(false);
  setSecondsLeft(TOTAL_SECONDS);
  setPhraseIdx(0);
  setCompleted(false);
  setBreatheState('Inalar');
};
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Circular progress stroke calculation
  const progress = (TOTAL_SECONDS - secondsLeft) / TOTAL_SECONDS;
  const radius = 80;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <div className="flex flex-col items-center max-w-md mx-auto space-y-6 py-4">
      {/* Tab Header Banner */}
      <div className="text-center space-y-1.5 w-full">
        <h2 className="text-xl font-black text-[#4E3B36] flex items-center justify-center gap-2 font-display">
<span className="text-[#E5A88B]">🫂</span> {t("mindHug")}
        </h2>
        <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto font-medium">
       {t("mindHugDescription")}
        </p>
      </div>

      {/* Main Visual breathing circle and Timer */}
      <div className="relative flex items-center justify-center w-64 h-64 my-4 bg-[#FFF0E8]/40 rounded-full border border-[#E5A88B]/15 shadow-inner">
        {/* Pulsing breathing back aura */}
        {isActive && (
          <motion.div
            animate={{
              scale: breatheState === 'Inalar' ? 1.3 : 0.9,
              opacity: breatheState === 'Inalar' ? 0.35 : 0.15,
            }}
            transition={{
              duration: 5,
              ease: "easeInOut",
            }}
            className="absolute inset-4 rounded-full bg-[#E5A88B]/20 blur-md pointer-events-none"
          />
        )}

        {/* SVG Circle Progress bar */}
        <svg className="absolute w-full h-full transform -rotate-90">
          {/* Background circle */}
          <circle
            cx="128"
            cy="128"
            r={radius}
            className="text-[#FFF0E8] stroke-current"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Active progress circle */}
          <motion.circle
            cx="128"
            cy="128"
            r={radius}
            className="text-[#E5A88B] stroke-current"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: "linear" }}
            strokeLinecap="round"
          />
        </svg>

        {/* Inner Content */}
        <div className="z-10 flex flex-col items-center text-center">
          {isActive ? (
            <motion.div
              key={breatheState}
              initial={{ scale: 0.9, opacity: 0.7 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-xs font-extrabold uppercase tracking-widest text-[#C97B5E] mb-1 font-display"
            >
             {breatheState === 'Inalar'
 ? t("hugInhale")
 : t("hugExhale")}
            </motion.div>
          ) : (
            <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-1 font-display">
             {completed ? t("completed") : t("ready")}
            </div>
          )}

          <div className="text-4xl font-mono font-bold text-[#4E3B36] tracking-tight">
            {formatTime(secondsLeft)}
          </div>

          {isActive && (
            <div className="text-[10px] text-slate-400 mt-1 font-medium">
             {t("breathingRhythm")}
            </div>
          )}
        </div>
      </div>

      {/* Soothing Phrase Display */}
      <div className="min-h-[85px] w-full flex items-center justify-center px-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={phraseIdx + '-' + secondsLeft}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <p className="text-sm font-semibold text-[#4E3B36] max-w-xs mx-auto leading-relaxed italic">
{isActive ? t(SOOTHING_PHRASES[phraseIdx]) : t("startHugMessage")}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
{/* Relaxing Sounds */}
<div className="w-full bg-[#F8F1EA] rounded-2xl p-4 border border-[#E5A88B]/20 mb-4">
  <p className="text-xs font-bold text-[#4E3B36] mb-3">
    🌿 {t("calmNow")}
  </p>

  <select
    value={selectedSound}
    onChange={(e) => setSelectedSound(e.target.value)}
    className="w-full rounded-xl border border-[#E5A88B]/30 px-3 py-2 text-sm bg-white"
  >
    <option value="rain">{t("soundRain")}</option>
    <option value="forest">{t("soundForest")}</option>
    <option value="ocean">{t("soundOcean")}</option>
    <option value="white-noise">{t("soundWhiteNoise")}</option>
  </select>
</div>

      {/* Control Buttons */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleReset}
          className="p-3 bg-white hover:bg-[#FAF5F0] text-slate-500 hover:text-[#4E3B36] rounded-2xl border border-[#E5A88B]/15 shadow-sm transition-all cursor-pointer"
         title={t("reset")}
        >
          <RotateCcw size={18} />
        </button>

        <button
          onClick={handleToggle}
          className={`px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider font-display shadow-lg transition-all flex items-center gap-2 cursor-pointer ${
            isActive
              ? 'bg-[#E5A88B] hover:bg-[#D59375] text-white shadow-[#E5A88B]/25'
              : 'bg-[#C97B5E] hover:bg-[#B56A4F] text-white shadow-[#C97B5E]/20'
          }`}
        >
          {isActive ? (
            <>
             <Pause size={14} fill="currentColor" /> {t("pauseHug")}
            </>
          ) : (
            <>
             <Play size={14} fill="currentColor" /> {t("startHug")}
            </>
          )}
        </button>
      </div>

      {/* Completion reward banner */}
      <AnimatePresence>
        {completed && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#E5A88B]/10 border border-[#E5A88B]/25 p-5 rounded-[24px] text-center max-w-sm space-y-1.5"
          >
            <div className="flex items-center justify-center text-[#C97B5E] gap-1">
              <Sparkles size={16} className="animate-spin" />
             <span className="font-extrabold text-xs uppercase tracking-widest font-display">
  {t("sessionCompleted")}
</span>
            </div>
           <p className="text-xs text-[#4E3B36] leading-relaxed font-semibold">
  {t("sessionCompletedMessage")}{" "}
  <strong className="text-[#C97B5E]">+30 XP</strong>{" "}
  {t("sessionCompletedReward")}
</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
