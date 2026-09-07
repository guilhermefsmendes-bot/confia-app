import {
  interpretCompanionSession,
} from "./companionBrainSessionInterpreter";

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
 * CONFIA — COMPANION BRAIN
 *
 * PRIMEIRAS REGRAS CONTEXTUAIS
 *
 * Objetivo:
 * transformar contexto simples em pensamentos candidatos.
 *
 * Nesta fase privilegiamos frases curtas,
 * observacionais e humanas.
 */

function minutesSince(
  isoDate: string | undefined,
  now: Date
): number | null {
  if (!isoDate) return null;

  const timestamp = new Date(isoDate).getTime();

  if (Number.isNaN(timestamp)) {
    return null;
  }

  return Math.floor(
    (now.getTime() - timestamp) / 60000
  );
}


/**
 * ============================================================
 * CONFIA — COMPANION VIVO
 * FASE 8C — VARIANTES ESTÁVEIS
 * ============================================================
 *
 * O mesmo evento escolhe sempre a mesma variante.
 * Um novo evento possui outro ID e pode escolher
 * outra frase.
 */
function selectCompanionVariant(
  eventId: string,
  translationKeys: string[]
): string {
  let hash = 0;

  for (let i = 0; i < eventId.length; i += 1) {
    hash =
      ((hash << 5) - hash) +
      eventId.charCodeAt(i);

    hash |= 0;
  }

  return translationKeys[
    Math.abs(hash) % translationKeys.length
  ];
}

