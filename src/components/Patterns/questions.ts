import { PatternCategory } from "./types";

export interface Question {
  id: number;
  category: PatternCategory;
  translationKey: string;
}

export const ANSWER_VALUES = [
  0, // Nunca
  1, // Raramente
  2, // Às vezes
  3, // Frequentemente
  4, // Quase sempre
];

export const QUESTIONS: Question[] = [
  // Procura de confirmação
  { id: 1, category: "reassurance", translationKey: "patterns.questions.q1" },
  { id: 2, category: "reassurance", translationKey: "patterns.questions.q2" },
  { id: 3, category: "reassurance", translationKey: "patterns.questions.q3" },

  // Pesquisa compulsiva
  { id: 4, category: "search", translationKey: "patterns.questions.q4" },
  { id: 5, category: "search", translationKey: "patterns.questions.q5" },
  { id: 6, category: "search", translationKey: "patterns.questions.q6" },

  // Hipervigilância corporal
  { id: 7, category: "body", translationKey: "patterns.questions.q7" },
  { id: 8, category: "body", translationKey: "patterns.questions.q8" },
  { id: 9, category: "body", translationKey: "patterns.questions.q9" },

  // Perfeccionismo
  { id: 10, category: "perfectionism", translationKey: "patterns.questions.q10" },
  { id: 11, category: "perfectionism", translationKey: "patterns.questions.q11" },
  { id: 12, category: "perfectionism", translationKey: "patterns.questions.q12" },

  // Evitação
  { id: 13, category: "avoidance", translationKey: "patterns.questions.q13" },
  { id: 14, category: "avoidance", translationKey: "patterns.questions.q14" },
  { id: 15, category: "avoidance", translationKey: "patterns.questions.q15" },

  // Ruminação
  { id: 16, category: "rumination", translationKey: "patterns.questions.q16" },
  { id: 17, category: "rumination", translationKey: "patterns.questions.q17" },
  { id: 18, category: "rumination", translationKey: "patterns.questions.q18" },

  // Necessidade de controlo
  { id: 19, category: "control", translationKey: "patterns.questions.q19" },
  { id: 20, category: "control", translationKey: "patterns.questions.q20" },
  { id: 21, category: "control", translationKey: "patterns.questions.q21" },

  // Comparação social
  { id: 22, category: "comparison", translationKey: "patterns.questions.q22" },
  { id: 23, category: "comparison", translationKey: "patterns.questions.q23" },
  { id: 24, category: "comparison", translationKey: "patterns.questions.q24" }
];
