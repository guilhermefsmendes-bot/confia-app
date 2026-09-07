import type {
  CompanionBrainCandidate,
} from "./companionBrainTypes";

/**
 * ============================================================
 * CONFIA — COMPANION VIVO
 * FASE 12A — RANKING CONTEXTUAL UNIFICADO
 * ============================================================
 *
 * A prioridade original continua a ser a base.
 *
 * Este módulo NÃO decide o que o Companion diz.
 * Apenas ajuda o motor de decisão a perceber qual
 * dos candidatos elegíveis é mais relevante agora.
 *
 * Objetivos:
 *
 * - presente > histórico
 * - emocional > casual
 * - continuidade real > mensagem isolada equivalente
 * - padrões longitudinais não abafam acontecimentos atuais
 * - micro-interações não roubam espaço a temas importantes
 */

export interface CompanionContextualRankingResult {
  candidate: CompanionBrainCandidate;
  basePriority: number;
  contextualScore: number;
  modifiers: string[];
}


function readMetadataString(
  candidate: CompanionBrainCandidate,
  key: string
): string | undefined {
  const metadata =
    candidate.metadata as
      | Record<string, unknown>
      | undefined;

  const value =
    metadata?.[key];

  return typeof value === "string"
    ? value
    : undefined;
}


function readMetadataBoolean(
  candidate: CompanionBrainCandidate,
  key: string
): boolean {
  const metadata =
    candidate.metadata as
      | Record<string, unknown>
      | undefined;

  return metadata?.[key] === true;
}


/**
 * A categoria funciona como uma camada de relevância
 * sobre a prioridade base.
 *
 * Os valores são intencionalmente moderados:
 * não queremos destruir as prioridades já construídas
 * nas fases anteriores.
 */
function getCategoryModifier(
  category: CompanionBrainCandidate["category"]
): number {
  switch (category) {
    case "emotional_followup":
      return 18;

    case "impulse_followup":
      return 17;

    case "symptom":
      return 14;

    case "mood_change":
      return 12;

    case "missing_checkin":
      return 6;

    case "progress":
      return 5;

    case "objective":
      return 3;

    case "discovery":
      return -2;

    case "community":
      return -3;

    case "casual":
      return -7;

    default:
      return 0;
  }
}


/**
 * ============================================================
 * CONFIA — FASE 12B
 * RECÊNCIA CONTEXTUAL REAL
 * ============================================================
 *
 * Só existe recência quando conhecemos o timestamp
 * verdadeiro do evento que originou o candidato.
 *
 * Sem timestamp -> 0 modificador.
 * Nunca inventamos a idade de um candidato.
 */
function getMetadataTimestampAgeMinutes(
  candidate: CompanionBrainCandidate,
  key: string,
  now: Date
): number | null {
  const timestamp =
    readMetadataString(
      candidate,
      key
    );

  if (!timestamp) {
    return null;
  }

  const eventTime =
    new Date(timestamp).getTime();

  if (!Number.isFinite(eventTime)) {
    return null;
  }

  const ageMs =
    now.getTime() -
    eventTime;

  if (ageMs < 0) {
    return null;
  }

  return ageMs / 60000;
}


function getSourceEventAgeMinutes(
  candidate: CompanionBrainCandidate,
  now: Date
): number | null {
  const timestamp =
    readMetadataString(
      candidate,
      "sourceEventTimestamp"
    );

  if (!timestamp) {
    return null;
  }

  const eventTime =
    new Date(timestamp).getTime();

  if (!Number.isFinite(eventTime)) {
    return null;
  }

  const ageMs =
    now.getTime() -
    eventTime;

  if (ageMs < 0) {
    return null;
  }

  return ageMs / 60000;
}


