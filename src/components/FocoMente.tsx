import React, { useState, useEffect } from 'react';
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  BookOpen, 
  PenTool, 
  Palette, 
  FolderSync, 
  Scissors, 
  Sprout,
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle, 
  ArrowRight, 
  Lightbulb,
  Clock,
  ChevronRight
} from 'lucide-react';

interface FocoMenteProps {
  onAddXp: (amount: number) => void;
}

type StepType = 'choice' | 'proposal' | 'timer' | 'completed';

interface FocusActivity {
  id: string;
  title: string;
  icon: React.ReactNode;
  emoji: string;
  description: string;
  exerciseTitle: string;
  exerciseDesc: string;
  tip: string;
}

const ACTIVITIES = (t: any): FocusActivity[] => [
  {
    id: 'ler',
title: t("readBookTitle"),
description: t("readBookDesc"),
exerciseTitle: t("readBookExercise"),
exerciseDesc: t("readBookExerciseDesc"),
tip: t("readBookTip")
  },
  {
    id: 'escrever',
title: t("writeTitle"),
description: t("writeDesc"),
exerciseTitle: t("writeExercise"),
exerciseDesc: t("writeExerciseDesc"),
tip: t("writeTip")
  },
  {
    id: 'desenhar',
title: t("drawTitle"),
description: t("drawDesc"),
exerciseTitle: t("drawExercise"),
exerciseDesc: t("drawExerciseDesc"),
tip: t("drawTip")
  },
  {
    id: 'organizar',
title: t("organizeTitle"),
description: t("organizeDesc"),
exerciseTitle: t("organizeExercise"),
exerciseDesc: t("organizeExerciseDesc"),
tip: t("organizeTip")
  },
  {
    id: 'artesanato',
title: t("craftTitle"),
description: t("craftDesc"),
exerciseTitle: t("craftExercise"),
exerciseDesc: t("craftExerciseDesc"),
tip: t("craftTip")
  },
  {
    id: 'plantas',
title: t("plantsTitle"),
description: t("plantsDesc"),
exerciseTitle: t("plantsExercise"),
exerciseDesc: t("plantsExerciseDesc"),
tip: t("plantsTip")
  }
];

