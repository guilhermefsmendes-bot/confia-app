import type {
  DailyRating,
} from "../../types";

/**
 * ============================================================
 * CONFIA — COMPANION BRAIN
 * MEMÓRIA LONGITUDINAL — 7 DIAS
 * ============================================================
 *
 * Esta camada NÃO cria um novo histórico.
 *
 * Lê os DailyRating reais já existentes e transforma-os
 * em observações simples que o Companion Brain pode usar.
 *
 * Não diagnostica.
 * Não interpreta causas.
 * Não inventa estados emocionais.
 */

export type CompanionMoodTrend =
  | "improving"
  | "declining"
  | "stable"
  | "insufficient";


export type CompanionPatternRelevance =
  | "current"
  | "changing"
  | "outdated"
  | "insufficient";

export interface CompanionLongitudinalMoodMemory {
  recordCount: number;

  activeDays: number;

  averageMorning?: number;

  averageAfternoon?: number;

  averageDaily?: number;

  trend: CompanionMoodTrend;

  /**
   * Número de dias em que existe manhã e tarde
   * e a tarde melhorou >= 2 pontos.
   */
  recoveryDays: number;

  /**
   * Número de dias em que existe manhã e tarde
   * e a tarde piorou >= 2 pontos.
   */
  harderDays: number;

  /**
   * Número de manhãs <= 3.
   *
   * É apenas uma observação numérica.
   */
  lowMorningCount: number;

  /**
   * Existem pelo menos 2 manhãs <= 3
   * nos últimos 7 dias.
   */
  repeatedLowMornings: boolean;

  /**
   * Existem pelo menos 2 recuperações claras
   * durante o mesmo dia.
   */
  repeatedRecoveries: boolean;

  /**
   * Relevância atual do padrão de manhãs baixas.
   */
  lowMorningRelevance:
    CompanionPatternRelevance;

  /**
   * Relevância atual do padrão de recuperação
   * entre manhã e tarde.
   */
  recoveryRelevance:
    CompanionPatternRelevance;

  /**
   * Informação suficiente para uma observação
   * longitudinal responsável.
   */
  hasEnoughData: boolean;
}

function average(
  values: number[]
): number | undefined {
  if (values.length === 0) {
    return undefined;
  }

  return (
    values.reduce(
      (sum, value) => sum + value,
      0
    ) / values.length
  );
}

function localDateValue(
  date: string
): number {
  const parts =
    date.split("-").map(Number);

  if (parts.length !== 3) {
    return NaN;
  }

  const [
    year,
    month,
    day,
  ] = parts;

  return new Date(
    year,
    month - 1,
    day
  ).setHours(
    0,
    0,
    0,
    0
  );
}

function dailyValue(
  rating: DailyRating
): number | undefined {
  const values: number[] = [];

  if (
    typeof rating.morning === "number"
  ) {
    values.push(
      rating.morning
    );
  }

  if (
    typeof rating.afternoon === "number"
  ) {
    values.push(
      rating.afternoon
    );
  }

  return average(values);
}

function calculateTrend(
  ratings: DailyRating[]
): CompanionMoodTrend {
  const values =
    ratings
      .map(rating => ({
        date:
          localDateValue(rating.date),
        value:
          dailyValue(rating),
      }))
      .filter(
        (
          item
        ): item is {
          date: number;
          value: number;
        } =>
          Number.isFinite(item.date) &&
          typeof item.value === "number"
      )
      .sort(
        (a, b) =>
          a.date - b.date
      );

  /**
   * Não falamos de tendência com apenas
   * um ou dois registos.
   */
  if (values.length < 3) {
    return "insufficient";
  }

  /**
   * Comparamos uma parte inicial com uma
   * parte final em vez de reagir apenas
   * ao primeiro e último valor.
   */
  const split =
    Math.floor(
      values.length / 2
    );

  const early =
    values.slice(
      0,
      split
    );

  const recent =
    values.slice(
      split
    );

  const earlyAverage =
    average(
      early.map(
        item => item.value
      )
    );

  const recentAverage =
    average(
      recent.map(
        item => item.value
      )
    );

  if (
    earlyAverage === undefined ||
    recentAverage === undefined
  ) {
    return "insufficient";
  }

  const difference =
    recentAverage -
    earlyAverage;

  /**
   * Evitamos chamar "tendência" a pequenas
   * oscilações normais.
   */
  if (difference >= 1) {
    return "improving";
  }

  if (difference <= -1) {
    return "declining";
  }

  return "stable";
}


