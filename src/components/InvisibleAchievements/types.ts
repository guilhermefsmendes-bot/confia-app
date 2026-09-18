export interface InvisibleAchievement {
  id: string;
  icon: string;
  titleKey: string;
  descriptionKey: string;
  threshold: number;
  value: number;
}

export interface InvisibleAchievementsProps {
  checkInDays: number;
  completedObjectives: number;
}
