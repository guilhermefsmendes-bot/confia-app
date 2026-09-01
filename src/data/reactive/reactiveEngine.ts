import {
  loadReactiveHistory,
} from "./reactiveHistoryStorage";
/**
 * CONFIA — MOTOR REATIVO
 *
 * Primeira camada de inteligência do sistema.
 *
 * Responsabilidade:
 * 1. Recolher os dados existentes.
 * 2. Calcular métricas recentes.
 * 3. Identificar sinais de mudança.
 * 4. Classificar a situação dominante.
 * 5. Produzir confiança + reasoning.
 *
 * Este motor NÃO gera texto diretamente.
 * A resposta textual é responsabilidade de reactiveResponses.ts
 * + sistema de traduções.
 */
import {
  buildReactiveRecentMemory,
} from "./reactiveRecentMemory";

import {
  ReactiveAnalysisInput,
  ReactiveContext,
  ReactiveMetrics,
  ReactiveResult,
  ReactiveSituation,
} from "./reactiveTypes";

import {
  ReactiveIntentContext,
} from "./reactiveIntent";

import {
  collectCompanionData,
  CompanionCollectedData,
} from "../companionData";

import {
  REACTIVE_RESPONSES,
  getResponsesForSituation,
} from "./reactiveResponses";

import {
  selectReactiveIntent,
} from "./reactiveIntentEngine";

/**
 * Data atual no formato YYYY-MM-DD.
 */
