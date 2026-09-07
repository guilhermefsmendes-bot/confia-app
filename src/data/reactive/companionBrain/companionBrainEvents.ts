import type {
  CompanionBrainEvent,
  CompanionBrainTrigger,
} from "./companionBrainTypes";

import {
  recordCompanionBrainEvent,
} from "./companionBrainMemory";

function createEventId(type: CompanionBrainTrigger): string {
  return [
    type,
    Date.now().toString(36),
    Math.random().toString(36).slice(2, 8),
  ].join("_");
}

/**
 * Regista um acontecimento relevante da experiência.
 *
 * O Companion Brain poderá posteriormente interpretar
 * estes acontecimentos em conjunto com o histórico
 * emocional existente.
 */
export function emitCompanionBrainEvent(
  type: CompanionBrainTrigger,
  metadata?: Record<string, unknown>
): CompanionBrainEvent {
  const event: CompanionBrainEvent = {
    id: createEventId(type),
    type,
    timestamp: new Date().toISOString(),
    metadata,
  };

  recordCompanionBrainEvent(event);

  return event;
}
