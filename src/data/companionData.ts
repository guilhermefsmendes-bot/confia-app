/**
 * COMPANHEIRO CONFIA
 *
 * Camada de ligação entre os registos reais da aplicação
 * e o motor de análise do Companheiro.
 *
 * IMPORTANTE:
 * Este ficheiro NÃO cria um sistema paralelo de registos.
 * Apenas lê os dados já existentes no localStorage e organiza-os.
 */

import { getDailyCheckInHistory } from "../storage/dailyCheckInStorage";
import { loadEpisodes } from "../components/Impulso/storage";
import { loadPatternProfile } from "../components/Patterns/storage";

export interface CompanionMoodRecord {
  date: string;
  morning?: number;
  afternoon?: number;
}

export interface CompanionObjectiveRecord {
  date: string;
  completed: number;
  total: number;
}

export interface CompanionHabitRecord {
  date: string;
  completed: number;
  total: number;
}

export interface CompanionImpulseRecord {
  date: string;
  intensity?: number;
  finalIntensity?: number;
  emotion?: string;
  trigger?: string;
  automaticThought?: string;
}

export interface CompanionCollectedData {
  mood: CompanionMoodRecord[];
  objectives: CompanionObjectiveRecord[];
  habits: CompanionHabitRecord[];
  impulse: CompanionImpulseRecord[];
  checkIns: ReturnType<typeof getDailyCheckInHistory>;
  patternProfile: ReturnType<typeof loadPatternProfile>;
  xp: number;
}

/**
 * Lê os registos de humor existentes.
 */
function readMoodHistory(): CompanionMoodRecord[] {
  try {
    const raw = localStorage.getItem("confia_ratings_v2");

    if (!raw) return [];

    const ratings = JSON.parse(raw);

    if (!Array.isArray(ratings)) return [];

    return ratings.map((item) => ({
      date: item.date,
      morning:
        typeof item.morning === "number"
          ? item.morning
          : undefined,
      afternoon:
        typeof item.afternoon === "number"
          ? item.afternoon
          : undefined,
    }));
  } catch {
    return [];
  }
}

/**
 * Lê o histórico de objetivos existente.
 */
function readObjectivesHistory(): CompanionObjectiveRecord[] {
  try {
    const raw = localStorage.getItem("confia_objectives_history");

    if (!raw) return [];

    const history = JSON.parse(raw);

    if (!Array.isArray(history)) return [];

    return history.map((item) => ({
      date: item.date,
      completed:
        typeof item.completed === "number"
          ? item.completed
          : 0,
      total:
        typeof item.total === "number"
          ? item.total
          : 0,
    }));
  } catch {
    return [];
  }
}

/**
 * Lê o histórico diário de hábitos.
 */
function readHabitsHistory(): CompanionHabitRecord[] {
  try {
    const raw = localStorage.getItem("confia_habits_daily");

    if (!raw) return [];

    const history = JSON.parse(raw);

    if (!Array.isArray(history)) return [];

    return history.map((item) => ({
      date: item.date,
      completed:
        typeof item.completed === "number"
          ? item.completed
          : 0,
      total:
        typeof item.total === "number"
          ? item.total
          : 0,
    }));
  } catch {
    return [];
  }
}

/**
 * Lê os episódios reais do Impulso.
 */
function readImpulseHistory(): CompanionImpulseRecord[] {
  try {
    const episodes = loadEpisodes();

    return episodes.map((episode) => ({
      date: episode.createdAt,
      intensity: episode.initialIntensity,
      finalIntensity: episode.finalIntensity,
      emotion: episode.emotion,
      trigger: episode.trigger,
      automaticThought: episode.thought,
    }));
  } catch {
    return [];
  }
}

/**
 * Lê o XP atual.
 *
 * O avatar é guardado pela aplicação através da chave
 * confia_avatar.
 */
function readXp(): number {
  try {
    const raw = localStorage.getItem("confia_avatar");

    if (!raw) return 0;

    const avatar = JSON.parse(raw);

    return typeof avatar?.xp === "number"
      ? avatar.xp
      : 0;
  } catch {
    return 0;
  }
}

/**
 * Recolhe todos os dados disponíveis para o Companheiro.
 */
export function collectCompanionData(): CompanionCollectedData {
  return {
    mood: readMoodHistory(),

    objectives: readObjectivesHistory(),

    habits: readHabitsHistory(),

    impulse: readImpulseHistory(),

    checkIns: getDailyCheckInHistory(),

    patternProfile: loadPatternProfile(),

    xp: readXp(),
  };
}