function getRecencyModifier(
  ageMinutes: number,
  sourceEventType?: string
): number {
  /**
   * ==========================================================
   * CONFIA — FASE 12C
   * DECAIMENTO TEMPORAL SEMÂNTICO
   * ==========================================================
   *
   * Nem todos os eventos envelhecem da mesma forma.
   *
   * Um toque no avatar é muito efémero.
   * Um regresso ao Home mantém algum contexto
   * durante mais alguns minutos.
   *
   * A curva genérica da 12B continua disponível
   * para futuros eventos.
   */

  if (
    sourceEventType === "avatar_tapped"
  ) {
    if (ageMinutes <= 1) {
      return 8;
    }

    if (ageMinutes <= 3) {
      return 5;
    }

    if (ageMinutes <= 5) {
      return 2;
    }

    if (ageMinutes <= 10) {
      return -2;
    }

    return -8;
  }

  if (
    sourceEventType === "home_returned"
  ) {
    if (ageMinutes <= 2) {
      return 7;
    }

    if (ageMinutes <= 5) {
      return 5;
    }

    if (ageMinutes <= 10) {
      return 2;
    }

    if (ageMinutes <= 20) {
      return 0;
    }

    if (ageMinutes <= 30) {
      return -3;
    }

    return -7;
  }

  /**
   * ==========================================================
   * CONFIA — FASE 12E
   * HUMOR GUARDADO
   * ==========================================================
   *
   * Um registo emocional acabado de guardar mantém
   * relevância durante bastante mais tempo do que uma
   * micro-interação.
   *
   * Continua a ser apenas um modificador contextual.
   */
  if (
    sourceEventType === "mood_saved"
  ) {
    if (ageMinutes <= 5) {
      return 9;
    }

    if (ageMinutes <= 10) {
      return 8;
    }

    if (ageMinutes <= 20) {
      return 6;
    }

    if (ageMinutes <= 30) {
      return 4;
    }

    if (ageMinutes <= 45) {
      return 2;
    }

    if (ageMinutes <= 60) {
      return 0;
    }

    if (ageMinutes <= 90) {
      return -3;
    }

    return -7;
  }


  /**
   * ==========================================================
   * CONFIA — FASE 12E
   * IMPULSO / SOS CONCLUÍDO
   * ==========================================================
   *
   * Um episódio recente de Impulso é um acontecimento
   * emocionalmente relevante e merece continuidade por
   * mais tempo.
   *
   * Não implica causalidade nem diagnóstico.
   */
  if (
    sourceEventType === "impulse_completed"
  ) {
    if (ageMinutes <= 5) {
      return 10;
    }

    if (ageMinutes <= 10) {
      return 9;
    }

    if (ageMinutes <= 20) {
      return 7;
    }

    if (ageMinutes <= 30) {
      return 5;
    }

    if (ageMinutes <= 45) {
      return 3;
    }

    if (ageMinutes <= 60) {
      return 1;
    }

    if (ageMinutes <= 90) {
      return 0;
    }

    if (ageMinutes <= 120) {
      return -3;
    }

    return -8;
  }

  /**
   * Fallback genérico:
   * comportamento original da Fase 12B.
   */
  if (ageMinutes <= 2) {
    return 8;
  }

  if (ageMinutes <= 5) {
    return 6;
  }

  if (ageMinutes <= 10) {
    return 4;
  }

  if (ageMinutes <= 20) {
    return 2;
  }

  if (ageMinutes <= 30) {
    return 0;
  }

  if (ageMinutes <= 45) {
    return -3;
  }

  return -6;
}


