export interface AvatarState {
  level: number;
  xp: number;
  maxXp: number;
  name: string;
  evolutionStage: string;
  points: number;
}

export interface Objective {
  id: string;
  text: string;
  category: 'corporeo' | 'mental' | 'social' | 'nutricao';
  xpReward: number;
difficulty?: 'easy' | 'medium' | 'hard';
  completed: boolean;
  isCustom?: boolean;
}

export interface DailyRating {
  date: string; // YYYY-MM-DD
  morning: number | null; // 0-10
  afternoon: number | null; // 0-10
  note?: string;
}

export interface SharePost {
  id: string;
  authorId: string;
  userName: string;
  feeling: string; // e.g. "Ansioso", "Calmo", "Grato", "Agitado"
  message: string;
  timestamp: string;

  yellowLikes: number;
  greenLikes: number;
  redLikes: number;

  userReaction?: "yellow" | "green" | "red";
}

export interface TriageStep {
  id: number;
  title: string;
  description: string;
  options?: string[];
  type: 'question' | 'instruction' | 'breathing' | 'grounding';
}
