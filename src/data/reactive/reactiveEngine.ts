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

  /**
   * Objetivos — períodos comparáveis.
   *
   * O histórico anterior à 2F.1 pode conter
   * registos sem denominador real.
   *
   * Por isso apenas usamos registos com total > 0.
   */
  const validObjectiveRecords =
    data.objectives.filter(
      (item) =>
        typeof item.completed === "number" &&
        typeof item.total === "number" &&
        item.total > 0
    );

  /**
   * Trabalhamos com até 6 dias válidos:
   *
   * - últimos 3 = período recente
   * - 3 anteriores = período anterior
   */
  const recentObjectiveRecords =
    validObjectiveRecords.slice(-3);

  const previousObjectiveRecords =
    validObjectiveRecords.slice(-6, -3);

  const calculateObjectivePeriodRate = (
    records: typeof validObjectiveRecords
  ) => {
    const completed = records.reduce(
      (sum, item) => sum + item.completed,
      0
    );

    const total = records.reduce(
      (sum, item) => sum + item.total,
      0
    );

    return {
      completed,
      total,
      rate:
        total > 0
          ? completed / total
          : undefined,
      validDays: records.length,
    };
  };

  const recentObjectivePeriod =
    calculateObjectivePeriodRate(
      recentObjectiveRecords
    );

  const previousObjectivePeriod =
    calculateObjectivePeriodRate(
      previousObjectiveRecords
    );

  const objectivesCompleted =
    recentObjectivePeriod.completed;

  const objectivesTotal =
    recentObjectivePeriod.total;

  const objectiveCompletionRate =
    recentObjectivePeriod.rate;

  const previousObjectiveCompletionRate =
    previousObjectivePeriod.rate;

  const objectiveValidDays =
    recentObjectivePeriod.validDays;

  const previousObjectiveValidDays =
    previousObjectivePeriod.validDays;

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
      validObjectiveRecords.length > 0
        ? objectivesCompleted
        : undefined,

    objectivesTotal:
      validObjectiveRecords.length > 0
        ? objectivesTotal
        : undefined,

    objectiveCompletionRate,

    previousObjectiveCompletionRate,

    objectiveValidDays,

    previousObjectiveValidDays,

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

  /**
   * Objetivos — tendência temporal real.
   *
   * Para chamar algo de tendência precisamos
   * de dados dos dois lados da comparação.
   *
   * Exigimos pelo menos:
   * - 2 dias válidos recentes
   * - 2 dias válidos anteriores
   */
  const hasComparableObjectivePeriods =
    typeof metrics.objectiveCompletionRate === "number" &&
    typeof metrics.previousObjectiveCompletionRate === "number" &&
    typeof metrics.objectiveValidDays === "number" &&
    typeof metrics.previousObjectiveValidDays === "number" &&
    metrics.objectiveValidDays >= 2 &&
    metrics.previousObjectiveValidDays >= 2;

  if (hasComparableObjectivePeriods) {
    const recentRate =
      metrics.objectiveCompletionRate as number;

    const previousRate =
      metrics.previousObjectiveCompletionRate as number;

    const change =
      recentRate - previousRate;

    /**
     * Melhoria real:
     * pelo menos +15 pontos percentuais.
     */
    if (change >= 0.15) {
      return {
        situation: "objectives_improving",
        confidence: 0.88,
        reasoning:
          "A conclusão de objetivos melhorou face ao período anterior.",
      };
    }

    /**
     * Declínio real:
     * pelo menos -15 pontos percentuais.
     *
     * Uma simples reversão de um objetivo
     * não é suficiente para produzir este estado.
     */
    if (change <= -0.15) {
      return {
        situation: "objectives_declining",
        confidence: 0.86,
        reasoning:
          "A conclusão de objetivos diminuiu face ao período anterior.",
      };
    }

    /**
     * Consistência positiva:
     *
     * - variação inferior a 15 pontos percentuais
     * - pelo menos 60% em ambos os períodos
     *
     * Desta forma 10% -> 10% não é apresentado
     * como uma conquista de consistência.
     */
    if (
      Math.abs(change) < 0.15 &&
      recentRate >= 0.60 &&
      previousRate >= 0.60
    ) {
      return {
        situation: "objectives_consistent",
        confidence: 0.84,
        reasoning:
          "A conclusão de objetivos manteve-se consistente entre períodos.",
      };
    }
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

  } else if (
    input.source === "objective" &&
    input.objectiveCompleted === true
  ) {
    /**
     * A ação atual tem prioridade.
     *
     * O utilizador acabou de concluir um objetivo,
     * portanto essa conclusão não deve ser substituída
     * por um sinal histórico de humor, Impulso ou uso.
     */
    detection = {
      situation: "objective_completed" as const,
      confidence: 0.98,
      reasoning:
        "O utilizador acabou de concluir um objetivo.",
    };

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

  } else if (input.source === "objective") {
    /**
     * Leitura histórica dos Objetivos.
     *
     * O detectSituation continua a ser a única fonte
     * das tendências temporais.
     *
     * Porém, quando a origem atual é "objective",
     * não permitimos que uma situação de Mood,
     * Impulso ou utilização seja apresentada dentro
     * do separador Objetivos.
     */
    const objectiveHistoricalDetection =
      detectSituation(metrics, data);

    const objectiveSituations = new Set([
      "objectives_improving",
      "objectives_declining",
      "objectives_consistent",
    ]);

    if (
      objectiveSituations.has(
        objectiveHistoricalDetection.situation
      )
    ) {
      detection = objectiveHistoricalDetection;
    } else {
      detection = {
        situation: "no_data" as const,
        confidence: 0.96,
        reasoning:
          "Ainda não existem dados históricos suficientes de objetivos para identificar uma tendência.",
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
     * 1D.9A — SCORING SEM DUPLICAÇÃO
     *
     * Necessidades repetidas do Daily Check-In são avaliadas
     * exclusivamente pela memória transversal abaixo.
     *
     * A mesma evidência não deve receber peso duas vezes.
     */

    /**
     * 1D.8B — MEMÓRIA TRANSVERSAL
     *
     * A continuidade pode agora vir de Humor,
     * Daily Check-In e Impulso.
     *
     * A memória apenas aumenta a relevância de respostas
     * já válidas para a situação e intenção atuais.
     *
     * Não altera situation.
     * Não altera intent.
     * Não cria candidatos.
     * Não ignora cooldown.
     */
    if (memory.continuity?.hasRepeatedSignals) {
      const continuity =
        memory.continuity;

      /**
       * --------------------------------------------------------
       * DAILY CHECK-IN
       * --------------------------------------------------------
       *
       * Se uma necessidade apareceu repetidamente,
       * reforçamos apenas respostas explicitamente
       * relacionadas com essa necessidade.
       */
      const repeatedCheckInNeed =
        continuity.repeatedCheckInNeed;

      if (
        repeatedCheckInNeed &&
        continuity.repeatedCheckInNeedCount >= 2 &&
        tags.includes(repeatedCheckInNeed)
      ) {
        score += 4;
      }

      if (
        repeatedCheckInNeed === "well" &&
        continuity.repeatedCheckInNeedCount >= 2 &&
        tags.includes("continuation")
      ) {
        score += 3;
      }

      /**
       * --------------------------------------------------------
       * IMPULSO
       * --------------------------------------------------------
       *
       * Mantemos a aprendizagem já existente, mas agora
       * apenas quando a continuidade do Impulso é real.
       */
      const repeatedImpulseNeed =
        continuity.repeatedNeed;

      const hasImpulseContinuity =
        continuity.recentEffectiveImpulseCount >= 2 ||
        continuity.repeatedNeedCount >= 2;

      /**
       * 1D.9B — NORMALIZAÇÃO DO IMPULSO
       *
       * Uma estratégia eficaz recente já reforça as tags
       * "impulse" e "strategy" no bloco anterior.
       *
       * A continuidade não deve duplicar automaticamente
       * esse mesmo reforço. Quando existe experiência eficaz
       * recente, usamos a continuidade apenas para acrescentar
       * informação mais específica: aprendizagem e necessidade.
       *
       * Se não existe recentEffectiveImpulse, a continuidade
       * pode continuar a reforçar impulse/strategy por si só.
       */
      if (hasImpulseContinuity) {
        if (tags.includes("learning")) {
          score += 2;
        }

        if (!memory.recentEffectiveImpulse) {
          if (tags.includes("strategy")) {
            score += 2;
          }

          if (tags.includes("impulse")) {
            score += 2;
          }
        }

        if (
          repeatedImpulseNeed &&
          tags.includes(repeatedImpulseNeed)
        ) {
          score += 3;
        }
      }

      /**
       * --------------------------------------------------------
       * HUMOR
       * --------------------------------------------------------
       *
       * A tendência histórica só reforça respostas quando
       * o estado atual não a contradiz.
       *
       * Exemplo:
       * uma tendência histórica de melhoria não deve fazer
       * a Confia falar de progresso se o momento atual está
       * claramente em descida.
       */
      const continuityMood =
        continuity.moodDirection;

      const currentMoodDirection =
        memory.moodDirection;

      const moodCompatible =
        continuityMood !== "unknown" &&
        (
          currentMoodDirection === "unknown" ||
          currentMoodDirection === "stable" ||
          currentMoodDirection === continuityMood
        );

      if (moodCompatible) {
        if (continuityMood === "improving") {
          if (tags.includes("progress")) {
            score += 3;
          }

          if (tags.includes("positive")) {
            score += 2;
          }

          if (tags.includes("small-win")) {
            score += 2;
          }
        }

        if (continuityMood === "declining") {
          if (tags.includes("support")) {
            score += 3;
          }

          if (tags.includes("attention")) {
            score += 2;
          }

          if (tags.includes("difficult")) {
            score += 2;
          }
        }

        if (
          continuityMood === "stable" &&
          tags.includes("stability")
        ) {
          score += 2;
        }
      }

      /**
       * --------------------------------------------------------
       * CONVERGÊNCIA
       * --------------------------------------------------------
       *
       * Duas ou mais fontes com continuidade aumentam
       * ligeiramente a relevância de respostas de reflexão
       * e aprendizagem.
       *
       * É um reforço pequeno: convergência não significa
       * causalidade nem deve dominar a ação atual.
       */
      if (continuity.signalCount >= 2) {
        /**
         * Reflexão é transversal.
         *
         * A convergência entre diferentes fontes pode tornar
         * uma resposta reflexiva ligeiramente mais relevante.
         */
        if (tags.includes("reflection")) {
          score += 1;
        }

        /**
         * Learning representa aprendizagem de estratégia.
         *
         * Por isso só recebe o reforço da convergência quando
         * existe também continuidade real do Impulso.
         *
         * Humor + Check-In, por si só, não são suficientes.
         */
        if (
          hasImpulseContinuity &&
          tags.includes("learning")
        ) {
          score += 1;
        }
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
