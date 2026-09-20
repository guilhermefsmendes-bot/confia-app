import {
  CONSTELLATIONS,
  type ConstellationDefinition,
  type ConstellationFamily,
} from "./constellationCatalog";

import {
  EMOTIONAL_STATES,
  familyStrengths,
  hashAnswers,
  seededNoise,
  type EmotionalAnswers,
} from "./innerCanvasEngine";

export type ConstellationPoint = {
  x: number;
  y: number;
  brightness: number;
};

export type ConstellationMatch = {
  constellation: ConstellationDefinition;
  score: number;
  stars: ConstellationPoint[];
  family: ConstellationFamily;
};

function clamp(
  value: number,
  min: number,
  max: number
) {
  return Math.max(
    min,
    Math.min(max, value)
  );
}

/*
 * Converte as 16 respostas num vetor
 * emocional normalizado.
 *
 * Não representa um diagnóstico.
 */
function emotionalVector(
  answers: EmotionalAnswers
) {
  const raw = EMOTIONAL_STATES.map(
    state =>
      clamp(
        answers[state.id] ?? 0,
        0,
        10
      ) / 10
  );

  /*
   * Comprimimos 16 respostas em 8
   * características geométricas.
   */
  return Array.from(
    { length: 8 },
    (_, index) => {
      const a = raw[index * 2] ?? 0;
      const b =
        raw[index * 2 + 1] ?? 0;

      return (
        a * 0.58 +
        b * 0.42
      );
    }
  );
}

function dominantFamily(
  answers: EmotionalAnswers
): ConstellationFamily {
  const strengths =
    familyStrengths(answers);

  const ranked = (
    Object.entries(strengths) as [
      Exclude<
        ConstellationFamily,
        "balanced"
      >,
      number
    ][]
  ).sort(
    (a, b) => b[1] - a[1]
  );

  const first = ranked[0];
  const second = ranked[1];

  /*
   * Quando não existe uma família
   * claramente dominante, usamos
   * "balanced".
   */
  if (
    first &&
    second &&
    Math.abs(
      first[1] - second[1]
    ) < 1.15
  ) {
    return "balanced";
  }

  return first?.[0] ?? "balanced";
}

function signatureDistance(
  vector: number[],
  signature: number[]
) {
  const count = Math.min(
    vector.length,
    signature.length
  );

  let total = 0;

  for (
    let index = 0;
    index < count;
    index += 1
  ) {
    const diff =
      vector[index] -
      signature[index];

    total += diff * diff;
  }

  return Math.sqrt(
    total /
      Math.max(1, count)
  );
}

function familyPenalty(
  emotionalFamily: ConstellationFamily,
  constellationFamily: ConstellationFamily
) {
  if (
    emotionalFamily ===
    constellationFamily
  ) {
    return 0;
  }

  if (
    emotionalFamily === "balanced" ||
    constellationFamily === "balanced"
  ) {
    return 0.035;
  }

  return 0.085;
}

function buildStars(
  answers: EmotionalAnswers,
  constellation:
    ConstellationDefinition
): ConstellationPoint[] {
  const seed =
    hashAnswers(answers) +
    constellation.id
      .split("")
      .reduce(
        (sum, char) =>
          sum +
          char.charCodeAt(0),
        0
      );

  const vector =
    emotionalVector(answers);

  /*
   * 7 estrelas principais.
   * O padrão é determinístico:
   * mesmas respostas =
   * mesma constelação e mesmo céu.
   */
  return Array.from(
    { length: 7 },
    (_, index) => {
      const signature =
        constellation.signature[
          index %
            constellation
              .signature.length
        ] ?? 0.5;

      const emotion =
        vector[
          index %
            vector.length
        ] ?? 0.5;

      const angle =
        -Math.PI / 2 +
        index *
          ((Math.PI * 2) / 7) +
        (signature - 0.5) *
          0.75;

      const radius =
        70 +
        signature * 72 +
        emotion * 34 +
        (
          seededNoise(
            seed,
            100 + index
          ) -
          0.5
        ) *
          20;

      const stretchX =
        0.88 +
        seededNoise(
          seed,
          200 + index
        ) *
          0.32;

      const stretchY =
        0.82 +
        seededNoise(
          seed,
          300 + index
        ) *
          0.36;

      return {
        x: clamp(
          180 +
            Math.cos(angle) *
              radius *
              stretchX,
          28,
          332
        ),

        y: clamp(
          180 +
            Math.sin(angle) *
              radius *
              stretchY,
          28,
          332
        ),

        brightness:
          clamp(
            0.55 +
              emotion * 0.35 +
              seededNoise(
                seed,
                400 + index
              ) *
                0.10,
            0.5,
            1
          ),
      };
    }
  );
}

/*
 * Matching determinístico.
 *
 * 1. Geometria emocional é o fator principal.
 * 2. Família emocional é apenas desempate.
 * 3. Um ruído determinístico muito pequeno evita
 *    empates exatos sem tornar o resultado aleatório.
 */
export function matchConstellation(
  answers: EmotionalAnswers
): ConstellationMatch {
  const vector =
    emotionalVector(answers);

  const family =
    dominantFamily(answers);

  const answerSeed =
    hashAnswers(answers);

  const ranked =
    CONSTELLATIONS.map(
      (
        constellation,
        index
      ) => {
        const geometry =
          signatureDistance(
            vector,
            constellation.signature
          );

        const penalty =
          familyPenalty(
            family,
            constellation.family
          );

        const tieBreaker =
          seededNoise(
            answerSeed,
            9000 + index
          ) * 0.012;

        const distance =
          geometry +
          penalty +
          tieBreaker;

        return {
          constellation,
          distance,
        };
      }
    ).sort(
      (a, b) =>
        a.distance -
        b.distance
    );

  const winner =
    ranked[0];

  const score =
    clamp(
      1 -
        (winner?.distance ?? 1),
      0,
      1
    );

  const constellation =
    winner?.constellation ??
    CONSTELLATIONS[0];

  return {
    constellation,
    score,
    stars:
      buildStars(
        answers,
        constellation
      ),
    family,
  };
}

/*
 * Útil para a futura animação:
 * devolve as melhores correspondências
 * antes da revelação final.
 */
export function getConstellationCandidates(
  answers: EmotionalAnswers,
  limit = 5
) {
  const vector =
    emotionalVector(answers);

  const family =
    dominantFamily(answers);

  return CONSTELLATIONS
    .map(constellation => ({
      constellation,
      distance:
        signatureDistance(
          vector,
          constellation.signature
        ) +
        familyPenalty(
          family,
          constellation.family
        ),
    }))
    .sort(
      (a, b) =>
        a.distance -
        b.distance
    )
    .slice(
      0,
      Math.max(1, limit)
    );
}
