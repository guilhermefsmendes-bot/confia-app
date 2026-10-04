import { loadCompanionBrainMemory } from "./companionBrainMemory";
import { getLocalCalendarDate } from "../../../utils/date";
import {
  rankCompanionCandidatesContextually,
} from "./companionBrainContextualRanking";
import type {
  CompanionBrainCandidate,
  CompanionBrainDecision,
} from "./companionBrainTypes";
import { resolveCompanionIntent } from "./companionIntent";

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

  const memory=loadCompanionBrainMemory();
  const nowMs=now.getTime(),today=getLocalCalendarDate(now);
  const recent=memory.shownMessages.filter(m=>Number.isFinite(Date.parse(m.shownAt))&&Date.parse(m.shownAt)<=nowMs);
  const last=recent.at(-1);
  if(recent.filter(m=>getLocalCalendarDate(new Date(m.shownAt))===today).length>=4)return null;
  if(last&&nowMs-Date.parse(last.shownAt)<45*60_000)return null;
  const eligible = candidates.filter(
    (candidate) =>
      Boolean(candidate) &&
      typeof candidate.id === "string" &&
      typeof candidate.translationKey === "string" &&
      typeof candidate.priority === "number" &&
      typeof candidate.cooldownMinutes === "number" &&
      candidate.priority >= 40 &&
      candidate.intent !== "silent" &&
      !isExpired(candidate,now) &&
      !recent.some(m=>m.id===candidate.id&&nowMs-Date.parse(m.shownAt)<candidate.cooldownMinutes*60_000) &&
      !recent.some(m=>m.category===candidate.category&&nowMs-Date.parse(m.shownAt)<20*60_000) &&
      !recent.some(m=>candidate.metadata?.family&&m.reason===candidate.reason&&nowMs-Date.parse(m.shownAt)<20*3600_000)
  );

  if (eligible.length === 0) {
    return null;
  }

  // CONFIA_FASE12A_CONTEXTUAL_RANKING
  const intentReady = eligible.map(resolveCompanionIntent).filter(candidate => candidate.intent !== "silent");
  if (intentReady.length === 0) return null;

  const ranked =
    rankCompanionCandidatesContextually(
      intentReady,
      now
    );

  // Priority tiers take precedence over narrative modifiers.
  const selected = ranked.sort((a,b)=>Number(b.priority>=80)-Number(a.priority>=80))[0];

  if (!selected) {
    return null;
  }

  return {
    candidate: selectVariant(selected,recent),
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

// Rotate within a family; IDs stay factual so variants cannot bypass deduplication.
export function selectVariant(candidate:CompanionBrainCandidate,history:ReturnType<typeof loadCompanionBrainMemory>["shownMessages"]):CompanionBrainCandidate {
 const family=candidate.metadata?.family;if(typeof family!=="string")return candidate;
 const keys=Array.from({length:3},(_,i)=>`companionDaily.${family}.${i}`);
 const used=history.slice(-12).map(m=>m.translationKey);
 const key=keys.find(k=>!used.includes(k))??keys[(keys.indexOf(used.filter(k=>k?.startsWith(`companionDaily.${family}.`)).at(-1)??"")+1)%keys.length];
 return {...candidate,translationKey:key};
}
