import { HabitKey } from "./types";

export interface HabitDefinition {
  id: HabitKey;
  icon: string;
  translationKey: string;
}

export const HABITS: HabitDefinition[] = [
  {
    id: "symptom_search",
    icon: "🔍",
    translationKey: "patterns.habits.symptom_search"
  },
  {
    id: "google_answers",
    icon: "🌐",
    translationKey: "patterns.habits.google_answers"
  },
  {
    id: "tv_series",
    icon: "🎬",
    translationKey: "patterns.habits.tv_series"
  },
  {
    id: "social_media",
    icon: "📱",
    translationKey: "patterns.habits.social_media"
  },
  {
    id: "video_games",
    icon: "🎮",
    translationKey: "patterns.habits.video_games"
  },
  {
    id: "shopping",
    icon: "🛍️",
    translationKey: "patterns.habits.shopping"
  },
  {
    id: "food",
    icon: "🍫",
    translationKey: "patterns.habits.food"
  },
  {
    id: "coffee",
    icon: "☕",
    translationKey: "patterns.habits.coffee"
  },
  {
    id: "alcohol",
    icon: "🍺",
    translationKey: "patterns.habits.alcohol"
  },
  {
    id: "tobacco",
    icon: "🚬",
    translationKey: "patterns.habits.tobacco"
  },
  {
    id: "sleep",
    icon: "🛏️",
    translationKey: "patterns.habits.sleep"
  },
  {
    id: "exercise",
    icon: "🏃",
    translationKey: "patterns.habits.exercise"
  },
  {
    id: "reassurance",
    icon: "💬",
    translationKey: "patterns.habits.reassurance"
  },
  {
    id: "notifications",
    icon: "❤️",
    translationKey: "patterns.habits.notifications"
  },
  {
    id: "youtube",
    icon: "📺",
    translationKey: "patterns.habits.youtube"
  },
  {
    id: "music",
    icon: "🎵",
    translationKey: "patterns.habits.music"
  },
  {
    id: "other",
    icon: "✨",
    translationKey: "patterns.habits.other"
  }
];