export function buildCompanionCandidates(
  context: CompanionBrainContext
): CompanionBrainCandidate[] {
  const candidates: CompanionBrainCandidate[] = [];

  // CONFIA_COMPANION_CROSS_MEMORY_RULES_9D
  /**
   * ==========================================================
   * FASE 9D — MEMÓRIA CRUZADA
   * HUMOR + IMPULSO
   * ==========================================================
   *
   * O cérebro reconhece coexistência repetida de sinais
   * provenientes de fontes diferentes.
   *
   * CORRELAÇÃO NÃO É CAUSALIDADE.
   */
  const crossMemory =
    context.crossMemory;

  if (
    crossMemory?.hasEnoughData
  ) {

    /**
     * --------------------------------------------------------
     * 1. MANHÃ BAIXA + IMPULSO EM VÁRIOS DIAS
     * --------------------------------------------------------
     */
    if (
      crossMemory
        .repeatedLowMorningWithImpulse
    ) {
      candidates.push({
        id:
          "cross_low_morning_impulse",
        translationKey:
          "companionBrain.crossLowMorningImpulse",
        category: "discovery",
        emotion: "curious",
        priority: 71,
        reason:
          "Low morning ratings and Impulso use occurred on the same day more than once.",
        cooldownMinutes: 4320,
        metadata: {
          longitudinal: true,
          crossMemory: true,
          lowMorningAndImpulseDays:
            crossMemory
              .lowMorningAndImpulseDays,
        },
      });
    }

    /**
     * --------------------------------------------------------
     * 2. IMPULSO + MELHORIA ENTRE MANHÃ E TARDE
     * --------------------------------------------------------
     *
     * Não afirmamos que o Impulso causou a melhoria.
     */
    if (
      crossMemory
        .repeatedImpulseRecovery
    ) {
      candidates.push({
        id:
          "cross_impulse_recovery",
        translationKey:
          "companionBrain.crossImpulseRecovery",
        category: "progress",
        emotion: "curious",
        priority: 74,
        reason:
          "Impulso use and a meaningful same-day improvement between morning and afternoon co-occurred more than once.",
        cooldownMinutes: 4320,
        metadata: {
          longitudinal: true,
          crossMemory: true,
          impulseAndRecoveryDays:
            crossMemory
              .impulseAndRecoveryDays,
        },
      });
    }

    /**
     * --------------------------------------------------------
     * 3. PADRÃO CRUZADO MAIS ESPECÍFICO
     * --------------------------------------------------------
     *
     * Manhã baixa + Impulso + tarde >= manhã + 2,
     * em pelo menos dois dias.
     *
     * É a observação cruzada mais forte desta fase.
     */
    if (
      crossMemory
        .repeatedLowMorningImpulseRecovery
    ) {
      candidates.push({
        id:
          "cross_low_morning_impulse_recovery",
        translationKey:
          "companionBrain.crossLowMorningImpulseRecovery",
        category: "progress",
        emotion: "encouraging",
        priority: 79,
        reason:
          "Low morning ratings, Impulso use and a later higher afternoon rating co-occurred on multiple recent days.",
        cooldownMinutes: 5760,
        metadata: {
          longitudinal: true,
          crossMemory: true,
          lowMorningImpulseRecoveryDays:
            crossMemory
              .lowMorningImpulseRecoveryDays,
        },
      });
    }
  }


  // CONFIA_COMPANION_LONGITUDINAL_IMPULSE_RULES_9C
  /**
   * ==========================================================
   * CONFIA — FASE 9C
   * MEMÓRIA LONGITUDINAL DO IMPULSO
   * ==========================================================
   *
   * Observações dos últimos 7 dias.
   * Não são diagnósticos nem garantias de eficácia futura.
   */
  const longitudinalImpulse =
    context.longitudinalImpulse;

  if (
    longitudinalImpulse?.hasEnoughData
  ) {

    /**
     * Utilização repetida.
     */
    if (
      longitudinalImpulse.repeatedUse
    ) {
      candidates.push({
        id:
          "longitudinal_impulse_repeated_use",
        translationKey:
          "companionBrain.longitudinalImpulseRepeatedUse",
        category: "discovery",
        emotion: "curious",
        priority: 64,
        reason:
          "The Impulso was used repeatedly during the recent seven-day window.",
        cooldownMinutes: 2880,
        metadata: {
          longitudinal: true,
          longitudinalImpulse: true,
          episodeCount:
            longitudinalImpulse.episodeCount,
        },
      });
    }

    /**
     * Redução de intensidade repetida.
     */
    if (
      longitudinalImpulse
        .repeatedEffectiveness
    ) {
      candidates.push({
        id:
          "longitudinal_impulse_repeated_effectiveness",
        translationKey:
          "companionBrain.longitudinalImpulseRepeatedEffectiveness",
        category: "progress",
        emotion: "encouraging",
        priority: 68,
        reason:
          "Several recent Impulso episodes were followed by a meaningful reduction in intensity.",
        cooldownMinutes: 2880,
        metadata: {
          longitudinal: true,
          longitudinalImpulse: true,
          effectiveEpisodeCount:
            longitudinalImpulse
              .effectiveEpisodeCount,
          averageReduction:
            longitudinalImpulse
              .averageReduction,
        },
      });
    }

    /**
     * Mesmo percurso associado a redução significativa
     * mais do que uma vez.
     */
    if (
      longitudinalImpulse
        .repeatedEffectiveNeed
    ) {
      candidates.push({
        id:
          "longitudinal_impulse_effective_path",
        translationKey:
          "companionBrain.longitudinalImpulseEffectivePath",
        category: "progress",
        emotion: "encouraging",
        priority: 73,
        reason:
          "The same Impulso support path was associated with meaningful intensity reduction more than once.",
        cooldownMinutes: 4320,
        metadata: {
          longitudinal: true,
          longitudinalImpulse: true,
          effectiveNeed:
            longitudinalImpulse
              .effectiveNeed,
          effectiveNeedCount:
            longitudinalImpulse
              .effectiveNeedCount,
        },
      });
    }
  }


  

  // CONFIA_COMPANION_PATTERN_RELEVANCE_9E
  /**
   * ==========================================================
   * FASE 9E — RELEVÂNCIA TEMPORAL
   * ==========================================================
   *
   * Um padrão pode continuar armazenado mas deixar
   * de representar o presente do utilizador.
   */

  const longitudinalRelevance =
    context.longitudinalMood;

  if (
    longitudinalRelevance.hasEnoughData
  ) {

    /**
     * --------------------------------------------------------
     * MANHÃS BAIXAS — PADRÃO A MUDAR
     * --------------------------------------------------------
     */
    if (
      longitudinalRelevance
        .lowMorningRelevance ===
          "changing"
    ) {
      candidates.push({
        id:
          "longitudinal_low_mornings_changing",
        translationKey:
          "companionBrain.longitudinalLowMorningsChanging",
        category: "progress",
        emotion: "encouraging",
        priority: 63,
        reason:
          "A previously repeated low-morning pattern appears less present in the most recent records.",
        cooldownMinutes: 4320,
        metadata: {
          longitudinal: true,
          temporalRelevance: "changing",
        },
      });
    }

    /**
     * --------------------------------------------------------
     * MANHÃS BAIXAS — PADRÃO ULTRAPASSADO
     * --------------------------------------------------------
     *
     * Só é mencionado uma vez com cooldown longo.
     * Depois deixa naturalmente de competir.
     */
    if (
      longitudinalRelevance
        .lowMorningRelevance ===
          "outdated"
    ) {
      candidates.push({
        id:
          "longitudinal_low_mornings_outdated",
        translationKey:
          "companionBrain.longitudinalLowMorningsOutdated",
        category: "progress",
        emotion: "encouraging",
        priority: 58,
        reason:
          "A previously repeated low-morning pattern is absent from the most recent records.",
        cooldownMinutes: 10080,
        metadata: {
          longitudinal: true,
          temporalRelevance: "outdated",
        },
      });
    }

    /**
     * --------------------------------------------------------
     * RECUPERAÇÕES — PADRÃO A MUDAR
     * --------------------------------------------------------
     */
    if (
      longitudinalRelevance
        .recoveryRelevance ===
          "changing"
    ) {
      candidates.push({
        id:
          "longitudinal_recovery_pattern_changing",
        translationKey:
          "companionBrain.longitudinalRecoveryChanging",
        category: "discovery",
        emotion: "curious",
        priority: 52,
        reason:
          "A previously repeated same-day recovery pattern is appearing less often in recent records.",
        cooldownMinutes: 4320,
        metadata: {
          longitudinal: true,
          temporalRelevance: "changing",
        },
      });
    }
  }

// CONFIA_COMPANION_LONGITUDINAL_RULES_9B
  /**
   * ==========================================================
   * CONFIA — FASE 9B
   * MEMÓRIA ENTRE DIAS
   * ==========================================================
   *
   * O cérebro pode agora transformar a memória factual
   * dos últimos 7 dias em candidatos de fala.
   *
   * IMPORTANTE:
   * - não diagnostica;
   * - não inventa causas;
   * - exige dados suficientes;
   * - acontecimentos atuais continuam prioritários.
   */
  const longitudinal =
    context.longitudinalMood;

  if (
    longitudinal.hasEnoughData
  ) {

    /**
     * --------------------------------------------------------
     * 1. TENDÊNCIA RECENTE DE MELHORIA
     * --------------------------------------------------------
     */
    if (
      longitudinal.trend === "improving"
    ) {
      candidates.push({
        id: "longitudinal_mood_improving",
        translationKey:
          "companionBrain.longitudinalMoodImproving",
        category: "progress",
        emotion: "encouraging",
        priority: 57,
        reason:
          "Recent mood records show a meaningful upward direction across several days.",
        cooldownMinutes: 1440,
        metadata: {
          longitudinal: true,
          trend:
            longitudinal.trend,
          activeDays:
            longitudinal.activeDays,
          averageDaily:
            longitudinal.averageDaily,
        },
      });
    }

    /**
     * --------------------------------------------------------
     * 2. RECUPERAÇÕES REPETIDAS NO MESMO DIA
     * --------------------------------------------------------
     *
     * Isto é particularmente interessante porque fala
     * de algo que o utilizador pode aprender sobre si:
     *
     * começar mais baixo não significa necessariamente
     * que o resto do dia seguirá da mesma forma.
     */
    if (
      longitudinal.repeatedRecoveries &&
      longitudinal.recoveryRelevance ===
        "current"
    ) {
      candidates.push({
        id: "longitudinal_repeated_recoveries",
        translationKey:
          "companionBrain.longitudinalRepeatedRecoveries",
        category: "progress",
        emotion: "encouraging",
        priority: 62,
        reason:
          "Several recent days improved meaningfully from morning to afternoon.",
        cooldownMinutes: 2880,
        metadata: {
          longitudinal: true,
          recoveryDays:
            longitudinal.recoveryDays,
        },
      });
    }

    /**
     * --------------------------------------------------------
     * 3. MANHÃS BAIXAS REPETIDAS
     * --------------------------------------------------------
     *
     * Dizemos apenas que os REGISTOS das manhãs têm
     * aparecido mais baixos.
     *
     * Não afirmamos:
     * - que existe ansiedade;
     * - que existe depressão;
     * - que as manhãs são "um problema".
     */
    if (
      longitudinal.repeatedLowMornings &&
      longitudinal.lowMorningRelevance ===
        "current"
    ) {
      candidates.push({
        id: "longitudinal_repeated_low_mornings",
        translationKey:
          "companionBrain.longitudinalRepeatedLowMornings",
        category: "mood_change",
        emotion: "curious",
        priority: 69,
        reason:
          "Several recent morning ratings were numerically low.",
        cooldownMinutes: 2880,
        metadata: {
          longitudinal: true,
          lowMorningCount:
            longitudinal.lowMorningCount,
        },
      });
    }

    /**
     * --------------------------------------------------------
     * 4. TENDÊNCIA RECENTE DESCENDENTE
     * --------------------------------------------------------
     *
     * É a observação longitudinal mais importante desta
     * primeira versão, mas continua abaixo dos follow-ups
     * emocionais imediatos.
     */
    if (
      longitudinal.trend === "declining"
    ) {
      candidates.push({
        id: "longitudinal_mood_declining",
        translationKey:
          "companionBrain.longitudinalMoodDeclining",
        category: "mood_change",
        emotion: "concerned",
        priority: 76,
        reason:
          "Recent mood records show a meaningful downward direction across several days.",
        cooldownMinutes: 1440,
        metadata: {
          longitudinal: true,
          trend:
            longitudinal.trend,
          activeDays:
            longitudinal.activeDays,
          averageDaily:
            longitudinal.averageDaily,
        },
      });
    }
  }


  // CONFIA_COMPANION_SESSION_SEQUENCE_RULES
  /**
   * ==========================================================
   * FASE 8D — LEITURA DA SEQUÊNCIA DA SESSÃO
   * ==========================================================
   *
   * Estas mensagens competem com todas as restantes.
   * Não são apresentadas automaticamente.
   */
  const session =
    interpretCompanionSession(
      context.recentEvents
    );

  /**
   * Padrões → depois registo do estado.
   *
   * Mais significativo que uma simples micro-reação,
   * mas abaixo de situações emocionais importantes.
   */
  if (
    session.signals.includes(
      "reflection_after_patterns"
    )
  ) {
    candidates.push({
      id: "session_reflection_after_patterns",
      translationKey:
        "companionBrain.sessionReflectionAfterPatterns",
      category: "discovery",
      emotion: "curious",
      priority: 58,
      reason:
        "The user explored patterns and then recorded their mood.",
      cooldownMinutes: 360,
      metadata: {
        sessionSignal:
          "reflection_after_patterns",
      },
    });
  }

  /**
   * Exploração deliberada de várias áreas.
   */
  if (
    session.signals.includes(
      "exploring_app"
    )
  ) {
    candidates.push({
      id: "session_exploring_app",
      translationKey:
        "companionBrain.sessionExploringApp",
      category: "casual",
      emotion: "curious",
      priority: 34,
      reason:
        "The user explored several areas during the same recent session.",
      cooldownMinutes: 360,
      metadata: {
        sessionSignal:
          "exploring_app",
        navigationCount:
          session.navigationCount,
      },
    });
  }

  /**
   * Vários toques não são tratados como três frases
   * independentes: podem representar procura de presença.
   */
  if (
    session.signals.includes(
      "seeking_companion"
    )
  ) {
    candidates.push({
      id: "session_seeking_companion",
      translationKey:
        "companionBrain.sessionSeekingCompanion",
      category: "casual",
      emotion: "warm",
      priority: 42,
      reason:
        "The user repeatedly interacted with the companion.",
      cooldownMinutes: 240,
      metadata: {
        sessionSignal:
          "seeking_companion",
        avatarTapCount:
          session.avatarTapCount,
      },
    });
  }

  /**
   * O utilizador continuou a interagir depois de concluir
   * o Impulso. Isto representa continuidade de apoio.
   */
  if (
    session.signals.includes(
      "support_session"
    )
  ) {
    candidates.push({
      id: "session_support_after_impulse",
      translationKey:
        "companionBrain.sessionSupportAfterImpulse",
      category: "impulse_followup",
      emotion: "calm",
      priority: 98,
      reason:
        "The user continued interacting after completing Impulso.",
      cooldownMinutes: 240,
      metadata: {
        sessionSignal:
          "support_session",
      },
    });
  }


  // CONFIA_COMPANION_MICRO_INTERACTION_RULES
  /**
   * Micro-reações de interação.
   *
   * Prioridade deliberadamente baixa:
   * situações emocionais importantes continuam
   * sempre à frente.
   */
  const interaction =
    context.latestInteractionEvent;

  if (
    interaction?.type === "avatar_tapped"
  ) {
    candidates.push({
      id:
        `avatar_tapped_micro:${interaction.id}`,

      translationKey:
        selectCompanionVariant(
          interaction.id,
          [
            "companionBrain.avatarTapped1",
            "companionBrain.avatarTapped2",
            "companionBrain.avatarTapped3",
            "companionBrain.avatarTapped4",
          ]
        ),

      category: "casual",
      emotion: "warm",
      priority: 30,

      reason:
        "The user directly interacted with the companion.",

      cooldownMinutes: 10,

      metadata: {
        microInteraction: true,
        eventId: interaction.id,

        /**
         * CONFIA FASE 12B
         * Origem temporal REAL deste candidato.
         */
        sourceEventTimestamp:
          interaction.timestamp,

        /**
         * CONFIA FASE 12C
         * Tipo real do evento que originou o candidato.
         */
        sourceEventType:
          interaction.type,
      },
    });
  }

  if (
    interaction?.type === "home_returned"
  ) {
    const from =
      typeof interaction.metadata?.from === "string"
        ? interaction.metadata.from
        : undefined;

    const variantsBySource:
      Record<string, string[]> = {

        patterns: [
          "companionBrain.returnedPatterns1",
          "companionBrain.returnedPatterns2",
          "companionBrain.returnedPatterns3",
        ],

        progress: [
          "companionBrain.returnedProgress1",
          "companionBrain.returnedProgress2",
          "companionBrain.returnedProgress3",
        ],

        companion: [
          "companionBrain.returnedCompanion1",
          "companionBrain.returnedCompanion2",
          "companionBrain.returnedCompanion3",
        ],

        shop: [
          "companionBrain.returnedShop1",
          "companionBrain.returnedShop2",
          "companionBrain.returnedShop3",
        ],

        inventory: [
          "companionBrain.returnedInventory1",
          "companionBrain.returnedInventory2",
          "companionBrain.returnedInventory3",
        ],
      };

    const variants =
      from
        ? variantsBySource[from]
        : undefined;

    if (variants) {
      candidates.push({
        id:
          `home_returned_${from}:${interaction.id}`,

        translationKey:
          selectCompanionVariant(
            interaction.id,
            variants
          ),

        category:
          from === "patterns"
            ? "discovery"
            : from === "progress"
              ? "progress"
              : "casual",

        emotion: "warm",

        priority:
          from === "patterns" ||
          from === "progress"
            ? 32
            : 28,

        reason:
          `The user returned home from ${from}.`,

        cooldownMinutes: 10,

        metadata: {
          microInteraction: true,
          eventId: interaction.id,
          from,

          /**
           * CONFIA FASE 12B
           * Origem temporal REAL deste candidato.
           */
          sourceEventTimestamp:
            interaction.timestamp,

          /**
           * CONFIA FASE 12C
           * Tipo real do evento que originou o candidato.
           */
          sourceEventType:
            interaction.type,
        },
      });
    }
  }


  const {
    hour,
    morningCompleted,
    afternoonCompleted,
    morningRating,
    afternoonRating,
    recentImpulse,
    sessionActivityCount,
    lastActivityAt,
    now,
  } = context;

  /**
   * ==========================================================
   * CONFIA — FASE 12D
   * ORIGEM TEMPORAL DOS EVENTOS EMOCIONAIS
   * ==========================================================
   *
   * recentEvents já contém eventos reais com timestamp.
   *
   * Para mood_saved só usamos um evento cujo payload
   * corresponde aos ratings atuais.
   *
   * Assim não atribuímos a um estado atual o timestamp
   * de um registo anterior.
   */

  const recentMoodSavedEvent =
    [...context.recentEvents]
      .reverse()
      .find(event => {
        if (
          event.type !== "mood_saved"
        ) {
          return false;
        }

        if (
          typeof morningRating !== "number" ||
          typeof afternoonRating !== "number"
        ) {
          return false;
        }

        return (
          event.metadata?.morningRating ===
            morningRating &&
          event.metadata?.afternoonRating ===
            afternoonRating
        );
      });

  const recentImpulseCompletedEvent =
    [...context.recentEvents]
      .reverse()
      .find(
        event =>
          event.type ===
          "impulse_completed"
      );

  /**
   * 1 — manhã ainda não iniciada.
   */
  if (
    hour >= 7 &&
    hour < 12 &&
    !morningCompleted
  ) {
    candidates.push({
      id: "morning_not_started",
      translationKey:
        "companionBrain.morningNotStarted",
      category: "missing_checkin",
      emotion: "warm",
      priority: COMPANION_PRIORITY.MISSING_CHECKIN,
      reason: "morning_not_completed",
      cooldownMinutes: 180,
      action: {
        labelKey:
          "companionBrain.actionRegisterMorning",
        target: "mood",
      },
    });
  }

  /**
   * 2 — já é de tarde e a manhã ficou por preencher.
   */
  if (
    hour >= 12 &&
    hour < 18 &&
    !morningCompleted
  ) {
    candidates.push({
      id: "missing_morning_afternoon",
      translationKey:
        "companionBrain.missingMorningAfternoon",
      category: "missing_checkin",
      emotion: "warm",
      priority:
        COMPANION_PRIORITY.MISSING_CHECKIN + 5,
      reason:
        "afternoon_started_without_morning_record",
      cooldownMinutes: 240,
      action: {
        labelKey:
          "companionBrain.actionRegisterMorning",
        target: "mood",
      },
    });
  }

  /**
   * 3 — tarde ainda por fechar.
   */
  if (
    hour >= 17 &&
    hour < 22 &&
    !afternoonCompleted
  ) {
    candidates.push({
      id: "afternoon_not_completed",
      translationKey:
        "companionBrain.afternoonNotCompleted",
      category: "missing_checkin",
      emotion: "warm",
      priority: COMPANION_PRIORITY.MISSING_CHECKIN,
      reason: "afternoon_not_completed",
      cooldownMinutes: 180,
      action: {
        labelKey:
          "companionBrain.actionRegisterAfternoon",
        target: "mood",
      },
    });
  }

  /**
   * 4 — manhã difícil.
   *
   * A escala atual da Confia é assumida aqui
   * como mais baixa = pior estado.
   *
   * Mantemos um limite prudente nesta primeira fase.
   */
  if (
    morningCompleted &&
    typeof morningRating === "number" &&
    morningRating <= 3
  ) {
    candidates.push({
      id: "morning_low_followup",
      translationKey:
        "companionBrain.morningLowFollowup",
      category: "emotional_followup",
      emotion: "concerned",
      priority:
        COMPANION_PRIORITY.EMOTIONAL_FOLLOWUP,
      reason: "morning_rating_low",
      cooldownMinutes: 240,

      metadata:
        recentMoodSavedEvent
          ? {
              sourceEventTimestamp:
                recentMoodSavedEvent.timestamp,
              sourceEventType:
                recentMoodSavedEvent.type,
            }
          : undefined,
    });
  }

  /**
   * 5 — melhoria clara entre manhã e tarde.
   */
  if (
    morningCompleted &&
    afternoonCompleted &&
    typeof morningRating === "number" &&
    typeof afternoonRating === "number" &&
    afternoonRating - morningRating >= 2
  ) {
    candidates.push({
      id: "mood_improved_today",
      translationKey:
        "companionBrain.moodImprovedToday",
      category: "mood_change",
      emotion: "encouraging",
      priority:
        COMPANION_PRIORITY.IMPORTANT_MOOD_CHANGE,
      reason:
        "afternoon_rating_improved_vs_morning",
      cooldownMinutes: 360,

      metadata:
        recentMoodSavedEvent
          ? {
              sourceEventTimestamp:
                recentMoodSavedEvent.timestamp,
              sourceEventType:
                recentMoodSavedEvent.type,
            }
          : undefined,
    });
  }

  /**
   * 6 — piora clara entre manhã e tarde.
   */
  if (
    morningCompleted &&
    afternoonCompleted &&
    typeof morningRating === "number" &&
    typeof afternoonRating === "number" &&
    morningRating - afternoonRating >= 2
  ) {
    candidates.push({
      id: "mood_declined_today",
      translationKey:
        "companionBrain.moodDeclinedToday",
      category: "emotional_followup",
      emotion: "concerned",
      priority:
        COMPANION_PRIORITY.EMOTIONAL_FOLLOWUP,
      reason:
        "afternoon_rating_declined_vs_morning",
      cooldownMinutes: 360,

      metadata:
        recentMoodSavedEvent
          ? {
              sourceEventTimestamp:
                recentMoodSavedEvent.timestamp,
              sourceEventType:
                recentMoodSavedEvent.type,
            }
          : undefined,
    });
  }

  /**
   * 7 — continuidade após Impulso / SOS.
   */
  if (recentImpulse) {
    candidates.push({
      id: "recent_impulse_followup",
      translationKey:
        "companionBrain.recentImpulseFollowup",
      category: "impulse_followup",
      emotion: "calm",
      priority:
        COMPANION_PRIORITY.IMPULSE_FOLLOWUP,
      reason: "recent_impulse_detected",
      cooldownMinutes: 180,

      expiresAt:
        recentImpulseCompletedEvent
          ? new Date(
              new Date(
                recentImpulseCompletedEvent.timestamp
              ).getTime() +
                30 * 60 * 1000
            ).toISOString()
          : undefined,
      action: {
        labelKey:
          "companionBrain.actionTalkAboutIt",
        target: "impulse",
      },

      metadata:
        recentImpulseCompletedEvent
          ? {
              sourceEventTimestamp:
                recentImpulseCompletedEvent.timestamp,
              sourceEventType:
                recentImpulseCompletedEvent.type,
            }
          : undefined,
    });
  }

  /**
   * 8 — regresso após algum tempo.
   */
  const inactiveMinutes = minutesSince(
    lastActivityAt,
    now
  );

  if (
    inactiveMinutes !== null &&
    inactiveMinutes >= 120 &&
    inactiveMinutes < 720
  ) {
    candidates.push({
      id: "returned_after_break",
      translationKey:
        "companionBrain.returnedAfterBreak",
      category: "casual",
      emotion: "warm",
      priority: COMPANION_PRIORITY.CASUAL + 5,
      reason: "returned_after_2h_or_more",
      cooldownMinutes: 360,
    });
  }

  /**
   * 9 — muita interação durante a sessão.
   *
   * A intenção não é julgar.
   * É reconhecer que o utilizador tem voltado
   * várias vezes à aplicação.
   */
  if (sessionActivityCount >= 6) {
    candidates.push({
      id: "active_session_observation",
      translationKey:
        "companionBrain.activeSessionObservation",
      category: "casual",
      emotion: "curious",
      priority: COMPANION_PRIORITY.CASUAL + 5,
      reason: "high_session_activity",
      cooldownMinutes: 360,
    });
  }

  /**
   * 10 — dia relativamente estável.
   *
   * Só aparece quando os dois registos existem,
   * a diferença é pequena e os valores não são baixos.
   */
  if (
    morningCompleted &&
    afternoonCompleted &&
    typeof morningRating === "number" &&
    typeof afternoonRating === "number" &&
    Math.abs(
      afternoonRating - morningRating
    ) <= 1 &&
    morningRating >= 5 &&
    afternoonRating >= 5
  ) {
    candidates.push({
      id: "stable_day_observation",
      translationKey:
        "companionBrain.stableDayObservation",
      category: "progress",
      emotion: "warm",
      priority: COMPANION_PRIORITY.PROGRESS,
      reason: "day_is_relatively_stable",
      cooldownMinutes: 720,

      metadata:
        recentMoodSavedEvent
          ? {
              sourceEventTimestamp:
                recentMoodSavedEvent.timestamp,
              sourceEventType:
                recentMoodSavedEvent.type,
            }
          : undefined,
    });
  }

  return candidates;
}
