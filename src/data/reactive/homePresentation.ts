import type { ReactiveResult } from "./reactiveTypes";

/**
 * Pure presentation selectors for the home Companion.
 * These functions map the one existing Reactive Engine result to UI copy;
 * they do not analyse personal data or create a second decision engine.
 */
export function buildHomeReactiveObservation(result: ReactiveResult | null) {
  if (!result) return null;

  const positiveFacts = (result.personalSignals?.facts ?? []).filter(
    (fact) => typeof fact.observedValue === "number" && fact.observedValue > 0
  );
  const domains = new Set(positiveFacts.map((fact) => fact.domain));
  const activeDays = result.personalSignals?.activeDays ?? result.metrics.activeDays;
  const variant = activeDays % 2 === 0 ? "a" : "b";

  if (domains.size >= 2) {
    return { key: `dailyMoment.observation.mixed.${variant}` };
  }
  if (domains.has("exercise")) {
    return { key: `dailyMoment.observation.exercise.${variant}` };
  }
  if (domains.has("nutrition")) {
    return { key: `dailyMoment.observation.nutrition.${variant}` };
  }
  if (domains.has("habit")) {
    return { key: `dailyMoment.observation.habit.${variant}` };
  }
  if (activeDays >= 4) {
    return {
      key: `dailyMoment.observation.records.${variant}`,
      values: { count: activeDays },
    };
  }
  return null;
}

export function getHomeNowAction(result: ReactiveResult | null, currentTab: number, homeScreen: string) {
  if (currentTab !== 0 || homeScreen !== "home") {
    return null;
  }

  /*
   * 1D.6D — separação entre MEMÓRIA e AÇÃO.
   *
   * A memória contextual não deve decidir sozinha
   * qual é a próxima ação do utilizador.
   *
   * Ela informa o Principal sobre experiências anteriores.
   * O Reactive Engine continua a ser responsável
   * pela decisão da ação atual.
   */

  /*
   * 1D.4 — decisão normal do Reactive Engine.
   */

  const intent = result?.intent;

  if (!intent) {
    return null;
  }

  switch (intent) {
    // Regulação / momento difícil
    case "calm":
    case "ground":
    case "encourage_regulation":
    case "support_difficult_moment":
    case "gentle_check":
      return {
        kind: "impulse" as const,
        titleKey: "homeNow.impulse.title",
        textKey: "homeNow.impulse.text",
        actionKey: "homeNow.impulse.action",
      };

    // Aprendizagem a partir do Impulso
    case "reinforce_impulse":
    case "review_impulse":
    case "reinforce_effective_strategy":
      return {
        kind: "impulse" as const,
        titleKey: "homeNow.impulseMemory.title",
        textKey: "homeNow.impulseMemory.text",
        actionKey: "homeNow.impulseMemory.action",
      };

    // Padrões / reflexão
    case "connect_pattern":
    case "invite_reflection":
    case "explore":
    case "reflect":
    case "clarify":
      return {
        kind: "patterns" as const,
        titleKey: "homeNow.patterns.title",
        textKey: "homeNow.patterns.text",
        actionKey: "homeNow.patterns.action",
      };

    // Objetivos
    case "celebrate_objective":
    case "redirect_objective":
      return {
        kind: "objectives" as const,
        titleKey: "homeNow.objectives.title",
        textKey: "homeNow.objectives.text",
        actionKey: "homeNow.objectives.action",
      };

    // Evolução
    case "reinforce_progress":
    case "highlight_small_win":
    case "recognize_consistency":
      return {
        kind: "progress" as const,
        titleKey: "homeNow.progress.title",
        textKey: "homeNow.progress.text",
        actionKey: "homeNow.progress.action",
      };

    // Retoma / início
    case "welcome":
    case "encourage_return":
      return {
        kind: "record" as const,
        titleKey: "homeNow.record.title",
        textKey: "homeNow.record.text",
        actionKey: "homeNow.record.action",
      };

    /*
     * Intenções genéricas não recebem uma recomendação
     * artificial apenas para preencher espaço.
     */
    default:
      return null;
   }
}
