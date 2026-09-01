/**
 * CONFIA — MEMÓRIA REATIVA CURTA
 *
 * Esta camada NÃO cria um novo histórico.
 *
 * A memória é reconstruída a partir dos registos
 * reais já existentes na aplicação.
 *
 * Objetivo:
 *
 * AÇÃO ATUAL
 *     ↓
 * MEMÓRIA RECENTE
 *     ↓
 * CONTEXTO
 *     ↓
 * INTENÇÃO
 *     ↓
 * RESPOSTA
 *
 * A ação atual continua a ter prioridade.
 * A memória serve apenas para enriquecer a resposta.
 */

import type {
  CompanionCollectedData,
  CompanionImpulseRecord,
} from "../companionData";

import {
  collectCompanionData,
} from "../companionData";

import {
  getRecentReactiveHistory,
} from "./reactiveHistoryStorage";

import type {
  ReactiveHistoryEntry,
} from "./reactiveHistoryStorage";


export type ReactiveMoodDirection =
  | "improving"
  | "declining"
  | "stable"
  | "unknown";


export interface ReactiveMemoryMood {
  date: string;
  value: number;
}


export interface ReactiveMemoryCheckIn {
  date: string;
  mood: number;
  need: string;
}


export interface ReactiveMemoryImpulse {
  date: string;

  initialIntensity: number;
  finalIntensity: number;

  reduction: number;

  effective: boolean;
  partiallyEffective: boolean;

  emotion?: string;
  trigger?: string;
  automaticThought?: string;
}


export interface ReactiveRecentMemory {
  /**
   * Humor recente.
   */
  latestMood?: ReactiveMemoryMood;
  previousMood?: ReactiveMemoryMood;

  recentMoodAverage?: number;

  moodDirection: ReactiveMoodDirection;


  /**
   * Daily Check-In.
   */
  latestCheckIn?: ReactiveMemoryCheckIn;
  previousCheckIn?: ReactiveMemoryCheckIn;

  latestNeed?: string;

  /**
   * Necessidade que aparece repetidamente
   * nos check-ins recentes.
   */
  repeatedNeed?: string;


  /**
   * Impulso.
   */
  latestImpulse?: ReactiveMemoryImpulse;

  /**
   * Episódio eficaz mais recente.
   */
  recentEffectiveImpulse?: ReactiveMemoryImpulse;

  /**
   * Quantos episódios recentes reduziram
   * a intensidade em pelo menos 2 pontos.
   */
  effectiveImpulseCount: number;


  /**
   * Utilização recente da aplicação.
   */
  activeDaysLast7: number;


  /**
   * Respostas recentes dadas pela Confia.
   *
   * Não influencia ainda diretamente o texto.
   * Serve para continuidade e prevenção
   * de repetições futuras.
   */
  recentReactiveResponses: ReactiveHistoryEntry[];
}


/**
 * Média simples.
 */
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


/**
 * Normaliza uma data para YYYY-MM-DD.
 */
function normalizeDate(
  value: string
): string {
  return value.split("T")[0];
}


/**
 * Converte uma data YYYY-MM-DD para um valor
 * comparável sem depender da hora local.
 */
function dateValue(
  value: string
): number {
  const normalized = normalizeDate(value);

  const timestamp = Date.parse(
    `${normalized}T00:00:00Z`
  );

  return Number.isNaN(timestamp)
    ? 0
    : timestamp;
}


/**
 * Ordena do mais antigo para o mais recente.
 */
function sortByDate<T>(
  items: T[],
  getDate: (item: T) => string
): T[] {
  return [...items].sort(
    (a, b) =>
      dateValue(getDate(a)) -
      dateValue(getDate(b))
  );
}


/**
 * Calcula quantos dias existem entre hoje
 * e uma determinada data.
 */
function daysAgo(
  date: string
): number {
  const normalized = normalizeDate(date);

  const target = Date.parse(
    `${normalized}T00:00:00Z`
  );

  const today = new Date();

  const todayUtc = Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate()
  );

  if (Number.isNaN(target)) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.max(
    0,
    Math.floor(
      (todayUtc - target) / 86400000
    )
  );
}


/**
 * Obtém a média diária de humor.
 */
function getMoodRecords(
  data: CompanionCollectedData
): ReactiveMemoryMood[] {
  return sortByDate(
    data.mood
      .map((item) => {
        const values = [
          item.morning,
          item.afternoon,
        ].filter(
          (value): value is number =>
            typeof value === "number"
        );

        if (values.length === 0) {
          return null;
        }

        return {
          date: item.date,
          value:
            values.reduce(
              (sum, value) =>
                sum + value,
              0
            ) / values.length,
        };
      })
      .filter(
        (
          item
        ): item is ReactiveMemoryMood =>
          item !== null
      ),
    (item) => item.date
  );
}


/**
 * Direção entre os dois registos de humor
 * mais recentes.
 *
 * Usamos uma margem de 0.8 para evitar tratar
 * pequenas oscilações como mudanças importantes.
 */
function getMoodDirection(
  latest?: ReactiveMemoryMood,
  previous?: ReactiveMemoryMood
): ReactiveMoodDirection {
  if (!latest || !previous) {
    return "unknown";
  }

  const change =
    latest.value - previous.value;

  if (change >= 0.8) {
    return "improving";
  }

  if (change <= -0.8) {
    return "declining";
  }

  return "stable";
}


