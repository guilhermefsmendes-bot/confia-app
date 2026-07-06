import React, { useState, useEffect } from 'react';
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

const ACTIVITIES: FocusActivity[] = [
  {
    id: 'ler',
    title: 'Ler um Livro ou Artigo',
    emoji: '📚',
    icon: <BookOpen size={18} />,
    description: 'Desliga as notificações e foca-te nas palavras de um texto físico ou digital.',
    exerciseTitle: 'Leitura Focada de 10 Minutos',
    exerciseDesc: 'Escolhe um capítulo ou texto que te interesse. Lê sem pressa, prestando atenção à forma como os teus olhos acompanham cada frase. Se a tua mente dispersar, volta suavemente ao texto.',
    tip: 'Lê de preferência em papel para reduzir o estímulo das luzes azuis e ecrãs.'
  },
  {
    id: 'escrever',
    title: 'Escrita Livre / Diário',
    emoji: '✍️',
    icon: <PenTool size={18} />,
    description: 'Liberta pensamentos acumulados transcrevendo-os livremente para o papel.',
    exerciseTitle: 'Fluxo de Consciência',
    exerciseDesc: 'Escreve tudo o que te vier à cabeça sem julgar, corrigir erros ou apagar. Pode ser uma lista de gratidão, as tuas preocupações atuais, ou apenas descrever o teu quarto.',
    tip: 'A escrita manual ajuda a abrandar a velocidade do pensamento ansioso.'
  },
  {
    id: 'desenhar',
    title: 'Desenhar ou Colorir',
    emoji: '🎨',
    icon: <Palette size={18} />,
    description: 'Usa formas, traços e cores para ancorar a tua atenção através da criatividade.',
    exerciseTitle: 'Rabiscos Conscientes',
    exerciseDesc: 'Pega num papel e caneta. Desenha formas geométricas repetidas, mandalas, ou tenta fazer um esboço de um objeto simples que esteja mesmo à tua frente (ex: uma caneca ou planta).',
    tip: 'Foca-te na sensação física do contacto do lápis com o papel.'
  },
  {
    id: 'organizar',
    title: 'Organizar Espaço ou Ficheiros',
    emoji: '📂',
    icon: <FolderSync size={18} />,
    description: 'Arrumar o exterior ajuda a trazer uma sensação instantânea de ordem interna.',
    exerciseTitle: 'Arrumação Seletiva de 10 Minutos',
    exerciseDesc: 'Escolhe um canto pequeno: organiza os ícones do teu ambiente de trabalho, limpa a tua pasta de transferências, apaga e-mails antigos, ou arruma a gaveta onde tens as canetas.',
    tip: 'Começa por um espaço pequeno. Pequenas ações criam grande paz mental.'
  },
  {
    id: 'artesanato',
    title: 'Trabalhos Manuais / Origami',
    emoji: '✂️',
    icon: <Scissors size={18} />,
    description: 'Sincroniza o cérebro com tarefas motoras finas e precisas.',
    exerciseTitle: 'Criação Manual Direcionada',
    exerciseDesc: 'Experimenta fazer um barquinho ou avião de papel simples, amarra pequenos nós, ou limpa minuciosamente um objeto pequeno. Sente a textura de cada dobra e a precisão do movimento.',
    tip: 'O toque físico e o esforço de precisão cortam o ciclo de ruminação mental.'
  },
  {
    id: 'plantas',
    title: 'Jardinagem ou Cuidado Ativo',
    emoji: '🌱',
    icon: <Sprout size={18} />,
    description: 'Interage com elementos naturais e seres vivos para desacelerar o ritmo.',
    exerciseTitle: 'Atenção às Plantas',
    exerciseDesc: 'Regula ou rega as tuas plantas, limpa o pó das folhas de uma planta doméstica com cuidado, ou separa sementes. Se não tiveres plantas, observa uma árvore pela janela prestando atenção aos detalhes.',
    tip: 'A biofilia (conexão com a natureza) reduz comprovadamente os níveis de cortisol.'
  }
];

