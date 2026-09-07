import {
  openCompanionConversationThread,
  continueCompanionConversationThread,
  closeContinuedCompanionConversationThreads,
} from "./companionBrainMemory";
import {
  markCompanionConversationAnchorUsed,
} from "./companionBrainMemory";
import type {
  CompanionBrainCandidate,
  CompanionBrainDecision,
  CompanionBrainTrigger,
} from "./companionBrainTypes";

import {
  decideCompanionThought,
} from "./companionBrainDecisionEngine";

import {
  recordCompanionShownMessage,
} from "./companionBrainMemory";

/**
 * CONFIA — COMPANION BRAIN
 *
 * Porta de entrada principal do novo cérebro contínuo.
 *
 * Nesta fase recebe candidatos já construídos.
 *
 * Mais tarde esta função receberá contexto real
 * da aplicação e produzirá os candidatos através
 * das regras contextuais.
 */
export function evaluateCompanionBrain(
  candidates: CompanionBrainCandidate[]
): CompanionBrainDecision | null {
  return decideCompanionThought(
    candidates
  );
}

/**
 * Regista que uma decisão foi realmente mostrada
 * ao utilizador.
 *
 * IMPORTANTE:
 *
 * decidir != mostrar
 *
 * Uma mensagem só entra na memória conversacional
 * quando chega efetivamente ao utilizador.
 */
export function markCompanionDecisionShown(
  decision: CompanionBrainDecision,
  trigger?: CompanionBrainTrigger
): void {
  recordCompanionShownMessage({
    id: decision.candidate.id,
    category:
      decision.candidate.category,
    reason:
      decision.candidate.reason,
    shownAt: new Date().toISOString(),
    trigger,
  });

  // CONFIA_FASE11C_CONSUME_CONVERSATION_ANCHOR
  /**
   * A âncora só é consumida aqui:
   *
   * decisão tomada       -> NÃO
   * candidato escolhido  -> NÃO
   * fala realmente vista -> SIM
   *
   * Isto mantém a regra introduzida na 11A:
   * memória conversacional representa aquilo que
   * aconteceu entre Companion e utilizador.
   */
  const conversationAnchorId =
    decision.candidate.metadata
      ?.conversationAnchorId;

  if (
    typeof conversationAnchorId ===
      "string" &&
    conversationAnchorId
  ) {
    markCompanionConversationAnchorUsed(
      conversationAnchorId,
      decision.candidate.id
    );
  }

  // CONFIA_FASE11D_CONVERSATION_THREAD_LIFECYCLE
  /**
   * ==========================================================
   * CICLO DE VIDA DO FIO
   * ==========================================================
   *
   * Só alteramos o estado da conversa quando uma fala
   * chegou realmente ao utilizador.
   */

  const shownCandidate =
    decision.candidate;

  const shownAnchorId =
    shownCandidate.metadata
      ?.conversationAnchorId;

  if (
    typeof shownAnchorId ===
      "string" &&
    shownAnchorId
  ) {
    /**
     * Esta fala é uma continuação.
     */
    continueCompanionConversationThread(
      shownAnchorId,
      shownCandidate.id
    );
  } else {
    /**
     * Uma nova fala relevante pode iniciar
     * um novo assunto.
     *
     * Micro-interações/casual não precisam
     * de criar fios persistentes.
     */
    const canOpenThread =
      shownCandidate.category ===
        "emotional_followup" ||
      shownCandidate.category ===
        "impulse_followup" ||
      shownCandidate.category ===
        "mood_change" ||
      shownCandidate.category ===
        "symptom";

    if (canOpenThread) {
      /**
       * Um fio que já foi continuado cumpriu a sua função.
       * Fechamo-lo antes de iniciar um novo assunto.
       */
      closeContinuedCompanionConversationThreads();

      openCompanionConversationThread(
        shownCandidate.id,
        shownCandidate.category
      );
    }
  }


}