export function getCompanionContextualRanking(
  candidate: CompanionBrainCandidate,
  now: Date = new Date()
): CompanionContextualRankingResult {
  const basePriority =
    candidate.priority ?? 0;

  let contextualScore =
    basePriority;

  const modifiers: string[] = [];

  /**
   * ----------------------------------------------------------
   * 1. IMPORTÂNCIA DA CATEGORIA
   * ----------------------------------------------------------
   */
  const categoryModifier =
    getCategoryModifier(
      candidate.category
    );

  contextualScore +=
    categoryModifier;

  if (categoryModifier !== 0) {
    modifiers.push(
      `category:${categoryModifier}`
    );
  }


  /**
   * ----------------------------------------------------------
   * 2. CONTINUIDADE CONVERSACIONAL REAL
   * ----------------------------------------------------------
   *
   * Se existe um fio recente e relacionado,
   * damos uma pequena vantagem à continuação.
   *
   * Isto não torna a continuação invencível:
   * um acontecimento emocional realmente mais importante
   * continua a poder ganhar.
   */
  if (
    readMetadataBoolean(
      candidate,
      "conversationalContinuity"
    )
  ) {
    contextualScore += 8;

    modifiers.push(
      "conversation:+8"
    );
  }


  /**
   * ----------------------------------------------------------
   * 3. MEMÓRIA LONGITUDINAL
   * ----------------------------------------------------------
   *
   * Um padrão de 7 dias é importante,
   * mas normalmente não deve ultrapassar
   * uma situação emocional presente apenas
   * por ser estatisticamente interessante.
   */
  if (
    readMetadataBoolean(
      candidate,
      "longitudinal"
    )
  ) {
    contextualScore -= 7;

    modifiers.push(
      "longitudinal:-7"
    );
  }


  /**
   * ----------------------------------------------------------
   * 4. CROSS-MEMORY
   * ----------------------------------------------------------
   *
   * Relações entre Humor + Impulso são úteis,
   * mas são observações históricas/associativas.
   * Mantemos uma pequena penalização perante
   * acontecimentos presentes.
   */
  if (
    readMetadataBoolean(
      candidate,
      "crossMemory"
    )
  ) {
    contextualScore -= 4;

    modifiers.push(
      "crossMemory:-4"
    );
  }


  /**
   * ----------------------------------------------------------
   * 5. RECÊNCIA DO EVENTO REAL
   * ----------------------------------------------------------
   *
   * Apenas candidatos ligados a um evento com timestamp
   * verdadeiro recebem este modificador.
   */
  const isCompositeTemporalSource =
    readMetadataBoolean(
      candidate,
      "compositeTemporalSource"
    );

  /**
   * ==========================================================
   * CONFIA — FASE 12G
   * RECÊNCIA MULTI-ORIGEM
   * ==========================================================
   *
   * Um candidato composto pode nascer de dois eventos reais.
   *
   * Não somamos dois modificadores completos.
   * Isso faria o composto ganhar quase automaticamente.
   *
   * Estratégia:
   *
   * - calcular Humor e Impulso separadamente
   * - usar o modificador mais forte como base
   * - acrescentar um pequeno bónus se a segunda origem
   *   também for realmente recente
   */

  if (isCompositeTemporalSource) {
    const moodAgeMinutes =
      getMetadataTimestampAgeMinutes(
        candidate,
        "moodSourceEventTimestamp",
        now
      );

    const impulseAgeMinutes =
      getMetadataTimestampAgeMinutes(
        candidate,
        "impulseSourceEventTimestamp",
        now
      );

    const moodModifier =
      moodAgeMinutes !== null
        ? getRecencyModifier(
            moodAgeMinutes,
            readMetadataString(
              candidate,
              "moodSourceEventType"
            )
          )
        : null;

    const impulseModifier =
      impulseAgeMinutes !== null
        ? getRecencyModifier(
            impulseAgeMinutes,
            readMetadataString(
              candidate,
              "impulseSourceEventType"
            )
          )
        : null;

    const availableModifiers =
      [
        moodModifier,
        impulseModifier,
      ].filter(
        (
          value
        ): value is number =>
          value !== null
      );

    if (
      availableModifiers.length > 0
    ) {
      const strongestModifier =
        Math.max(
          ...availableModifiers
        );

      let secondaryRecencyBonus = 0;

      /**
       * Bónus controlado:
       *
       * +3 se as duas origens têm relevância positiva forte
       * +2 se ambas ainda são positivas
       * +1 se ambas ainda são atuais/neutras
       *
       * Nunca somamos os dois scores completos.
       */
      if (
        moodModifier !== null &&
        impulseModifier !== null
      ) {
        if (
          moodModifier >= 5 &&
          impulseModifier >= 5
        ) {
          secondaryRecencyBonus = 3;
        } else if (
          moodModifier > 0 &&
          impulseModifier > 0
        ) {
          secondaryRecencyBonus = 2;
        } else if (
          moodModifier >= 0 &&
          impulseModifier >= 0
        ) {
          secondaryRecencyBonus = 1;
        }
      }

      const compositeRecencyModifier =
        strongestModifier +
        secondaryRecencyBonus;

      contextualScore +=
        compositeRecencyModifier;

      modifiers.push(
        `recencyComposite:${compositeRecencyModifier}`
      );

      if (moodModifier !== null) {
        modifiers.push(
          `moodRecency:${moodModifier}`
        );
      }

      if (
        impulseModifier !== null
      ) {
        modifiers.push(
          `impulseRecency:${impulseModifier}`
        );
      }

      if (
        secondaryRecencyBonus > 0
      ) {
        modifiers.push(
          `multiSourceBonus:+${secondaryRecencyBonus}`
        );
      }
    }
  } else {
    /**
     * Candidatos simples:
     * comportamento das Fases 12B–12F preservado.
     */
    const sourceEventAgeMinutes =
      getSourceEventAgeMinutes(
        candidate,
        now
      );

    if (
      sourceEventAgeMinutes !== null
    ) {
      const sourceEventType =
        readMetadataString(
          candidate,
          "sourceEventType"
        );

      const recencyModifier =
        getRecencyModifier(
          sourceEventAgeMinutes,
          sourceEventType
        );

      contextualScore +=
        recencyModifier;

      modifiers.push(
        `recency:${recencyModifier}`
      );

      if (sourceEventType) {
        modifiers.push(
          `eventType:${sourceEventType}`
        );
      }
    }
  }


  return {
    candidate,
    basePriority,
    contextualScore,
    modifiers,
  };
}


/**
 * Ranking estável.
 *
 * 1. maior contextualScore
 * 2. maior priority original
 * 3. ordem original
 *
 * A estabilidade é importante para evitar
 * mudanças aparentemente aleatórias no Companion.
 */
export function rankCompanionCandidatesContextually(
  candidates: CompanionBrainCandidate[],
  now: Date = new Date()
): CompanionBrainCandidate[] {
  return candidates
    .map(
      (candidate, index) => ({
        ...getCompanionContextualRanking(
          candidate,
          now
        ),
        index,
      })
    )
    .sort(
      (a, b) => {
        if (
          b.contextualScore !==
          a.contextualScore
        ) {
          return (
            b.contextualScore -
            a.contextualScore
          );
        }

        if (
          b.basePriority !==
          a.basePriority
        ) {
          return (
            b.basePriority -
            a.basePriority
          );
        }

        return a.index - b.index;
      }
    )
    .map(
      result =>
        result.candidate
    );
}


/**
 * Helper DEV para conseguirmos perceber
 * por que razão uma fala ganhou.
 */
export function inspectCompanionContextualRanking(
  candidates: CompanionBrainCandidate[],
  now: Date = new Date()
): CompanionContextualRankingResult[] {
  return candidates
    .map(
      candidate =>
        getCompanionContextualRanking(
          candidate,
          now
        )
    )
    .sort(
      (a, b) =>
        b.contextualScore -
        a.contextualScore
    );
}