function calculateLowMorningRelevance(
  ratings: DailyRating[]
): CompanionPatternRelevance {
  const mornings =
    ratings
      .filter(
        rating =>
          typeof rating.morning ===
          "number"
      )
      .map(
        rating => ({
          date:
            rating.date,
          value:
            rating.morning as number,
        })
      )
      .sort(
        (a, b) =>
          a.date.localeCompare(
            b.date
          )
      );

  if (mornings.length < 3) {
    return "insufficient";
  }

  const recent =
    mornings.slice(-3);

  const earlier =
    mornings.slice(
      0,
      Math.max(
        0,
        mornings.length - 3
      )
    );

  const recentLowCount =
    recent.filter(
      item =>
        item.value <= 3
    ).length;

  const earlierLowCount =
    earlier.filter(
      item =>
        item.value <= 3
    ).length;

  /**
   * Continua atual:
   * pelo menos 2 das últimas 3 manhãs
   * ainda estão <= 3.
   */
  if (recentLowCount >= 2) {
    return "current";
  }

  /**
   * Existia antes, mas aparece apenas uma vez
   * nas últimas 3 observações.
   */
  if (
    earlierLowCount >= 2 &&
    recentLowCount === 1
  ) {
    return "changing";
  }

  /**
   * Existia antes e desapareceu das últimas
   * três manhãs.
   */
  if (
    earlierLowCount >= 2 &&
    recentLowCount === 0
  ) {
    return "outdated";
  }

  return "insufficient";
}

function calculateRecoveryRelevance(
  ratings: DailyRating[]
): CompanionPatternRelevance {
  const recoveries =
    ratings
      .filter(
        rating =>
          typeof rating.morning ===
            "number" &&
          typeof rating.afternoon ===
            "number"
      )
      .map(
        rating => ({
          date:
            rating.date,
          recovered:
            (
              rating.afternoon as number
            ) -
            (
              rating.morning as number
            ) >= 2,
        })
      )
      .sort(
        (a, b) =>
          a.date.localeCompare(
            b.date
          )
      );

  if (recoveries.length < 3) {
    return "insufficient";
  }

  const recent =
    recoveries.slice(-3);

  const earlier =
    recoveries.slice(
      0,
      Math.max(
        0,
        recoveries.length - 3
      )
    );

  const recentCount =
    recent.filter(
      item =>
        item.recovered
    ).length;

  const earlierCount =
    earlier.filter(
      item =>
        item.recovered
    ).length;

  if (recentCount >= 2) {
    return "current";
  }

  if (
    earlierCount >= 2 &&
    recentCount === 1
  ) {
    return "changing";
  }

  if (
    earlierCount >= 2 &&
    recentCount === 0
  ) {
    return "outdated";
  }

  return "insufficient";
}

export function buildCompanionLongitudinalMoodMemory(
  ratings: DailyRating[],
  now: Date = new Date()
): CompanionLongitudinalMoodMemory {
  const today =
    new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    ).getTime();

  const cutoff =
    today -
    6 * 24 * 60 * 60 * 1000;

  /**
   * Últimos 7 dias de calendário incluindo hoje.
   */
  const recent =
    ratings
      .filter(rating => {
        const value =
          localDateValue(
            rating.date
          );

        return (
          Number.isFinite(value) &&
          value >= cutoff &&
          value <= today
        );
      })
      .sort(
        (a, b) =>
          a.date.localeCompare(
            b.date
          )
      );

  const morningValues =
    recent
      .map(
        item =>
          item.morning
      )
      .filter(
        (
          value
        ): value is number =>
          typeof value === "number"
      );

  const afternoonValues =
    recent
      .map(
        item =>
          item.afternoon
      )
      .filter(
        (
          value
        ): value is number =>
          typeof value === "number"
      );

  const dailyValues =
    recent
      .map(dailyValue)
      .filter(
        (
          value
        ): value is number =>
          typeof value === "number"
      );

  let recoveryDays = 0;
  let harderDays = 0;
  let lowMorningCount = 0;

  for (const rating of recent) {
    const morning =
      rating.morning;

    const afternoon =
      rating.afternoon;

    if (
      typeof morning === "number" &&
      morning <= 3
    ) {
      lowMorningCount += 1;
    }

    if (
      typeof morning !== "number" ||
      typeof afternoon !== "number"
    ) {
      continue;
    }

    if (
      afternoon - morning >= 2
    ) {
      recoveryDays += 1;
    }

    if (
      morning - afternoon >= 2
    ) {
      harderDays += 1;
    }
  }

  const activeDays =
    new Set(
      recent.map(
        item => item.date
      )
    ).size;

  return {
    recordCount:
      recent.length,

    activeDays,

    averageMorning:
      average(
        morningValues
      ),

    averageAfternoon:
      average(
        afternoonValues
      ),

    averageDaily:
      average(
        dailyValues
      ),

    trend:
      calculateTrend(
        recent
      ),

    recoveryDays,

    harderDays,

    lowMorningCount,

    repeatedLowMornings:
      lowMorningCount >= 2,

    repeatedRecoveries:
      recoveryDays >= 2,

    lowMorningRelevance:
      calculateLowMorningRelevance(
        recent
      ),

    recoveryRelevance:
      calculateRecoveryRelevance(
        recent
      ),

    /**
     * Três dias é o mínimo para começar
     * a falar de padrão recente.
     */
    hasEnoughData:
      activeDays >= 3,
  };
}
