/**
 * ============================================================
 * CONFIA — COMPANION EVENT INTELLIGENCE V3
 * ============================================================
 *
 * Esta camada transforma acontecimentos factuais da interface
 * em contexto comportamental.
 *
 * IMPORTANTE:
 *
 * - não diagnostica;
 * - não infere emoções a partir de cliques;
 * - não guarda texto livre;
 * - não guarda conteúdo de desabafos;
 * - não transforma um clique isolado numa conclusão;
 * - não fala diretamente;
 * - não substitui o Companion Brain.
 *
 * A função desta camada é responder:
 *
 * "O que tem acontecido nesta sessão?"
 *
 * e não:
 *
 * "O que se passa psicologicamente com esta pessoa?"
 */

export type CompanionSemanticArea =
  | "home"
  | "companion"
  | "checkin"
  | "impulse"
  | "patterns"
  | "map"
  | "progress"
  | "objectives"
  | "habits"
  | "experiments"
  | "community"
  | "vent"
  | "shop"
  | "inventory"
  | "exercise"
  | "other";

export type CompanionInteractionKind =
  | "area_opened"
  | "area_returned"
  | "tool_started"
  | "tool_completed"
  | "tool_abandoned"
  | "reflection_opened"
  | "progress_viewed"
  | "goal_completed"
  | "habit_completed"
  | "item_equipped"
  | "item_purchased"
  | "experiment_started"
  | "experiment_completed"
  | "community_interaction"
  | "support_requested"
  | "support_completed"
  | "companion_contact"
  | "checkin_completed";

export interface CompanionInteractionEvent {
  id: string;
  kind: CompanionInteractionKind;
  area: CompanionSemanticArea;
  timestamp: string;

  /**
   * Metadados deliberadamente limitados.
   *
   * Não colocar aqui:
   * - texto livre;
   * - mensagens privadas;
   * - conteúdo de desabafos;
   * - diagnósticos;
   * - inferências psicológicas.
   */
  metadata?: Record<
    string,
    string | number | boolean | null
  >;
}

export type CompanionBehaviorSignal =
  | "quiet_navigation"
  | "active_exploration"
  | "reflection_sequence"
  | "support_sequence"
  | "return_after_support"
  | "repeated_companion_contact"
  | "progress_reflection"
  | "experiment_reflection"
  | "self_care_action"
  | "unfinished_tool";

export interface CompanionBehaviorInterpretation {
  signals: CompanionBehaviorSignal[];

  eventCount: number;
  uniqueAreas: number;

  latestArea?: CompanionSemanticArea;

  latestMeaningfulEvent?:
    CompanionInteractionEvent;

  shouldConsiderSpeaking: boolean;

  /**
   * Não é uma emoção.
   * É apenas a relevância comportamental da sequência.
   */
  relevance:
    | "none"
    | "low"
    | "medium"
    | "high";
}

const STORAGE_KEY =
  "confia_companion_interactions_v3";

const MAX_EVENTS = 80;

const MAX_AGE_MS =
  1000 * 60 * 60 * 24 * 7;

function canUseBrowserStorage(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.localStorage !== "undefined"
  );
}

function timestampOf(
  event: CompanionInteractionEvent
): number {
  const value =
    new Date(event.timestamp).getTime();

  return Number.isFinite(value)
    ? value
    : 0;
}

function createId(): string {
  return [
    "ci",
    Date.now().toString(36),
    Math.random()
      .toString(36)
      .slice(2, 8),
  ].join("_");
}

