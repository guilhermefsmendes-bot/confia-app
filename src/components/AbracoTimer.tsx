import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, RotateCcw, Heart, Sparkles, Smile, ShieldAlert } from 'lucide-react';
import { SOOTHING_PHRASES } from '../data/initialData';

interface AbracoTimerProps {
  onAddXp: (amount: number) => void;
}

export const AbracoTimer: React.FC<AbracoTimerProps> = ({ onAddXp }) => {
  const TOTAL_SECONDS = 300; // 5 minutes
  const [secondsLeft, setSecondsLeft] = useState(TOTAL_SECONDS);
  const [isActive, setIsActive] = useState(false);
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [breatheState, setBreatheState] = useState<'Inalar' | 'Exalar'>('Inalar');
  const [completed, setCompleted] = useState(false);

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
    setIsActive(!isActive);
    setCompleted(false);
  };

  const handleReset = () => {
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
          <span className="text-[#E5A88B]">🫂</span> Abraço da Mente
        </h2>
        <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto font-medium">
          Um refúgio de 5 minutos desenhado para abrandar o ritmo do teu corpo. Foca-te na respiração e lê calmamente as mensagens.
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
              {breatheState}
            </motion.div>
          ) : (
            <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-1 font-display">
              {completed ? 'Concluído!' : 'Pronto'}
            </div>
          )}

          <div className="text-4xl font-mono font-bold text-[#4E3B36] tracking-tight">
            {formatTime(secondsLeft)}
          </div>

          {isActive && (
            <div className="text-[10px] text-slate-400 mt-1 font-medium">
              Ritmo de 10s por ciclo
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
              "{isActive ? SOOTHING_PHRASES[phraseIdx] : 'Clica em começar para iniciar o teu abraço e acalmar os teus pensamentos.'}"
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleReset}
          className="p-3 bg-white hover:bg-[#FAF5F0] text-slate-500 hover:text-[#4E3B36] rounded-2xl border border-[#E5A88B]/15 shadow-sm transition-all cursor-pointer"
          title="Reiniciar"
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
              <Pause size={14} fill="currentColor" /> Pausar Abraço
            </>
          ) : (
            <>
              <Play size={14} fill="currentColor" /> Começar Abraço
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
              <span className="font-extrabold text-xs uppercase tracking-widest font-display">Momento Concluído</span>
            </div>
            <p className="text-xs text-[#4E3B36] leading-relaxed font-semibold">
              Fizeste um excelente investimento na tua saúde mental hoje! Ganhaste <strong className="text-[#C97B5E]">+30 XP</strong> de evolução para o teu amigo.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
