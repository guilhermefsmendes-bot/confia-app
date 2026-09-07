import {
  rankCompanionCandidatesContextually,
} from "./companionBrainContextualRanking";
import type {
  CompanionBrainCandidate,
  CompanionBrainDecision,
} from "./companionBrainTypes";

import {
  wasCompanionCategoryShownRecently,
  wasCompanionMessageShownRecently,
} from "./companionBrainMemory";

/**
 * CONFIA — COMPANION BRAIN
 *
 * MOTOR DE DECISÃO
 *
 * Responsabilidade:
 *
 * 1. Receber pensamentos candidatos.
 * 2. Remover pensamentos expirados.
 * 3. Respeitar cooldowns.
 * 4. Evitar insistência sobre o mesmo assunto.
 * 5. Ordenar por relevância.
 * 6. Permitir silêncio.
 *
 * Este motor NÃO decide ainda quais pensamentos existem.
 * Isso ficará a cargo das regras contextuais.
 */

const MINIMUM_PRIORITY_TO_SPEAK = 20;

/**
 * Cooldown mínimo entre mensagens pertencentes
 * à mesma categoria.
 *
 * É deliberadamente mais curto do que os cooldowns
 * individuais das mensagens.
 *
 * Evita que o companheiro diga várias coisas semelhantes
 * em sequência mesmo que sejam mensagens diferentes.
 */
const CATEGORY_COOLDOWN_MINUTES = 20;

function isExpired(
  candidate: CompanionBrainCandidate,
  now: Date
): boolean {
  if (!candidate.expiresAt) {
    return false;
  }

  const expiresAt = new Date(
    candidate.expiresAt
  ).getTime();

  if (Number.isNaN(expiresAt)) {
    return false;
  }

  return now.getTime() > expiresAt;
}

function isEligible(
  candidate: CompanionBrainCandidate,
  now: Date
): boolean {
  if (candidate.priority < MINIMUM_PRIORITY_TO_SPEAK) {
    return false;
  }

  if (isExpired(candidate, now)) {
    return false;
  }

  if (
    wasCompanionMessageShownRecently(
      candidate.id,
      candidate.cooldownMinutes
    )
  ) {
    return false;
  }

  // CONFIA_MICRO_INTERACTION_CATEGORY_COOLDOWN
  const isMicroInteraction =
    candidate.metadata?.microInteraction === true;

  if (
    !isMicroInteraction &&
    wasCompanionCategoryShownRecently(
      candidate.category,
      CATEGORY_COOLDOWN_MINUTES
    )
  ) {
    return false;
  }

  return true;
}

/**
 * Ordenação estável:
 *
 * 1. maior prioridade;
 * 2. em empate, preserva ordem original.
 *
 * Isso permite que as regras contextuais tenham
 * também algum controlo narrativo.
 */
function rankCandidates(
  candidates: CompanionBrainCandidate[]
): CompanionBrainCandidate[] {
  return candidates
    .map((candidate, index) => ({
      candidate,
      index,
    }))
    .sort((a, b) => {
      if (
        b.candidate.priority !==
        a.candidate.priority
      ) {
        return (
          b.candidate.priority -
          a.candidate.priority
        );
      }

      return a.index - b.index;
    })
    .map((item) => item.candidate);
}

/**
 * Seleciona a mensagem que o companheiro considera
 * mais relevante neste momento.
 *
 * Retorna null quando o silêncio é preferível.
 */
export function decideCompanionThought(
  candidates: CompanionBrainCandidate[],
  now = new Date()
): CompanionBrainDecision | null {
  if (!Array.isArray(candidates)) {
    return null;
  }

  if (candidates.length === 0) {
    return null;
  }

  const eligible = candidates.filter(
    (candidate) =>
      Boolean(candidate) &&
      typeof candidate.id === "string" &&
      typeof candidate.translationKey === "string" &&
      typeof candidate.priority === "number" &&
      typeof candidate.cooldownMinutes === "number" &&
      isEligible(candidate, now)
  );

  if (eligible.length === 0) {
    return null;
  }

  // CONFIA_FASE12A_CONTEXTUAL_RANKING
  const ranked =
    rankCompanionCandidatesContextually(
      eligible,
      now
    );

  const selected = ranked[0];

  if (!selected) {
    return null;
  }

  return {
    candidate: selected,
    decidedAt: now.toISOString(),
  };
}

/**
 * Versão útil para debug/desenvolvimento.
 *
 * Permite perceber porque determinada mensagem
 * poderia ou não falar sem interferir com o estado.
 */
export function inspectCompanionCandidates(
  candidates: CompanionBrainCandidate[],
  now = new Date()
) {
  return candidates.map((candidate) => ({
    id: candidate.id,
    category: candidate.category,
    priority: candidate.priority,

    expired: isExpired(
      candidate,
      now
    ),

    blockedByMessageCooldown:
      wasCompanionMessageShownRecently(
        candidate.id,
        candidate.cooldownMinutes
      ),

    blockedByCategoryCooldown:
      wasCompanionCategoryShownRecently(
        candidate.category,
        CATEGORY_COOLDOWN_MINUTES
      ),

    eligible: isEligible(
      candidate,
      now
    ),
  }));
}
