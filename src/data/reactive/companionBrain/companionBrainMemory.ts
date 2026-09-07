import type {
  CompanionBrainCategory,
  CompanionConversationThread,
} from "./companionBrainTypes";
import type {
  CompanionBrainEvent,
  CompanionBrainMemory,
  CompanionBrainShownMessage,
} from "./companionBrainTypes";

const STORAGE_KEY = "confia_companion_brain_memory_v1";

const MAX_SHOWN_MESSAGES = 120;
const MAX_RECENT_EVENTS = 100;

function storageAvailable(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.localStorage !== "undefined"
  );
}

function nowIso(): string {
  return new Date().toISOString();
}

function createSessionId(): string {
  return [
    "session",
    Date.now().toString(36),
    Math.random().toString(36).slice(2, 9),
  ].join("_");
}

function createEmptyMemory(): CompanionBrainMemory {
  const now = nowIso();

  return {
    version: 1,
    sessionId: createSessionId(),
    sessionStartedAt: now,
    lastActivityAt: now,
    shownMessages: [],
    recentEvents: [],
  };
}

export function loadCompanionBrainMemory(): CompanionBrainMemory {
  if (!storageAvailable()) {
    return createEmptyMemory();
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return createEmptyMemory();
    }

    const parsed = JSON.parse(raw);

    if (
      !parsed ||
      parsed.version !== 1 ||
      typeof parsed.sessionId !== "string" ||
      !Array.isArray(parsed.shownMessages) ||
      !Array.isArray(parsed.recentEvents)
    ) {
      return createEmptyMemory();
    }

    return parsed as CompanionBrainMemory;
  } catch {
    return createEmptyMemory();
  }
}

export function saveCompanionBrainMemory(
  memory: CompanionBrainMemory
): void {
  if (!storageAvailable()) return;

  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...memory,
        shownMessages:
          memory.shownMessages.slice(-MAX_SHOWN_MESSAGES),
        recentEvents:
          memory.recentEvents.slice(-MAX_RECENT_EVENTS),
      })
    );
  } catch {
    // O cérebro nunca deve bloquear a aplicação
    // devido a armazenamento local.
  }
}

export function recordCompanionBrainEvent(
  event: CompanionBrainEvent
): CompanionBrainMemory {
  const memory = loadCompanionBrainMemory();

  const next: CompanionBrainMemory = {
    ...memory,
    lastActivityAt: nowIso(),
    recentEvents: [
      ...memory.recentEvents,
      event,
    ].slice(-MAX_RECENT_EVENTS),
  };

  saveCompanionBrainMemory(next);

  return next;
}

export function recordCompanionShownMessage(
  message: CompanionBrainShownMessage
): CompanionBrainMemory {
  const memory = loadCompanionBrainMemory();

  const next: CompanionBrainMemory = {
    ...memory,
    lastActivityAt: nowIso(),
    shownMessages: [
      ...memory.shownMessages,
      message,
    ].slice(-MAX_SHOWN_MESSAGES),
  };

  saveCompanionBrainMemory(next);

  return next;
}

export function wasCompanionMessageShownRecently(
  id: string,
  cooldownMinutes: number
): boolean {
  const memory = loadCompanionBrainMemory();

  const last = [...memory.shownMessages]
    .reverse()
    .find((item) => item.id === id);

  if (!last) return false;

  const elapsed =
    Date.now() - new Date(last.shownAt).getTime();

  return elapsed < cooldownMinutes * 60 * 1000;
}

export function wasCompanionCategoryShownRecently(
  category: CompanionBrainShownMessage["category"],
  cooldownMinutes: number
): boolean {
  const memory = loadCompanionBrainMemory();

  const last = [...memory.shownMessages]
    .reverse()
    .find((item) => item.category === category);

  if (!last) return false;

  const elapsed =
    Date.now() - new Date(last.shownAt).getTime();

  return elapsed < cooldownMinutes * 60 * 1000;
}


// CONFIA_COMPANION_RECENT_EVENT_HELPERS

export function getRecentCompanionBrainEvents(
  minutes: number
): CompanionBrainEvent[] {
  const memory =
    loadCompanionBrainMemory();

  const cutoff =
    Date.now() - minutes * 60 * 1000;

  return memory.recentEvents.filter(
    event => {
      const timestamp =
        new Date(event.timestamp).getTime();

      return (
        Number.isFinite(timestamp) &&
        timestamp >= cutoff
      );
    }
  );
}

export function hasRecentCompanionBrainEvent(
  type: CompanionBrainEvent["type"],
  minutes: number
): boolean {
  return getRecentCompanionBrainEvents(
    minutes
  ).some(
    event => event.type === type
  );
}

export function countRecentCompanionBrainEvents(
  minutes: number
): number {
  return getRecentCompanionBrainEvents(
    minutes
  ).length;
}

/**
 * ============================================================
 * CONFIA — COMPANION VIVO
 * FASE 11A — MEMÓRIA DA CONVERSA RECENTE
 * ============================================================
 *
 * Importante:
 *
 * Isto lê apenas mensagens que foram REALMENTE mostradas
 * ao utilizador.
 *
 * Uma decisão que o Brain tomou mas que nunca chegou
 * ao balão não entra na continuidade da conversa.
 */

export function getLastCompanionShownMessage():
  CompanionBrainShownMessage | undefined {
  const memory =
    loadCompanionBrainMemory();

  if (
    !memory.shownMessages.length
  ) {
    return undefined;
  }

  return [
    ...memory.shownMessages,
  ].sort(
    (a, b) =>
      new Date(
        b.shownAt
      ).getTime() -
      new Date(
        a.shownAt
      ).getTime()
  )[0];
}

