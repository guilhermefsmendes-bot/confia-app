import { useEffect, useMemo, useState } from "react";
import { readCompanionPersonalContextConsent } from "../data/reactive/companionContextConsent";

type ReactiveRecentMemorySnapshot = ReturnType<
  typeof import("../data/reactive/reactiveRecentMemory").collectReactiveRecentMemory
>;

interface UseCompanionHomeMemoryOptions {
  currentTab: number;
  homeScreen: string;
  appDataReady: boolean;
  ratings: readonly unknown[];
  objectives: readonly unknown[];
}

/**
 * Owns the existing contextual-memory lifecycle for the home Companion.
 * It reuses the single reactive recent-memory builder; it does not make
 * decisions or persist a second copy of personal data.
 */
export function useCompanionHomeMemory({
  currentTab,
  homeScreen,
  appDataReady,
  ratings,
  objectives,
}: UseCompanionHomeMemoryOptions) {
const [homeCompanionRelationalMemory, setHomeCompanionRelationalMemory] =
  useState<ReactiveRecentMemorySnapshot | null>(null);
const [companionConsentRevision, setCompanionConsentRevision] = useState(0);
useEffect(() => {
  const refreshConsent = () => setCompanionConsentRevision(value => value + 1);
  window.addEventListener("confia:companion-context-consent-changed", refreshConsent);
  return () => window.removeEventListener("confia:companion-context-consent-changed", refreshConsent);
}, []);

useEffect(() => {
  let cancelled = false;
  let idleId: number | undefined;
  let timerId: number | undefined;

  if (!appDataReady || currentTab !== 0 || homeScreen !== "home" || !readCompanionPersonalContextConsent()) {
    setHomeCompanionRelationalMemory(null);
    return;
  }

  // A memória contextual é complementar: não bloqueia a primeira pintura.
  // Mantém o último snapshot válido durante a atualização em background.
  const calculate = () => {
    void import("../data/reactive/reactiveRecentMemory")
      .then(({ collectReactiveRecentMemory }) => {
        if (cancelled) return;
        try {
          setHomeCompanionRelationalMemory(collectReactiveRecentMemory());
        } catch {
          setHomeCompanionRelationalMemory(null);
        }
      })
      .catch(() => {
        if (!cancelled) setHomeCompanionRelationalMemory(null);
      });
  };

  const requestIdle = (window as any).requestIdleCallback;
  if (typeof requestIdle === "function") {
    idleId = requestIdle(calculate, { timeout: 3200 });
  } else {
    timerId = window.setTimeout(calculate, 1800);
  }

  return () => {
    cancelled = true;
    if (idleId !== undefined) (window as any).cancelIdleCallback?.(idleId);
    if (timerId !== undefined) window.clearTimeout(timerId);
  };
}, [currentTab, homeScreen, ratings, objectives, appDataReady, companionConsentRevision]);


const homeNowMemory = useMemo(() => {
  if (currentTab !== 0 || homeScreen !== "home" || !readCompanionPersonalContextConsent()) {
    return null;
  }

  try {
    const memory = homeCompanionRelationalMemory;

    const effectiveImpulse =
      memory?.recentEffectiveImpulse ?? null;

    const continuity =
      memory?.continuity ?? null;

    /*
     * 1D.6C — HIERARQUIA DA MEMÓRIA
     *
     * Primeiro verificamos se existe aprendizagem pessoal
     * suficiente para apresentar um padrão observado.
     *
     * A aprendizagem exige pelo menos dois episódios eficazes.
     * Isto evita transformar uma única experiência numa conclusão.
     *
     * A necessidade observada é apenas memória contextual.
     * Nunca escolhe automaticamente o percurso.
     */
    if (memory?.hasImpulseLearning) {
      return {
        kind: "impulseLearning" as const,

        effectiveCount:
          memory.effectiveImpulseCount,

        recentCount:
          memory.recentImpulseCount,

        averageReduction:
          memory.recentImpulseAverageReduction ?? null,

        need:
          memory.effectiveImpulseNeed ?? null,

        needCount:
          memory.effectiveImpulseNeedCount,

        /*
         * Mantemos a última experiência eficaz disponível
         * para eventual utilização visual futura.
         */
        recentEffective:
          effectiveImpulse &&
          typeof effectiveImpulse.initialIntensity === "number" &&
          typeof effectiveImpulse.finalIntensity === "number"
            ? {
                before: effectiveImpulse.initialIntensity,
                after: effectiveImpulse.finalIntensity,
                reduction: effectiveImpulse.reduction,
                need: effectiveImpulse.need ?? null,
              }
            : null,
      };
    }

    /*
     * 2. Ainda não existe evidência suficiente para falar
     * de aprendizagem.
     *
     * Nesse caso mantemos a memória da última experiência
     * eficaz exatamente como anteriormente.
     */
    if (
      effectiveImpulse &&
      typeof effectiveImpulse.initialIntensity === "number" &&
      typeof effectiveImpulse.finalIntensity === "number"
    ) {
      return {
        kind: "impulseMemory" as const,

        need:
          effectiveImpulse.need ?? null,

        before:
          effectiveImpulse.initialIntensity,

        after:
          effectiveImpulse.finalIntensity,

        reduction:
          effectiveImpulse.reduction,

        continuity:
          continuity,
      };
    }

    /*
     * 1D.7B — continuidade sem uma última experiência
     * suficientemente recente para mostrar Antes / Agora.
     *
     * Continua a ser apenas memória contextual.
     */
    if (
      continuity?.hasRepeatedSignals
    ) {
      return {
        kind: "continuity" as const,

        /**
         * 1D.8C — CONTINUIDADE VISÍVEL COMPATÍVEL
         *
         * A Home recebe agora as três dimensões da memória.
         * Continua sem decidir a ação.
         */
        signalCount:
          continuity.signalCount,

        moodDirection:
          continuity.moodDirection,

        moodRecordCount:
          continuity.moodRecordCount,

        repeatedCheckInNeed:
          continuity.repeatedCheckInNeed ?? null,

        repeatedCheckInNeedCount:
          continuity.repeatedCheckInNeedCount,

        repeatedNeed:
          continuity.repeatedNeed ?? null,

        repeatedNeedCount:
          continuity.repeatedNeedCount,

        recentEffectiveImpulseCount:
          continuity.recentEffectiveImpulseCount,
      };
    }

    return null;
  } catch {
    /*
     * A memória é apenas uma camada complementar.
     *
     * Se não estiver disponível, o Principal continua
     * a funcionar normalmente através do Reactive Engine.
     */
    return null;
  }
}, [
  currentTab,
  homeScreen,
  homeCompanionRelationalMemory,
  companionConsentRevision,
]);


  return { homeNowMemory };
}