export const FocoMente: React.FC<FocoMenteProps> = ({ onAddXp }) => {
  const [step, setStep] = useState<StepType>('choice');
  const [selectedActivity, setSelectedActivity] = useState<FocusActivity | null>(null);

  // Timer states (10 minutes = 600 seconds)
  const [timeLeft, setTimeLeft] = useState<number>(600);
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
    setTimeLeft(600); // 10 minutes
    setIsActive(true);
    setStep('timer');
  };

  const handleToggleTimer = () => {
    setIsActive(!isActive);
  };

  const handleResetTimer = () => {
    setIsActive(false);
    setTimeLeft(600);
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
      if (confirm('Tens a certeza que queres interromper o teu exercício de foco?')) {
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
  const progressPercent = ((600 - timeLeft) / 600) * 100;

  return (
    <div className="bg-white border border-[#E5A88B]/15 rounded-[32px] p-6 shadow-sm space-y-4">
      {/* Header of Section */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-sm font-black text-[#4E3B36] flex items-center gap-1.5 font-display uppercase tracking-wider">
            <Sparkles size={15} className="text-[#E5A88B]" /> Foco da Mente
          </h3>
          <p className="text-xs text-slate-500 font-semibold leading-relaxed">
            Sugerimos ferramentas de foco positivo para ocupar e acalmar os teus pensamentos.
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
              🤔 Escolhe uma atividade que gostas de fazer para te ajudar a focar:
            </p>

            <div className="grid grid-cols-1 gap-2">
              {ACTIVITIES.map(act => (
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
                  <h4 className="text-xs font-extrabold uppercase tracking-widest text-[#C97B5E] font-display">Exercício Recomendado</h4>
                  <h3 className="text-sm font-black text-[#4E3B36] font-display">{selectedActivity.exerciseTitle}</h3>
                </div>
              </div>

              <p className="text-xs text-[#4E3B36] leading-relaxed font-semibold">
                {selectedActivity.exerciseDesc}
              </p>

              <div className="flex items-start gap-2 pt-2 border-t border-[#E5A88B]/10 text-[10px] font-semibold text-slate-500">
                <Lightbulb size={13} className="text-[#C97B5E] shrink-0 mt-0.5 animate-pulse" />
                <p className="leading-relaxed">
                  <strong>Dica de Sucesso:</strong> {selectedActivity.tip}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={handleGoBack}
                className="px-4 py-3 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Voltar
              </button>
              <button
                onClick={handleStartTimer}
                className="flex-1 py-3 bg-[#C97B5E] hover:bg-[#B56A4F] text-white rounded-xl font-extrabold text-xs uppercase tracking-wider font-display transition-all shadow-md shadow-[#C97B5E]/15 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Clock size={14} /> Começar Exercício (10 Min)
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
                Foco Ativo: {selectedActivity.title}
              </span>
              <h4 className="text-xs font-bold text-[#4E3B36] max-w-xs leading-relaxed">
                Deixa o telemóvel de lado e foca-te completamente no exercício.
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
                  {isActive ? 'A focar...' : 'Pausado'}
                </span>
              </div>
            </div>

            {/* Timer Actions */}
            <div className="flex items-center gap-2 w-full max-w-xs">
              <button
                onClick={handleResetTimer}
                className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-xl border border-slate-100 transition-all cursor-pointer"
                title="Reiniciar"
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
                    <Pause size={14} /> Pausar
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
                title="Concluir exercício mais cedo para testar"
              >
                Concluir Já
              </button>
            </div>

            <button
              onClick={handleGoBack}
              className="text-[10px] font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              &larr; Abandonar Exercício
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
              <h3 className="text-sm font-black text-[#4E3B36] font-display">Excelente Foco!</h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto font-semibold">
                Dedicar tempo ativamente a uma atividade que gostas desvia a energia da ansiedade e expande o teu bem-estar.
              </p>
            </div>

            <div className="bg-[#FFF0E8]/80 border border-[#E5A88B]/20 rounded-2xl p-4 text-left">
              <h4 className="text-[10px] font-black text-[#C97B5E] uppercase tracking-wider mb-1 flex items-center gap-1.5 font-display">
                <Sparkles size={13} /> Companheiro Fortalecido!
              </h4>
              <p className="text-xs text-[#4E3B36] leading-relaxed font-semibold">
                A tua mente esteve ativamente em foco positivo. O teu amigo ganhou <strong className="text-[#C97B5E]">+40 XP</strong> de evolução e progresso!
              </p>
            </div>

            <button
              onClick={() => setStep('choice')}
              className="w-full py-3 bg-[#C97B5E] hover:bg-[#B56A4F] text-white rounded-xl font-extrabold text-xs uppercase tracking-wider font-display transition-all shadow-md cursor-pointer"
            >
              Focar Noutra Atividade
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
