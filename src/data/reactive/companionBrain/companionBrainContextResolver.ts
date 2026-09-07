import {
  getActiveCompanionConversationThread,
} from "./companionBrainMemory";
import {
  hasCompanionConversationAnchorBeenUsed,
} from "./companionBrainMemory";
import type {
  CompanionBrainCandidate,
} from "./companionBrainTypes";

import type {
  CompanionBrainContext,
} from "./companionBrainContext";

import {
  COMPANION_PRIORITY,
} from "./companionBrainPriorities";

/**
 * ============================================================
 * CONFIA — COMPANION BRAIN
 * RESOLUÇÃO CONTEXTUAL
 * ============================================================
 *
 * As regras identificam sinais isolados.
 *
 * Este resolver interpreta combinações desses sinais para
 * evitar respostas contraditórias ou pouco humanas.
 *
 * Exemplo:
 *
 * manhã = 3
 * tarde = 6
 *
 * Não queremos:
 * "Começaste em baixo..."
 *
 * Queremos:
 * "Começaste mais em baixo, mas entretanto melhoraste.
 *  Alguma coisa ajudou?"
 */

function withoutIds(
  candidates: CompanionBrainCandidate[],
  ids: string[]
): CompanionBrainCandidate[] {
  return candidates.filter(
    candidate => !ids.includes(candidate.id)
  );
}


/**
 * ============================================================
 * CONFIA — COMPANION VIVO
 * FASE 11B — CONTINUIDADE CONVERSACIONAL
 * ============================================================
 *
 * Só tratamos uma fala anterior como parte da conversa
 * atual quando foi realmente mostrada há pouco tempo.
 *
 * Não usamos a hora da decisão.
 * Usamos shownAt: a hora em que chegou ao utilizador.
 */
function isPreviousCompanionMessageRecent(
  shownAt: string | undefined,
  now: Date,
  minutes: number = 45
): boolean {
  if (!shownAt) {
    return false;
  }

  const timestamp =
    new Date(
      shownAt
    ).getTime();

  if (
    !Number.isFinite(timestamp)
  ) {
    return false;
  }

  const ageMs =
    now.getTime() -
    timestamp;

  return (
    ageMs >= 0 &&
    ageMs <=
      minutes *
        60 *
        1000
  );
}

