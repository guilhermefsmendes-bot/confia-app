import type {
  CompanionImpulseRecord,
} from "../companionData";

/**
 * ============================================================
 * CONFIA — COMPANION BRAIN
 * MEMÓRIA LONGITUDINAL DO IMPULSO — 7 DIAS
 * ============================================================
 *
 * Esta camada NÃO cria um novo histórico.
 *
 * Recebe os episódios reais já recolhidos pela arquitetura
 * existente da Confia e transforma-os em observações que
 * podem ser usadas pelo Companion Brain.
 *
 * Não diagnostica.
 * Não assume causas.
 * Não classifica o utilizador.
 */

export type CompanionImpulseNeed =
  | "calm"
  | "mind"
  | "control"
  | "support";

export interface CompanionLongitudinalImpulseMemory {
  /**
   * Total de episódios nos últimos 7 dias.
   */
  episodeCount: number;

  /**
   * Episódios que possuem intensidade final válida.
   */
  measurableEpisodeCount: number;

  /**
   * Episódios em que a intensidade desceu
   * pelo menos 2 pontos.
   */
  effectiveEpisodeCount: number;

  /**
   * Episódios em que houve alguma redução,
   * mas inferior a 2 pontos.
   */
  partiallyEffectiveEpisodeCount: number;

  /**
   * Média da redução entre intensidade inicial
   * e final.
   */
  averageReduction?: number;

  /**
   * Necessidade/percurso mais escolhido.
   */
  repeatedNeed?: CompanionImpulseNeed;

  repeatedNeedCount: number;

  /**
   * Necessidade/percurso que aparece repetidamente
   * entre episódios considerados eficazes.
   */
  effectiveNeed?: CompanionImpulseNeed;

  effectiveNeedCount: number;

  /**
   * O utilizador recorreu ao Impulso pelo menos
   * 3 vezes na janela de 7 dias.
   */
  repeatedUse: boolean;

  /**
   * Existem pelo menos 2 episódios recentes
   * com redução >= 2.
   */
  repeatedEffectiveness: boolean;

  /**
   * O mesmo percurso esteve associado a pelo
   * menos 2 episódios eficazes.
   */
  repeatedEffectiveNeed: boolean;

  /**
   * Existem dados suficientes para fazer
   * uma observação longitudinal prudente.
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
      (sum, value) =>
        sum + value,
      0
    ) / values.length
  );
}

function timestampOf(
  value: string
): number {
  const timestamp =
    new Date(value).getTime();

  return Number.isFinite(timestamp)
    ? timestamp
    : NaN;
}

function isImpulseNeed(
  value: unknown
): value is CompanionImpulseNeed {
  return (
    value === "calm" ||
    value === "mind" ||
    value === "control" ||
    value === "support"
  );
}

function mostCommonNeed(
  needs: CompanionImpulseNeed[]
): {
  need?: CompanionImpulseNeed;
  count: number;
} {
  if (needs.length === 0) {
    return {
      need: undefined,
      count: 0,
    };
  }

  const counts =
    new Map<
      CompanionImpulseNeed,
      number
    >();

  for (const need of needs) {
    counts.set(
      need,
      (counts.get(need) ?? 0) + 1
    );
  }

  let selected:
    CompanionImpulseNeed | undefined;

  let selectedCount = 0;

  for (const [
    need,
    count,
  ] of counts.entries()) {
    if (count > selectedCount) {
      selected = need;
      selectedCount = count;
    }
  }

  return {
    need: selected,
    count: selectedCount,
  };
}

export function buildCompanionLongitudinalImpulseMemory(
  impulse: CompanionImpulseRecord[],
  now: Date = new Date()
): CompanionLongitudinalImpulseMemory {
  const cutoff =
    now.getTime() -
    7 * 24 * 60 * 60 * 1000;

  const recent =
    impulse
      .filter(item => {
        const timestamp =
          timestampOf(
            item.date
          );

        return (
          Number.isFinite(timestamp) &&
          timestamp >= cutoff &&
          timestamp <= now.getTime()
        );
      })
      .sort(
        (a, b) =>
          timestampOf(a.date) -
          timestampOf(b.date)
      );

  const reductions: number[] = [];

  const effectiveNeeds:
    CompanionImpulseNeed[] = [];

  const allNeeds:
    CompanionImpulseNeed[] = [];

  let effectiveEpisodeCount = 0;

  let partiallyEffectiveEpisodeCount =
    0;

  let measurableEpisodeCount = 0;

  for (const episode of recent) {
    if (
      isImpulseNeed(
        episode.need
      )
    ) {
      allNeeds.push(
        episode.need
      );
    }

    if (
      typeof episode.intensity !==
        "number" ||
      typeof episode.finalIntensity !==
        "number"
    ) {
      continue;
    }

    measurableEpisodeCount += 1;

    const reduction =
      episode.intensity -
      episode.finalIntensity;

    reductions.push(
      reduction
    );

    if (reduction >= 2) {
      effectiveEpisodeCount += 1;

      if (
        isImpulseNeed(
          episode.need
        )
      ) {
        effectiveNeeds.push(
          episode.need
        );
      }

      continue;
    }

    if (reduction > 0) {
      partiallyEffectiveEpisodeCount +=
        1;
    }
  }

  const commonNeed =
    mostCommonNeed(
      allNeeds
    );

  const commonEffectiveNeed =
    mostCommonNeed(
      effectiveNeeds
    );

  return {
    episodeCount:
      recent.length,

    measurableEpisodeCount,

    effectiveEpisodeCount,

    partiallyEffectiveEpisodeCount,

    averageReduction:
      average(
        reductions
      ),

    repeatedNeed:
      commonNeed.count >= 2
        ? commonNeed.need
        : undefined,

    repeatedNeedCount:
      commonNeed.count,

    effectiveNeed:
      commonEffectiveNeed.count >= 2
        ? commonEffectiveNeed.need
        : undefined,

    effectiveNeedCount:
      commonEffectiveNeed.count,

    repeatedUse:
      recent.length >= 3,

    repeatedEffectiveness:
      effectiveEpisodeCount >= 2,

    repeatedEffectiveNeed:
      commonEffectiveNeed.count >= 2,

    /**
     * Não fazemos observações de eficácia
     * baseadas numa única utilização.
     */
    hasEnoughData:
      recent.length >= 2,
  };
}
