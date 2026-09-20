import type {
  CompanionBehaviorInterpretation,
  CompanionBehaviorSignal,
} from "./companionEventIntelligence";

export type CompanionBehaviorResponse = {
  signal: CompanionBehaviorSignal;
  priority: number;
  translationKeys: string[];
  cooldownMinutes: number;
} | null;

/**
 * ============================================================
 * CONFIA — BEHAVIOR RESPONSE V3B
 * ============================================================
 *
 * Converte apenas sinais comportamentais suficientemente
 * significativos em possibilidades de resposta.
 *
 * Não reage a navegação normal.
 * Não reage automaticamente a abandono.
 * Não compete com acontecimentos emocionais prioritários.
 */
export function resolveCompanionBehaviorResponse(
  behavior: CompanionBehaviorInterpretation
): CompanionBehaviorResponse {
  const signals = behavior.signals;

  if (
    signals.includes(
      "return_after_support"
    )
  ) {
    return {
      signal: "return_after_support",
      priority: 78,
      cooldownMinutes: 45,
      translationKeys: [
        "companionBehavior.returnAfterSupport.a",
        "companionBehavior.returnAfterSupport.b",
        "companionBehavior.returnAfterSupport.c",
      ],
    };
  }

  if (
    signals.includes(
      "reflection_sequence"
    )
  ) {
    return {
      signal: "reflection_sequence",
      priority: 58,
      cooldownMinutes: 90,
      translationKeys: [
        "companionBehavior.reflection.a",
        "companionBehavior.reflection.b",
        "companionBehavior.reflection.c",
      ],
    };
  }

  if (
    signals.includes(
      "repeated_companion_contact"
    )
  ) {
    return {
      signal:
        "repeated_companion_contact",
      priority: 52,
      cooldownMinutes: 45,
      translationKeys: [
        "companionBehavior.companionContact.a",
        "companionBehavior.companionContact.b",
        "companionBehavior.companionContact.c",
      ],
    };
  }

  if (
    signals.includes(
      "progress_reflection"
    )
  ) {
    return {
      signal: "progress_reflection",
      priority: 42,
      cooldownMinutes: 120,
      translationKeys: [
        "companionBehavior.progress.a",
        "companionBehavior.progress.b",
        "companionBehavior.progress.c",
      ],
    };
  }

  if (
    signals.includes(
      "support_sequence"
    )
  ) {
    return {
      signal: "support_sequence",
      priority: 65,
      cooldownMinutes: 60,
      translationKeys: [
        "companionBehavior.support.a",
        "companionBehavior.support.b",
        "companionBehavior.support.c",
      ],
    };
  }

  /**
   * active_exploration, self_care_action e unfinished_tool
   * são deliberadamente silenciosos isoladamente.
   */
  return null;
}
