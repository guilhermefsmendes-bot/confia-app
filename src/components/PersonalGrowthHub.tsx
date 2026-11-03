import { lazy, Suspense } from "react";
import type { DailyRating } from "../types";
type ObjectiveHistory = { date: string; completed: number };

const PersonalMap = lazy(() => import("./PersonalMap"));
const ProgressoDashboard = lazy(() => import("./ProgressoDashboard").then(module => ({ default: module.ProgressoDashboard })));

export default function PersonalGrowthHub({
  onBack, ratings, avatarLevel, avatarXp, completedObjectivesCount, objectivesHistory,
}: {
  onBack: () => void;
  ratings: DailyRating[];
  avatarLevel: number;
  avatarXp: number;
  completedObjectivesCount: number;
  objectivesHistory: ObjectiveHistory[];
}) {
  return <Suspense fallback={<div className="min-h-[50vh] animate-pulse rounded-3xl bg-white/60" />}>
    <PersonalMap
      onBack={onBack}
      progressContent={<ProgressoDashboard ratings={ratings} avatarLevel={avatarLevel} avatarXp={avatarXp} completedObjectivesCount={completedObjectivesCount} objectivesHistory={objectivesHistory} />}
    />
  </Suspense>;
}
