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
  userName: string;
  feeling: string; // e.g. "Ansioso", "Calmo", "Grato", "Agitado"
  message: string;
  timestamp: string;
  likes: number;
  likedByUser?: boolean;
}

export interface TriageStep {
  id: number;
  title: string;
  description: string;
  options?: string[];
  type: 'question' | 'instruction' | 'breathing' | 'grounding';
}
