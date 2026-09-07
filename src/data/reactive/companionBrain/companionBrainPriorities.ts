/**
 * CONFIA — COMPANION BRAIN
 *
 * Escala comum de prioridade.
 *
 * Quanto maior o valor, maior a probabilidade de
 * este assunto ocupar o balão do companheiro.
 *
 * Evitamos números espalhados pelas regras.
 */

export const COMPANION_PRIORITY = {
  /**
   * Situações emocionais que merecem continuidade.
   */
  EMOTIONAL_FOLLOWUP: 100,

  /**
   * Continuidade depois do Impulso / SOS.
   */
  IMPULSE_FOLLOWUP: 95,

  /**
   * Alteração emocional relevante detetada.
   */
  IMPORTANT_MOOD_CHANGE: 85,

  /**
   * Sintoma ou sinal recente relevante.
   */
  SYMPTOM: 80,

  /**
   * Registo importante que ficou por completar.
   */
  MISSING_CHECKIN: 60,

  /**
   * Reforço de progresso observado.
   */
  PROGRESS: 55,

  /**
   * Objetivo ou pequena conquista.
   */
  OBJECTIVE: 50,

  /**
   * Sugestão relacionada com comunidade.
   */
  COMMUNITY: 35,

  /**
   * Descoberta de funcionalidades / exploração.
   */
  DISCOVERY: 25,

  /**
   * Comentário humano sem urgência.
   */
  CASUAL: 20,
} as const;