function todayString(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Diferença em dias entre duas datas YYYY-MM-DD.
 */
function daysBetween(a: string, b: string): number {
  const first = new Date(`${a}T12:00:00`);
  const second = new Date(`${b}T12:00:00`);

  const difference = second.getTime() - first.getTime();

  return Math.round(difference / 86400000);
}

/**
 * Ordena datas do mais antigo para o mais recente.
 */
function sortDates(dates: string[]): string[] {
  return [...dates].sort((a, b) => a.localeCompare(b));
}

/**
 * Obtém os valores de humor disponíveis.
 */
function getMoodRecords(data: CompanionCollectedData) {
  return data.mood
    .map((item) => {
      const values = [
        typeof item.morning === "number" ? item.morning : null,
        typeof item.afternoon === "number" ? item.afternoon : null,
      ].filter((value): value is number => value !== null);

      if (values.length === 0) return null;

      return {
        date: item.date,
        value:
          values.reduce((sum, value) => sum + value, 0) /
          values.length,
      };
    })
    .filter(
      (
        item
      ): item is {
        date: string;
        value: number;
      } => item !== null
    );
}

/**
 * Calcula a média de uma lista.
 */
function average(values: number[]): number | undefined {
  if (values.length === 0) return undefined;

  return (
    values.reduce((sum, value) => sum + value, 0) / values.length
  );
}

/**
 * Calcula a média de humor da primeira metade
 * e da segunda metade dos registos recentes.
 */
function calculateMoodTrend(values: number[]) {
  if (values.length < 2) {
    return {
      change: undefined,
      previousAverage: undefined,
      currentAverage: undefined,
    };
  }

  const half = Math.max(1, Math.floor(values.length / 2));

  const previous = values.slice(0, half);
  const current = values.slice(-half);

  const previousAverage = average(previous);
  const currentAverage = average(current);

  if (
    previousAverage === undefined ||
    currentAverage === undefined
  ) {
    return {
      change: undefined,
      previousAverage,
      currentAverage,
    };
  }

  return {
    change: currentAverage - previousAverage,
    previousAverage,
    currentAverage,
  };
}

/**
 * Calcula a redução média observada nos episódios
 * do Impulso.
 */
function calculateImpulseReduction(
  data: CompanionCollectedData
): number | undefined {
  const reductions = data.impulse
    .filter(
      (episode) =>
        typeof episode.intensity === "number" &&
        typeof episode.finalIntensity === "number"
    )
    .map(
      (episode) =>
        episode.intensity! - episode.finalIntensity!
    );

  return average(reductions);
}

/**
 * Calcula o número de dias ativos.
 *
 * Consideramos atividade:
 * - humor registado
 * - objetivo registado
 * - check-in
 * - Impulso
 */
function calculateActiveDays(
  data: CompanionCollectedData
): number {
  const dates = new Set<string>();

  data.mood.forEach((item) => {
    if (item.date) dates.add(item.date);
  });

  data.objectives.forEach((item) => {
    if (item.date) dates.add(item.date);
  });

  data.checkIns.forEach((item) => {
    if (item.date) dates.add(item.date);
  });

  data.impulse.forEach((item) => {
    if (item.date) {
      dates.add(item.date.split("T")[0]);
    }
  });

  return dates.size;
}

/**
 * Calcula uma sequência simples de utilização.
 */
function calculateStreak(
  data: CompanionCollectedData
): number {
  const dates = new Set<string>();

  data.mood.forEach((item) => {
    if (item.date) dates.add(item.date);
  });

  data.checkIns.forEach((item) => {
    if (item.date) dates.add(item.date);
  });

  data.objectives.forEach((item) => {
    if (item.date) dates.add(item.date);
  });

  data.impulse.forEach((item) => {
    if (item.date) {
      dates.add(item.date.split("T")[0]);
    }
  });

  const sorted = sortDates([...dates]);

  if (sorted.length === 0) return 0;

  let streak = 1;

  for (let i = sorted.length - 1; i > 0; i--) {
    const difference = daysBetween(
      sorted[i - 1],
      sorted[i]
    );

    if (difference === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Constrói todas as métricas.
 */
function buildMetrics(
  data: CompanionCollectedData
): ReactiveMetrics {
  const moods = getMoodRecords(data);

  const recentMoods = moods.slice(-7).map(
    (item) => item.value
  );

  const latest = moods[moods.length - 1];
  const previous = moods[moods.length - 2];

  const trend = calculateMoodTrend(recentMoods);

  const morningValues = data.mood
    .map((item) => item.morning)
    .filter(
      (value): value is number => typeof value === "number"
    );

  const afternoonValues = data.mood
    .map((item) => item.afternoon)
    .filter(
      (value): value is number => typeof value === "number"
    );

  const objectives = data.objectives.slice(-7);

  const objectivesCompleted = objectives.reduce(
    (sum, item) => sum + item.completed,
    0
  );

  const objectivesTotal = objectives.reduce(
    (sum, item) => sum + item.total,
    0
  );

  const objectiveCompletionRate =
    objectivesTotal > 0
      ? objectivesCompleted / objectivesTotal
      : undefined;

  const dates = sortDates([
    ...moods.map((item) => item.date),
    ...data.checkIns.map((item) => item.date),
    ...data.objectives.map((item) => item.date),
    ...data.impulse.map((item) =>
      item.date.split("T")[0]
    ),
  ]);

  const lastDate = dates[dates.length - 1];

  const daysSinceLastRecord = lastDate
    ? Math.max(0, daysBetween(lastDate, todayString()))
    : undefined;

  return {
    currentMood: latest?.value,
    previousMood: previous?.value,

    moodAverage: average(
      moods.slice(-7).map((item) => item.value)
    ),

    previousMoodAverage: trend.previousAverage,

    morningAverage: average(morningValues),
    afternoonAverage: average(afternoonValues),

    moodChange: trend.change,

    daysTracked: dates.length,
    activeDays: calculateActiveDays(data),

    objectivesCompleted:
      objectives.length > 0
        ? objectivesCompleted
        : undefined,

    objectivesTotal:
      objectives.length > 0
        ? objectivesTotal
        : undefined,

    objectiveCompletionRate,

    impulseCount: data.impulse.length,

    impulseAverageReduction:
      calculateImpulseReduction(data),

    xp: data.xp,

    currentStreak: calculateStreak(data),

    daysSinceLastRecord,
  };
}

/**
 * Identifica a situação dominante.
 *
 * A ordem é deliberada:
 * situações muito específicas têm prioridade
 * sobre situações genéricas.
 */
function detectSituation(
  metrics: ReactiveMetrics,
  data: CompanionCollectedData
): {
  situation: ReactiveSituation;
  confidence: number;
  reasoning: string;
} {
  const hasMood = typeof metrics.currentMood === "number";
  const hasPreviousMood =
    typeof metrics.previousMood === "number";

  // Primeiro registo de humor
  if (hasMood && !hasPreviousMood) {
    return {
      situation: "first_mood_record",
      confidence: 0.96,
      reasoning:
        "Existe um primeiro registo de humor disponível.",
    };
  }

  // Impulso eficaz
  if (
    data.impulse.length > 0 &&
    typeof metrics.impulseAverageReduction === "number" &&
    metrics.impulseAverageReduction >= 2
  ) {
    return {
      situation: "impulse_effective",
      confidence: 0.91,
      reasoning:
        "Os episódios do Impulso mostram uma redução média relevante da intensidade.",
    };
  }

  // Impulso parcialmente eficaz
  if (
    data.impulse.length > 0 &&
    typeof metrics.impulseAverageReduction === "number" &&
    metrics.impulseAverageReduction > 0 &&
    metrics.impulseAverageReduction < 2
  ) {
    return {
      situation: "impulse_partially_effective",
      confidence: 0.82,
      reasoning:
        "Os episódios do Impulso mostram alguma redução de intensidade, mas ainda limitada.",
    };
  }

  // Humor muito baixo
  if (
    hasMood &&
    metrics.currentMood !== undefined &&
    metrics.currentMood <= 3
  ) {
    return {
      situation: "mood_low",
      confidence: 0.94,
      reasoning:
        "O humor atual está numa faixa baixa.",
    };
  }

  // Humor alto
  if (
    hasMood &&
    metrics.currentMood !== undefined &&
    metrics.currentMood >= 8
  ) {
    return {
      situation: "mood_high",
      confidence: 0.90,
      reasoning:
        "O humor atual está numa faixa elevada.",
    };
  }

  // Queda recente
  if (
    typeof metrics.moodChange === "number" &&
    metrics.moodChange <= -0.8
  ) {
    return {
      situation: "mood_declining",
      confidence: 0.89,
      reasoning:
        "A média recente de humor apresenta uma descida clara.",
    };
  }

  // Melhoria recente
  if (
    typeof metrics.moodChange === "number" &&
    metrics.moodChange >= 0.8
  ) {
    return {
      situation: "mood_improving",
      confidence: 0.89,
      reasoning:
        "A média recente de humor apresenta uma melhoria clara.",
    };
  }

  // Objetivos em evolução
  if (
    typeof metrics.objectiveCompletionRate === "number" &&
    metrics.objectiveCompletionRate >= 0.75
  ) {
    return {
      situation: "objectives_improving",
      confidence: 0.84,
      reasoning:
        "A taxa recente de conclusão dos objetivos é elevada.",
    };
  }

  // Utilização consistente
  if (
    typeof metrics.currentStreak === "number" &&
    metrics.currentStreak >= 4
  ) {
    return {
      situation: "consistent_use",
      confidence: 0.86,
      reasoning:
        "Existem pelo menos quatro dias consecutivos de atividade.",
    };
  }

  // Longa ausência
  if (
    data.mood.length > 0 &&
    data.checkIns.length > 0
  ) {
    const dates = sortDates([
      ...data.mood.map((item) => item.date),
      ...data.checkIns.map((item) => item.date),
    ]);

    const lastDate = dates[dates.length - 1];

    if (
      lastDate &&
      daysBetween(lastDate, todayString()) >= 5
    ) {
      return {
        situation: "return_after_absence",
        confidence: 0.88,
        reasoning:
          "Existe um intervalo de vários dias desde o último registo.",
      };
    }
  }

  // Período estável
  if (
    typeof metrics.moodChange === "number" &&
    Math.abs(metrics.moodChange) < 0.5 &&
    data.mood.length >= 3
  ) {
    return {
      situation: "mood_stable",
      confidence: 0.76,
      reasoning:
        "Os registos recentes mostram pouca variação de humor.",
    };
  }

  // Utilização inicial
  if (metrics.daysTracked <= 1) {
    return {
      situation: "first_use",
      confidence: 0.72,
      reasoning:
        "Existem poucos dados e a utilização ainda está numa fase inicial.",
    };
  }

  // Sem dados
  if (metrics.daysTracked === 0) {
    return {
      situation: "no_data",
      confidence: 1,
      reasoning:
        "Ainda não existem dados suficientes para análise.",
    };
  }

  // Situação genérica
  return {
    situation: "multiple_signals",
    confidence: 0.55,
    reasoning:
      "Existem vários sinais, mas nenhum domina claramente a análise.",
  };
}

/**
 * Constrói o contexto completo.
 */
export function buildReactiveContext(
  input: ReactiveAnalysisInput = {}
): ReactiveContext {
  const data = collectCompanionData();
  const metrics = buildMetrics(data);

  const memory =
    buildReactiveRecentMemory(data);

  const moodRecords = getMoodRecords(data);

  const recentMoods = moodRecords
    .slice(-7)
    .map((item) => item.value);

  const recentDates = sortDates([
    ...data.mood.map((item) => item.date),
    ...data.checkIns.map((item) => item.date),
    ...data.objectives.map((item) => item.date),
    ...data.impulse.map((item) =>
      item.date.split("T")[0]
    ),
  ]).slice(-7);

  let detection;

  /**
   * Quando a análise é provocada por uma ação explícita,
   * essa ação tem prioridade sobre sinais históricos globais.
   *
   * Os restantes dados continuam disponíveis como contexto,
   * mas não podem substituir aquilo que o utilizador
   * acabou de fazer.
   */
  if (
    input.source === "impulse" &&
    typeof input.initialIntensity === "number" &&
    typeof input.finalIntensity === "number"
  ) {
    const reduction =
      input.initialIntensity - input.finalIntensity;

    if (reduction >= 2) {
      detection = {
        situation: "impulse_effective" as const,
        confidence: 0.96,
        reasoning:
          "O Impulso acabado de concluir reduziu a intensidade em pelo menos dois pontos.",
      };
    } else if (reduction > 0) {
      detection = {
        situation: "impulse_partially_effective" as const,
        confidence: 0.90,
        reasoning:
          "O Impulso acabado de concluir produziu uma pequena redução de intensidade.",
      };
    } else {
      detection = {
        situation: "impulse_not_effective" as const,
        confidence: 0.92,
        reasoning:
          "O Impulso acabado de concluir não reduziu a intensidade.",
      };
    }

  } else if (
    input.source === "daily_checkin" &&
    typeof input.currentMood === "number"
  ) {
    /**
     * O Daily Check-In deve reagir ao que acabou
     * de ser registado, sem ser dominado por um
     * Impulso ou registo de humor antigo.
     */
    if (input.currentMood <= 3) {
      detection = {
        situation: "mood_low" as const,
        confidence: 0.95,
        reasoning:
          "O Daily Check-In atual indica um estado baixo.",
      };

    } else if (input.currentMood >= 8) {
      detection = {
        situation: "mood_high" as const,
        confidence: 0.92,
        reasoning:
          "O Daily Check-In atual indica um estado elevado.",
      };

    } else {
      detection = {
        situation: "mood_stable" as const,
        confidence: 0.84,
        reasoning:
          "O Daily Check-In atual encontra-se numa faixa intermédia.",
      };
    }

  } else if (input.source === "mood") {
    const hasMood =
      typeof metrics.currentMood === "number";

    const hasPreviousMood =
      typeof metrics.previousMood === "number";

    if (hasMood && !hasPreviousMood) {
      detection = {
        situation: "first_mood_record" as const,
        confidence: 0.96,
        reasoning:
          "A ação atual corresponde ao primeiro registo de humor.",
      };

    } else if (
      hasMood &&
      metrics.currentMood !== undefined &&
      metrics.currentMood <= 3
    ) {
      detection = {
        situation: "mood_low" as const,
        confidence: 0.94,
        reasoning:
          "O registo de humor acabado de guardar está numa faixa baixa.",
      };

    } else if (
      hasMood &&
      metrics.currentMood !== undefined &&
      metrics.currentMood >= 8
    ) {
      detection = {
        situation: "mood_high" as const,
        confidence: 0.90,
        reasoning:
          "O registo de humor acabado de guardar está numa faixa elevada.",
      };

    } else if (
      typeof metrics.moodChange === "number" &&
      metrics.moodChange <= -0.8
    ) {
      detection = {
        situation: "mood_declining" as const,
        confidence: 0.89,
        reasoning:
          "Os registos de humor mostram uma descida recente.",
      };

    } else if (
      typeof metrics.moodChange === "number" &&
      metrics.moodChange >= 0.8
    ) {
      detection = {
        situation: "mood_improving" as const,
        confidence: 0.89,
        reasoning:
          "Os registos de humor mostram uma melhoria recente.",
      };

    } else {
      detection = {
        situation: "mood_stable" as const,
        confidence: 0.80,
        reasoning:
          "O registo atual não apresenta uma variação dominante.",
      };
    }

  } else {
    detection = detectSituation(metrics, data);
  }

  const lastDate =
    recentDates[recentDates.length - 1];

  const daysSinceLastRecord = lastDate
    ? Math.max(
        0,
        daysBetween(lastDate, todayString())
      )
    : undefined;

  return {
    situation: detection.situation,
    metrics,
    memory,
    recentMoods,
    recentDates,
    hasPreviousData: metrics.daysTracked > 1,
    daysSinceLastRecord,
  };
}

/**
 * Seleciona uma resposta da biblioteca.
 *
 * Nesta primeira versão usamos prioridade.
 * Mais à frente vamos acrescentar:
 * - histórico de respostas
 * - cooldown
 * - variedade
 * - contexto
 * - personalização
 * - exploração de respostas
 */
function selectResponse(
  context: ReactiveContext,
  intent: ReactiveResult["intent"]
) {
  const candidates =
    getResponsesForSituation(context.situation);

  const history = loadReactiveHistory();
  const now = Date.now();

  const getLastUseTime = (
    responseId: string
  ): number | undefined => {
    for (let i = history.length - 1; i >= 0; i -= 1) {
      if (history[i].responseId !== responseId) {
        continue;
      }

      const timestamp = new Date(
        history[i].timestamp
      ).getTime();

      if (!Number.isNaN(timestamp)) {
        return timestamp;
      }
    }

    return undefined;
  };

  const getUseCount = (
    responseId: string
  ): number =>
    history.reduce(
      (count, item) =>
        item.responseId === responseId
          ? count + 1
          : count,
      0
    );

  const isInCooldown = (
    response: (typeof candidates)[number]
  ): boolean => {
    if (
      !response.cooldownDays ||
      response.cooldownDays <= 0
    ) {
      return false;
    }

    const lastUse = getLastUseTime(response.id);

    if (lastUse === undefined) {
      return false;
    }

    const cooldownMs =
      response.cooldownDays *
      24 *
      60 *
      60 *
      1000;

    return now - lastUse < cooldownMs;
  };

  /**
   * Pontuação de relevância baseada na memória curta.
   *
   * IMPORTANTE:
   * esta pontuação apenas ajuda a escolher entre
   * respostas que já são válidas para a situação
   * e intenção atuais.
   *
   * Não altera situation.
   * Não altera intent.
   * Não ignora cooldown.
   */
  const getMemoryScore = (
    response: (typeof candidates)[number]
  ): number => {
    const tags = response.tags ?? [];
    const memory = context.memory;

    let score = 0;

    /**
     * Estratégias que já ajudaram recentemente.
     */
    if (memory.recentEffectiveImpulse) {
      if (tags.includes("impulse")) {
        score += 4;
      }

      if (tags.includes("strategy")) {
        score += 3;
      }
    }

    /**
     * Consistência recente.
     */
    if (memory.activeDaysLast7 >= 5) {
      if (tags.includes("consistency")) {
        score += 3;
      }

      if (tags.includes("streak")) {
        score += 3;
      }

      if (tags.includes("progress")) {
        score += 1;
      }
    }

    /**
     * Necessidade que tem aparecido repetidamente
     * nos Daily Check-Ins.
     */
    if (memory.repeatedNeed) {
      if (tags.includes(memory.repeatedNeed)) {
        score += 4;
      }

      if (
        memory.repeatedNeed === "well" &&
        tags.includes("continuation")
      ) {
        score += 4;
      }
    }

    /**
     * Tendência recente do humor.
     */
    if (memory.moodDirection === "improving") {
      if (tags.includes("progress")) {
        score += 2;
      }

      if (tags.includes("positive")) {
        score += 2;
      }

      if (tags.includes("small-win")) {
        score += 1;
      }
    }

    if (memory.moodDirection === "declining") {
      if (tags.includes("support")) {
        score += 2;
      }

      if (tags.includes("attention")) {
        score += 2;
      }

      if (tags.includes("difficult")) {
        score += 2;
      }
    }

    return score;
  };


  const rankCandidates = (
    items: typeof candidates
  ) =>
    [...items].sort((a, b) => {
      /**
       * 1. Variedade:
       * respostas menos usadas continuam primeiro.
       */
      const aCount = getUseCount(a.id);
      const bCount = getUseCount(b.id);

      if (aCount !== bCount) {
        return aCount - bCount;
      }

      /**
       * 2. Memória:
       * entre respostas com o mesmo número de usos,
       * preferir a mais relevante para o histórico recente.
       */
      const aMemoryScore =
        getMemoryScore(a);

      const bMemoryScore =
        getMemoryScore(b);

      if (aMemoryScore !== bMemoryScore) {
        return bMemoryScore - aMemoryScore;
      }

      /**
       * 3. Evitar repetição temporal.
       */
      const aLast =
        getLastUseTime(a.id) ?? 0;

      const bLast =
        getLastUseTime(b.id) ?? 0;

      if (aLast !== bLast) {
        return aLast - bLast;
      }

      /**
       * 4. Prioridade editorial da resposta.
       */
      return b.priority - a.priority;
    });

  /**
   * Verifica se a memória real do utilizador permite
   * apresentar determinada resposta.
   *
   * Uma resposta sem memoryRequirements continua
   * sempre elegível.
   */
  const meetsMemoryRequirements = (
    response: (typeof candidates)[number]
  ): boolean => {
    const requirements =
      response.memoryRequirements;

    if (!requirements) {
      return true;
    }

    const memory = context.memory;

    if (
      requirements.recentEffectiveImpulse === true &&
      !memory.recentEffectiveImpulse
    ) {
      return false;
    }

    if (
      requirements.repeatedNeed !== undefined &&
      memory.repeatedNeed !==
        requirements.repeatedNeed
    ) {
      return false;
    }

    if (
      requirements.minActiveDaysLast7 !== undefined &&
      memory.activeDaysLast7 <
        requirements.minActiveDaysLast7
    ) {
      return false;
    }

    if (
      requirements.moodDirection !== undefined &&
      memory.moodDirection !==
        requirements.moodDirection
    ) {
      return false;
    }

    return true;
  };


  const eligibleCandidates =
    candidates.filter(
      meetsMemoryRequirements
    );

  const intentCandidates =
    eligibleCandidates.filter(
      (response) => response.intent === intent
    );

  /**
   * 1. Tentar primeiro uma resposta da intenção ideal
   *    que esteja fora de cooldown.
   */
  const availableIntentCandidates =
    intentCandidates.filter(
      (response) => !isInCooldown(response)
    );

  if (availableIntentCandidates.length > 0) {
    return rankCandidates(
      availableIntentCandidates
    )[0];
  }

  /**
   * 2. Se todas as respostas da intenção ideal estiverem
   *    em cooldown, procurar outra resposta disponível
   *    para a MESMA situação.
   *
   * Isto evita repetir mecanicamente a mesma frase.
   */
  const alternativeSituationCandidates =
    eligibleCandidates.filter(
      (response) =>
        response.intent !== intent &&
        !isInCooldown(response)
    );

  if (alternativeSituationCandidates.length > 0) {
    return rankCandidates(
      alternativeSituationCandidates
    )[0];
  }

  /**
   * 3. Compatibilidade com respostas antigas/neutras.
   */
  const neutralCandidates =
    eligibleCandidates.filter(
      (response) => response.intent === undefined
    );

  const availableNeutralCandidates =
    neutralCandidates.filter(
      (response) => !isInCooldown(response)
    );

  if (availableNeutralCandidates.length > 0) {
    return rankCandidates(
      availableNeutralCandidates
    )[0];
  }

  /**
   * 4. Se absolutamente todas as respostas desta situação
   *    estiverem em cooldown, usar a menos repetida / mais antiga.
   */
  if (eligibleCandidates.length > 0) {
    return rankCandidates(
      eligibleCandidates
    )[0];
  }

  const fallback =
    REACTIVE_RESPONSES.find(
      (response) =>
        response.situation === "multiple_signals"
    );

  if (fallback) return fallback;

  return REACTIVE_RESPONSES[0];
}

/**
 * Constrói o contexto utilizado pelo decisor de intenções.
 *
 * A intenção recebe apenas os dados necessários para decidir
 * o comportamento da Confia.
 */
function buildIntentContext(
  context: ReactiveContext,
  input: ReactiveAnalysisInput
): ReactiveIntentContext {
  return {
    situation: context.situation,

    currentMood: context.metrics.currentMood,
    previousMood: context.metrics.previousMood,
    moodChange: context.metrics.moodChange,

    activeDays: context.metrics.activeDays,
    currentStreak: context.metrics.currentStreak,

    objectiveCompletionRate:
      context.metrics.objectiveCompletionRate,

    impulseCount: context.metrics.impulseCount,
    impulseAverageReduction:
      context.metrics.impulseAverageReduction,

    daysSinceLastRecord:
      context.daysSinceLastRecord,

    hasPreviousData:
      context.hasPreviousData,

    currentNeed:
      input.currentNeed,
  };
}

/**
 * Função principal do motor.
 */
export function analyzeReactiveState(
  input: ReactiveAnalysisInput = {}
): ReactiveResult {
  const context = buildReactiveContext(input);

  const intentContext = buildIntentContext(
    context,
    input
  );

  const intentResult =
    selectReactiveIntent(intentContext);

  const response = selectResponse(
    context,
    intentResult.intent
  );

  return {
    situation: context.situation,

    intent: intentResult.intent,

    response,

    metrics: context.metrics,

    reasoning:
      `Situação identificada: ${context.situation}. ` +
      `Intenção: ${intentResult.intent}. ` +
      `Confiança: ${Math.round(
        getConfidence(context) * 100
      )}%.`,

    confidence: getConfidence(context),
  };
}

/**
 * Confiança final.
 *
 * Pode evoluir posteriormente para uma função
 * baseada em múltiplos sinais.
 */
function getConfidence(
  context: ReactiveContext
): number {
  switch (context.situation) {
    case "first_mood_record":
      return 0.96;

    case "mood_low":
      return 0.94;

    case "mood_high":
      return 0.90;

    case "mood_declining":
    case "mood_improving":
      return 0.89;

    case "impulse_effective":
      return 0.91;

    case "impulse_partially_effective":
      return 0.82;

    case "objectives_improving":
      return 0.84;

    case "consistent_use":
      return 0.86;

    case "return_after_absence":
      return 0.88;

    case "mood_stable":
      return 0.76;

    case "first_use":
      return 0.72;

    case "no_data":
      return 1;

    default:
      return 0.55;
  }
}

/**
 * Atalho útil para componentes.
 */
export function getReactiveResponse() {
  return analyzeReactiveState();
}
