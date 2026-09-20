import {
  interpretCompanionInteractions,
  readCompanionInteractions,
  type CompanionBehaviorInterpretation,
} from "./companionEventIntelligence";

/**
 * ============================================================
 * CONFIA — COMPANION BEHAVIOR CONTEXT V3B
 * ============================================================
 *
 * Ponte entre a camada factual de interação e o Companion Brain.
 *
 * Esta camada NÃO diagnostica.
 * Esta camada NÃO transforma cliques em estados emocionais.
 *
 * Apenas resume sequências comportamentais recentes para que
 * as regras do Brain possam decidir se vale a pena reagir.
 */

export function getCompanionBehaviorContext(
  now = new Date()
): CompanionBehaviorInterpretation {
  const events =
    readCompanionInteractions(now);

  return interpretCompanionInteractions(
    events
  );
}

export function hasCompanionBehaviorSignal(
  signal:
    CompanionBehaviorInterpretation["signals"][number],
  now = new Date()
): boolean {
  return getCompanionBehaviorContext(
    now
  ).signals.includes(signal);
}