export function getRecentCompanionShownMessages(
  minutes: number
): CompanionBrainShownMessage[] {
  const memory =
    loadCompanionBrainMemory();

  const cutoff =
    Date.now() -
    Math.max(
      0,
      minutes
    ) *
      60 *
      1000;

  return memory.shownMessages
    .filter(
      message => {
        const timestamp =
          new Date(
            message.shownAt
          ).getTime();

        return (
          Number.isFinite(timestamp) &&
          timestamp >= cutoff
        );
      }
    )
    .sort(
      (a, b) =>
        new Date(
          b.shownAt
        ).getTime() -
        new Date(
          a.shownAt
        ).getTime()
    );
}

/**
 * ============================================================
 * CONFIA — FASE 11C
 * MEMÓRIA DO FIO CONVERSACIONAL
 * ============================================================
 */

export function hasCompanionConversationAnchorBeenUsed(
  messageId: string
): boolean {
  if (!messageId) {
    return false;
  }

  const memory =
    loadCompanionBrainMemory();

  return (
    memory.conversationAnchorUses ??
    []
  ).some(
    entry =>
      entry.messageId ===
      messageId
  );
}


export function markCompanionConversationAnchorUsed(
  messageId: string,
  continuationId: string
): void {
  if (
    !messageId ||
    !continuationId
  ) {
    return;
  }

  const memory =
    loadCompanionBrainMemory();

  const existing =
    memory.conversationAnchorUses ??
    [];

  /**
   * A mesma fala só pode ser consumida uma vez.
   */
  if (
    existing.some(
      entry =>
        entry.messageId ===
        messageId
    )
  ) {
    return;
  }

  memory.conversationAnchorUses = [
    ...existing,
    {
      messageId,
      continuationId,
      usedAt:
        new Date().toISOString(),
    },
  ]
    /**
     * Não precisamos de guardar uma história infinita.
     */
    .slice(-100);

  saveCompanionBrainMemory(
    memory
  );
}

/**
 * ============================================================
 * CONFIA — FASE 11D
 * GESTÃO DO FIO CONVERSACIONAL
 * ============================================================
 */

export function getActiveCompanionConversationThread():
  CompanionConversationThread | undefined {
  const memory =
    loadCompanionBrainMemory();

  const threads =
    memory.conversationThreads ??
    [];

  return [...threads]
    .filter(
      thread =>
        thread.status !==
        "closed"
    )
    .sort(
      (a, b) =>
        new Date(
          b.continuedAt ??
            b.openedAt
        ).getTime() -
        new Date(
          a.continuedAt ??
            a.openedAt
        ).getTime()
    )[0];
}


export function openCompanionConversationThread(
  anchorMessageId: string,
  category: CompanionBrainCategory
): void {
  if (
    !anchorMessageId ||
    !category
  ) {
    return;
  }

  const memory =
    loadCompanionBrainMemory();

  const threads =
    memory.conversationThreads ??
    [];

  /**
   * Não abrimos duas vezes o mesmo fio.
   */
  if (
    threads.some(
      thread =>
        thread.anchorMessageId ===
        anchorMessageId
    )
  ) {
    return;
  }

  const now =
    new Date().toISOString();

  memory.conversationThreads = [
    ...threads,
    {
      anchorMessageId,
      category,
      status: "open",
      openedAt: now,
    },
  ].slice(-50);

  saveCompanionBrainMemory(
    memory
  );
}


export function continueCompanionConversationThread(
  anchorMessageId: string,
  continuationId: string
): void {
  if (
    !anchorMessageId ||
    !continuationId
  ) {
    return;
  }

  const memory =
    loadCompanionBrainMemory();

  const threads =
    memory.conversationThreads ??
    [];

  const now =
    new Date().toISOString();

  memory.conversationThreads =
    threads.map(
      thread => {
        if (
          thread.anchorMessageId !==
          anchorMessageId
        ) {
          return thread;
        }

        return {
          ...thread,
          status: "continued",
          continuedAt: now,
          continuationId,
        };
      }
    );

  saveCompanionBrainMemory(
    memory
  );
}


export function closeCompanionConversationThread(
  anchorMessageId: string
): void {
  if (!anchorMessageId) {
    return;
  }

  const memory =
    loadCompanionBrainMemory();

  const threads =
    memory.conversationThreads ??
    [];

  const now =
    new Date().toISOString();

  memory.conversationThreads =
    threads.map(
      thread => {
        if (
          thread.anchorMessageId !==
          anchorMessageId ||
          thread.status ===
          "closed"
        ) {
          return thread;
        }

        return {
          ...thread,
          status: "closed",
          closedAt: now,
        };
      }
    );

  saveCompanionBrainMemory(
    memory
  );
}


/**
 * Um fio continuado não deve ficar semanticamente
 * ativo indefinidamente.
 *
 * A continuação já cumpriu a função de acompanhar
 * aquele assunto.
 */
export function closeContinuedCompanionConversationThreads():
  void {
  const memory =
    loadCompanionBrainMemory();

  const threads =
    memory.conversationThreads ??
    [];

  const now =
    new Date().toISOString();

  let changed = false;

  const next =
    threads.map(
      thread => {
        if (
          thread.status !==
          "continued"
        ) {
          return thread;
        }

        changed = true;

        return {
          ...thread,
          status: "closed" as const,
          closedAt: now,
        };
      }
    );

  if (!changed) {
    return;
  }

  memory.conversationThreads =
    next;

  saveCompanionBrainMemory(
    memory
  );
}

