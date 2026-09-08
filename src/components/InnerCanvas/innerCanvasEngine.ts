export type EmotionalFamily =
  | "serenity"
  | "expansion"
  | "tension"
  | "inward";

export type EmotionalDefinition = {
  id: string;
  x: number;
  y: number;
  family: EmotionalFamily;
  softness: number;
};

export type EmotionalAnswers =
  Record<string, number>;

export const EMOTIONAL_STATES: EmotionalDefinition[] = [
  // REGIÃO 1 — expansão / energia positiva
  { id: "motivated",    x:  0.42, y: -0.42, family: "expansion", softness: 0.72 },
  { id: "energetic",    x:  0.72, y: -0.72, family: "expansion", softness: 0.58 },
  { id: "enthusiastic", x:  0.82, y: -0.34, family: "expansion", softness: 0.62 },
  { id: "sociable",     x:  0.40, y: -0.78, family: "expansion", softness: 0.76 },

  // REGIÃO 2 — tensão / ativação difícil
  { id: "anxious",      x: -0.70, y: -0.70, family: "tension", softness: 0.34 },
  { id: "irritated",    x: -0.82, y: -0.30, family: "tension", softness: 0.26 },
  { id: "overwhelmed",  x: -0.44, y: -0.82, family: "tension", softness: 0.30 },
  { id: "restless",     x: -0.38, y: -0.40, family: "tension", softness: 0.38 },

  // REGIÃO 3 — recolhimento / energia baixa
  { id: "tired",        x: -0.72, y:  0.66, family: "inward", softness: 0.82 },
  { id: "sad",          x: -0.46, y:  0.82, family: "inward", softness: 0.68 },
  { id: "withdrawn",    x: -0.82, y:  0.34, family: "inward", softness: 0.78 },
  { id: "discouraged",  x: -0.34, y:  0.46, family: "inward", softness: 0.64 },

  // REGIÃO 4 — serenidade / reflexão
  { id: "calm",         x:  0.70, y:  0.66, family: "serenity", softness: 0.96 },
  { id: "thoughtful",   x:  0.36, y:  0.78, family: "serenity", softness: 0.90 },
  { id: "observant",    x:  0.76, y:  0.34, family: "serenity", softness: 0.92 },
  { id: "secure",       x:  0.38, y:  0.42, family: "serenity", softness: 0.94 },
];

export const FAMILY_COLORS: Record<
  EmotionalFamily,
  [string, string, string]
> = {
  serenity: ["#55CDB4", "#63C8D5", "#CFEA91"],
  expansion: ["#F19063", "#F3C969", "#F28DB0"],
  tension: ["#7658C5", "#B24AA7", "#5F3B88"],
  inward: ["#5A9BC7", "#655DB0", "#AABBE1"],
};

export function clamp(
  value: number,
  min: number,
  max: number
) {
  return Math.max(min, Math.min(max, value));
}

export function hashAnswers(
  answers: EmotionalAnswers
) {
  let hash = 2166136261;

  for (const state of EMOTIONAL_STATES) {
    const value = answers[state.id] ?? 0;

    const token = `${state.id}:${value};`;

    for (let i = 0; i < token.length; i += 1) {
      hash ^= token.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
  }

  return Math.abs(hash >>> 0);
}

export function seededNoise(
  seed: number,
  index: number
) {
  const x =
    Math.sin(seed * 0.0001 + index * 12.9898) *
    43758.5453;

  return x - Math.floor(x);
}

export function getDominantStates(
  answers: EmotionalAnswers,
  limit = 4
) {
  return [...EMOTIONAL_STATES]
    .map(state => ({
      ...state,
      value: answers[state.id] ?? 0,
    }))
    .filter(item => item.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

export function familyStrengths(
  answers: EmotionalAnswers
) {
  const totals: Record<EmotionalFamily, number> = {
    serenity: 0,
    expansion: 0,
    tension: 0,
    inward: 0,
  };

  const counts: Record<EmotionalFamily, number> = {
    serenity: 0,
    expansion: 0,
    tension: 0,
    inward: 0,
  };

  EMOTIONAL_STATES.forEach(state => {
    totals[state.family] += answers[state.id] ?? 0;
    counts[state.family] += 1;
  });

  return {
    serenity:
      totals.serenity / Math.max(1, counts.serenity),
    expansion:
      totals.expansion / Math.max(1, counts.expansion),
    tension:
      totals.tension / Math.max(1, counts.tension),
    inward:
      totals.inward / Math.max(1, counts.inward),
  };
}

export function strongestFamily(
  answers: EmotionalAnswers
): EmotionalFamily {
  const strengths = familyStrengths(answers);

  return (
    Object.entries(strengths) as [
      EmotionalFamily,
      number
    ][]
  ).sort((a, b) => b[1] - a[1])[0][0];
}
