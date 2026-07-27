import { PatternCategory } from "./types";

export interface PatternScores {
  reassurance: number;
  search: number;
  body: number;
  perfectionism: number;
  avoidance: number;
  rumination: number;
  control: number;
  comparison: number;
}

export function calculateScores(answers: number[]): PatternScores {
  return {
    reassurance: (answers[0] ?? 0) + (answers[1] ?? 0) + (answers[2] ?? 0),
    search: (answers[3] ?? 0) + (answers[4] ?? 0) + (answers[5] ?? 0),
    body: (answers[6] ?? 0) + (answers[7] ?? 0) + (answers[8] ?? 0),
    perfectionism: (answers[9] ?? 0) + (answers[10] ?? 0) + (answers[11] ?? 0),
    avoidance: (answers[12] ?? 0) + (answers[13] ?? 0) + (answers[14] ?? 0),
    rumination: (answers[15] ?? 0) + (answers[16] ?? 0) + (answers[17] ?? 0),
    control: (answers[18] ?? 0) + (answers[19] ?? 0) + (answers[20] ?? 0),
    comparison: (answers[21] ?? 0) + (answers[22] ?? 0) + (answers[23] ?? 0),
  };
}

export interface PatternResult {
  dominant: PatternCategory;
  secondary: PatternCategory[];
}

export function analysePatterns(scores: PatternScores): PatternResult {

  const ordered = Object.entries(scores)
    .sort((a, b) => b[1] - a[1]);

  return {
    dominant: ordered[0][0] as PatternCategory,
    secondary: ordered
      .slice(1, 3)
      .map(([key]) => key as PatternCategory)
  };

}
