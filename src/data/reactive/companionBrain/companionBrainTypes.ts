/**
 * CONFIA — COMPANION BRAIN
 *
 * Tipos fundamentais do cérebro reativo contínuo.
 *
 * Esta camada não substitui o Reactive Engine.
 * Acrescenta contexto de sessão, eventos, memória
 * conversacional, prioridade e silêncio inteligente.
 */

export type CompanionBrainCategory =
  | "emotional_followup"
  | "impulse_followup"
  | "mood_change"
  | "symptom"
  | "missing_checkin"
  | "progress"
  | "objective"
  | "community"
  | "discovery"
  | "casual";

export type CompanionBrainEmotion =
  | "neutral"
  | "warm"
  | "concerned"
  | "encouraging"
  | "celebrating"
  | "curious"
  | "calm";

export type CompanionBrainTrigger =
  | "app_opened"
  | "home_opened"
  | "home_returned"
  | "mood_saved"
  | "checkin_saved"
  | "impulse_started"
  | "impulse_completed"
  | "symptom_selected"
  | "objective_completed"
  | "community_opened"
  | "community_posted"
  | "avatar_tapped"
  | "time_context"
  | "context_changed";

export interface CompanionBrainEvent {
  id: string;
  type: CompanionBrainTrigger;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface CompanionBrainCandidate {
  id: string;
  translationKey: string;

  category: CompanionBrainCategory;
  emotion: CompanionBrainEmotion;

  priority: number;

  reason: string;

  cooldownMinutes: number;

  /**
   * Se definido, a mensagem deixa de fazer sentido
   * depois deste momento.
   */
  expiresAt?: string;

  /**
   * Ação opcional apresentada juntamente
   * com o pensamento do companheiro.
   */
  action?: {
    labelKey: string;
    target:
      | "mood"
      | "impulse"
      | "patterns"
      | "objectives"
      | "community";
  };

  metadata?: Record<string, unknown>;
}

export interface CompanionBrainDecision {
  candidate: CompanionBrainCandidate;
  decidedAt: string;
}

export interface CompanionBrainShownMessage {
  id: string;
  category: CompanionBrainCategory;
  reason: string;
  shownAt: string;
  trigger?: CompanionBrainTrigger;
}

export interface CompanionBrainMemory {
  version: 1;

  sessionId: string;

  sessionStartedAt: string;

  lastActivityAt: string;

  shownMessages: CompanionBrainShownMessage[];

  recentEvents: CompanionBrainEvent[];

  conversationAnchorUses?:
    CompanionConversationAnchorUse[];

  conversationThreads?:
    CompanionConversationThread[];
}

/**
 * ============================================================
 * CONFIA — COMPANION VIVO
 * FASE 11C — FIO DA CONVERSA
 * ============================================================
 *
 * Regista que uma fala anterior já serviu de origem
 * a uma continuação.
 *
 * Assim a mesma frase não abre indefinidamente
 * novas continuações.
 */
export interface CompanionConversationAnchorUse {
  messageId: string;
  continuationId: string;
  usedAt: string;
}

/**
 * ============================================================
 * CONFIA — COMPANION VIVO
 * FASE 11D — CICLO DE VIDA DA CONVERSA
 * ============================================================
 */

export type CompanionConversationThreadStatus =
  | "open"
  | "continued"
  | "closed";

export interface CompanionConversationThread {
  /**
   * ID da primeira fala que abriu este fio.
   */
  anchorMessageId: string;

  /**
   * Categoria emocional/funcional do assunto.
   */
  category: CompanionBrainCategory;

  status:
    CompanionConversationThreadStatus;

  openedAt: string;

  continuedAt?: string;

  closedAt?: string;

  continuationId?: string;
}