function sanitizeMetadata(
  metadata:
    | CompanionInteractionEvent["metadata"]
    | undefined
): CompanionInteractionEvent["metadata"] {
  if (!metadata) {
    return undefined;
  }

  const safe:
    Record<
      string,
      string | number | boolean | null
    > = {};

  /**
   * Lista positiva.
   *
   * Nada que possa conter texto livre entra na memória.
   */
  const allowed = new Set([
    "from",
    "to",
    "tool",
    "source",
    "completed",
    "durationSeconds",
    "beforeIntensity",
    "afterIntensity",
    "goalType",
    "habitType",
    "itemType",
  ]);

  for (const [key, value] of Object.entries(metadata)) {
    if (!allowed.has(key)) {
      continue;
    }

    if (
      value === null ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      safe[key] = value;
      continue;
    }

    if (
      typeof value === "string" &&
      value.length <= 80
    ) {
      safe[key] = value;
    }
  }

  return Object.keys(safe).length
    ? safe
    : undefined;
}

export function readCompanionInteractions(
  now = new Date()
): CompanionInteractionEvent[] {
  if (!canUseBrowserStorage()) {
    return [];
  }

  try {
    const raw =
      window.localStorage.getItem(
        STORAGE_KEY
      );

    if (!raw) {
      return [];
    }

    const parsed =
      JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    const minimum =
      now.getTime() - MAX_AGE_MS;

    return parsed
      .filter(
        (
          event
        ): event is CompanionInteractionEvent =>
          Boolean(event) &&
          typeof event.id === "string" &&
          typeof event.kind === "string" &&
          typeof event.area === "string" &&
          typeof event.timestamp === "string"
      )
      .filter(
        event =>
          timestampOf(event) >= minimum
      )
      .slice(-MAX_EVENTS);
  } catch {
    return [];
  }
}

export function recordCompanionInteraction(
  input: Omit<
    CompanionInteractionEvent,
    "id" | "timestamp"
  > & {
    timestamp?: string;
  }
): CompanionInteractionEvent {
  const event:
    CompanionInteractionEvent = {
      id: createId(),
      kind: input.kind,
      area: input.area,
      timestamp:
        input.timestamp ??
        new Date().toISOString(),
      metadata:
        sanitizeMetadata(
          input.metadata
        ),
    };

  if (!canUseBrowserStorage()) {
    return event;
  }

  try {
    const current =
      readCompanionInteractions();

    const next =
      [...current, event]
        .slice(-MAX_EVENTS);

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(next)
    );

    window.dispatchEvent(
      new CustomEvent(
        "confia-companion-interaction",
        {
          detail: {
            id: event.id,
            kind: event.kind,
            area: event.area,
          },
        }
      )
    );
  } catch {
    // A experiência principal nunca depende desta memória.
  }

  return event;
}

export function clearCompanionInteractions(): void {
  if (!canUseBrowserStorage()) {
    return;
  }

  try {
    window.localStorage.removeItem(
      STORAGE_KEY
    );
  } catch {
    // noop
  }
}

function countKind(
  events: CompanionInteractionEvent[],
  kind: CompanionInteractionKind
): number {
  return events.filter(
    event => event.kind === kind
  ).length;
}

function hasSequence(
  events: CompanionInteractionEvent[],
  first:
    (
      event: CompanionInteractionEvent
    ) => boolean,
  second:
    (
      event: CompanionInteractionEvent
    ) => boolean
): boolean {
  for (
    let firstIndex = 0;
    firstIndex < events.length;
    firstIndex += 1
  ) {
    if (!first(events[firstIndex])) {
      continue;
    }

    for (
      let secondIndex =
        firstIndex + 1;
      secondIndex < events.length;
      secondIndex += 1
    ) {
      if (second(events[secondIndex])) {
        return true;
      }
    }
  }

  return false;
}

