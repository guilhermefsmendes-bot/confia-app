import React, { useState, useEffect } from "react";
import { saveEpisode } from "./Impulso";
import type {
  Emotion,
  ImpulseNeed,
  Trigger,
} from "./Impulso/types";
import ProgressBar from "./ProgressBar";
import { useTranslation } from "react-i18next";
import {
  collectReactiveRecentMemory,
} from "../data/reactive/reactiveRecentMemory";
import {
  ArrowLeft,
  ArrowRight,
  Brain,
  Check,
  Compass,
  Heart,
  HeartHandshake,
  Lightbulb,
  MapPin,
  Pause,
  Play,
  RotateCcw,
  Search,
  Sparkles,
  Wind,
} from "lucide-react";
import {
  analyzeReactiveState,
} from "../data/reactive/reactiveEngine";
import {
  recordReactiveResponse,
} from "../data/reactive/reactiveHistoryStorage";
interface ImpulsoSOSProps {
  onAddXp: (amount: number) => void;
}

type Thought = string;


export const ImpulsoSOS: React.FC<ImpulsoSOSProps> = ({ onAddXp }) => {
const { t } = useTranslation();
const triggers: Array<{
  id: Trigger;
  label: string;
}> = [
  {
    id: "internet",
    label: t("triggerInternet"),
  },
  {
    id: "symptom",
    label: t("triggerSymptom"),
  },
  {
    id: "conversation",
    label: t("triggerDiseaseTalk"),
  },
  {
    id: "message",
    label: t("triggerMessage"),
  },
  {
    id: "other",
    label: t("triggerUnknown"),
  },
];

const emotions: Array<{
  id: Emotion;
  label: string;
}> = [
  {
    id: "fear",
    label: t("emotionFear"),
  },
  {
    id: "anxiety",
    label: t("emotionAnxiety"),
  },
  {
    id: "sadness",
    label: t("emotionSadness"),
  },
  {
    id: "frustration",
    label: t("emotionFrustration"),
  },
  {
    id: "confusion",
    label: t("emotionConfusion"),
  },
];

const thoughts: Thought[] = [
  t("thoughtSeriousDisease"),
  t("thoughtNeedConfirm"),
  t("thoughtNeverHappened"),
  t("thoughtLoseControl"),
  t("thoughtDontKnow"),
];
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [intensity, setIntensity] = useState(5);
  const [finalIntensity, setFinalIntensity] = useState(5);
const lastUse = localStorage.getItem("confia_last_impulse_use_v1");

const impulseCount = Number(
  localStorage.getItem("confia_impulse_count_v1") || "0"
);

const daysWithoutUse =
  lastUse !== null
    ? Math.max(
        1,
        Math.floor(
          (Date.now() - new Date(lastUse).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      )
    : null;

  // Estados de seleção
  const [trigger, setTrigger] = useState<Trigger | null>(null);
  const [emotion, setEmotion] = useState<Emotion | null>(null);
  const [thought, setThought] = useState<Thought | null>(null);
  const [impulseNeed, setImpulseNeed] = useState<ImpulseNeed | null>(null);
  
  const [completed, setCompleted] = useState(false);
  const [reactiveMessageKey, setReactiveMessageKey] =
    useState<string | null>(null);

  /**
   * Memória existente quando o utilizador entra no Impulso.
   *
   * É reconstruída uma única vez por montagem através
   * dos registos que a aplicação já possui.
   */
  const [impulseMemory] = useState(
    () => collectReactiveRecentMemory()
  );

  const rememberedImpulse =
    impulseMemory.recentEffectiveImpulse?.need
      ? impulseMemory.recentEffectiveImpulse
      : undefined;

  const rememberedNeed =
    rememberedImpulse?.need;


  // Estados do Cronómetro (180 segundos = 3 minutos)
  const [timeLeft, setTimeLeft] = useState(180);
  const [timerRunning, setTimerRunning] = useState(false);

  // Percursos adaptativos do Impulso.
  // Os números correspondem aos passos existentes do componente.
  const impulseRoutes: Record<ImpulseNeed, number[]> = {
    calm: [1, 6, 8],
    mind: [1, 4, 5, 8],
    control: [1, 2, 3, 5, 8],
    support: [1, 3, 7, 8],
  };

  const activeRoute = impulseNeed
    ? impulseRoutes[impulseNeed]
    : [1, 8];

  const currentRouteIndex = activeRoute.indexOf(step);

  const progress =
    started && currentRouteIndex >= 0
      ? Math.round(
          ((currentRouteIndex + 1) / activeRoute.length) * 100
        )
      : 0;

  const routeLabelKey: Record<ImpulseNeed, string> = {
    calm: "impulseAdaptive.calmRoute",
    mind: "impulseAdaptive.mindRoute",
    control: "impulseAdaptive.controlRoute",
    support: "impulseAdaptive.supportRoute",
  };

  // Lógica do efeito do Cronómetro
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [timerRunning, timeLeft]);

  const getTriggerLabel = (
    value: Trigger | null
  ): string => {
    if (!value) {
      return t("unexpectedTrigger");
    }

    return (
      triggers.find((item) => item.id === value)?.label ??
      t("unexpectedTrigger")
    );
  };

  const getEmotionLabel = (
    value: Emotion | null
  ): string => {
    if (!value) {
      return t("apprehension");
    }

    return (
      emotions.find((item) => item.id === value)?.label ??
      t("apprehension")
    );
  };

  // Formatar segundos em MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };
const getJustificationPhrase = () => {
  const triggerLabel = getTriggerLabel(trigger);
  const emotionLabel = getEmotionLabel(emotion).toLowerCase();
  const thoughtLabel = thought
    ? thought.replace(/\.$/, "")
    : t("needsConfirmation");

  return t("justificationPhrase", {
    trigger: triggerLabel,
    emotion: emotionLabel,
    thought: thoughtLabel,
  });
};

const getPsychoeducationMessage = () => {
  switch (trigger) {
    case "internet":
      return t("psychoInternet");

    case "symptom":
      return t("psychoSymptom");

    case "conversation":
      return t("psychoDiseaseTalk");

    default:
      return t("psychoDefault");
  }
};


  const finishSOS = () => {
    /**
     * Guardar primeiro o episódio.
     *
     * O motor reativo consegue assim analisar imediatamente
     * a diferença entre intensidade inicial e final.
     */
    saveEpisode({
      createdAt: new Date().toISOString(),
      need: impulseNeed ?? undefined,
      initialIntensity: intensity,
      finalIntensity,
      trigger: trigger ?? undefined,
      emotion: emotion ?? undefined,
      thought: thought ?? undefined,
      completed: true,
      xpEarned: 30,
    });

    const reactiveResult = analyzeReactiveState({
      source: "impulse",
      initialIntensity: intensity,
      finalIntensity,
    });

    setReactiveMessageKey(
      reactiveResult.response.translationKey
    );

    /**
     * Esta resposta foi provocada diretamente
     * pela conclusão de um Impulso.
     */
    recordReactiveResponse({
      responseId: reactiveResult.response.id,
      situation: reactiveResult.situation,
      intent: reactiveResult.intent,
      timestamp: new Date().toISOString(),
    });

    onAddXp(30);
    setCompleted(true);
  };

  const nextStep = () => {
    if (!canContinueCurrentStep) {
      return;
    }

    const routeIndex = activeRoute.indexOf(step);

    if (routeIndex === -1) {
      setStep(activeRoute[0]);
      return;
    }

    const isLastRouteStep =
      routeIndex === activeRoute.length - 1;

    if (isLastRouteStep) {
      finishSOS();
      return;
    }

    setStep(activeRoute[routeIndex + 1]);
  };

  const canContinueCurrentStep =
    step === 2
      ? Boolean(trigger)
      : step === 3
      ? Boolean(emotion)
      : step === 4
      ? Boolean(thought)
      : true;

  const prevStep = () => {
    const routeIndex = activeRoute.indexOf(step);

    if (routeIndex > 0) {
      setStep(activeRoute[routeIndex - 1]);
    }
  };

  // 1. Ecrã de Conclusão premium
  if (completed) {
    const intensityDifference =
      finalIntensity - intensity;

    const formattedDifference =
      intensityDifference > 0
        ? `+${intensityDifference}`
        : `${intensityDifference}`;

    return (
      <section className="relative mx-auto max-w-[450px] overflow-hidden rounded-[32px] border border-[#E8DDD7]/70 bg-gradient-to-b from-[#FFFDFC] via-white to-[#FFF9F5] px-5 py-6 shadow-[0_18px_50px_rgba(92,64,52,0.07)]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[#F4D9CA]/25 blur-3xl"
        />

        <div className="relative text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[20px] border border-[#E5A88B]/25 bg-[#FFF8F4] shadow-sm">
            <Check
              size={23}
              strokeWidth={1.8}
              className="text-[#C97B5E]"
            />
          </div>

          <p className="mt-4 text-[9px] font-black uppercase tracking-[0.18em] text-[#C97B5E]">
            {t("impulseClosing.completedEyebrow")}
          </p>

          <h2 className="mx-auto mt-2 max-w-[330px] text-[22px] font-black leading-tight tracking-tight text-[#4E3B36]">
            {t("impulseClosing.completedTitle")}
          </h2>

          <p className="mx-auto mt-2 max-w-[330px] text-xs font-semibold leading-relaxed text-slate-400">
            {t("impulseClosing.completedDesc")}
          </p>
        </div>

        <div className="relative mt-6 grid grid-cols-3 gap-2">
          <div className="rounded-[20px] border border-[#E8DDD7]/60 bg-[#FFF9F5] px-2 py-3 text-center">
            <p className="text-[8px] font-black uppercase tracking-wider text-slate-400">
              {t("impulseClosing.before")}
            </p>

            <p className="mt-1.5 text-xl font-black text-[#8B6B60]">
              {intensity}
            </p>
          </div>

          <div className="rounded-[20px] border border-[#E5A88B]/25 bg-white px-2 py-3 text-center shadow-sm">
            <p className="text-[8px] font-black uppercase tracking-wider text-[#C97B5E]">
              {t("impulseClosing.after")}
            </p>

            <p className="mt-1.5 text-xl font-black text-[#4E3B36]">
              {finalIntensity}
            </p>
          </div>

          <div className="rounded-[20px] border border-[#E8DDD7]/60 bg-[#FFF9F5] px-2 py-3 text-center">
            <p className="text-[8px] font-black uppercase tracking-wider text-slate-400">
              {t("impulseClosing.difference")}
            </p>

            <p className="mt-1.5 text-xl font-black text-[#C97B5E]">
              {formattedDifference}
            </p>
          </div>
        </div>

        {reactiveMessageKey && (
          <div className="relative mt-4 rounded-[24px] border border-[#E5A88B]/25 bg-gradient-to-br from-[#FFF8F4] to-white p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[13px] border border-[#E5A88B]/20 bg-white">
                <Sparkles
                  size={16}
                  strokeWidth={1.8}
                  className="text-[#C97B5E]"
                />
              </div>

              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#C97B5E]">
                  {t("impulseClosing.confiaNoticed")}
                </p>

                <p className="mt-1.5 text-xs font-semibold leading-relaxed text-[#5F504B]">
                  {t(reactiveMessageKey)}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="relative mt-4 flex items-center gap-3 rounded-[20px] border border-[#E8DDD7]/60 bg-white/75 px-4 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[13px] bg-[#FFF3EC]">
            <Sparkles
              size={15}
              strokeWidth={1.8}
              className="text-[#C97B5E]"
            />
          </div>

          <div>
            <p className="text-xs font-black text-[#4E3B36]">
              {t("impulseClosing.xpEarned")}
            </p>

            <p className="mt-0.5 text-[9px] font-semibold leading-relaxed text-slate-400">
              {t("impulseClosing.xpDesc")}
            </p>
          </div>
        </div>
      </section>
    );
  }

  // 2. Entrada premium do Impulso
  if (!started) {
    const needs: Array<{
      id: ImpulseNeed;
      icon: React.ComponentType<{
        size?: number;
        strokeWidth?: number;
        className?: string;
      }>;
      title: string;
      description: string;
    }> = [
      {
        id: "calm",
        icon: Wind,
        title: t("impulsePremium.calmTitle"),
        description: t("impulsePremium.calmDesc"),
      },
      {
        id: "mind",
        icon: Brain,
        title: t("impulsePremium.mindTitle"),
        description: t("impulsePremium.mindDesc"),
      },
      {
        id: "control",
        icon: Compass,
        title: t("impulsePremium.controlTitle"),
        description: t("impulsePremium.controlDesc"),
      },
      {
        id: "support",
        icon: HeartHandshake,
        title: t("impulsePremium.supportTitle"),
        description: t("impulsePremium.supportDesc"),
      },
    ];

    const getNeedLabel = (
      need: ImpulseNeed
    ): string => {
      const match = needs.find(
        (item) => item.id === need
      );

      return match?.title ?? need;
    };

    const rememberedNeedLabel =
      rememberedNeed
        ? getNeedLabel(rememberedNeed)
        : undefined;


    const beginImpulse = () => {
      if (!impulseNeed) return;

      localStorage.setItem(
        "confia_last_impulse_use_v1",
        new Date().toISOString()
      );

      const count = Number(
        localStorage.getItem("confia_impulse_count_v1") || "0"
      );

      localStorage.setItem(
        "confia_impulse_count_v1",
        String(count + 1)
      );

      setStarted(true);
      setStep(1);
    };

    return (
      <section className="relative overflow-hidden rounded-[34px] border border-[#E8DDD7]/70 bg-gradient-to-b from-[#FFFDFC] via-[#FFF9F5] to-white shadow-[0_18px_50px_rgba(92,64,52,0.08)]">
        {/* Atmosfera */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-[#F4D9CA]/30 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-20 top-52 h-40 w-40 rounded-full bg-[#F7EBDD]/45 blur-3xl"
        />

        <div className="relative px-5 pb-5 pt-6">
          {/* Identidade */}
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#E5A88B]/20 bg-white/80">
              <Sparkles
                size={15}
                strokeWidth={1.8}
                className="text-[#C97B5E]"
              />
            </div>

            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#C97B5E]">
              {t("impulsePremium.eyebrow")}
            </p>
          </div>

          <div className="mt-5 max-w-[330px]">
            <h1 className="text-[25px] font-black leading-[1.08] tracking-[-0.03em] text-[#4E3B36] font-display">
              {t("impulsePremium.title")}
            </h1>

            <p className="mt-3 text-[12px] font-semibold leading-relaxed text-slate-400">
              {t("impulsePremium.subtitle")}
            </p>
          </div>

          {/* Separador visual */}
          <div className="my-6 h-px bg-gradient-to-r from-transparent via-[#E8DDD7] to-transparent" />

          {/* Escolha da necessidade */}
          <div>
            <p className="text-sm font-black text-[#4E3B36]">
              {t("impulsePremium.question")}
            </p>

            {rememberedImpulse &&
              rememberedNeedLabel && (
                <div className="mb-4 rounded-[22px] border border-[#E5A88B]/25 bg-gradient-to-br from-[#FFF8F4] to-white p-4 text-left shadow-[0_8px_24px_rgba(92,64,52,0.04)]">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[13px] border border-[#E5A88B]/20 bg-white">
                      <Sparkles
                        size={15}
                        strokeWidth={1.8}
                        className="text-[#C97B5E]"
                      />
                    </div>

                    <div className="min-w-0">
                      <p className="text-[9px] font-black uppercase tracking-[0.15em] text-[#C97B5E]">
                        {t("impulseMemory.memoryEyebrow")}
                      </p>

                      <p className="mt-1.5 text-[11px] font-semibold leading-relaxed text-[#6B5750]">
                        {t(
                          "impulseMemory.memoryText",
                          {
                            need: rememberedNeedLabel,
                            before:
                              rememberedImpulse.initialIntensity,
                            after:
                              rememberedImpulse.finalIntensity,
                          }
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-3 grid grid-cols-2 gap-2.5">
              {needs.map((need) => {
                const NeedIcon = need.icon;
                const selected = impulseNeed === need.id;

                return (
                  <button
                    key={need.id}
                    type="button"
                    onClick={() => setImpulseNeed(need.id)}
                    aria-pressed={selected}
                    className={`min-h-[132px] rounded-[22px] border p-3.5 text-left transition-all duration-200 ${
                      selected
                        ? "border-[#E5A88B]/55 bg-[#FFF5EF] shadow-[0_8px_22px_rgba(201,123,94,0.10)]"
                        : "border-[#E8DDD7]/65 bg-white/75 active:bg-[#FFF9F5]"
                    }`}
                  >
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                        selected
                          ? "bg-white text-[#C97B5E]"
                          : "bg-[#FFF8F4] text-[#A87968]"
                      }`}
                    >
                      <NeedIcon
                        size={17}
                        strokeWidth={1.8}
                      />
                    </div>

                    <p className="mt-3 text-[12px] font-black leading-tight text-[#4E3B36]">
                      {need.title}
                    </p>

                      {rememberedNeed === need.id && (
                        <span className="mt-1.5 inline-flex rounded-full border border-[#E5A88B]/25 bg-[#FFF3EC] px-2 py-1 text-[8px] font-black uppercase tracking-[0.08em] text-[#C97B5E]">
                          {t(
                            "impulseMemory.helpedRecently"
                          )}
                        </span>
                      )}

                    <p className="mt-1.5 text-[10px] font-semibold leading-relaxed text-slate-400">
                      {need.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* CTA */}
          <button
            type="button"
            disabled={!impulseNeed}
            onClick={beginImpulse}
            className={`mt-5 flex w-full items-center justify-between rounded-[20px] px-4 py-4 transition-all duration-200 ${
              impulseNeed
                ? "bg-[#C97B5E] text-white shadow-[0_10px_24px_rgba(201,123,94,0.18)] active:scale-[0.99]"
                : "cursor-not-allowed bg-[#EEE7E2] text-[#B7AAA4]"
            }`}
          >
            <span className="text-xs font-black">
              {impulseNeed
                ? t("impulsePremium.continue")
                : t("impulsePremium.chooseFirst")}
            </span>

            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15">
              <ArrowRight
                size={16}
                strokeWidth={2}
              />
            </span>
          </button>

          {/* Histórico discreto */}
          <div className="mt-5 flex items-center justify-between border-t border-[#E8DDD7]/55 pt-4">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#A87968]">
                {t("impulsePremium.history")}
              </p>

              <p className="mt-1 text-[10px] font-semibold text-slate-400">
                {impulseCount > 0
                  ? t("impulsePremium.historyUses", {
                      count: impulseCount,
                    })
                  : t("impulsePremium.historyFirst")}
              </p>
            </div>

            {lastUse && daysWithoutUse !== null && (
              <span className="shrink-0 rounded-full border border-[#E8DDD7]/60 bg-white/75 px-2.5 py-1 text-[9px] font-bold text-slate-400">
                {t("impulseLastUsed", {
                  days: daysWithoutUse,
                })}
              </span>
            )}
          </div>
        </div>
      </section>
    );
  }

  // 3. Layout Principal do Exercício
  return (
    <section className="relative mx-auto max-w-[450px] overflow-hidden rounded-[32px] border border-[#E8DDD7]/70 bg-gradient-to-b from-[#FFFDFC] via-white to-[#FFF9F5] shadow-[0_18px_50px_rgba(92,64,52,0.07)]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[#F4D9CA]/25 blur-3xl"
      />

      {/* Cabeçalho do percurso */}
      <div className="relative border-b border-[#E8DDD7]/55 px-5 pb-4 pt-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#C97B5E]">
              {t("impulseAdaptive.routeLabel")}
            </p>

            <p className="mt-1 truncate text-[13px] font-black text-[#4E3B36]">
              {impulseNeed
                ? t(routeLabelKey[impulseNeed])
                : t("impulse")}
            </p>
          </div>

          <div className="shrink-0 text-right">
            <p className="text-[9px] font-bold text-slate-400">
              {t("impulseExperience.step", {
                current: currentRouteIndex + 1,
                total: activeRoute.length,
              })}
            </p>

            <p className="mt-1 text-[11px] font-black text-[#C97B5E]">
              {progress}%
            </p>
          </div>
        </div>

        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#F1E8E3]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#E5A88B] to-[#C97B5E] transition-[width] duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Conteúdo Dinâmico dos Passos */}
      <div className="relative min-h-[300px] px-5 py-6">
        {step === 1 && (
          <div>
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[18px] border border-[#E5A88B]/20 bg-[#FFF8F4]">
                <Sparkles
                  size={20}
                  strokeWidth={1.7}
                  className="text-[#C97B5E]"
                />
              </div>

              <h2 className="mt-4 text-xl font-black tracking-tight text-[#4E3B36]">
                {t("impulseExperience.intensityNow")}
              </h2>

              <p className="mx-auto mt-2 max-w-[330px] text-xs font-semibold leading-relaxed text-slate-400">
                {t("impulseExperience.intensityNowDesc")}
              </p>
            </div>

            <div className="mt-7 rounded-[26px] border border-[#E8DDD7]/65 bg-white/80 p-5">
              <div className="text-center">
                <span className="text-[46px] font-black leading-none tracking-[-0.05em] text-[#4E3B36]">
                  {intensity}
                </span>

                <span className="ml-1 text-sm font-black text-[#B8AAA4]">
                  /10
                </span>

                <p className="mt-2 text-[10px] font-black uppercase tracking-[0.14em] text-[#C97B5E]">
                  {intensity <= 3
                    ? t("impulseExperience.low")
                    : intensity <= 6
                    ? t("impulseExperience.medium")
                    : t("impulseExperience.high")}
                </p>
              </div>

              <div className="mt-6">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={intensity}
                  onChange={(e) =>
                    setIntensity(Number(e.target.value))
                  }
                  aria-label={t("impulseExperience.intensityNow")}
                  className="w-full accent-[#C97B5E]"
                />

                <div className="mt-2 flex justify-between px-0.5 text-[9px] font-bold text-slate-300">
                  <span>1</span>
                  <span>5</span>
                  <span>10</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <div className="mb-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-[16px] border border-[#E5A88B]/20 bg-[#FFF8F4]">
                <MapPin
                  size={18}
                  strokeWidth={1.8}
                  className="text-[#C97B5E]"
                />
              </div>

              <h2 className="mt-3 text-xl font-black tracking-tight text-[#4E3B36]">
                {t("impulseStep2")}
              </h2>
            </div>

            <div className="space-y-2.5">
              {triggers.map((item) => {
                const selected = trigger === item.id;

                return (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => setTrigger(item.id)}
                    className={`flex w-full items-center gap-3 rounded-[20px] border px-4 py-3.5 text-left transition-all active:scale-[0.99] ${
                      selected
                        ? "border-[#E5A88B]/55 bg-[#FFF5EF] shadow-[0_7px_18px_rgba(201,123,94,0.08)]"
                        : "border-[#E8DDD7]/65 bg-white/80"
                    }`}
                  >
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${
                        selected
                          ? "border-[#C97B5E] bg-[#C97B5E] text-white"
                          : "border-[#DED4CF] bg-white text-transparent"
                      }`}
                    >
                      <Check size={13} strokeWidth={2.2} />
                    </span>

                    <span
                      className={`text-[13px] font-bold leading-snug ${
                        selected
                          ? "text-[#4E3B36]"
                          : "text-[#6F625E]"
                      }`}
                    >
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <div className="mb-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-[16px] border border-[#E5A88B]/20 bg-[#FFF8F4]">
                <Heart
                  size={18}
                  strokeWidth={1.8}
                  className="text-[#C97B5E]"
                />
              </div>

              <h2 className="mt-3 text-xl font-black tracking-tight text-[#4E3B36]">
                {t("impulseStep3")}
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {emotions.map((item) => {
                const selected = emotion === item.id;

                return (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => setEmotion(item.id)}
                    className={`flex w-full items-center gap-3 rounded-[20px] border px-4 py-3.5 text-left transition-all active:scale-[0.99] ${
                      selected
                        ? "border-[#E5A88B]/55 bg-[#FFF5EF] shadow-[0_7px_18px_rgba(201,123,94,0.08)]"
                        : "border-[#E8DDD7]/65 bg-white/80"
                    }`}
                  >
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${
                        selected
                          ? "border-[#C97B5E] bg-[#C97B5E] text-white"
                          : "border-[#DED4CF] bg-white text-transparent"
                      }`}
                    >
                      <Check size={13} strokeWidth={2.2} />
                    </span>

                    <span
                      className={`text-[13px] font-bold leading-snug ${
                        selected
                          ? "text-[#4E3B36]"
                          : "text-[#6F625E]"
                      }`}
                    >
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
{step === 4 && (
          <div>
            <div className="mb-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-[16px] border border-[#E5A88B]/20 bg-[#FFF8F4]">
                <Brain
                  size={18}
                  strokeWidth={1.8}
                  className="text-[#C97B5E]"
                />
              </div>

              <h2 className="mt-3 text-xl font-black tracking-tight text-[#4E3B36]">
                {t("impulseStep4")}
              </h2>
            </div>

            <div className="space-y-2.5">
              {thoughts.map((item) => {
                const selected = thought === item;

                return (
                  <button
                    type="button"
                    key={item}
                    onClick={() => setThought(item)}
                    className={`group flex w-full items-center justify-between gap-3 rounded-[20px] border px-4 py-4 text-left transition-all active:scale-[0.99] ${
                      selected
                        ? "border-[#E5A88B]/55 bg-[#FFF5EF]"
                        : "border-[#E8DDD7]/65 bg-white/80"
                    }`}
                  >
                    <span className="text-[13px] font-bold leading-snug text-[#5F504B]">
                      {item}
                    </span>

                    <ArrowRight
                      size={15}
                      strokeWidth={1.9}
                      className="shrink-0 text-[#C97B5E]"
                    />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 5 && (
          <div>
            <div className="mb-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-[16px] border border-[#E5A88B]/20 bg-[#FFF8F4]">
                <Lightbulb
                  size={18}
                  strokeWidth={1.8}
                  className="text-[#C97B5E]"
                />
              </div>

              <h2 className="mt-3 text-xl font-black tracking-tight text-[#4E3B36]">
                {t("impulseStep5")}
              </h2>
            </div>

            <div className="rounded-[24px] border border-[#E8DDD7]/65 bg-white/80 p-4">
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#C97B5E]">
                {t("identifiedSoFar")}
              </p>

              <div className="mt-4 space-y-2">
                {trigger && (
                  <div className="flex items-start gap-3 rounded-[17px] bg-[#FFF9F5] px-3.5 py-3">
                    <MapPin
                      size={15}
                      strokeWidth={1.8}
                      className="mt-0.5 shrink-0 text-[#C97B5E]"
                    />

                    <div className="min-w-0">
                      <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                        {t("trigger")}
                      </p>

                      <p className="mt-0.5 text-xs font-bold leading-snug text-[#4E3B36]">
                        {getTriggerLabel(trigger)}
                      </p>
                    </div>
                  </div>
                )}

                {emotion && (
                  <div className="flex items-start gap-3 rounded-[17px] bg-[#FFF9F5] px-3.5 py-3">
                    <Heart
                      size={15}
                      strokeWidth={1.8}
                      className="mt-0.5 shrink-0 text-[#C97B5E]"
                    />

                    <div className="min-w-0">
                      <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                        {t("emotion")}
                      </p>

                      <p className="mt-0.5 text-xs font-bold leading-snug text-[#4E3B36]">
                        {getEmotionLabel(emotion)}
                      </p>
                    </div>
                  </div>
                )}

                {thought && (
                  <div className="flex items-start gap-3 rounded-[17px] bg-[#FFF9F5] px-3.5 py-3">
                    <Brain
                      size={15}
                      strokeWidth={1.8}
                      className="mt-0.5 shrink-0 text-[#C97B5E]"
                    />

                    <div className="min-w-0">
                      <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                        {t("thought")}
                      </p>

                      <p className="mt-0.5 text-xs font-bold leading-snug text-[#4E3B36]">
                        {thought}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-3 rounded-[24px] border border-[#F0D8C9]/70 bg-gradient-to-br from-[#FFF8F3] to-[#FFFDFC] p-4">
              <div className="flex items-start gap-3">
                <Sparkles
                  size={16}
                  strokeWidth={1.8}
                  className="mt-0.5 shrink-0 text-[#C97B5E]"
                />

                <p className="whitespace-pre-line text-xs font-semibold leading-relaxed text-[#6B5750]">
                  {getPsychoeducationMessage()}
                </p>
              </div>
            </div>

            <div className="mt-3 rounded-[24px] border border-[#E8DDD7]/65 bg-white p-4">
              <div className="flex items-center gap-2">
                <Search
                  size={15}
                  strokeWidth={1.8}
                  className="text-[#C97B5E]"
                />

                <h3 className="text-xs font-black text-[#4E3B36]">
                  {t("anxietyCycle")}
                </h3>
              </div>

              <div className="mt-4 space-y-1.5">
                {[
                  t("cycleAnxiety"),
                  t("cycleSearch"),
                  t("cycleTemporaryRelief"),
                  t("cycleNewDoubts"),
                  t("cycleMoreAnxiety"),
                ].map((label, index) => (
                  <React.Fragment key={`${label}-${index}`}>
                    <div className="flex items-center gap-3 rounded-[16px] bg-[#FFF9F5] px-3 py-2.5">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-[9px] font-black text-[#C97B5E] shadow-sm">
                        {index + 1}
                      </span>

                      <span className="text-[11px] font-bold leading-snug text-[#5F504B]">
                        {label}
                      </span>
                    </div>

                    {index < 4 && (
                      <div className="flex justify-center text-[#D8B7A7]">
                        <span className="text-xs">↓</span>
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>

              <p className="mt-4 border-t border-[#EFE6E1] pt-3 text-center text-[10px] font-semibold italic leading-relaxed text-slate-400">
                {t("cycleExplanation")}
              </p>
            </div>
          </div>
        )}

        {step === 6 && (
          <div>
            <div className="text-center">
              <div className="relative mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-[#E5A88B]/25 bg-gradient-to-br from-[#FFF8F4] to-white shadow-[0_12px_30px_rgba(201,123,94,0.10)]">
                <div className="absolute inset-2 rounded-full border border-[#E5A88B]/15" />

                <Wind
                  size={30}
                  strokeWidth={1.4}
                  className="relative text-[#C97B5E]"
                />
              </div>

              <h2 className="mt-5 text-xl font-black tracking-tight text-[#4E3B36]">
                {t("impulseStep6")}
              </h2>
            </div>

            <div className="mt-6 space-y-2.5">
              <div className="flex items-center gap-3 rounded-[20px] border border-[#E8DDD7]/60 bg-white/80 px-4 py-3.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FFF3EC] text-[10px] font-black text-[#C97B5E]">
                  1
                </span>

                <div>
                  <p className="text-xs font-black text-[#4E3B36]">
                    {t("inhale")}
                  </p>

                  <p className="mt-0.5 text-[10px] font-semibold leading-relaxed text-slate-400">
                    {t("inhaleDescription")}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-[20px] border border-[#E8DDD7]/60 bg-white/80 px-4 py-3.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FFF3EC] text-[10px] font-black text-[#C97B5E]">
                  2
                </span>

                <div>
                  <p className="text-xs font-black text-[#4E3B36]">
                    {t("holdBreath")}
                  </p>

                  <p className="mt-0.5 text-[10px] font-semibold leading-relaxed text-slate-400">
                    {t("holdBreathDescription")}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-[20px] border border-[#E8DDD7]/60 bg-white/80 px-4 py-3.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FFF3EC] text-[10px] font-black text-[#C97B5E]">
                  3
                </span>

                <div>
                  <p className="text-xs font-black text-[#4E3B36]">
                    {t("exhale")}
                  </p>

                  <p className="mt-0.5 text-[10px] font-semibold leading-relaxed text-slate-400">
                    {t("exhaleDescription")}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-[18px] bg-[#FFF8F4] px-4 py-3 text-center">
              <p className="text-[10px] font-semibold italic leading-relaxed text-[#8B6B60]">
                {t("repeatBreathing")}
              </p>
            </div>
          </div>
        )}

        {step === 7 && (
          <>
            {impulseNeed === "support" ? (
              <div className="space-y-4 text-left">
                <div className="rounded-[26px] border border-[#E8DDD7]/70 bg-gradient-to-br from-[#FFF9F5] to-white p-5">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#C97B5E]">
                    {t("impulsePremium.supportTitle")}
                  </p>

                  <h3 className="mt-2 text-xl font-black leading-tight text-[#4E3B36]">
                    {t("impulseAdaptive.supportStepTitle")}
                  </h3>

                  <p className="mt-3 text-sm font-semibold leading-relaxed text-slate-500">
                    {t("impulseAdaptive.supportStepText")}
                  </p>
                </div>

                <div className="rounded-[22px] border border-[#E8DDD7]/60 bg-white p-4">
                  <p className="text-xs font-bold leading-relaxed text-[#4E3B36]">
                    {t("impulseAdaptive.supportPrompt")}
                  </p>

                  <div className="mt-3 rounded-[16px] bg-[#FFF8F4] px-4 py-3">
                    <p className="text-[11px] font-semibold italic leading-relaxed text-[#8B6B60]">
                      {t("impulseAdaptive.supportExample")}
                    </p>
                  </div>
                </div>

                <p className="px-1 text-center text-[11px] font-semibold leading-relaxed text-slate-400">
                  {t("impulseAdaptive.supportContinue")}
                </p>
              </div>
            ) : (
              <div>
                <div className="text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[18px] border border-[#E5A88B]/20 bg-[#FFF8F4]">
                    <Heart
                      size={20}
                      strokeWidth={1.7}
                      className="text-[#C97B5E]"
                    />
                  </div>

                  <p className="mt-4 text-[9px] font-black uppercase tracking-[0.16em] text-[#C97B5E]">
                    {t("impulseClosing.gratitudeEyebrow")}
                  </p>

                  <h2 className="mt-2 text-xl font-black tracking-tight text-[#4E3B36]">
                    {t("gratitudeExercise")}
                  </h2>
                </div>

                <div className="mt-5 rounded-[22px] border border-[#E5A88B]/20 bg-gradient-to-br from-[#FFF8F4] to-white p-4">
                  <div className="flex items-start gap-3">
                    <Sparkles
                      size={16}
                      strokeWidth={1.8}
                      className="mt-0.5 shrink-0 text-[#C97B5E]"
                    />

                    <p className="text-xs font-semibold leading-relaxed text-[#6B5750]">
                      {getJustificationPhrase()}
                    </p>
                  </div>
                </div>

                <div className="mt-3 rounded-[26px] border border-[#E8DDD7]/65 bg-white/80 p-5 text-center">
                  <p className="text-xs font-black text-[#4E3B36]">
                    {t("impulseClosing.timerTitle")}
                  </p>

                  <p className="mx-auto mt-1.5 max-w-[300px] text-[10px] font-semibold leading-relaxed text-slate-400">
                    {t("impulseClosing.timerDesc")}
                  </p>

                  <div className="my-6">
                    <p
                      className={`font-mono text-[42px] font-black tracking-[-0.04em] ${
                        timeLeft < 30
                          ? "text-[#C97B5E]"
                          : "text-[#4E3B36]"
                      }`}
                    >
                      {formatTime(timeLeft)}
                    </p>
                  </div>

                  <div className="flex gap-2.5">
                    <button
                      type="button"
                      onClick={() =>
                        setTimerRunning(!timerRunning)
                      }
                      className="flex h-11 flex-1 items-center justify-center gap-2 rounded-[17px] bg-[#C97B5E] px-4 text-white shadow-[0_7px_18px_rgba(201,123,94,0.16)] transition-transform active:scale-[0.98]"
                    >
                      {timerRunning ? (
                        <Pause
                          size={15}
                          strokeWidth={2}
                        />
                      ) : (
                        <Play
                          size={15}
                          strokeWidth={2}
                        />
                      )}

                      <span className="text-[11px] font-black">
                        {timerRunning
                          ? t("pause")
                          : t("startTimer")}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setTimerRunning(false);
                        setTimeLeft(180);
                      }}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[17px] border border-[#E8DDD7] bg-white text-[#8B6B60] transition-transform active:scale-[0.98]"
                      aria-label={t("reset")}
                    >
                      <RotateCcw
                        size={16}
                        strokeWidth={1.9}
                      />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {step === 8 && (
          <div>
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[18px] border border-[#E5A88B]/20 bg-[#FFF8F4]">
                <Check
                  size={20}
                  strokeWidth={1.8}
                  className="text-[#C97B5E]"
                />
              </div>

              <h2 className="mt-4 text-xl font-black tracking-tight text-[#4E3B36]">
                {t("impulseExperience.intensityAfter")}
              </h2>

              <p className="mx-auto mt-2 max-w-[330px] text-xs font-semibold leading-relaxed text-slate-400">
                {t("impulseExperience.intensityAfterDesc")}
              </p>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-2.5">
              <div className="rounded-[20px] border border-[#E8DDD7]/60 bg-[#FFF9F5] px-4 py-3 text-center">
                <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
                  {t("impulseExperience.initial")}
                </p>

                <p className="mt-1 text-xl font-black text-[#8B6B60]">
                  {intensity}
                  <span className="text-[10px] text-slate-300">
                    /10
                  </span>
                </p>
              </div>

              <div className="rounded-[20px] border border-[#E5A88B]/30 bg-white px-4 py-3 text-center shadow-sm">
                <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#C97B5E]">
                  {t("impulseExperience.now")}
                </p>

                <p className="mt-1 text-xl font-black text-[#4E3B36]">
                  {finalIntensity}
                  <span className="text-[10px] text-slate-300">
                    /10
                  </span>
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-[26px] border border-[#E8DDD7]/65 bg-white/80 p-5">
              <div className="text-center">
                <span className="text-[42px] font-black leading-none tracking-[-0.05em] text-[#4E3B36]">
                  {finalIntensity}
                </span>

                <span className="ml-1 text-sm font-black text-[#B8AAA4]">
                  /10
                </span>

                <p className="mt-2 text-[10px] font-black uppercase tracking-[0.14em] text-[#C97B5E]">
                  {finalIntensity <= 3
                    ? t("impulseExperience.low")
                    : finalIntensity <= 6
                    ? t("impulseExperience.medium")
                    : t("impulseExperience.high")}
                </p>
              </div>

              <div className="mt-6">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={finalIntensity}
                  onChange={(e) =>
                    setFinalIntensity(Number(e.target.value))
                  }
                  aria-label={t("impulseExperience.intensityAfter")}
                  className="w-full accent-[#C97B5E]"
                />

                <div className="mt-2 flex justify-between px-0.5 text-[9px] font-bold text-slate-300">
                  <span>1</span>
                  <span>5</span>
                  <span>10</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>


      {/* Navegação premium */}
      <div className="relative flex items-center gap-3 border-t border-[#E8DDD7]/55 bg-white/70 px-5 py-4 backdrop-blur-sm">
        <button
          type="button"
          onClick={prevStep}
          disabled={currentRouteIndex <= 0}
          className={`flex h-12 items-center justify-center rounded-[18px] border px-4 transition-all ${
            currentRouteIndex <= 0
              ? "cursor-not-allowed border-[#EEE8E4] bg-[#F8F5F3] text-[#CFC4BF]"
              : "border-[#E8DDD7] bg-white text-[#8B6B60] active:scale-[0.98]"
          }`}
          aria-label={t("back")}
        >
          <ArrowLeft
            size={17}
            strokeWidth={1.9}
          />
        </button>

        <button
          type="button"
          onClick={nextStep}
          disabled={!canContinueCurrentStep}
          className={`flex h-12 flex-1 items-center justify-between rounded-[18px] px-4 transition-all ${
            canContinueCurrentStep
              ? "bg-[#C97B5E] text-white shadow-[0_8px_20px_rgba(201,123,94,0.18)] active:scale-[0.99]"
              : "cursor-not-allowed bg-[#EEE7E2] text-[#B7AAA4]"
          }`}
        >
          <span className="text-xs font-black">
            {currentRouteIndex === activeRoute.length - 1
              ? t("finish")
              : t("next")}
          </span>

          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15">
            {currentRouteIndex === activeRoute.length - 1 ? (
              <Check
                size={15}
                strokeWidth={2}
              />
            ) : (
              <ArrowRight
                size={15}
                strokeWidth={2}
              />
            )}
          </span>
        </button>
      </div>
    </section>
  );
};