export function resolveCompanionContext(
  context: CompanionBrainContext,
  candidates: CompanionBrainCandidate[]
): CompanionBrainCandidate[] {

  // CONFIA_COMPANION_CONVERSATIONAL_CONTINUITY_11B
  /**
   * ==========================================================
   * CONTINUIDADE CONVERSACIONAL
   * ==========================================================
   *
   * O Companion não deve fingir uma conversa que não existiu.
   *
   * Só criamos continuidade quando:
   *
   * 1. houve realmente uma fala anterior;
   * 2. essa fala é recente;
   * 3. a intenção anterior está semanticamente relacionada
   *    com a nova situação.
   */
  const previousShownMessage =
    context.previousShownMessage;

  const hasRecentPreviousSpeech =
    isPreviousCompanionMessageRecent(
      previousShownMessage?.shownAt,
      context.now,
      45
    );

  /**
   * FASE 11C:
   *
   * Uma fala anterior deixa de poder abrir novas
   * continuações depois de já ter sido utilizada
   * como âncora.
   */
  const activeConversationThread =
    getActiveCompanionConversationThread();

  const previousSpeechAvailableAsAnchor =
    Boolean(
      previousShownMessage &&
      !hasCompanionConversationAnchorBeenUsed(
        previousShownMessage.id
      ) &&
      (
        !activeConversationThread ||
        activeConversationThread.anchorMessageId ===
          previousShownMessage.id
      )
    );

  if (
    previousShownMessage &&
    hasRecentPreviousSpeech &&
    previousSpeechAvailableAsAnchor
  ) {
    const previousId =
      previousShownMessage.id;

    /**
     * --------------------------------------------------------
     * A. MANHÃ DIFÍCIL → RECUPERAÇÃO
     * --------------------------------------------------------
     *
     * Antes:
     * "A manhã parece ter começado difícil."
     *
     * Agora:
     * reconhecemos que algo mudou desde essa conversa.
     */
    if (
      (
        previousId ===
          "morning_low_followup" ||
        previousId ===
          "longitudinal_repeated_low_mornings"
      ) &&
      context.morningCompleted &&
      context.afternoonCompleted &&
      typeof context.morningRating ===
        "number" &&
      typeof context.afternoonRating ===
        "number" &&
      context.afternoonRating -
        context.morningRating >= 2
    ) {
      candidates = candidates.filter(
        candidate =>
          candidate.id !==
            "low_morning_recovered" &&
          candidate.id !==
            "mood_improved_today"
      );

      candidates.push({
        id:
          "conversation_morning_recovery",
        translationKey:
          "companionBrain.conversationMorningRecovery",
        category: "mood_change",
        emotion: "encouraging",
        priority: 97,
        reason:
          "A recent conversation about a difficult morning is now followed by a clearly better afternoon rating.",
        cooldownMinutes: 480,
        metadata: {
          conversationalContinuity:
            true,
          previousMessageId:
            previousId,
          conversationAnchorId:
            previousId,
        },
      });
    }

    /**
     * --------------------------------------------------------
     * B. QUEDA DE HUMOR → RECUPERAÇÃO POSTERIOR
     * --------------------------------------------------------
     */
    if (
      (
        previousId ===
          "mood_declined_today" ||
        previousId ===
          "day_became_harder"
      ) &&
      context.morningCompleted &&
      context.afternoonCompleted &&
      typeof context.morningRating ===
        "number" &&
      typeof context.afternoonRating ===
        "number" &&
      context.afternoonRating >
        context.morningRating
    ) {
      candidates.push({
        id:
          "conversation_after_harder_moment",
        translationKey:
          "companionBrain.conversationAfterHarderMoment",
        category: "mood_change",
        emotion: "encouraging",
        priority: 96,
        reason:
          "A recent conversation about a harder moment is followed by a better current mood signal.",
        cooldownMinutes: 480,
        metadata: {
          conversationalContinuity:
            true,
          previousMessageId:
            previousId,
          conversationAnchorId:
            previousId,
        },
      });
    }

    /**
     * --------------------------------------------------------
     * C. IMPULSO → CONTINUIDADE
     * --------------------------------------------------------
     *
     * Não afirmamos que o Impulso provocou a melhoria.
     * Apenas reconhecemos que já falámos desse momento
     * e que o contexto atual parece diferente.
     */
    if (
      (
        previousShownMessage.category ===
          "impulse_followup" ||
        previousId ===
          "recent_impulse_followup" ||
        previousId ===
          "session_support_after_impulse" ||
        previousId ===
          "impulse_and_mood_decline"
      ) &&
      context.morningCompleted &&
      context.afternoonCompleted &&
      typeof context.morningRating ===
        "number" &&
      typeof context.afternoonRating ===
        "number" &&
      context.afternoonRating >
        context.morningRating
    ) {
      candidates.push({
        id:
          "conversation_after_impulse_improvement",
        translationKey:
          "companionBrain.conversationAfterImpulseImprovement",
        category: "progress",
        emotion: "warm",
        priority: 88,
        reason:
          "A recent Impulso-related conversation is followed by a better mood signal, without assuming causality.",
        cooldownMinutes: 480,
        metadata: {
          conversationalContinuity:
            true,
          previousMessageId:
            previousId,
          conversationAnchorId:
            previousId,
        },
      });
    }
  }


  let resolved = [...candidates];

  /**
   * ==========================================================
   * CONFIA — FASE 12F
   * HERANÇA TEMPORAL EM CANDIDATOS COMPOSTOS
   * ==========================================================
   *
   * O Context Resolver substitui por vezes candidatos simples
   * por observações semanticamente mais fortes.
   *
   * Ao fazer isso, não devemos perder o evento REAL que
   * originou o candidato inicial.
   */

  const readCandidateMetadataString = (
    candidate:
      | CompanionBrainCandidate
      | undefined,
    key: string
  ): string | undefined => {
    const value =
      candidate?.metadata?.[key];

    return typeof value === "string"
      ? value
      : undefined;
  };

  const readCandidateEventSource = (
    candidate:
      | CompanionBrainCandidate
      | undefined
  ):
    | {
        type: string;
        timestamp: string;
      }
    | undefined => {
    const type =
      readCandidateMetadataString(
        candidate,
        "sourceEventType"
      );

    const timestamp =
      readCandidateMetadataString(
        candidate,
        "sourceEventTimestamp"
      );

    if (
      !type ||
      !timestamp
    ) {
      return undefined;
    }

    const time =
      new Date(timestamp).getTime();

    if (!Number.isFinite(time)) {
      return undefined;
    }

    return {
      type,
      timestamp,
    };
  };

  const getNewestRealEventSource = (
    sources: Array<
      | {
          type: string;
          timestamp: string;
        }
      | undefined
    >
  ):
    | {
        type: string;
        timestamp: string;
      }
    | undefined => {
    return sources
      .filter(
        (
          source
        ): source is {
          type: string;
          timestamp: string;
        } =>
          Boolean(source)
      )
      .sort(
        (a, b) =>
          new Date(
            b.timestamp
          ).getTime() -
          new Date(
            a.timestamp
          ).getTime()
      )[0];
  };

  const morning =
    context.morningRating;

  const afternoon =
    context.afternoonRating;

  const bothCompleted =
    context.morningCompleted &&
    context.afternoonCompleted &&
    morning !== undefined &&
    afternoon !== undefined;

  /**
   * ----------------------------------------------------------
   * 1. RECUPERAÇÃO AO LONGO DO DIA
   * ----------------------------------------------------------
   *
   * Uma manhã baixa deixa de ser o tema dominante se
   * a tarde demonstrar melhoria clara.
   */
  if (
    bothCompleted &&
    morning <= 3 &&
    afternoon - morning >= 2
  ) {
    const moodImprovedSource =
      readCandidateEventSource(
        resolved.find(
          candidate =>
            candidate.id ===
            "mood_improved_today"
        )
      );

    resolved = withoutIds(
      resolved,
      [
        "morning_low_followup",
        "mood_improved_today",
        "stable_day_observation",
      ]
    );

    resolved.push({
      id: "low_morning_recovered",
      translationKey:
        "companionBrain.lowMorningRecovered",
      category: "mood_change",
      emotion: "encouraging",
      priority:
        COMPANION_PRIORITY.IMPORTANT_MOOD_CHANGE + 10,
      reason:
        "Morning mood was low but improved clearly later.",
      cooldownMinutes: 480,
      metadata: {
        morningRating: morning,
        afternoonRating: afternoon,

        ...(moodImprovedSource
          ? {
              sourceEventTimestamp:
                moodImprovedSource.timestamp,
              sourceEventType:
                moodImprovedSource.type,
            }
          : {}),
      },
    });
  }

  /**
   * ----------------------------------------------------------
   * 2. AGRAVAMENTO DURANTE O DIA
   * ----------------------------------------------------------
   *
   * Se o utilizador começou melhor e caiu bastante,
   * falamos da mudança atual em vez de usar mensagens
   * genéricas sobre o dia.
   */
  if (
    bothCompleted &&
    morning >= 5 &&
    morning - afternoon >= 2
  ) {
    const moodDeclinedSource =
      readCandidateEventSource(
        resolved.find(
          candidate =>
            candidate.id ===
            "mood_declined_today"
        )
      );

    resolved = withoutIds(
      resolved,
      [
        "mood_declined_today",
        "stable_day_observation",
      ]
    );

    resolved.push({
      id: "day_became_harder",
      translationKey:
        "companionBrain.dayBecameHarder",
      category: "emotional_followup",
      emotion: "concerned",
      priority:
        COMPANION_PRIORITY.EMOTIONAL_FOLLOWUP + 5,
      reason:
        "Mood became clearly worse later in the day.",
      cooldownMinutes: 480,
      metadata: {
        morningRating: morning,
        afternoonRating: afternoon,

        ...(moodDeclinedSource
          ? {
              sourceEventTimestamp:
                moodDeclinedSource.timestamp,
              sourceEventType:
                moodDeclinedSource.type,
            }
          : {}),
      },
    });
  }

  // COMPANION_COMPOSITION_IMPULSE_DECLINE
  /**
   * ----------------------------------------------------------
   * 2B. IMPULSO RECENTE + AGRAVAMENTO
   * ----------------------------------------------------------
   *
   * Estes sinais pertencem ao mesmo momento emocional.
   * Não escolhemos apenas um deles: criamos uma observação
   * composta.
   */
  const recentImpulseCandidate =
    resolved.find(
      candidate =>
        candidate.id ===
        "recent_impulse_followup"
    );

  const dayBecameHarderCandidate =
    resolved.find(
      candidate =>
        candidate.id ===
        "day_became_harder"
    );

  const hasRecentImpulse =
    Boolean(
      recentImpulseCandidate
    );

  const hasDayBecameHarder =
    Boolean(
      dayBecameHarderCandidate
    );

  if (
    hasRecentImpulse &&
    hasDayBecameHarder
  ) {
    const impulseSource =
      readCandidateEventSource(
        recentImpulseCandidate
      );

    const moodSource =
      readCandidateEventSource(
        dayBecameHarderCandidate
      );

    /**
     * O ranking atual aceita uma origem principal.
     *
     * Usamos simplesmente o evento REAL mais recente.
     * As duas origens completas ficam preservadas
     * em metadata para evolução posterior.
     */
    const newestCompositeSource =
      getNewestRealEventSource([
        impulseSource,
        moodSource,
      ]);
    resolved = withoutIds(
      resolved,
      [
        "recent_impulse_followup",
        "day_became_harder",
        "mood_declined_today",
      ]
    );

    resolved.push({
      id: "impulse_and_mood_decline",
      translationKey:
        "companionBrain.impulseAndMoodDecline",
      category: "emotional_followup",
      emotion: "concerned",
      priority:
        COMPANION_PRIORITY.EMOTIONAL_FOLLOWUP + 10,
      reason:
        "Recent impulse and a clear mood decline happened in the same context.",
      cooldownMinutes: 480,

      /**
       * CONFIA — FASE 12H
       *
       * O composto só é contextualmente atual enquanto
       * o Impulso que participa nele continuar dentro
       * da mesma janela de 30 minutos usada pelas regras.
       *
       * Isto não afirma causalidade entre Impulso e Humor.
       */
      expiresAt:
        impulseSource
          ? new Date(
              new Date(
                impulseSource.timestamp
              ).getTime() +
                30 * 60 * 1000
            ).toISOString()
          : undefined,

      metadata: {
        morningRating: morning,
        afternoonRating: afternoon,

        /**
         * As duas origens reais permanecem disponíveis.
         */
        ...(moodSource
          ? {
              moodSourceEventTimestamp:
                moodSource.timestamp,
              moodSourceEventType:
                moodSource.type,
            }
          : {}),

        ...(impulseSource
          ? {
              impulseSourceEventTimestamp:
                impulseSource.timestamp,
              impulseSourceEventType:
                impulseSource.type,
            }
          : {}),

        /**
         * Compatibilidade com o ranking temporal atual:
         * evento real mais recente entre os dois.
         */
        ...(newestCompositeSource
          ? {
              sourceEventTimestamp:
                newestCompositeSource.timestamp,
              sourceEventType:
                newestCompositeSource.type,
              compositeTemporalSource: true,
            }
          : {}),
      },
    });
  }


  /**
   * ----------------------------------------------------------
   * 3. IMPULSO RECENTE GANHA A MENSAGENS OPERACIONAIS
   * ----------------------------------------------------------
   *
   * Se houve Impulso/SOS recente, não interrompemos com
   * mensagens genéricas de preenchimento ou atividade.
   */
  const hasImpulseFollowup =
    resolved.some(
      candidate =>
        candidate.id === "recent_impulse_followup"
    );

  if (hasImpulseFollowup) {
    resolved = resolved.filter(candidate => {
      if (
        candidate.id === "recent_impulse_followup"
      ) {
        return true;
      }

      return ![
        "morning_not_started",
        "missing_morning_afternoon",
        "afternoon_not_completed",
        "active_session_observation",
        "returned_after_break",
      ].includes(candidate.id);
    });
  }

  /**
   * ----------------------------------------------------------
   * 4. FOLLOW-UP EMOCIONAL GANHA A MENSAGENS CASUAIS
   * ----------------------------------------------------------
   */
  const hasImportantEmotionalCandidate =
    resolved.some(
      candidate =>
        candidate.category === "emotional_followup" &&
        candidate.priority >=
          COMPANION_PRIORITY.IMPORTANT_MOOD_CHANGE
    );

  if (hasImportantEmotionalCandidate) {
    resolved = resolved.filter(candidate => {
      if (
        candidate.category === "casual" ||
        candidate.category === "discovery"
      ) {
        return false;
      }

      return true;
    });
  }


  // CONFIA_LONGITUDINAL_PRESENT_OVERRIDES_PAST
  /**
   * ----------------------------------------------------------
   * 4B. O PRESENTE GANHA AO PASSADO
   * ----------------------------------------------------------
   *
   * Uma observação de 7 dias nunca deve substituir uma
   * situação emocional imediata.
   *
   * Exemplos:
   *
   * Hoje caiu 7 → 4
   * + semana a melhorar
   *
   * NÃO:
   * "Os últimos dias parecem melhores."
   *
   * SIM:
   * "Parece que hoje ficou mais difícil."
   */
  const hasImmediateImportantContext =
    resolved.some(candidate => {
      const isLongitudinal =
        candidate.metadata?.longitudinal === true;

      if (isLongitudinal) {
        return false;
      }

      return (
        candidate.category ===
          "emotional_followup" ||
        candidate.category ===
          "impulse_followup" ||
        (
          candidate.category ===
            "mood_change" &&
          candidate.priority >= 85
        )
      );
    });

  if (hasImmediateImportantContext) {
    resolved =
      resolved.filter(candidate => {
        return (
          candidate.metadata?.longitudinal
          !== true
        );
      });
  }


  /**
   * ----------------------------------------------------------
   * 5. DEDUPLICAÇÃO SEMÂNTICA SIMPLES
   * ----------------------------------------------------------
   *
   * Nesta fase mantemos no máximo uma mensagem por categoria,
   * escolhendo a mais prioritária.
   */
  const bestByCategory =
    new Map<string, CompanionBrainCandidate>();

  for (const candidate of resolved) {
    const existing =
      bestByCategory.get(candidate.category);

    if (
      !existing ||
      candidate.priority > existing.priority
    ) {
      bestByCategory.set(
        candidate.category,
        candidate
      );
    }
  }

  return Array.from(
    bestByCategory.values()
  );
}
