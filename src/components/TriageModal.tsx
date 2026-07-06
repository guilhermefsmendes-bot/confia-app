import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ArrowRight, CheckCircle, Eye, Hand, Ear, Sparkles, Smile, Wind, Droplets, Sun, Globe } from 'lucide-react';

interface TriageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddXp: (amount: number) => void;
}

type BranchType = 'initial' | 'terra' | 'vento' | 'agua' | 'sol';

export const TriageModal: React.FC<TriageModalProps> = ({ isOpen, onClose, onAddXp }) => {
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
                <h2 className="text-sm font-black text-[#4E3B36] font-display">Menu de Apoio Natural</h2>
                <p className="text-[9px] text-[#C97B5E] font-extrabold tracking-widest uppercase font-display">Resgate Guiado para a Ansiedade</p>
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
                  <h3 className="text-lg font-black text-[#4E3B36] font-display">Humor Restabelecido!</h3>
                  <p className="text-xs text-slate-500 max-w-xs leading-relaxed font-semibold">
                    A ansiedade é uma reação natural que diminui quando nos conectamos com elementos simples e orgânicos. Fizeste um excelente trabalho a acalmar o teu corpo hoje.
                  </p>
                  <div className="bg-[#E5A88B]/10 border border-[#E5A88B]/20 rounded-[24px] p-5 w-full text-left">
                    <h4 className="text-xs font-black text-[#C97B5E] uppercase tracking-wider mb-1 flex items-center gap-1.5 font-display">
                      <Sparkles size={14} /> Evolução Amigo
                    </h4>
                    <p className="text-xs text-[#4E3B36] leading-relaxed font-semibold">
                      O teu amigo sentiu o teu esforço de conexão e ganhou <strong className="text-[#C97B5E]">+25 XP</strong> de evolução!
                    </p>
                  </div>
                  <button
                    onClick={handleReset}
                    className="w-full py-4 bg-[#C97B5E] hover:bg-[#B56A4F] text-white rounded-2xl font-black text-xs uppercase tracking-wider font-display transition-all shadow-lg shadow-[#C97B5E]/20 cursor-pointer"
                  >
                    Voltar ao Menu Principal
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
                      Fase de Escolha
                    </span>
                    <h3 className="text-base font-black text-[#4E3B36] font-display">
                      Sentes a ansiedade a subir?
                    </h3>
                    <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                      Não lutes contra a sensação. Vamos escolher um caminho natural e orgânico para te ancorar suavemente ao presente:
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
                        <h4 className="text-xs font-black text-[#4E3B36]">🌿 Conexão com a Terra</h4>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Ancoragem sensorial 5-3-1 focada em elementos naturais ao teu redor.</p>
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
                        <h4 className="text-xs font-black text-[#4E3B36]">💨 O Sopro do Vento</h4>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Respiração quadrada rítmica para oxigenar e abrandar os batimentos cardíacos.</p>
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
                        <h4 className="text-xs font-black text-[#4E3B36]">💧 O Fluxo da Água Fria</h4>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Ativação do reflexo vagal com o poder calmante fisiológico do frio.</p>
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
                        <h4 className="text-xs font-black text-[#4E3B36]">🌞 O Calor do Sol</h4>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Relaxamento muscular progressivo simulando o calor reconfortante da luz solar.</p>
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
                          🌿 Passo 1 de 2
                        </span>
                        <h3 className="text-base font-black text-[#4E3B36] font-display">Ancoragem à Terra</h3>
                        <p className="text-xs text-slate-500 font-medium">
                          A ansiedade cria pensamentos rápidos. Vamos forçar a mente a conectar-se com o espaço físico real e natural ao teu redor:
                        </p>
                      </div>

                      <div className="bg-[#FAF5F0] border border-[#E5A88B]/15 rounded-2xl p-4.5 space-y-3">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-[#4E3B36] flex items-center gap-1.5">
                            <Eye size={13} className="text-[#C97B5E]" /> 1. Vês algo verde ou orgânico à tua volta?
                          </label>
                          <input
                            type="text"
                            placeholder="Ex: Uma planta, a luz do sol, o céu, uma flor..."
                            value={terraSee}
                            onChange={(e) => setTerraSee(e.target.value)}
                            className="w-full px-3 py-2 text-xs border border-slate-200/80 rounded-xl bg-white focus:outline-none focus:border-[#E5A88B] text-[#4E3B36]"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-[#4E3B36] flex items-center gap-1.5">
                            <Hand size={13} className="text-[#C97B5E]" /> 2. Toca numa textura natural que consigas alcançar
                          </label>
                          <input
                            type="text"
                            placeholder="Ex: Mesa de madeira, tecido da tua roupa, a tua pele..."
                            value={terraTouch}
                            onChange={(e) => setTerraTouch(e.target.value)}
                            className="w-full px-3 py-2 text-xs border border-slate-200/80 rounded-xl bg-white focus:outline-none focus:border-[#E5A88B] text-[#4E3B36]"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-[#4E3B36] flex items-center gap-1.5">
                            <Ear size={13} className="text-[#C97B5E]" /> 3. Tenta focar-te e ouvir um som no ambiente
                          </label>
                          <input
                            type="text"
                            placeholder="Ex: Vento lá fora, o teu batimento, respiração, silêncio..."
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
                          🌿 Passo 2 de 2
                        </span>
                        <h3 className="text-base font-black text-[#4E3B36] font-display">Firmeza de Raízes</h3>
                      </div>

                      <div className="bg-[#FFF0E8]/50 border border-[#E5A88B]/20 rounded-[24px] p-5 text-center space-y-3 shadow-inner">
                        <p className="text-sm font-semibold italic text-[#4E3B36] leading-relaxed">
                          "Imagina o teu corpo como uma árvore forte, com raízes invisíveis e profundas ancoradas no chão. O vento sopra com força nas tuas folhas, mas o teu tronco mantém-se inabalável e firme. Deixa o vento passar... estás seguro."
                        </p>
                        <span className="inline-block text-[10px] font-bold text-[#C97B5E] bg-white px-3 py-1 rounded-full border border-[#E5A88B]/15">
                          Sente os pés bem assentes no chão
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
                          💨 Passo 1 de 2
                        </span>
                        <h3 className="text-base font-black text-[#4E3B36] font-display">Respiração Quadrada da Brisa</h3>
                        <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed font-semibold">
                          Vamos imitar o ritmo sereno e contínuo do vento para restaurar o equilíbrio interno. Foca-te no círculo abaixo:
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
                            {breathState}
                          </span>
                          <span className="text-2xl font-mono font-black text-[#4E3B36]">
                            {breathCounter}s
                          </span>
                        </div>
                      </div>

                      <p className="text-[11px] font-bold text-center text-slate-500 max-w-xs leading-relaxed">
                        {breathState === 'Inalar' && 'Puxa o ar lentamente pelo nariz imaginando uma brisa fresca...'}
                        {breathState === 'Segurar' && 'Mantém a frescura no teu peito, relaxa os ombros...'}
                        {breathState === 'Exalar' && 'Liberta o ar morno e toda a tensão pela boca...'}
                        {breathState === 'Pausar Vazio' && 'Aguarda um pouco sem ar, descontraindo a mente...'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <span className="text-[9px] font-extrabold text-[#C97B5E] uppercase tracking-widest bg-[#E5A88B]/10 px-2.5 py-0.5 rounded-lg font-display">
                          💨 Passo 2 de 2
                        </span>
                        <h3 className="text-base font-black text-[#4E3B36] font-display">Suspiro Libertador</h3>
                      </div>

                      <div className="bg-[#FFF0E8]/50 border border-[#E5A88B]/20 rounded-[24px] p-5 text-center space-y-3.5 shadow-inner">
                        <p className="text-sm font-semibold italic text-[#4E3B36] leading-relaxed">
                          "O oxigénio é o remédio natural mais rápido do corpo. Com esta respiração rítmica, deste indicação direta ao teu coração de que não há perigo. Tu comandas o teu ritmo."
                        </p>
                        <div className="p-3 bg-white border border-[#E5A88B]/15 rounded-xl text-[10px] text-slate-500 font-bold leading-relaxed">
                          Faz um último suspiro longo e barulhento pela boca... Solta tudo!
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
                          💧 Passo 1 de 2
                        </span>
                        <h3 className="text-base font-black text-[#4E3B36] font-display">O Poder Fisiológico da Água</h3>
                        <p className="text-xs text-slate-500 font-medium">
                          A água fria desencadeia o "Reflexo de Mergulho", ativando de forma automática os nervos reguladores que abrandam a frequência cardíaca. Tenta cumprir um destes gestos simples:
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
                            <span className="text-xs font-bold">Molhei o rosto ou pulsos com água fria</span>
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
                            <span className="text-xs font-bold">Bebi um copo de água fria devagar</span>
                          </div>
                          <span className={`w-5 h-5 rounded-md border flex items-center justify-center text-xs font-bold ${
                            waterSip ? 'bg-[#C97B5E] border-[#C97B5E] text-white' : 'border-slate-300'
                          }`}>
                            {waterSip ? '✓' : ''}
                          </span>
                        </button>
                      </div>

                      <p className="text-[10px] text-[#C97B5E] text-center font-bold">
                        Dica: Sentir o frio do gelo ou lavar as mãos também ajuda imenso!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <span className="text-[9px] font-extrabold text-[#C97B5E] uppercase tracking-widest bg-[#E5A88B]/10 px-2.5 py-0.5 rounded-lg font-display">
                          💧 Passo 2 de 2
                        </span>
                        <h3 className="text-base font-black text-[#4E3B36] font-display">Seguir o Fluxo</h3>
                      </div>

                      <div className="bg-[#FFF0E8]/50 border border-[#E5A88B]/20 rounded-[24px] p-5 text-center space-y-3 shadow-inner">
                        <p className="text-sm font-semibold italic text-[#4E3B36] leading-relaxed">
                          "A ansiedade funciona como um rio agitado. Não tentes travar o fluxo ou nadar contra a corrente, pois cansas-te. Limita-te a flutuar e a deixar que a corrente passe de largo. Logo a água voltará a ficar calma."
                        </p>
                        <span className="inline-block text-[10px] font-bold text-[#C97B5E] bg-white px-3 py-1 rounded-full border border-[#E5A88B]/15">
                          Aceita o momento presente
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
                          🌞 Passo 1 de 2
                        </span>
                        <h3 className="text-base font-black text-[#4E3B36] font-display">Aquecer e Derreter a Tensão</h3>
                        <p className="text-xs text-slate-500 font-medium">
                          A tensão física acumula-se sem darmos conta. Imagina uma luz solar morna a tocar no teu corpo e relaxa estas três áreas principais:
                        </p>
                      </div>

                      <div className="space-y-3">
                        <div className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                          solStep === 1 ? 'border-[#E5A88B] bg-[#FFF0E8]/25' : 'border-slate-100 bg-[#FAF5F0]'
                        }`}>
                          <div className="space-y-0.5">
                            <span className="text-[10px] font-bold text-[#C97B5E] uppercase tracking-wider">Zona 1: Maxilar</span>
                            <p className="text-xs font-bold text-[#4E3B36]">Entreabre os dentes e relaxa a boca.</p>
                          </div>
                          {solStep === 1 ? (
                            <button
                              onClick={() => setSolStep(2)}
                              className="text-[10px] font-extrabold bg-[#E5A88B] text-white px-3 py-1.5 rounded-lg font-display cursor-pointer"
                            >
                              Feito &rarr;
                            </button>
                          ) : (
                            <span className="text-xs text-[#C97B5E]">✓</span>
                          )}
                        </div>

                        <div className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                          solStep === 2 ? 'border-[#E5A88B] bg-[#FFF0E8]/25' : 'border-slate-100 bg-[#FAF5F0]'
                        }`}>
                          <div className="space-y-0.5">
                            <span className="text-[10px] font-bold text-[#C97B5E] uppercase tracking-wider">Zona 2: Ombros</span>
                            <p className="text-xs font-bold text-[#4E3B36]">Deixa cair os ombros longe das orelhas.</p>
                          </div>
                          {solStep === 2 ? (
                            <button
                              onClick={() => setSolStep(3)}
                              className="text-[10px] font-extrabold bg-[#E5A88B] text-white px-3 py-1.5 rounded-lg font-display cursor-pointer"
                            >
                              Feito &rarr;
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
                            <span className="text-[10px] font-bold text-[#C97B5E] uppercase tracking-wider">Zona 3: Mãos</span>
                            <p className="text-xs font-bold text-[#4E3B36]">Abre os dedos e deita-os sobre a perna.</p>
                          </div>
                          {solStep === 3 ? (
                            <button
                              onClick={() => setSolStep(4)}
                              className="text-[10px] font-extrabold bg-[#E5A88B] text-white px-3 py-1.5 rounded-lg font-display cursor-pointer"
                            >
                              Feito
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
                          🌞 Passo 2 de 2
                        </span>
                        <h3 className="text-base font-black text-[#4E3B36] font-display">Leveza e Presença</h3>
                      </div>

                      <div className="bg-[#FFF0E8]/50 border border-[#E5A88B]/20 rounded-[24px] p-5 text-center space-y-3 shadow-inner">
                        <p className="text-sm font-semibold italic text-[#4E3B36] leading-relaxed">
                          "Imagina que todo o teu corpo está a receber o calor suave de um dia de primavera. A tensão escorre como neve a derreter ao sol. Estás aqui, vivo, seguro, e em total calma."
                        </p>
                        <span className="inline-block text-[10px] font-bold text-[#C97B5E] bg-white px-3 py-1 rounded-full border border-[#E5A88B]/15">
                          Sente o calor no teu peito
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
                {currentBranch === 'initial' ? 'Cancelar' : 'Anterior'}
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
                  {branchStep === 1 ? 'Concluir' : 'Seguinte'}
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
