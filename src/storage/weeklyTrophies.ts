export interface WeeklyTrophy {
  id: string;
  goalId: string;
  title: string;
  emoji: string;
  createdAt: number;

  /**
   * Adicionado posteriormente.
   * É opcional para manter compatibilidade com troféus
   * conquistados antes da Sala de Troféus.
   */
  weekStart?: string;
}

const TROPHIES_KEY = "confia_weekly_trophies";

export function getWeeklyTrophies(): WeeklyTrophy[] {
  const saved = localStorage.getItem(TROPHIES_KEY);

  if (!saved) return [];

  try {
    const parsed = JSON.parse(saved);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (trophy): trophy is WeeklyTrophy =>
        !!trophy &&
        typeof trophy.id === "string" &&
        typeof trophy.goalId === "string" &&
        typeof trophy.title === "string" &&
        typeof trophy.createdAt === "number"
    );
  } catch {
    return [];
  }
}

export function saveWeeklyTrophies(
  trophies: WeeklyTrophy[]
) {
  localStorage.setItem(
    TROPHIES_KEY,
    JSON.stringify(trophies)
  );
}

export function hasWeeklyTrophy(
  goalId: string
) {
  return getWeeklyTrophies().some(
    trophy => trophy.goalId === goalId
  );
}

export function createWeeklyTrophy(
  goalId: string,
  title: string,
  weekStart?: string
): WeeklyTrophy | null {
  const trophies = getWeeklyTrophies();

  const existing = trophies.find(
    trophy => trophy.goalId === goalId
  );

  if (existing) {
    /**
     * Migração não destrutiva:
     * se um troféu já existir e ainda não tiver weekStart,
     * podemos enriquecê-lo quando essa informação estiver
     * disponível.
     */
    if (weekStart && !existing.weekStart) {
      const updated = {
        ...existing,
        weekStart
      };

      saveWeeklyTrophies(
        trophies.map(trophy =>
          trophy.id === existing.id
            ? updated
            : trophy
        )
      );

      return updated;
    }

    return existing;
  }

  const trophy: WeeklyTrophy = {
    id: `weekly-trophy-${goalId}`,
    goalId,
    title,
    emoji: "🏆",
    createdAt: Date.now(),
    ...(weekStart ? { weekStart } : {})
  };

  saveWeeklyTrophies([
    ...trophies,
    trophy
  ]);

  return trophy;
}
