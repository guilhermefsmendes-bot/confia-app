import type {
  DailyRating,
} from "../../types";

import type {
  CompanionImpulseRecord,
} from "../companionData";

/**
 * ============================================================
 * CONFIA — COMPANION BRAIN
 * FASE 9D — MEMÓRIA CRUZADA
 * HUMOR + IMPULSO
 * ============================================================
 *
 * Esta camada cruza fontes reais já existentes.
 *
 * NÃO cria um novo histórico.
 * NÃO afirma causalidade.
 * NÃO assume que o Impulso provocou uma alteração de humor.
 *
 * Como DailyRating não guarda a hora exata de cada registo,
 * esta camada fala apenas de acontecimentos observados
 * NO MESMO DIA.
 */

export interface CompanionCrossMemory {
  /**
   * Dias analisados com pelo menos um rating.
   */
  ratingDayCount: number;

  /**
   * Dias dos últimos 7 dias que tiveram pelo menos
   * uma utilização do Impulso.
   */
  impulseDayCount: number;

  /**
   * Dias em que:
   *
   * - manhã <= 3
   * - houve Impulso nesse dia
   */
  lowMorningAndImpulseDays: number;

  /**
   * Dias em que:
   *
   * - manhã <= 3
   * - houve Impulso
   * - tarde >= manhã + 2
   *
   * Isto NÃO significa que o Impulso causou a melhoria.
   */
  lowMorningImpulseRecoveryDays: number;

  /**
   * Dias em que:
   *
   * - houve Impulso
   * - tarde >= manhã + 2
   *
   * Independentemente de a manhã ser <= 3.
   */
  impulseAndRecoveryDays: number;

  /**
   * Existe repetição suficiente para mencionar
   * manhã baixa + Impulso.
   */
  repeatedLowMorningWithImpulse: boolean;

  /**
   * Existe repetição suficiente para mencionar
   * que, em mais do que um dia, os três sinais
   * coexistiram.
   */
  repeatedLowMorningImpulseRecovery: boolean;

  /**
   * Existe repetição de dias com Impulso e
   * melhoria clara entre manhã e tarde.
   */
  repeatedImpulseRecovery: boolean;

  /**
   * Quantidade mínima de dados para uma leitura
   * cruzada responsável.
   */
  hasEnoughData: boolean;
}

function ratingDateValue(
  value: string
): number {
  const parts =
    value.split("-").map(Number);

  if (
    parts.length !== 3 ||
    parts.some(
      part => !Number.isFinite(part)
    )
  ) {
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

function localDateKeyFromTimestamp(
  value: string
): string | undefined {
  const date =
    new Date(value);

  if (
    !Number.isFinite(
      date.getTime()
    )
  ) {
    return undefined;
  }

  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(
      2,
      "0"
    );

  const day =
    String(
      date.getDate()
    ).padStart(
      2,
      "0"
    );

  return (
    `${year}-${month}-${day}`
  );
}

export function buildCompanionCrossMemory(
  ratings: DailyRating[],
  impulse: CompanionImpulseRecord[],
  now: Date = new Date()
): CompanionCrossMemory {
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
   * Ratings dos últimos 7 dias de calendário,
   * incluindo hoje.
   */
  const recentRatings =
    ratings.filter(
      rating => {
        const timestamp =
          ratingDateValue(
            rating.date
          );

        return (
          Number.isFinite(timestamp) &&
          timestamp >= cutoff &&
          timestamp <= today
        );
      }
    );

  /**
   * Conjunto dos dias em que existiu pelo menos
   * um episódio do Impulso.
   */
  const impulseDays =
    new Set<string>();

  for (const episode of impulse) {
    const timestamp =
      new Date(
        episode.date
      ).getTime();

    if (
      !Number.isFinite(timestamp)
    ) {
      continue;
    }

    /**
     * Mantemos a mesma janela temporal aproximada
     * de 7 dias.
     */
    if (
      timestamp <
        cutoff ||
      timestamp >
        now.getTime()
    ) {
      continue;
    }

    const key =
      localDateKeyFromTimestamp(
        episode.date
      );

    if (key) {
      impulseDays.add(
        key
      );
    }
  }

  let lowMorningAndImpulseDays =
    0;

  let lowMorningImpulseRecoveryDays =
    0;

  let impulseAndRecoveryDays =
    0;

  for (
    const rating
    of recentRatings
  ) {
    const hasImpulse =
      impulseDays.has(
        rating.date
      );

    if (!hasImpulse) {
      continue;
    }

    const morning =
      rating.morning;

    const afternoon =
      rating.afternoon;

    if (
      typeof morning ===
      "number"
    ) {
      if (
        morning <= 3
      ) {
        lowMorningAndImpulseDays +=
          1;
      }
    }

    if (
      typeof morning !==
        "number" ||
      typeof afternoon !==
        "number"
    ) {
      continue;
    }

    const recovered =
      afternoon -
      morning >= 2;

    if (recovered) {
      impulseAndRecoveryDays +=
        1;
    }

    if (
      morning <= 3 &&
      recovered
    ) {
      lowMorningImpulseRecoveryDays +=
        1;
    }
  }

  return {
    ratingDayCount:
      recentRatings.length,

    impulseDayCount:
      impulseDays.size,

    lowMorningAndImpulseDays,

    lowMorningImpulseRecoveryDays,

    impulseAndRecoveryDays,

    repeatedLowMorningWithImpulse:
      lowMorningAndImpulseDays >= 2,

    repeatedLowMorningImpulseRecovery:
      lowMorningImpulseRecoveryDays >= 2,

    repeatedImpulseRecovery:
      impulseAndRecoveryDays >= 2,

    /**
     * Precisamos de vários dias de ratings e
     * pelo menos dois dias de utilização do Impulso
     * antes de considerar uma leitura cruzada.
     */
    hasEnoughData:
      recentRatings.length >= 3 &&
      impulseDays.size >= 2,
  };
}
