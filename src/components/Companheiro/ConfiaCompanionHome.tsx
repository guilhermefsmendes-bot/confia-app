import React, { memo, useMemo, useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Avatar } from "../Avatar";
import {
  resolveCompanionRelationalMemory,
  resolveCompanionRelationalExpression,
  resolveCompanionRelationalAction,
  type CompanionRelationalMemoryResult,
} from "../../data/reactive/companionRelationalMemory";
import type {
  ReactiveRecentMemory,
} from "../../data/reactive/reactiveRecentMemory";

import type { AvatarState } from "../../types";
import type {
  ReactiveResult,
} from "../../data/reactive/reactiveTypes";
import {
  resolveCompanionReaction,
} from "../../data/reactive/companionReactionEngine";
import {
  markCompanionDecisionShown,
  type CompanionBrainDecision,
} from "../../data/reactive/companionBrain";
import { getEquipped } from "../../storage/homeInventory";
import { getCompanionAccessories } from "../../data/homeItems";

interface ConfiaCompanionHomeProps {
  avatar: AvatarState;
  avatarCelebrating: boolean;
  avatarMemoryMessage: string;
  morningRating?: number;
  afternoonRating?: number;
  handlePetAvatar: () => void;
  reactiveResult: ReactiveResult | null;
  companionBrainDecision: CompanionBrainDecision | null;
  relationalMemory: ReactiveRecentMemory | null;
  onCompanionAction: (
    target:
      | "impulse"
      | "patterns"
      | "progress"
      | "record"
  ) => void;
  worldMood:
    | "growing"
    | "settling"
    | "discovering"
    | "neutral";
}

/**
 * ============================================================
 * CONFIA — COMPANHEIRO PREMIUM A2.5
 * ============================================================
 *
 * COMPANHEIRO LIVRE + BALÃO DE FALA
 *
 * A criatura deixa de viver dentro de um cartão.
 * A própria página passa a ser o seu espaço.
 *
 * PERFORMANCE:
 * - sem timers novos
 * - sem intervalos
 * - sem requestAnimationFrame
 * - sem canvas
 * - sem partículas
 * - sem animações permanentes
 * - sem dependências novas
 */

