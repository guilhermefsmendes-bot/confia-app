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
translationKey: "patterns.home.habits.symptomSearch"
  },
  {
    id: "google_answers",
    icon: "🌐",
translationKey: "patterns.home.habits.reassurance"
  },
  {
    id: "tv_series",
    icon: "🎬",
translationKey: "patterns.home.habits.series"
  },
  {
    id: "social_media",
    icon: "📱",
translationKey: "patterns.home.habits.socialMedia"
  },
  {
    id: "video_games",
    icon: "🎮",
translationKey: "patterns.home.habits.videoGames"
  },
  {
    id: "shopping",
    icon: "🛍️",
translationKey: "patterns.home.habits.shopping"
  },
  {
    id: "food",
    icon: "🍫",
translationKey: "patterns.home.habits.food"
  },
  {
    id: "coffee",
    icon: "☕",
translationKey: "patterns.home.habits.caffeine"
  },
  {
    id: "alcohol",
    icon: "🍺",
translationKey: "patterns.home.habits.other"
  },
  {
    id: "tobacco",
    icon: "🚬",
translationKey: "patterns.home.habits.other"
  },
  {
    id: "sleep",
    icon: "🛏️",
translationKey: "patterns.home.habits.other"
  },
  {
    id: "exercise",
    icon: "🏃",
translationKey: "patterns.home.habits.other"
  },
  {
    id: "reassurance",
    icon: "💬",
translationKey: "patterns.home.habits.reassurance"
  },
  {
    id: "notifications",
    icon: "❤️",
translationKey: "patterns.home.habits.checkingMessages"
  },
  {
    id: "youtube",
    icon: "📺",
translationKey: "patterns.home.habits.series"
  },
  {
    id: "music",
    icon: "🎵",
translationKey: "patterns.home.habits.other"
  },
  {
    id: "other",
    icon: "✨",
translationKey: "patterns.home.habits.other"
  }
];
