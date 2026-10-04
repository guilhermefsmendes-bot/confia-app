import type { CompanionBrainCandidate, CompanionConfidence, CompanionIntent } from './companionBrainTypes';

/**
 * CONFIA — Companion Intent Layer
 * A candidate is not allowed to speak simply because it exists.
 * It must have a clear conversational reason and enough evidence.
 */
export function resolveCompanionIntent(candidate: CompanionBrainCandidate): CompanionBrainCandidate {
  const mode = candidate.metadata?.mode;
  const evidence = Number(candidate.metadata?.evidenceCount ?? candidate.evidenceCount ?? 0);
  const windowDays = Number(candidate.metadata?.evidenceWindowDays ?? candidate.evidenceWindowDays ?? 0);
  let intent: CompanionIntent = 'accompany';
  let confidence: CompanionConfidence = 'moderate';

  if (candidate.category === 'objective' || candidate.category === 'community') intent = 'suggest';
  else if (candidate.category === 'progress') intent = mode === 'suggestion' ? 'suggest' : 'explain';
  else if (candidate.category === 'emotional_followup' || candidate.category === 'symptom') intent = 'accompany';
  else if (candidate.category === 'discovery') intent = 'observe';
  else if (candidate.category === 'impulse_followup') intent = 'accompany';

  if (candidate.metadata?.celebration === true) intent = 'celebrate';
  if (candidate.metadata?.ask === true) intent = 'ask';

  if (intent === 'celebrate') confidence = 'strong';
  else if (evidence >= 5) confidence = 'strong';
  else if (evidence >= 3 || mode === 'suggestion') confidence = 'moderate';
  else if (mode === 'insight') confidence = 'insufficient';

  if (confidence === 'insufficient' && mode === 'insight') return { ...candidate, intent: 'silent', confidence, evidenceCount: evidence, evidenceWindowDays: windowDays };
  return { ...candidate, intent, confidence, evidenceCount: evidence, evidenceWindowDays: windowDays };
}