/**
 * Check-ins ordenados cronologicamente.
 */
function getCheckIns(
  data: CompanionCollectedData
): ReactiveMemoryCheckIn[] {
  return sortByDate(
    data.checkIns
      .filter(
        (item) =>
          typeof item.date === "string" &&
          typeof item.mood === "number" &&
          typeof item.need === "string"
      )
      .map((item) => ({
        date: item.date,
        mood: item.mood,
        need: item.need,
      })),
    (item) => item.date
  );
}


/**
 * Identifica uma necessidade repetida.
 *
 * Consideramos os últimos 3 check-ins.
 * Para existir repetição, a mesma necessidade
 * tem de surgir pelo menos 2 vezes.
 */
function getRepeatedNeed(
  checkIns: ReactiveMemoryCheckIn[]
): string | undefined {
  const recent = checkIns.slice(-3);

  if (recent.length < 2) {
    return undefined;
  }

  const counts = new Map<
    string,
    number
  >();

  recent.forEach((item) => {
    counts.set(
      item.need,
      (counts.get(item.need) ?? 0) + 1
    );
  });

  let selected:
    | string
    | undefined;

  let selectedCount = 1;

  counts.forEach(
    (count, need) => {
      if (count > selectedCount) {
        selected = need;
        selectedCount = count;
      }
    }
  );

  return selected;
}


/**
 * Normaliza um episódio do Impulso.
 */
function normalizeImpulse(
  episode: CompanionImpulseRecord
): ReactiveMemoryImpulse | undefined {
  if (
    typeof episode.intensity !== "number" ||
    typeof episode.finalIntensity !== "number"
  ) {
    return undefined;
  }

  const reduction =
    episode.intensity -
    episode.finalIntensity;

  return {
    date: episode.date,

    initialIntensity:
      episode.intensity,

    finalIntensity:
      episode.finalIntensity,

    reduction,

    effective:
      reduction >= 2,

    partiallyEffective:
      reduction > 0 &&
      reduction < 2,

    emotion:
      episode.emotion,

    trigger:
      episode.trigger,

    automaticThought:
      episode.automaticThought,
  };
}


/**
 * Constrói a memória a partir dos dados
 * já recolhidos pela aplicação.
 *
 * Esta função é pura:
 * não grava nada.
 */
export function buildReactiveRecentMemory(
  data: CompanionCollectedData
): ReactiveRecentMemory {
  const moods =
    getMoodRecords(data);

  const latestMood =
    moods[moods.length - 1];

  const previousMood =
    moods[moods.length - 2];

  const checkIns =
    getCheckIns(data);

  const latestCheckIn =
    checkIns[checkIns.length - 1];

  const previousCheckIn =
    checkIns[checkIns.length - 2];


  const impulses = sortByDate(
    data.impulse
      .map(normalizeImpulse)
      .filter(
        (
          item
        ): item is ReactiveMemoryImpulse =>
          item !== undefined
      ),
    (item) => item.date
  );

  const latestImpulse =
    impulses[impulses.length - 1];

  const effectiveImpulses =
    impulses.filter(
      (item) =>
        item.effective &&
        daysAgo(item.date) <= 7
    );

  const recentEffectiveImpulse =
    effectiveImpulses[
      effectiveImpulses.length - 1
    ];


  /**
   * Dias com qualquer atividade nos
   * últimos sete dias.
   */
  const activeDates =
    new Set<string>();

  data.mood.forEach((item) => {
    if (daysAgo(item.date) <= 6) {
      activeDates.add(
        normalizeDate(item.date)
      );
    }
  });

  data.checkIns.forEach((item) => {
    if (daysAgo(item.date) <= 6) {
      activeDates.add(
        normalizeDate(item.date)
      );
    }
  });

  data.objectives.forEach((item) => {
    if (daysAgo(item.date) <= 6) {
      activeDates.add(
        normalizeDate(item.date)
      );
    }
  });

  data.impulse.forEach((item) => {
    if (daysAgo(item.date) <= 6) {
      activeDates.add(
        normalizeDate(item.date)
      );
    }
  });


  return {
    latestMood,
    previousMood,

    recentMoodAverage:
      average(
        moods
          .slice(-7)
          .map(
            (item) => item.value
          )
      ),

    moodDirection:
      getMoodDirection(
        latestMood,
        previousMood
      ),

    latestCheckIn,
    previousCheckIn,

    latestNeed:
      latestCheckIn?.need,

    repeatedNeed:
      getRepeatedNeed(
        checkIns
      ),

    latestImpulse,

    recentEffectiveImpulse,

    effectiveImpulseCount:
      effectiveImpulses.length,

    activeDaysLast7:
      activeDates.size,

    recentReactiveResponses:
      getRecentReactiveHistory(8),
  };
}


/**
 * Atalho utilizado pelo motor.
 *
 * Recolhe os dados existentes e constrói
 * a memória sem persistir informação nova.
 */
export function collectReactiveRecentMemory():
  ReactiveRecentMemory {
  return buildReactiveRecentMemory(
    collectCompanionData()
  );
}