export const FocoMente: React.FC<FocoMenteProps> = ({ onAddXp }) => {
const { t } = useTranslation();
  const [step, setStep] = useState<StepType>('choice');
  const [selectedActivity, setSelectedActivity] = useState<FocusActivity | null>(null);

  // Timer states (10 minutes = 600 seconds)
  const [timeLeft, setTimeLeft] = useState<number>(180);
  const [isActive, setIsActive] = useState<boolean>(false);

  // Auto-run timer
  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
      handleFinishExercise();
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const handleSelectActivity = (activity: FocusActivity) => {
    setSelectedActivity(activity);
    setStep('proposal');
  };

  const handleStartTimer = () => {
    setTimeLeft(180); // 10 minutes
    setIsActive(true);
    setStep('timer');
  };

  const handleToggleTimer = () => {
    setIsActive(!isActive);
  };

  const handleResetTimer = () => {
    setIsActive(false);
    setTimeLeft(180);
  };

  const handleFinishExercise = () => {
    setIsActive(false);
    onAddXp(40); // 40 XP reward for a 10 min exercise
    setStep('completed');
  };

  const handleGoBack = () => {
    if (step === 'proposal') {
      setStep('choice');
    } else if (step === 'timer') {
     if (confirm(t("confirmInterruptFocus"))) {
        setIsActive(false);
        setStep('choice');
      }
    } else {
      setStep('choice');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Circular progress calculated for 10 minutes (600s)
  const progressPercent = ((180 - timeLeft) / 180) * 100;

  return (
    <div className="bg-white border border-[#E5A88B]/15 rounded-[32px] p-6 shadow-sm space-y-4">
      {/* Header of Section */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-sm font-black text-[#4E3B36] flex items-center gap-1.5 font-display uppercase tracking-wider">
           <Sparkles size={15} className="text-[#E5A88B]" /> {t("mindFocus")}
          </h3>
          <p className="text-xs text-slate-500 font-semibold leading-relaxed">
           {t("focusSuggestion")}
          </p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 'choice' && (
          <motion.div
            key="choice"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            <p className="text-xs font-bold text-[#4E3B36] bg-[#FFF0E8]/50 px-3.5 py-2 rounded-xl border border-[#E5A88B]/10">
             🤔 {t("chooseFocusActivity")}
            </p>

            <div className="grid grid-cols-1 gap-2">
             {ACTIVITIES(t).map(act => (
                <button
                  key={act.id}
                  onClick={() => handleSelectActivity(act)}
                  className="w-full p-3.5 bg-white hover:bg-[#FFF0E8]/30 border border-slate-100 hover:border-[#E5A88B]/30 rounded-2xl transition-all flex items-center justify-between group cursor-pointer text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="p-2 bg-[#FFF0E8] text-[#C97B5E] rounded-xl flex items-center justify-center shrink-0">
                      {act.icon}
                    </span>
                    <div>
                      <h4 className="text-xs font-black text-[#4E3B36] flex items-center gap-1">
                        <span>{act.emoji}</span> {act.title}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-semibold line-clamp-1 mt-0.5">
                        {act.description}
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-[#C97B5E] group-hover:translate-x-0.5 transition-transform shrink-0" />
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {step === 'proposal' && selectedActivity && (
          <motion.div
            key="proposal"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="space-y-4"
          >
            <div className="border border-[#E5A88B]/20 rounded-2xl p-4 bg-[#FFF0E8]/30 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{selectedActivity.emoji}</span>
                <div>
                  <h4 className="text-xs font-extrabold uppercase tracking-widest text-[#C97B5E] font-display">{t("recommendedExercise")}</h4>
                  <h3 className="text-sm font-black text-[#4E3B36] font-display">{selectedActivity.exerciseTitle}</h3>
                </div>
              </div>

              <p className="text-xs text-[#4E3B36] leading-relaxed font-semibold">
                {selectedActivity.exerciseDesc}
              </p>

              <div className="flex items-start gap-2 pt-2 border-t border-[#E5A88B]/10 text-[10px] font-semibold text-slate-500">
                <Lightbulb size={13} className="text-[#C97B5E] shrink-0 mt-0.5 animate-pulse" />
                <p className="leading-relaxed">
                 <strong>{t("successTip")}:</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={handleGoBack}
                className="px-4 py-3 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                {t("back")}
              </button>
              <button
                onClick={handleStartTimer}
                className="flex-1 py-3 bg-[#C97B5E] hover:bg-[#B56A4F] text-white rounded-xl font-extrabold text-xs uppercase tracking-wider font-display transition-all shadow-md shadow-[#C97B5E]/15 flex items-center justify-center gap-1.5 cursor-pointer"
              >
               <Clock size={14} /> {t("startExerciseTimed")}
              </button>
            </div>
          </motion.div>
        )}

        {step === 'timer' && selectedActivity && (
          <motion.div
            key="timer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center text-center space-y-4"
          >
            <div className="space-y-1">
              <span className="text-[9px] font-extrabold text-[#C97B5E] uppercase tracking-widest bg-[#E5A88B]/10 px-2.5 py-0.5 rounded-lg font-display">
               {t("activeFocus")}: {selectedActivity.title}
              </span>
              <h4 className="text-xs font-bold text-[#4E3B36] max-w-xs leading-relaxed">
               {t("putPhoneAway")}
              </h4>
            </div>

            {/* Circular SVG Timer */}
            <div className="relative flex items-center justify-center w-40 h-40">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  className="text-[#FFF0E8] stroke-current"
                  strokeWidth="8"
                  fill="transparent"
                />
                <motion.circle
                  cx="80"
                  cy="80"
                  r="70"
                  className="text-[#C97B5E] stroke-current"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray="440"
                  strokeDashoffset={440 - (440 * progressPercent) / 100}
                  strokeLinecap="round"
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-2xl font-mono font-black text-[#4E3B36] tracking-tight">
                  {formatTime(timeLeft)}
                </span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 font-display">
                 {isActive ? t("focusing") : t("paused")}
                </span>
              </div>
            </div>

            {/* Timer Actions */}
            <div className="flex items-center gap-2 w-full max-w-xs">
              <button
                onClick={handleResetTimer}
                className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-xl border border-slate-100 transition-all cursor-pointer"
               title={t("restart")}
              >
                <RotateCcw size={15} />
              </button>

              <button
                onClick={handleToggleTimer}
                className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-wider font-display shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-amber-500 hover:bg-amber-600 text-white'
                    : 'bg-[#C97B5E] hover:bg-[#B56A4F] text-white'
                }`}
              >
                {isActive ? (
                  <>
                   <Pause size={14} /> {t("pause")}
                  </>
                ) : (
                  <>
                    <Play size={14} /> Retomar
                  </>
                )}
              </button>

              {/* Instant Test Completion Shortcut */}
              <button
                onClick={handleFinishExercise}
                className="px-3 py-3 bg-[#E5A88B]/10 hover:bg-[#E5A88B]/20 text-[#C97B5E] border border-[#E5A88B]/20 rounded-xl text-[10px] font-black uppercase tracking-wider font-display transition-all cursor-pointer"
               title={t("finishEarly")}
              >
               {t("finishNow")}
              </button>
            </div>

            <button
              onClick={handleGoBack}
              className="text-[10px] font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              &larr; {t("abandonExercise")}
            </button>
          </motion.div>
        )}

        {step === 'completed' && selectedActivity && (
          <motion.div
            key="completed"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-2 space-y-4"
          >
            <div className="w-14 h-14 bg-[#E5A88B]/15 text-[#C97B5E] rounded-full flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle size={28} className="animate-bounce" />
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-black text-[#4E3B36] font-display">{t("excellentFocus")}</h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto font-semibold">
               {t("focusBenefit")}
              </p>
            </div>

            <div className="bg-[#FFF0E8]/80 border border-[#E5A88B]/20 rounded-2xl p-4 text-left">
              <h4 className="text-[10px] font-black text-[#C97B5E] uppercase tracking-wider mb-1 flex items-center gap-1.5 font-display">
               <Sparkles size={13} /> {t("companionStrengthened")}
              </h4>
              <p className="text-xs text-[#4E3B36] leading-relaxed font-semibold">
              {t("mindFocusCompleted")} <strong className="text-[#C97B5E]">+40 XP</strong> {t("evolutionProgress")}
              </p>
            </div>

            <button
              onClick={() => setStep('choice')}
              className="w-full py-3 bg-[#C97B5E] hover:bg-[#B56A4F] text-white rounded-xl font-extrabold text-xs uppercase tracking-wider font-display transition-all shadow-md cursor-pointer"
            >
              {t("focusAnother")}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
