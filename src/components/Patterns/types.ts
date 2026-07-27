export type PatternCategory =
  | "reassurance"
  | "search"
  | "body"
  | "perfectionism"
  | "avoidance"
  | "rumination"
  | "control"
  | "comparison";

export type HabitKey =
  | "symptom_search"
  | "google_answers"
  | "tv_series"
  | "social_media"
  | "video_games"
  | "shopping"
  | "food"
  | "coffee"
  | "alcohol"
  | "tobacco"
  | "sleep"
  | "exercise"
  | "reassurance"
  | "notifications"
  | "youtube"
  | "music"
  | "other";

export interface PatternScore {
  category: PatternCategory;
  score: number;
}

export interface DailyHabitCheck {
  date: string;
  habit: HabitKey;
  status: "more" | "same" | "less" | "none";
}

export interface UserPatternProfile {
  completed: boolean;
  completedAt?: string;

  scores: PatternScore[];

  selectedHabits: HabitKey[];

  primaryHabit?: HabitKey;

  history: DailyHabitCheck[];
}
