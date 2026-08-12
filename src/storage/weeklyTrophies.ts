export interface WeeklyTrophy {
  id: string;
  goalId: string;
  title: string;
  emoji: string;
  createdAt: number;
}

const TROPHIES_KEY = "confia_weekly_trophies";

export function getWeeklyTrophies(): WeeklyTrophy[] {
  const saved = localStorage.getItem(TROPHIES_KEY);

  if (!saved) return [];

  try {
    return JSON.parse(saved);
  } catch {
    return [];
  }
}

export function saveWeeklyTrophies(trophies: WeeklyTrophy[]) {
  localStorage.setItem(
    TROPHIES_KEY,
    JSON.stringify(trophies)
  );
}

export function hasWeeklyTrophy(goalId: string) {
  return getWeeklyTrophies().some(
    trophy => trophy.goalId === goalId
  );
}

export function createWeeklyTrophy(
  goalId: string,
  title: string
): WeeklyTrophy | null {

  const trophies = getWeeklyTrophies();

  const existing = trophies.find(
    trophy => trophy.goalId === goalId
  );

  if (existing) return existing;

  const trophy: WeeklyTrophy = {
    id: `weekly-trophy-${goalId}`,
    goalId,
    title,
    emoji: "🏆",
    createdAt: Date.now()
  };

  saveWeeklyTrophies([
    ...trophies,
    trophy
  ]);

  return trophy;
}
