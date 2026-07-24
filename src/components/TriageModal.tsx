import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { X, ArrowRight, CheckCircle, Eye, Hand, Ear, Sparkles, Smile, Wind, Droplets, Sun, Globe } from 'lucide-react';

interface TriageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddXp: (amount: number) => void;
}

type BranchType = 'initial' | 'terra' | 'vento' | 'agua' | 'sol';

export const TriageModal: React.FC<TriageModalProps> = ({ isOpen, onClose, onAddXp }) => {
const { t } = useTranslation();
  const [currentBranch, setCurrentBranch] = useState<BranchType>('initial');
  const [branchStep, setBranchStep] = useState(0); // 0 = intro/interactive, 1 = affirmation/closing
  const [selectedPhysicalSymptom, setSelectedPhysicalSymptom] = useState<string | null>(null);

  // Terra State
  const [terraSee, setTerraSee] = useState('');
  const [terraTouch, setTerraTouch] = useState('');
  const [terraHear, setTerraHear] = useState('');

  // Vento State
  const [breathState, setBreathState] = useState<'Inalar' | 'Segurar' | 'Exalar' | 'Pausar Vazio'>('Inalar');
  const [breathCounter, setBreathCounter] = useState(4);

  // Agua State
  const [waterSplashed, setWaterSplashed] = useState(false);
  const [waterSip, setWaterSip] = useState(false);

  // Sol State
  const [solStep, setSolStep] = useState(1); // 1 = maxilar, 2 = ombros, 3 = maos

  const [triageCompleted, setTriageCompleted] = useState(false);

  // Reset states on close
  const handleReset = () => {
    setCurrentBranch('initial');
    setBranchStep(0);
    setSelectedPhysicalSymptom(null);
    setTerraSee('');
    setTerraTouch('');
    setTerraHear('');
    setWaterSplashed(false);
    setWaterSip(false);
    setSolStep(1);
    setTriageCompleted(false);
    onClose();
  };

  // Breathing loop for Vento branch
  useEffect(() => {
    if (!isOpen || currentBranch !== 'vento' || branchStep !== 0) return;

    const interval = setInterval(() => {
      setBreathCounter(prev => {
        if (prev <= 1) {
          if (breathState === 'Inalar') {
            setBreathState('Segurar');
            return 4;
          } else if (breathState === 'Segurar') {
            setBreathState('Exalar');
            return 4;
          } else if (breathState === 'Exalar') {
            setBreathState('Pausar Vazio');
            return 4;
          } else {
            setBreathState('Inalar');
            return 4;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, currentBranch, branchStep, breathState]);

  if (!isOpen) return null;

  const handleSelectBranch = (branch: BranchType) => {
    setCurrentBranch(branch);
    setBranchStep(0);
    if (branch === 'vento') {
      setBreathState('Inalar');
      setBreathCounter(4);
    }
  };

  const handleNextStep = () => {
    if (branchStep === 0) {
      setBranchStep(1);
    } else {
      // Award reward XP
      onAddXp(25);
      setTriageCompleted(true);
    }
  };

  const handleBackStep = () => {
    if (branchStep > 0) {
      setBranchStep(0);
    } else {
      setCurrentBranch('initial');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#4E3B36]/60 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md overflow-hidden bg-white rounded-3xl shadow-2xl border border-[#E5A88B]/15 flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-gradient-to-r from-[#E5A88B]/10 to-[#FFF0E8]/10">
            <div className="flex items-center gap-2.5">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#E5A88B]/15 text-sm">
                🌿
              </span>
              <div>
                <h2 className="text-sm font-black text-[#4E3B36] font-display">{t("naturalSupportMenu")}</h2>
                <p className="text-[9px] text-[#C97B5E] font-extrabold tracking-widest uppercase font-display">{t("guidedAnxietyRescue")}</p>
              </div>
            </div>
            <button
              onClick={handleReset}
              className="p-1.5 rounded-full text-slate-400 hover:text-[#4E3B36] hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Dynamic Progress indicator */}
          {!triageCompleted && currentBranch !== 'initial' && (
            <div className="flex w-full h-1.5 bg-slate-100">
              <div className={`h-full transition-all duration-300 ${branchStep === 0 ? 'w-1/2' : 'w-full'} bg-[#C97B5E]`} />
            </div>
          )}

          {/* Content Body */}
          <div className="flex-1 overflow-y-auto p-6">
            <AnimatePresence mode="wait">
              {triageCompleted ? (
                <motion.div
                  key="completed"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center text-center py-4 space-y-4"
                >
                  <div className="w-16 h-16 bg-[#E5A88B]/15 text-[#C97B5E] rounded-full flex items-center justify-center shadow-sm">
                    <CheckCircle size={36} className="animate-bounce" />
                  </div>
                  <h3 className="text-lg font-black text-[#4E3B36] font-display">{t("moodRestored")}</h3>
                  <p className="text-xs text-slate-500 max-w-xs leading-relaxed font-semibold">
                   {t("groundingSuccessMessage")}
                  </p>
                  <div className="bg-[#E5A88B]/10 border border-[#E5A88B]/20 rounded-[24px] p-5 w-full text-left">
                    <h4 className="text-xs font-black text-[#C97B5E] uppercase tracking-wider mb-1 flex items-center gap-1.5 font-display">
                     <Sparkles size={14} /> {t("companionEvolution")}
                    </h4>
                    <p className="text-xs text-[#4E3B36] leading-relaxed font-semibold">
                     {t("friendConnectionReward")} <strong className="text-[#C97B5E]">+25 XP</strong> {t("evolutionProgress")}
                    </p>
                  </div>
                  <button
                    onClick={handleReset}
                    className="w-full py-4 bg-[#C97B5E] hover:bg-[#B56A4F] text-white rounded-2xl font-black text-xs uppercase tracking-wider font-display transition-all shadow-lg shadow-[#C97B5E]/20 cursor-pointer"
                  >
                   {t("backToMainMenu")}
                  </button>
                </motion.div>
              ) : currentBranch === 'initial' ? (
                /* STEP 0: BRANCH SELECTION MENU */
                <motion.div
                  key="initial"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  <div className="space-y-1">
                    <span className="text-[9px] font-extrabold text-[#C97B5E] uppercase tracking-widest bg-[#E5A88B]/10 px-2.5 py-1 rounded-lg font-display">
                     {t("choicePhase")}
                    </span>
                    <h3 className="text-base font-black text-[#4E3B36] font-display">
                     {t("crisisQuestion")}
                    </h3>
                    <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                     {t("choiceDescription")}
                    </p>
                  </div>

                  {/* Branch Menu Options */}
                  <div className="space-y-2.5 pt-1">
                    <button
                      onClick={() => handleSelectBranch('terra')}
                      className="w-full p-4 bg-white hover:bg-[#FFF0E8]/30 border border-[#E5A88B]/15 hover:border-[#E5A88B]/40 rounded-2xl transition-all flex items-start gap-3.5 text-left group cursor-pointer"
                    >
                      <span className="p-2.5 bg-[#FFF0E8] text-[#C97B5E] rounded-xl group-hover:scale-110 transition-transform">
                        <Globe size={18} />
                      </span>
                      <div>
                        <h4 className="text-xs font-black text-[#4E3B36]">{t("groundConnection")}</h4>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{t("groundingDescription")}</p>
                      </div>
                    </button>

                    <button
                      onClick={() => handleSelectBranch('vento')}
                      className="w-full p-4 bg-white hover:bg-[#FFF0E8]/30 border border-[#E5A88B]/15 hover:border-[#E5A88B]/40 rounded-2xl transition-all flex items-start gap-3.5 text-left group cursor-pointer"
                    >
                      <span className="p-2.5 bg-[#FFF0E8] text-[#C97B5E] rounded-xl group-hover:scale-110 transition-transform">
                        <Wind size={18} />
                      </span>
                      <div>
                        <h4 className="text-xs font-black text-[#4E3B36]">{t("windBreath")}</h4>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{t("boxBreathingDescription")}.</p>
                      </div>
                    </button>

                    <button
                      onClick={() => handleSelectBranch('agua')}
                      className="w-full p-4 bg-white hover:bg-[#FFF0E8]/30 border border-[#E5A88B]/15 hover:border-[#E5A88B]/40 rounded-2xl transition-all flex items-start gap-3.5 text-left group cursor-pointer"
                    >
                      <span className="p-2.5 bg-[#FFF0E8] text-[#C97B5E] rounded-xl group-hover:scale-110 transition-transform">
                        <Droplets size={18} />
                      </span>
                      <div>
                        <h4 className="text-xs font-black text-[#4E3B36]">{t("coldWaterFlow")}</h4>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{t("coldWaterDescription")}</p>
                      </div>
                    </button>

                    <button
                      onClick={() => handleSelectBranch('sol')}
                      className="w-full p-4 bg-white hover:bg-[#FFF0E8]/30 border border-[#E5A88B]/15 hover:border-[#E5A88B]/40 rounded-2xl transition-all flex items-start gap-3.5 text-left group cursor-pointer"
                    >
                      <span className="p-2.5 bg-[#FFF0E8] text-[#C97B5E] rounded-xl group-hover:scale-110 transition-transform">
                        <Sun size={18} />
                      </span>
                      <div>
                        <h4 className="text-xs font-black text-[#4E3B36]">{t("sunWarmth")}</h4>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{t("sunRelaxationDescription")}</p>
                      </div>
                    </button>
                  </div>
                </motion.div>
              ) : currentBranch === 'terra' ? (
                /* BRANCH 1: TERRA */
                <motion.div key="terra" initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                  {branchStep === 0 ? (
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <span className="text-[9px] font-extrabold text-[#C97B5E] uppercase tracking-widest bg-[#E5A88B]/10 px-2.5 py-0.5 rounded-lg font-display">
                      🌿 {t("step")} 1 {t("of")} 2
                        </span>
                        <h3 className="text-base font-black text-[#4E3B36] font-display">{t("earthGrounding")}</h3>
                        <p className="text-xs text-slate-500 font-medium">
                         {t("earthDescription")}
                        </p>
                      </div>

                      <div className="bg-[#FAF5F0] border border-[#E5A88B]/15 rounded-2xl p-4.5 space-y-3">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-[#4E3B36] flex items-center gap-1.5">
                           <Eye size={13} className="text-[#C97B5E]" /> 1. {t("earthSeeQuestion")}
                          </label>
                          <input
                            type="text"
                           placeholder={t("earthExample")}
                            value={terraSee}
                            onChange={(e) => setTerraSee(e.target.value)}
                            className="w-full px-3 py-2 text-xs border border-slate-200/80 rounded-xl bg-white focus:outline-none focus:border-[#E5A88B] text-[#4E3B36]"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-[#4E3B36] flex items-center gap-1.5">
                           <Hand size={13} className="text-[#C97B5E]" /> 2. {t("earthTouchQuestion")}
                          </label>
                          <input
                            type="text"
                           placeholder={t("touchExample")}
                            value={terraTouch}
                            onChange={(e) => setTerraTouch(e.target.value)}
                            className="w-full px-3 py-2 text-xs border border-slate-200/80 rounded-xl bg-white focus:outline-none focus:border-[#E5A88B] text-[#4E3B36]"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-[#4E3B36] flex items-center gap-1.5">
                           <Ear size={13} className="text-[#C97B5E]" /> 3. {t("earthHearQuestion")}
                          </label>
                          <input
                            type="text"
                           placeholder={t("soundExample")}
                            value={terraHear}
                            onChange={(e) => setTerraHear(e.target.value)}
                            className="w-full px-3 py-2 text-xs border border-slate-200/80 rounded-xl bg-white focus:outline-none focus:border-[#E5A88B] text-[#4E3B36]"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <span className="text-[9px] font-extrabold text-[#C97B5E] uppercase tracking-widest bg-[#E5A88B]/10 px-2.5 py-0.5 rounded-lg font-display">
                         🌿 {t("step")} 2 {t("of")} 2
                        </span>
                        <h3 className="text-base font-black text-[#4E3B36] font-display">{t("rootStrength")}</h3>
                      </div>

                      <div className="bg-[#FFF0E8]/50 border border-[#E5A88B]/20 rounded-[24px] p-5 text-center space-y-3 shadow-inner">
                        <p className="text-sm font-semibold italic text-[#4E3B36] leading-relaxed">
                         {t("treeGroundingText")}
                        </p>
                        <span className="inline-block text-[10px] font-bold text-[#C97B5E] bg-white px-3 py-1 rounded-full border border-[#E5A88B]/15">
                         {t("feetGrounded")}
                        </span>
                      </div>
                    </div>
                  )}
                </motion.div>
              ) : currentBranch === 'vento' ? (
                /* BRANCH 2: VENTO (BREATHING) */
                <motion.div key="vento" initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                  {branchStep === 0 ? (
                    <div className="flex flex-col items-center space-y-4">
                      <div className="text-center space-y-1">
                        <span className="text-[9px] font-extrabold text-[#C97B5E] uppercase tracking-widest bg-[#E5A88B]/10 px-2.5 py-0.5 rounded-lg font-display">
                         💨 {t("step")} 1 {t("of")} 2
                        </span>
                        <h3 className="text-base font-black text-[#4E3B36] font-display">{t("breezeBreathing")}</h3>
                        <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed font-semibold">
                         {t("windBreathingIntro")}
                        </p>
                      </div>

                      <div className="relative flex items-center justify-center w-40 h-40">
                        {/* Soft background aura */}
                        <motion.div
                          animate={{
                            scale: (breathState === 'Inalar' || breathState === 'Segurar') ? 1.35 : 0.95,
                            opacity: (breathState === 'Inalar' || breathState === 'Segurar') ? 0.35 : 0.15,
                          }}
                          transition={{
                            duration: 4,
                            ease: "easeInOut",
                          }}
                          className="absolute inset-0 bg-[#E5A88B]/25 rounded-full blur-md"
                        />

                        {/* Interactive Circle */}
                        <div className="z-10 w-28 h-28 bg-white border-4 border-[#E5A88B] rounded-full flex flex-col items-center justify-center text-center shadow-md">
                          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#C97B5E] font-display">
{breathState === "Inalar" && t("inhale")}
{breathState === "Segurar" && t("hold")}
{breathState === "Exalar" && t("exhale")}
{breathState === "Pausar Vazio" && t("pauseEmpty")}                           

                          </span>
                          <span className="text-2xl font-mono font-black text-[#4E3B36]">
                            {breathCounter}s
                          </span>
                        </div>
                      </div>

                      <p className="text-[11px] font-bold text-center text-slate-500 max-w-xs leading-relaxed">
{breathState === 'Inalar' && t("windInhale")}
{breathState === 'Segurar' && t("windHold")}
{breathState === 'Exalar' && t("windExhale")}
                       {breathState === 'Pausar Vazio' && t("holdBreathMessage")}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <span className="text-[9px] font-extrabold text-[#C97B5E] uppercase tracking-widest bg-[#E5A88B]/10 px-2.5 py-0.5 rounded-lg font-display">
                          💨 {t("step")} 2 {t("of")} 2
                        </span>
                        <h3 className="text-base font-black text-[#4E3B36] font-display">{t("liberatingSigh")}</h3>
                      </div>

                      <div className="bg-[#FFF0E8]/50 border border-[#E5A88B]/20 rounded-[24px] p-5 text-center space-y-3.5 shadow-inner">
                        <p className="text-sm font-semibold italic text-[#4E3B36] leading-relaxed">
                         {t("breathingExplanation")}
                        </p>
                        <div className="p-3 bg-white border border-[#E5A88B]/15 rounded-xl text-[10px] text-slate-500 font-bold leading-relaxed">
                         {t("sighInstruction")}
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              ) : currentBranch === 'agua' ? (
                /* BRANCH 3: AGUA */
                <motion.div key="agua" initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                  {branchStep === 0 ? (
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <span className="text-[9px] font-extrabold text-[#C97B5E] uppercase tracking-widest bg-[#E5A88B]/10 px-2.5 py-0.5 rounded-lg font-display">
                          💨 {t("step")} 1 {t("of")} 2
                        </span>
                        <h3 className="text-base font-black text-[#4E3B36] font-display">{t("waterPower")}</h3>
                        <p className="text-xs text-slate-500 font-medium">
                         {t("waterExplanation")}
                        </p>
                      </div>

                      <div className="space-y-2.5 pt-1">
                        <button
                          onClick={() => setWaterSplashed(!waterSplashed)}
                          className={`w-full p-4 border rounded-2xl flex items-center justify-between text-left transition-all cursor-pointer ${
                            waterSplashed
                              ? 'border-[#E5A88B] bg-[#FFF0E8]/40 text-[#4E3B36]'
                              : 'border-slate-100 hover:border-slate-200 text-slate-500 bg-slate-50/50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-lg">💧</span>
                            <span className="text-xs font-bold">{t("coldWaterActionFace")}</span>
                          </div>
                          <span className={`w-5 h-5 rounded-md border flex items-center justify-center text-xs font-bold ${
                            waterSplashed ? 'bg-[#C97B5E] border-[#C97B5E] text-white' : 'border-slate-300'
                          }`}>
                            {waterSplashed ? '✓' : ''}
                          </span>
                        </button>

                        <button
                          onClick={() => setWaterSip(!waterSip)}
                          className={`w-full p-4 border rounded-2xl flex items-center justify-between text-left transition-all cursor-pointer ${
                            waterSip
                              ? 'border-[#E5A88B] bg-[#FFF0E8]/40 text-[#4E3B36]'
                              : 'border-slate-100 hover:border-slate-200 text-slate-500 bg-slate-50/50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-lg">🥤</span>
                            <span className="text-xs font-bold">{t("coldWaterActionDrink")}</span>
                          </div>
                          <span className={`w-5 h-5 rounded-md border flex items-center justify-center text-xs font-bold ${
                            waterSip ? 'bg-[#C97B5E] border-[#C97B5E] text-white' : 'border-slate-300'
                          }`}>
                            {waterSip ? '✓' : ''}
                          </span>
                        </button>
                      </div>

                      <p className="text-[10px] text-[#C97B5E] text-center font-bold">
                       {t("waterTip")}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <span className="text-[9px] font-extrabold text-[#C97B5E] uppercase tracking-widest bg-[#E5A88B]/10 px-2.5 py-0.5 rounded-lg font-display">
                          💨 {t("step")} 2 {t("of")} 2
                        </span>
                        <h3 className="text-base font-black text-[#4E3B36] font-display">{t("followFlow")}</h3>
                      </div>

                      <div className="bg-[#FFF0E8]/50 border border-[#E5A88B]/20 rounded-[24px] p-5 text-center space-y-3 shadow-inner">
                        <p className="text-sm font-semibold italic text-[#4E3B36] leading-relaxed">
                         {t("riverMetaphor")}
                        </p>
                        <span className="inline-block text-[10px] font-bold text-[#C97B5E] bg-white px-3 py-1 rounded-full border border-[#E5A88B]/15">
                         {t("acceptPresent")}
                        </span>
                      </div>
                    </div>
                  )}
                </motion.div>
              ) : (
                /* BRANCH 4: SOL */
                <motion.div key="sol" initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                  {branchStep === 0 ? (
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <span className="text-[9px] font-extrabold text-[#C97B5E] uppercase tracking-widest bg-[#E5A88B]/10 px-2.5 py-0.5 rounded-lg font-display">
                         💨 {t("step")} 1 {t("of")} 2
                        </span>
                        <h3 className="text-base font-black text-[#4E3B36] font-display">{t("warmRelease")}</h3>
                        <p className="text-xs text-slate-500 font-medium">
                         {t("sunExplanation")}
                        </p>
                      </div>

                      <div className="space-y-3">
                        <div className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                          solStep === 1 ? 'border-[#E5A88B] bg-[#FFF0E8]/25' : 'border-slate-100 bg-[#FAF5F0]'
                        }`}>
                          <div className="space-y-0.5">
                            <span className="text-[10px] font-bold text-[#C97B5E] uppercase tracking-wider">{t("zoneJaw")}</span>
                            <p className="text-xs font-bold text-[#4E3B36]">{t("jawInstruction")}</p>
                          </div>
                          {solStep === 1 ? (
                            <button
                              onClick={() => setSolStep(2)}
                              className="text-[10px] font-extrabold bg-[#E5A88B] text-white px-3 py-1.5 rounded-lg font-display cursor-pointer"
                            >
                             {t("done")} &rarr;
                            </button>
                          ) : (
                            <span className="text-xs text-[#C97B5E]">✓</span>
                          )}
                        </div>

                        <div className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                          solStep === 2 ? 'border-[#E5A88B] bg-[#FFF0E8]/25' : 'border-slate-100 bg-[#FAF5F0]'
                        }`}>
                          <div className="space-y-0.5">
                            <span className="text-[10px] font-bold text-[#C97B5E] uppercase tracking-wider">{t("zoneShoulders")}</span>
                            <p className="text-xs font-bold text-[#4E3B36]">{t("shouldersInstruction")}</p>
                          </div>
                          {solStep === 2 ? (
                            <button
                              onClick={() => setSolStep(3)}
                              className="text-[10px] font-extrabold bg-[#E5A88B] text-white px-3 py-1.5 rounded-lg font-display cursor-pointer"
                            >
                             {t("done")} &rarr;
                            </button>
                          ) : solStep > 2 ? (
                            <span className="text-xs text-[#C97B5E]">✓</span>
                          ) : (
                            <span className="text-xs text-slate-300">-</span>
                          )}
                        </div>

                        <div className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                          solStep === 3 ? 'border-[#E5A88B] bg-[#FFF0E8]/25' : 'border-slate-100 bg-[#FAF5F0]'
                        }`}>
                          <div className="space-y-0.5">
                            <span className="text-[10px] font-bold text-[#C97B5E] uppercase tracking-wider">{t("zoneHands")}</span>
                            <p className="text-xs font-bold text-[#4E3B36]">{t("handsInstruction")}</p>
                          </div>
                          {solStep === 3 ? (
                            <button
                              onClick={() => setSolStep(4)}
                              className="text-[10px] font-extrabold bg-[#E5A88B] text-white px-3 py-1.5 rounded-lg font-display cursor-pointer"
                            >
                             {t("done")}
                            </button>
                          ) : solStep > 3 ? (
                            <span className="text-xs text-[#C97B5E]">✓</span>
                          ) : (
                            <span className="text-xs text-slate-300">-</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <span className="text-[9px] font-extrabold text-[#C97B5E] uppercase tracking-widest bg-[#E5A88B]/10 px-2.5 py-0.5 rounded-lg font-display">
                         💨 {t("step")} 2 {t("of")} 2
                        </span>
                        <h3 className="text-base font-black text-[#4E3B36] font-display">{t("lightnessPresence")}</h3>
                      </div>

                      <div className="bg-[#FFF0E8]/50 border border-[#E5A88B]/20 rounded-[24px] p-5 text-center space-y-3 shadow-inner">
                        <p className="text-sm font-semibold italic text-[#4E3B36] leading-relaxed">
                         {t("warmthMetaphor")}
                        </p>
                        <span className="inline-block text-[10px] font-bold text-[#C97B5E] bg-white px-3 py-1 rounded-full border border-[#E5A88B]/15">
                         {t("feelChestWarmth")}
                        </span>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer Navigation Controls */}
          {!triageCompleted && (
            <div className="p-5 border-t border-slate-100 bg-[#FAF5F0]/60 flex items-center justify-between">
              <button
                onClick={handleBackStep}
                className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:text-[#4E3B36] transition-colors cursor-pointer"
              >
               {currentBranch === 'initial' ? t("cancel") : t("previous")}
              </button>

              {currentBranch !== 'initial' && (
                <button
                  onClick={handleNextStep}
                  disabled={
                    (currentBranch === 'terra' && branchStep === 0 && (!terraSee || !terraTouch || !terraHear)) ||
                    (currentBranch === 'agua' && branchStep === 0 && (!waterSplashed && !waterSip)) ||
                    (currentBranch === 'sol' && branchStep === 0 && solStep < 4)
                  }
                  className={`px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider font-display flex items-center gap-1.5 transition-all cursor-pointer ${
                    ((currentBranch === 'terra' && branchStep === 0 && (!terraSee || !terraTouch || !terraHear)) ||
                     (currentBranch === 'agua' && branchStep === 0 && (!waterSplashed && !waterSip)) ||
                     (currentBranch === 'sol' && branchStep === 0 && solStep < 4))
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300/30'
                      : 'bg-[#C97B5E] hover:bg-[#B56A4F] text-white shadow-md shadow-[#C97B5E]/15'
                  }`}
                >
                {branchStep === 1 ? t("complete") : t("next")}
                  <ArrowRight size={14} />
                </button>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
