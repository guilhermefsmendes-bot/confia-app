export const PATTERNS_STORAGE_KEY = "confia_patterns_v1";

export interface PatternProfile {
  completed: boolean;
  answers: number[];
  dominantPattern?: string;
  selectedHabit?: string;
  createdAt: string;
}

export function savePatternProfile(profile: PatternProfile) {
  localStorage.setItem(
    PATTERNS_STORAGE_KEY,
    JSON.stringify(profile)
  );
}

export function loadPatternProfile(): PatternProfile | null {
  const data = localStorage.getItem(PATTERNS_STORAGE_KEY);

  if (!data) return null;

  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}