function ConfiaCompanionHome({
  avatar,
  avatarCelebrating,
  avatarMemoryMessage,
  morningRating,
  afternoonRating,
  handlePetAvatar,
  reactiveResult,
  companionBrainDecision,
  relationalMemory,
  onCompanionAction,
  worldMood,
}: ConfiaCompanionHomeProps) {
  const { t } = useTranslation();

  /**
   * ==========================================================
   * CONFIA — COMPANION VIVO
   * FASE 14 — LIVE AUDIT
   * ==========================================================
   *
   * Instrumentação exclusivamente de desenvolvimento.
   *
   * Não altera decisões.
   * Não altera memória.
   * Não altera cooldowns.
   * Não altera a UI de produção.
   */
  const companionLiveAudit = (
    event: string,
    data?: Record<string, unknown>
  ) => {
    if (!import.meta.env.DEV) {
      return;
    }

    console.log(
      `[CONFIA COMPANION LIVE] ${event}`,
      {
        at: new Date().toISOString(),
        ...data,
      }
    );
  };

  /**
   * A5.3 — acessórios visuais da CONFIA.
   *
   * home_equipped continua a ser a única fonte persistente.
   * IDs legacy e troféus são ignorados pela criatura.
   */
  // CONFIA_ACCESSORIES_V4B
  // O catálogo é a fonte de verdade para acessórios visuais.
  const readEquippedAccessoryIds = () => {
    const equipped = getEquipped();

    return getCompanionAccessories()
      .filter(accessory =>
        equipped.includes(accessory.id)
      )
      .map(accessory => accessory.id);
  };

  const [
    equippedAccessoryIds,
    setEquippedAccessoryIds
  ] = useState<string[]>(
    () => readEquippedAccessoryIds()
  );

  useEffect(() => {
    const refreshEquippedAccessories = () => {
      setEquippedAccessoryIds(
        readEquippedAccessoryIds()
      );
    };

    window.addEventListener(
      "confia:equipment-changed",
      refreshEquippedAccessories
    );

    window.addEventListener(
      "storage",
      refreshEquippedAccessories
    );

    window.addEventListener(
      "focus",
      refreshEquippedAccessories
    );

    return () => {
      window.removeEventListener(
        "confia:equipment-changed",
        refreshEquippedAccessories
      );

      window.removeEventListener(
        "storage",
        refreshEquippedAccessories
      );

      window.removeEventListener(
        "focus",
        refreshEquippedAccessories
      );
    };
  }, []);

  const currentMoodRating = useMemo(() => {
    if (typeof afternoonRating === "number") {
      return afternoonRating;
    }

    if (typeof morningRating === "number") {
      return morningRating;
    }

    return undefined;
  }, [morningRating, afternoonRating]);

  const progress = useMemo(() => {
    if (!avatar.maxXp || avatar.maxXp <= 0) {
      return 0;
    }

    return Math.max(
      0,
      Math.min(
        100,
        Math.round(
          (avatar.xp / avatar.maxXp) * 100
        )
      )
    );
  }, [avatar.xp, avatar.maxXp]);

  /**
   * A3.2
   *
   * A criatura não volta a analisar dados.
   * Apenas traduz o resultado já produzido pelo
   * Reactive Engine.
   */
  const companionReaction = useMemo(() => {
    if (!reactiveResult) {
      return null;
    }

    return resolveCompanionReaction(
      reactiveResult
    );
  }, [reactiveResult]);

  /**
   * A6.3 — memória relacional visível.
   *
   * Não volta a recolher dados e não cria memória.
   * Recebe a mesma ReactiveRecentMemory já construída
   * no Principal e transforma-a apenas numa possibilidade
   * de fala da criatura.
   */
  const companionRelationalMemory:
    CompanionRelationalMemoryResult | null =
      useMemo(
        () =>
          resolveCompanionRelationalMemory(
            relationalMemory
          ),
        [relationalMemory]
      );

  /**
   * Uma reação atual com prioridade >= 70 continua
   * sempre à frente da memória relacional.
   *
   * Isto protege:
   * - momentos difíceis;
   * - regressos;
   * - progresso relevante;
   * - celebrações;
   * - descobertas atuais.
   *
   * A memória relacional surge apenas quando existe
   * espaço emocional para a CONFIA demonstrar
   * continuidade da relação.
   */
  const canUseRelationalMemory =
    Boolean(companionRelationalMemory) &&
    (
      !companionReaction ||
      companionReaction.priority < 70
    );

  /**
   * A7.2
   *
   * A memória já foi escolhida pelo A6.
   * Aqui escolhemos apenas a forma linguística
   * dessa mesma memória.
   */
  const companionRelationalExpression =
    useMemo(
      () =>
        resolveCompanionRelationalExpression(
          companionRelationalMemory
        ),
      [companionRelationalMemory]
    );

  /**
   * ============================================================
   * A8.2 — AÇÃO CONTEXTUAL
   * ============================================================
   *
   * A6 escolhe a memória.
   * A7 escolhe a forma de expressão.
   * A8 transforma o contexto numa ação concreta.
   *
   * O resolver já existente determina o destino.
   * Não existe um segundo sistema de memória.
   *
   * Reações prioritárias >= 70 permanecem protegidas.
   */

  const companionRelationalAction =
    companionReaction &&
    companionReaction.priority < 70
      ? resolveCompanionRelationalAction(
          companionRelationalExpression?.kind ??
            companionReaction.kind
        )
      : null;

  /**
   * ============================================================
   * A8.3 — PRÓXIMO PASSO CONTEXTUAL
   * ============================================================
   *
   * A8.2 decide a ação.
   * A8.3 apenas define como essa ação é apresentada.
   *
   * Não altera:
   * - o kind
   * - a prioridade
   * - o target
   * - a memória
   * - a navegação
   */

  const companionRelationalNextStep =
    companionRelationalAction
      ? {
          target:
            companionRelationalAction.target,
          translationKey:
            companionRelationalAction.translationKey,
        }
      : null;

  const proposedCompanionMessage = useMemo(() => {
    /**
     * A6.3 — HIERARQUIA DA VOZ
     *
     * 1. reação atual importante;
     * 2. memória relacional factual;
     * 3. resposta reativa de baixa prioridade;
     * 4. fallbacks históricos existentes.
     */

    if (
      companionReaction?.response?.translationKey &&
      companionReaction.priority >= 70
    ) {
      return t(
        companionReaction.response.translationKey
      );
    }

    if (
      canUseRelationalMemory &&
      companionRelationalMemory
    ) {
      if (companionRelationalExpression) {
        return t(
          companionRelationalExpression.translationKey,
          companionRelationalExpression.values ?? {}
        );
      }

      /**
       * Fallback A6.
       *
       * Se o A7 não produzir uma expressão,
       * a memória original continua disponível.
       */
      return t(
        companionRelationalMemory.translationKey,
        companionRelationalMemory.values ?? {}
      );
    }

    if (
      companionReaction?.response?.translationKey
    ) {
      return t(
        companionReaction.response.translationKey
      );
    }

    if (
      avatarMemoryMessage &&
      avatarMemoryMessage.trim().length > 0
    ) {
      return avatarMemoryMessage;
    }

    if (
      currentMoodRating !== undefined &&
      currentMoodRating <= 3
    ) {
      return t("avatarLowMood");
    }

    if (
      currentMoodRating !== undefined &&
      currentMoodRating >= 8
    ) {
      return t("avatarHighMood");
    }

    if (avatar.level === 1) {
      return t("avatarStageMessage1");
    }

    if (avatar.level >= 10) {
      return t("avatarStageMessage10");
    }

    if (avatar.level >= 5) {
      return t("avatarStageMessage5");
    }

    return t("avatarWelcome");
  }, [
    avatar.level,
    avatarMemoryMessage,
    canUseRelationalMemory,
    companionReaction,
    companionRelationalExpression,
    companionRelationalMemory,
    currentMoodRating,
    t,
  ]);

  /**
   * ============================================================
   * CONFIA — COMPANION VIVO
   * FASE 8A — CURRENT UTTERANCE
   * ============================================================
   *
   * proposedCompanionMessage é apenas aquilo que o sistema
   * histórico diria neste momento.
   *
   * currentUtterance é aquilo que a criatura está realmente
   * a dizer.
   *
   * Uma mensagem do Companion Brain fica estável mesmo que
   * exista um novo render da Home.
   */
  const [
    currentUtterance,
    setCurrentUtterance
  ] = useState<{
    text: string;
    source: "fallback" | "brain";
    decisionId?: string;

    /**
     * Momento em que esta fala entrou realmente
     * no balão.
     */
    shownAt?: number;

    /**
     * Até quando esta fala fica protegida contra
     * substituições normais.
     */
    protectedUntil?: number;

    /**
     * Prioridade da decisão que originou esta fala.
     *
     * Permite decidir se uma nova mensagem tem
     * importância suficiente para interrompê-la.
     */
    priority?: number;

    /**
     * Momento em que esta fala deixa de ser considerada
     * atual e pode regressar ao fallback.
     */
    expiresAt?: number;
  }>(() => ({
    text: proposedCompanionMessage,
    source: "fallback",
  }));

  /**
   * Enquanto estivermos numa fala de fallback,
   * o sistema histórico pode continuar a atualizá-la
   * normalmente.
   *
   * Se o cérebro estiver a falar, um simples render
   * não pode substituir essa fala.
   */
  useEffect(() => {
    setCurrentUtterance(current => {
      if (current.source === "brain") {
        return current;
      }

      if (
        current.text === proposedCompanionMessage
      ) {
        return current;
      }

      return {
        text: proposedCompanionMessage,
        source: "fallback",
      };
    });
  }, [proposedCompanionMessage]);

  /**
   * ==========================================================
   * CONFIA — COMPANION VIVO
   * FASE 10A — TEMPO MÍNIMO DE EXPOSIÇÃO
   * ==========================================================
   *
   * Quanto mais importante for a mensagem,
   * mais tempo permanece protegida no balão.
   */
  function getCompanionMinimumDisplayMs(
    category?: string
  ): number {
    switch (category) {
      case "emotional_followup":
        return 12000;

      case "impulse_followup":
        return 12000;

      case "symptom":
        return 10000;

      case "mood_change":
        return 10000;

      case "progress":
        return 8000;

      case "objective":
        return 7000;

      case "missing_checkin":
        return 6000;

      case "discovery":
        return 6000;

      case "community":
        return 5000;

      case "casual":
      default:
        return 4000;
    }
  }



  /**
   * ==========================================================
   * CONFIA — COMPANION VIVO
   * FASE 10C — TEMPO TOTAL DE VIDA DA FALA
   * ==========================================================
   *
   * A proteção mínima impede substituições precoces.
   * O lifetime define quando a fala deixa de ser atual.
   */
  function getCompanionUtteranceLifetimeMs(
    category?: string
  ): number {
    switch (category) {
      case "emotional_followup":
        return 30000;

      case "impulse_followup":
        return 30000;

      case "symptom":
        return 25000;

      case "mood_change":
        return 25000;

      case "progress":
        return 20000;

      case "objective":
        return 20000;

      case "missing_checkin":
        return 18000;

      case "discovery":
        return 18000;

      case "community":
        return 15000;

      case "casual":
      default:
        return 12000;
    }
  }

  /**
   * Guarda apenas a decisão atualmente processada.
   *
   * Isto impede que o mesmo render volte a apresentar
   * e registar repetidamente a mesma decisão.
   */
  const lastProcessedBrainDecisionRef =
    React.useRef<string | null>(null);

  // CONFIA_COMPANION_BRAIN_SHOWN_EFFECT
  useEffect(() => {
    const candidate =
      companionBrainDecision?.candidate;

    // CONFIA_FASE10B_PRIORITY_INTERRUPTION_GUARD
    /**
     * ========================================================
     * FASE 10B — INTERRUPÇÃO POR PRIORIDADE
     * ========================================================
     *
     * Enquanto uma fala estiver protegida:
     *
     * - prioridade menor ou igual → espera
     * - prioridade superior → pode interromper
     *
     * Assim, uma micro-interação nunca apaga uma fala
     * emocional importante, mas uma nova situação realmente
     * mais relevante pode entrar imediatamente.
     */
    if (
      candidate &&
      currentUtterance.source === "brain" &&
      typeof currentUtterance.protectedUntil ===
        "number" &&
      Date.now() <
        currentUtterance.protectedUntil &&
      candidate.id !==
        currentUtterance.decisionId
    ) {
      const currentPriority =
        currentUtterance.priority ?? 0;

      const newPriority =
        candidate.priority ?? 0;

      if (
        newPriority <=
          currentPriority
      ) {
        companionLiveAudit(
          "DECISION_BLOCKED_BY_PROTECTION",
          {
            currentDecisionId:
              currentUtterance.decisionId,
            currentPriority,
            candidateId:
              candidate.id,
            candidateCategory:
              candidate.category,
            candidatePriority:
              newPriority,
            protectedUntil:
              currentUtterance.protectedUntil,
          }
        );

        return;
      }

      companionLiveAudit(
        "DECISION_INTERRUPTS_PROTECTED_UTTERANCE",
        {
          previousDecisionId:
            currentUtterance.decisionId,
          previousPriority:
            currentPriority,
          candidateId:
            candidate.id,
          candidateCategory:
            candidate.category,
          candidatePriority:
            newPriority,
        }
      );
    }

    if (
      !candidate?.translationKey
    ) {
      /**
       * Quando a decisão desaparece por cooldown ou
       * mudança de contexto, libertamos o identificador.
       *
       * Assim, a mesma intenção poderá voltar a ser
       * utilizada legitimamente no futuro.
       */
      lastProcessedBrainDecisionRef.current =
        null;

      return;
    }

    const brainKey =
      candidate.translationKey;

    const translated =
      t(brainKey);

    if (
      !translated ||
      translated === brainKey
    ) {
      companionLiveAudit(
        "DECISION_TRANSLATION_MISSING",
        {
          candidateId:
            candidate.id,
          translationKey:
            brainKey,
        }
      );

      return;
    }

    if (
      lastProcessedBrainDecisionRef.current ===
      candidate.id
    ) {
      return;
    }

    lastProcessedBrainDecisionRef.current =
      candidate.id;

    /**
     * A decisão transforma-se agora numa fala real.
     */
    const nowMs =
      Date.now();

    const minimumDisplayMs =
      getCompanionMinimumDisplayMs(
        candidate.category
      );

    const utteranceLifetimeMs =
      getCompanionUtteranceLifetimeMs(
        candidate.category
      );

    const protectedUntil =
      nowMs + minimumDisplayMs;

    const utteranceExpiresAt =
      nowMs + utteranceLifetimeMs;

    setCurrentUtterance({
      text: translated,
      source: "brain",
      decisionId: candidate.id,
      shownAt: nowMs,
      protectedUntil,
      priority:
        candidate.priority,
      expiresAt:
        utteranceExpiresAt,
    });

    companionLiveAudit(
      "UTTERANCE_SHOWN",
      {
        candidateId:
          candidate.id,
        category:
          candidate.category,
        priority:
          candidate.priority,
        emotion:
          candidate.emotion,
        reason:
          candidate.reason,
        translationKey:
          candidate.translationKey,
        text:
          translated,
        shownAt:
          new Date(
            nowMs
          ).toISOString(),
        protectedUntil:
          new Date(
            protectedUntil
          ).toISOString(),
        expiresAt:
          new Date(
            utteranceExpiresAt
          ).toISOString(),
        previousSource:
          currentUtterance.source,
        previousDecisionId:
          currentUtterance.decisionId,
      }
    );

    /**
     * Só agora marcamos a decisão como mostrada.
     */
    markCompanionDecisionShown(
      companionBrainDecision,
      "home_opened"
    );

    companionLiveAudit(
      "DECISION_MARKED_SHOWN",
      {
        candidateId:
          candidate.id,
        category:
          candidate.category,
      }
    );
  }, [
    companionBrainDecision?.candidate.id,
    companionBrainDecision?.candidate.translationKey,
    currentUtterance.source,
    currentUtterance.decisionId,
    currentUtterance.protectedUntil,
    currentUtterance.priority,
    t,
  ]);


  // CONFIA_FASE10C_UTTERANCE_EXPIRATION
  /**
   * ==========================================================
   * EXPIRAÇÃO NATURAL DA FALA
   * ==========================================================
   *
   * Uma fala do cérebro não deve permanecer para sempre.
   * Quando termina o seu lifetime, regressamos ao fallback
   * atualmente válido.
   */
  useEffect(() => {
    if (
      currentUtterance.source !== "brain" ||
      typeof currentUtterance.expiresAt !==
        "number"
    ) {
      return;
    }

    const remainingMs =
      currentUtterance.expiresAt -
      Date.now();

    if (remainingMs <= 0) {
      setCurrentUtterance({
        text: proposedCompanionMessage,
        source: "fallback",
      });

      return;
    }

    const timeoutId =
      window.setTimeout(() => {
        setCurrentUtterance(current => {
          /**
           * Se entretanto entrou outra fala,
           * este timeout antigo não lhe toca.
           */
          if (
            current.source !== "brain" ||
            current.decisionId !==
              currentUtterance.decisionId
          ) {
            return current;
          }

          companionLiveAudit(
            "UTTERANCE_EXPIRED",
            {
              candidateId:
                current.decisionId,
              previousText:
                current.text,
              fallbackText:
                proposedCompanionMessage,
            }
          );

          return {
            text: proposedCompanionMessage,
            source: "fallback",
          };
        });
      }, remainingMs);

    return () => {
      window.clearTimeout(
        timeoutId
      );
    };
  }, [
    currentUtterance.source,
    currentUtterance.decisionId,
    currentUtterance.expiresAt,
    proposedCompanionMessage,
  ]);

  /**
   * O restante componente continua a consumir
   * companionMessage normalmente.
   *
   * A diferença é que agora a mensagem vem de uma
   * fala persistente e não diretamente de cada render.
   */
  const companionMessage =
    currentUtterance.text;

  /**
   * A3.4 — apresentação contextual.
   *
   * A mesma decisão que controla a expressão da criatura
   * controla também a atmosfera e o balão.
   */
  const reactionState =
    companionReaction?.state ?? "neutral";

  const reactionIntensity =
    companionReaction?.visualIntensity ?? "quiet";

  const atmosphereClass =
    reactionState === "supportive"
      ? "bg-[#F3DDD4]/30"
      : reactionState === "curious"
        ? "bg-[#F4E4C9]/30"
        : reactionState === "welcoming"
          ? "bg-[#F7DFD2]/34"
          : reactionState === "celebrating"
            ? "bg-[#F2D3C3]/38"
            : "bg-[#F7DFD2]/25";

  const bubbleClass =
    reactionState === "supportive"
      ? "border-[#E8CFC5]/80 bg-[#FFFBF9]/95"
      : reactionState === "curious"
        ? "border-[#E8D8BD]/80 bg-[#FFFDF8]/95"
        : reactionState === "welcoming"
          ? "border-[#E9D1C5]/80 bg-white/95"
          : reactionState === "celebrating"
            ? "border-[#E6C2B2]/85 bg-[#FFFBF8]/95"
            : "border-[#E9D9D1]/70 bg-white/92";

  const bubbleShadow =
    reactionIntensity === "strong"
      ? "shadow-[0_13px_32px_rgba(89,58,45,0.09)]"
      : reactionIntensity === "normal"
        ? "shadow-[0_11px_29px_rgba(89,58,45,0.072)]"
        : "shadow-[0_10px_28px_rgba(89,58,45,0.055)]";

  const statusDot =
    worldMood === "growing"
      ? "bg-emerald-400"
      : worldMood === "settling"
        ? "bg-amber-400"
        : worldMood === "discovering"
          ? "bg-sky-400"
          : "bg-[#D89A80]";

  return (
    <section
      className="
        relative
        isolate
        px-1
        pt-1
        pb-2
      "
      aria-label={t("companion")}
    >
      {/* ====================================================
          ATMOSFERA

          Não é uma caixa.
          É apenas profundidade visual atrás da criatura.
      ==================================================== */}

      <div
        aria-hidden="true"
        className={`
          pointer-events-none
          absolute
          left-1/2
          top-[44%]
          -z-10
          h-[310px]
          w-[310px]
          -translate-x-1/2
          -translate-y-1/2
          rounded-full
          ${atmosphereClass}
          blur-3xl
        `}
      />

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          left-[20%]
          top-[36%]
          -z-10
          h-28
          w-28
          rounded-full
          bg-white/65
          blur-3xl
        "
      />

      {/* ====================================================
          CABEÇALHO
      ==================================================== */}

      <div
        className="
          relative
          z-10
          flex
          items-start
          justify-between
          px-2
          pt-1
        "
      >
        <div>
          <div
            className="
              flex
              items-center
              gap-2
            "
          >
            <span
              aria-hidden="true"
              className={`
                h-2
                w-2
                rounded-full
                ${statusDot}
              `}
            />

            <span
              className="
                text-[9px]
                font-black
                uppercase
                tracking-[0.2em]
                text-[#C97B5E]
              "
            >
              CONFIA
            </span>
          </div>

          <h2
            className="
              mt-1
              text-[21px]
              font-black
              tracking-[-0.035em]
              text-[#4E3B36]
            "
          >
            {t("companion")}
          </h2>
        </div>

        {/* único indicador de nível */}
        <div
          className="
            flex
            items-center
            gap-1.5
            rounded-full
            border border-[#E9D9D1]/70
            bg-white/72
            px-3
            py-1.5
            shadow-[0_5px_16px_rgba(89,58,45,0.04)]
            backdrop-blur-sm
          "
        >
          <Sparkles
            size={11}
            strokeWidth={2}
            className="text-[#C97B5E]"
          />

          <span
            className="
              text-[10px]
              font-black
              text-[#76584D]
            "
          >
            {t("level")} {avatar.level}
          </span>
        </div>
      </div>

      {/* ====================================================
          CRIATURA LIVRE
      ==================================================== */}

      <div
        className="
          relative
          z-10
          flex
          min-h-[270px]
          items-center
          justify-center
          -mt-1
        "
      >
        {/* sombra física subtil */}
        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            bottom-[18px]
            left-1/2
            h-7
            w-40
            -translate-x-1/2
            rounded-[50%]
            bg-[#765143]/[0.055]
            blur-lg
          "
        />

        <Avatar
          avatar={avatar}
          onPet={handlePetAvatar}
          levelUpTrigger={avatarCelebrating}
          moodRating={currentMoodRating}
          memoryMessage={avatarMemoryMessage}
          companionWorldMood={worldMood}
          reactionState={
            companionReaction?.state
          }
          equippedAccessoryIds={
            equippedAccessoryIds
          }
        />
      </div>

      {/* ====================================================
          BALÃO DE FALA

          Esta será a principal superfície da voz da CONFIA.
          No A3, o conteúdo passa a ser escolhido pelo motor
          reativo de amizade.
      ==================================================== */}

      <div
        className="
          relative
          z-20
          mx-2
          -mt-2
        "
      >
        {/* cauda do balão */}
        <div
          aria-hidden="true"
          className="
            absolute
            left-1/2
            top-[-7px]
            h-4
            w-4
            -translate-x-1/2
            rotate-45
            border-l
            border-t
            border-[#E9D9D1]/60
            bg-[#FFFCFA]
          "
        />

        <div
          className={`
            relative
            rounded-[24px]
            border
            ${bubbleClass}
            px-5
            py-4
            ${bubbleShadow}
            backdrop-blur-sm
          `}
        >
          <p
            className="
              text-center
              text-[13px]
              font-semibold
              leading-[1.55]
              text-[#674D44]
            "
          >
            {companionMessage}
          </p>

          {companionRelationalNextStep && (
            <div className="mt-3 flex justify-center">
              <button
                type="button"
                onClick={() =>
                  onCompanionAction(
                    companionRelationalNextStep.target
                  )
                }
                className="
                  rounded-full
                  border
                  border-[#E5C9BC]
                  bg-[#FFF8F4]
                  px-4
                  py-2
                  text-[11px]
                  font-extrabold
                  text-[#A86450]
                  shadow-sm
                  transition
                  active:scale-[0.98]
                "
              >
                {t(
                  companionRelationalNextStep.translationKey
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ====================================================
          EVOLUÇÃO

          Sem outro badge de nível.
          Apenas progresso visual.
      ==================================================== */}

      <div
        className="
          relative
          z-10
          px-4
          pt-4
          pb-1
        "
      >
        <div
          className="
            mb-2
            flex
            items-center
            justify-end
          "
        >
          <span
            className="
              text-[10px]
              font-black
              text-[#C97B5E]
            "
          >
            {progress}%
          </span>
        </div>

        <div
          className="
            h-1.5
            overflow-hidden
            rounded-full
            bg-[#EDE2DC]
          "
        >
          <div
            className="
              h-full
              rounded-full
              bg-gradient-to-r
              from-[#D99879]
              via-[#C97B5E]
              to-[#B45E4C]
              transition-[width]
              duration-500
              ease-out
            "
            style={{
              width: `${progress}%`,
            }}
          />
        </div>
      </div>
    </section>
  );
}

export default memo(ConfiaCompanionHome);
