/**
 * CONFIA — COMPANION INTELLIGENCE V2
 *
 * Esta camada NÃO diagnostica, NÃO cria factos e NÃO substitui
 * o Companion Brain.
 *
 * O Brain decide o que é relevante.
 * Esta camada melhora presença, variedade e continuidade quando
 * não existe uma decisão prioritária.
 */

export type CompanionRelationshipStage =
  | "first_contact"
  | "early_learning"
  | "established"
  | "personal_discovery";

export type CompanionPresenceContext = {
  relationshipStage: CompanionRelationshipStage;
  observationCount: number;
  moodRating?: number;
  hasPriorityDecision: boolean;
  hasRelationalMemory: boolean;
  worldMood:
    | "growing"
    | "settling"
    | "discovering"
    | "neutral";
};

export type CompanionPresenceIntent =
  | "welcome"
  | "listen"
  | "gentle_support"
  | "positive_presence"
  | "learning"
  | "continuity"
  | "discovery"
  | "quiet_presence";

export type CompanionPresenceDecision = {
  intent: CompanionPresenceIntent;
  translationKeys: string[];
};

/**
 * Hash determinístico.
 *
 * Evita Math.random(), para que renders React não façam a criatura
 * mudar de frase sem existir um novo acontecimento.
 */
function stableIndex(seed: string, length: number): number {
  if (length <= 1) return 0;

  let hash = 0;

  for (let i = 0; i < seed.length; i += 1) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  }

  return Math.abs(hash) % length;
}

export function chooseCompanionVariant(
  keys: string[],
  seed: string
): string {
  if (!keys.length) {
    return "companionRelationship.established";
  }

  return keys[stableIndex(seed, keys.length)];
}

export function resolveCompanionPresence(
  context: CompanionPresenceContext
): CompanionPresenceDecision {
  /*
   * Uma decisão prioritária pertence ao Brain.
   * Não tentamos competir com ela.
   */
  if (context.hasPriorityDecision) {
    return {
      intent: "quiet_presence",
      translationKeys: [
        "companionIntelligence.quietPresence.a",
      ],
    };
  }

  if (context.relationshipStage === "first_contact") {
    return {
      intent: "welcome",
      translationKeys: [
        "companionIntelligence.welcome.a",
        "companionIntelligence.welcome.b",
        "companionIntelligence.welcome.c",
      ],
    };
  }

  if (
    typeof context.moodRating === "number" &&
    context.moodRating <= 3
  ) {
    return {
      intent: "gentle_support",
      translationKeys: [
        "companionIntelligence.difficultMoment.a",
        "companionIntelligence.difficultMoment.b",
        "companionIntelligence.difficultMoment.c",
        "companionIntelligence.difficultMoment.d",
      ],
    };
  }

  if (
    typeof context.moodRating === "number" &&
    context.moodRating >= 8
  ) {
    return {
      intent: "positive_presence",
      translationKeys: [
        "companionIntelligence.goodMoment.a",
        "companionIntelligence.goodMoment.b",
        "companionIntelligence.goodMoment.c",
      ],
    };
  }

  if (context.relationshipStage === "personal_discovery") {
    return {
      intent: "discovery",
      translationKeys: [
        "companionIntelligence.discovery.a",
        "companionIntelligence.discovery.b",
        "companionIntelligence.discovery.c",
      ],
    };
  }

  if (context.relationshipStage === "early_learning") {
    return {
      intent: "learning",
      translationKeys: [
        "companionIntelligence.learning.a",
        "companionIntelligence.learning.b",
        "companionIntelligence.learning.c",
      ],
    };
  }

  if (context.hasRelationalMemory) {
    return {
      intent: "continuity",
      translationKeys: [
        "companionIntelligence.continuity.a",
        "companionIntelligence.continuity.b",
        "companionIntelligence.continuity.c",
        "companionIntelligence.continuity.d",
      ],
    };
  }

  return {
    intent: "listen",
    translationKeys: [
      "companionIntelligence.presence.a",
      "companionIntelligence.presence.b",
      "companionIntelligence.presence.c",
      "companionIntelligence.presence.d",
    ],
  };
}