export function interpretCompanionInteractions(
  inputEvents:
    CompanionInteractionEvent[]
): CompanionBehaviorInterpretation {
  const events =
    [...inputEvents]
      .filter(
        event =>
          timestampOf(event) > 0
      )
      .sort(
        (a, b) =>
          timestampOf(a) -
          timestampOf(b)
      );

  const signals:
    CompanionBehaviorSignal[] = [];

  const areas =
    new Set(
      events
        .map(event => event.area)
        .filter(area => area !== "home")
    );

  const meaningful =
    events.filter(
      event =>
        event.kind !== "area_opened" &&
        event.kind !== "area_returned"
    );

  const companionContacts =
    countKind(
      events,
      "companion_contact"
    );

  const supportCompleted =
    events.some(
      event =>
        event.kind ===
          "support_completed" ||
        (
          event.kind ===
            "tool_completed" &&
          (
            event.area === "impulse" ||
            event.area === "exercise"
          )
        )
    );

  const returnAfterSupport =
    hasSequence(
      events,
      event =>
        event.kind ===
          "support_completed" ||
        (
          event.kind ===
            "tool_completed" &&
          event.area === "impulse"
        ),
      event =>
        event.kind ===
          "area_returned" &&
        (
          event.area === "home" ||
          event.area === "companion"
        )
    );

  const reflectionSequence =
    hasSequence(
      events,
      event =>
        (
          event.area === "patterns" ||
          event.area === "map"
        ) &&
        (
          event.kind ===
            "area_opened" ||
          event.kind ===
            "reflection_opened"
        ),
      event =>
        event.kind ===
          "checkin_completed"
    );

  const progressReflection =
    hasSequence(
      events,
      event =>
        event.kind ===
          "goal_completed" ||
        event.kind ===
          "habit_completed",
      event =>
        event.kind ===
          "progress_viewed"
    );

  const experimentReflection =
    hasSequence(
      events,
      event =>
        event.kind ===
          "experiment_completed",
      event =>
        event.kind ===
          "progress_viewed" ||
        event.kind ===
          "reflection_opened"
    );

  const unfinishedTool =
    hasSequence(
      events,
      event =>
        event.kind ===
          "tool_started",
      event =>
        event.kind ===
          "tool_abandoned"
    );

  if (
    events.length >= 5 &&
    areas.size >= 3
  ) {
    signals.push(
      "active_exploration"
    );
  } else if (
    events.length > 0 &&
    meaningful.length === 0
  ) {
    signals.push(
      "quiet_navigation"
    );
  }

  if (reflectionSequence) {
    signals.push(
      "reflection_sequence"
    );
  }

  if (supportCompleted) {
    signals.push(
      "support_sequence"
    );
  }

  if (returnAfterSupport) {
    signals.push(
      "return_after_support"
    );
  }

  if (companionContacts >= 3) {
    signals.push(
      "repeated_companion_contact"
    );
  }

  if (progressReflection) {
    signals.push(
      "progress_reflection"
    );
  }

  if (experimentReflection) {
    signals.push(
      "experiment_reflection"
    );
  }

  if (
    events.some(
      event =>
        event.kind ===
          "tool_completed" ||
        event.kind ===
          "habit_completed"
    )
  ) {
    signals.push(
      "self_care_action"
    );
  }

  if (unfinishedTool) {
    signals.push(
      "unfinished_tool"
    );
  }

  let relevance:
    CompanionBehaviorInterpretation["relevance"] =
      "none";

  if (
    signals.includes(
      "return_after_support"
    ) ||
    signals.includes(
      "reflection_sequence"
    )
  ) {
    relevance = "high";
  } else if (
    signals.includes(
      "support_sequence"
    ) ||
    signals.includes(
      "repeated_companion_contact"
    ) ||
    signals.includes(
      "progress_reflection"
    ) ||
    signals.includes(
      "experiment_reflection"
    )
  ) {
    relevance = "medium";
  } else if (
    signals.includes(
      "active_exploration"
    ) ||
    signals.includes(
      "self_care_action"
    ) ||
    signals.includes(
      "unfinished_tool"
    )
  ) {
    relevance = "low";
  }

  return {
    signals,
    eventCount: events.length,
    uniqueAreas: areas.size,
    latestArea:
      events.at(-1)?.area,
    latestMeaningfulEvent:
      meaningful.at(-1),
    shouldConsiderSpeaking:
      relevance === "high" ||
      relevance === "medium",
    relevance,
  };
}
