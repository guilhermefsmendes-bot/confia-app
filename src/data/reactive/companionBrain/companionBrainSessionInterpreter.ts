import type {
  CompanionBrainEvent,
} from "./companionBrainTypes";

/**
 * ============================================================
 * CONFIA — COMPANION BRAIN
 * SESSION INTERPRETER
 * ============================================================
 *
 * Não decide frases.
 *
 * Interpreta pequenas sequências comportamentais recentes
 * para permitir que o cérebro perceba continuidade.
 *
 * Exemplos:
 *
 * Padrões → Home → registo
 * vários espaços visitados
 * vários toques no companheiro
 * Impulso → nova interação
 */

export type CompanionSessionSignal =
  | "reflection_after_patterns"
  | "exploring_app"
  | "seeking_companion"
  | "support_session";

export interface CompanionSessionInterpretation {
  signals: CompanionSessionSignal[];

  eventCount: number;

  avatarTapCount: number;

  navigationCount: number;

  metadata: {
    patternsThenMood: boolean;
    interactionAfterImpulse: boolean;
  };
}

function timestampOf(
  event: CompanionBrainEvent
): number {
  const value =
    new Date(event.timestamp).getTime();

  return Number.isFinite(value)
    ? value
    : 0;
}

function metadataString(
  event: CompanionBrainEvent,
  key: string
): string | undefined {
  const value =
    event.metadata?.[key];

  return typeof value === "string"
    ? value
    : undefined;
}

export function interpretCompanionSession(
  events: CompanionBrainEvent[]
): CompanionSessionInterpretation {
  const ordered = [...events]
    .filter(event => timestampOf(event) > 0)
    .sort(
      (a, b) =>
        timestampOf(a) - timestampOf(b)
    );

  const signals:
    CompanionSessionSignal[] = [];

  const avatarTapEvents =
    ordered.filter(
      event =>
        event.type === "avatar_tapped"
    );

  const navigationEvents =
    ordered.filter(
      event =>
        event.type === "context_changed" ||
        event.type === "home_returned"
    );

  /**
   * ----------------------------------------------------------
   * 1. PADRÕES → REFLEXÃO → REGISTO
   * ----------------------------------------------------------
   */
  const patternsEvents =
    ordered.filter(event => {
      if (event.type === "context_changed") {
        return (
          metadataString(event, "to") ===
          "patterns"
        );
      }

      if (event.type === "home_returned") {
        return (
          metadataString(event, "from") ===
          "patterns"
        );
      }

      return false;
    });

  const latestPatternsEvent =
    patternsEvents.at(-1);

  const patternsThenMood =
    Boolean(
      latestPatternsEvent &&
      ordered.some(
        event =>
          event.type === "mood_saved" &&
          timestampOf(event) >
            timestampOf(latestPatternsEvent)
      )
    );

  if (patternsThenMood) {
    signals.push(
      "reflection_after_patterns"
    );
  }

  /**
   * ----------------------------------------------------------
   * 2. EXPLORAÇÃO DA APP
   * ----------------------------------------------------------
   *
   * Não basta um simples ir e voltar.
   * Exigimos várias mudanças de contexto.
   */
  const visitedAreas =
    new Set<string>();

  for (const event of navigationEvents) {
    const to =
      metadataString(event, "to");

    const from =
      metadataString(event, "from");

    if (to && to !== "home") {
      visitedAreas.add(to);
    }

    if (from && from !== "home") {
      visitedAreas.add(from);
    }
  }

  if (
    navigationEvents.length >= 4 &&
    visitedAreas.size >= 2
  ) {
    signals.push(
      "exploring_app"
    );
  }

  /**
   * ----------------------------------------------------------
   * 3. PROCURA DO COMPANHEIRO
   * ----------------------------------------------------------
   */
  if (avatarTapEvents.length >= 3) {
    signals.push(
      "seeking_companion"
    );
  }

  /**
   * ----------------------------------------------------------
   * 4. CONTINUIDADE APÓS IMPULSO
   * ----------------------------------------------------------
   */
  const latestImpulse =
    [...ordered]
      .reverse()
      .find(
        event =>
          event.type ===
          "impulse_completed"
      );

  const interactionAfterImpulse =
    Boolean(
      latestImpulse &&
      ordered.some(event => {
        if (
          timestampOf(event) <=
          timestampOf(latestImpulse)
        ) {
          return false;
        }

        return (
          event.type === "avatar_tapped" ||
          event.type === "home_returned" ||
          event.type === "mood_saved"
        );
      })
    );

  if (interactionAfterImpulse) {
    signals.push(
      "support_session"
    );
  }

  return {
    signals,

    eventCount:
      ordered.length,

    avatarTapCount:
      avatarTapEvents.length,

    navigationCount:
      navigationEvents.length,

    metadata: {
      patternsThenMood,
      interactionAfterImpulse,
    },
  };
}
