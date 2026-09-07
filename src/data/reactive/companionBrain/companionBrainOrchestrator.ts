import type {
  CompanionBrainDecision,
} from "./companionBrainTypes";

import type {
  CompanionBrainContext,
} from "./companionBrainContext";

import {
  buildCompanionCandidates,
} from "./companionBrainRules";

import {
  resolveCompanionContext,
} from "./companionBrainContextResolver";

import {
  decideCompanionThought,
} from "./companionBrainDecisionEngine";

/**
 * ============================================================
 * CONFIA — COMPANION BRAIN
 * ORQUESTRADOR
 * ============================================================
 *
 * contexto
 *   ↓
 * regras isoladas
 *   ↓
 * resolução contextual
 *   ↓
 * prioridades + cooldowns
 *   ↓
 * decisão final ou silêncio
 */
export function evaluateCompanionContext(
  context: CompanionBrainContext
): CompanionBrainDecision | null {
  const rawCandidates =
    buildCompanionCandidates(context);

  const resolvedCandidates =
    resolveCompanionContext(
      context,
      rawCandidates
    );

  return decideCompanionThought(
    resolvedCandidates,
    context.now
  );
}


/**
 * CONFIA_COMPANION_BRAIN_DIAGNOSTICS
 *
 * Diagnóstico puro do processo de decisão.
 * Não altera memória, cooldowns nem mensagens mostradas.
 */
export interface CompanionBrainDiagnostic {
  context: CompanionBrainContext;
  rawCandidates: ReturnType<
    typeof buildCompanionCandidates
  >;
  resolvedCandidates: ReturnType<
    typeof resolveCompanionContext
  >;
  decision: CompanionBrainDecision | null;
}

export function diagnoseCompanionContext(
  context: CompanionBrainContext
): CompanionBrainDiagnostic {
  const rawCandidates =
    buildCompanionCandidates(context);

  const resolvedCandidates =
    resolveCompanionContext(
      context,
      rawCandidates
    );

  const decision =
    decideCompanionThought(
      resolvedCandidates,
      context.now
    );

  return {
    context,
    rawCandidates,
    resolvedCandidates,
    decision,
  };
}
