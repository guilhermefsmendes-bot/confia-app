export interface CompanionDailyTip {
  id: string;
  translationKey: string;
}

/**
 * CONFIA — DAILY DISCOVERY TIPS
 *
 * Pequenas sugestões que ajudam o utilizador a descobrir
 * funcionalidades da aplicação.
 *
 * Regras:
 * - uma dica estável por dia;
 * - não usa Math.random();
 * - não cria memória clínica;
 * - não interfere com o Companion Brain;
 * - a mesma dica é usada independentemente do idioma.
 */
export const COMPANION_DAILY_TIPS: CompanionDailyTip[] = [
  { id: "habits", translationKey: "companionDailyTips.habits" },
  { id: "patterns", translationKey: "companionDailyTips.patterns" },
  { id: "personalMap", translationKey: "companionDailyTips.personalMap" },
  { id: "experiments", translationKey: "companionDailyTips.experiments" },
  { id: "objectives", translationKey: "companionDailyTips.objectives" },
  { id: "weeklyGoal", translationKey: "companionDailyTips.weeklyGoal" },
  { id: "progress", translationKey: "companionDailyTips.progress" },
  { id: "sos", translationKey: "companionDailyTips.sos" },
  { id: "dailyCheckin", translationKey: "companionDailyTips.dailyCheckin" },
  { id: "companion", translationKey: "companionDailyTips.companion" },
  { id: "inventory", translationKey: "companionDailyTips.inventory" },
  { id: "shop", translationKey: "companionDailyTips.shop" },
  { id: "community", translationKey: "companionDailyTips.community" },
  { id: "reflection", translationKey: "companionDailyTips.reflection" },
  { id: "habitEvolution", translationKey: "companionDailyTips.habitEvolution" },
  { id: "smallChanges", translationKey: "companionDailyTips.smallChanges" },
  { id: "observeDays", translationKey: "companionDailyTips.observeDays" },
  { id: "useRegularly", translationKey: "companionDailyTips.useRegularly" },
];

function getLocalDateSeed(date: Date): number {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  return Math.floor(
    Date.UTC(year, month - 1, day) / 86400000
  );
}

export function getCompanionDailyTip(
  date: Date = new Date()
): CompanionDailyTip | null {
  if (COMPANION_DAILY_TIPS.length === 0) {
    return null;
  }

  const index =
    Math.abs(getLocalDateSeed(date)) %
    COMPANION_DAILY_TIPS.length;

  return COMPANION_DAILY_TIPS[index];
}
