import { useTranslation } from "react-i18next";
import { DailyRating } from "../types";
interface EmotionalMemoryProps {
  ratings: DailyRating[];
  objectivesHistory: {
    date: string;
    completed: number;
  }[];
}
export default function EmotionalMemory({
  ratings,
  objectivesHistory
}: EmotionalMemoryProps) {
  const { t } = useTranslation();

  const last7Days = ratings.filter((rating) => {
    const date = new Date(rating.date);
    const today = new Date();

    const diff =
      (today.getTime() - date.getTime()) /
      (1000 * 60 * 60 * 24);

    return diff <= 7;
  });

  const values = last7Days.flatMap((r) =>
    [r.morning, r.afternoon].filter(
      (v): v is number => v !== null
    )
  );

  if (values.length < 3) {
    return (
      <div className="bg-[#F8F1EA] rounded-3xl p-5 shadow-sm">
        <h3 className="font-bold text-[#4E3B36] mb-2">
          🧠 {t("emotionalMemoryTitle")}
        </h3>

        <p className="text-sm text-[#6B5A54]">
          {t("emotionalMemoryNotEnoughData")}
        </p>
      </div>
    );
  }

  const average =
    values.reduce((a, b) => a + b, 0) /
    values.length;
  // Weekly trend comparison
  const firstDays = values.slice(0, 3);
  const lastDays = values.slice(-3);

  const firstAverage =
    firstDays.reduce((a, b) => a + b, 0) /
    firstDays.length;

  const lastAverage =
    lastDays.reduce((a, b) => a + b, 0) /
    lastDays.length;

  const trend = lastAverage - firstAverage;
  const morningValues = last7Days
    .map((r) => r.morning)
    .filter((v): v is number => v !== null);

  const afternoonValues = last7Days
    .map((r) => r.afternoon)
    .filter((v): v is number => v !== null);

  const morningAverage =
    morningValues.length
      ? morningValues.reduce((a, b) => a + b, 0) /
        morningValues.length
      : 0;

  const afternoonAverage =
    afternoonValues.length
      ? afternoonValues.reduce((a, b) => a + b, 0) /
        afternoonValues.length
      : 0;
  // Objective and emotional correlation
  const objectiveScores = objectivesHistory
    .map((day) => {
      const rating = ratings.find(r => r.date === day.date);

      if (!rating) return null;

      const values = [
        rating.morning,
        rating.afternoon
      ].filter((v): v is number => v !== null);

      if (values.length === 0) return null;

      return {
        completed: day.completed,
        emotion:
          values.reduce((a, b) => a + b, 0) / values.length
      };
    })
    .filter(Boolean) as {
      completed: number;
      emotion: number;
    }[];

  const highObjectiveDays = objectiveScores.filter(
    d => d.completed >= 2
  );

  const objectiveInsight =
    highObjectiveDays.length >= 2
      ? highObjectiveDays.reduce(
          (sum, d) => sum + d.emotion,
          0
        ) / highObjectiveDays.length
      : null;
  return (
    <div className="bg-[#F8F1EA] rounded-3xl p-5 shadow-sm">
      <h3 className="font-bold text-[#4E3B36] mb-3">
        🧠 {t("emotionalMemoryTitle")}
      </h3>

      <p className="text-sm text-[#6B5A54] mb-2">
        {t("emotionalMemoryAverage", {
         average: average.toFixed(1),
        })}
      </p>

{afternoonAverage > morningAverage + 0.5 && (
  <p className="text-sm text-[#6B5A54] mb-2">
    {t("emotionalMemoryAfternoons")}
  </p>
)}

{morningAverage > afternoonAverage + 0.5 && (
  <p className="text-sm text-[#6B5A54] mb-2">
    {t("emotionalMemoryMornings")}
  </p>
)}

{Math.abs(morningAverage - afternoonAverage) <= 0.5 && (
  <p className="text-sm text-[#6B5A54] mb-2">
    {t("emotionalMemoryBalanced")}
  </p>
)}
<p className="text-sm text-[#6B5A54] mb-2">
  {t("emotionalMemoryObservation")}
</p>
{objectiveInsight !== null && (
  <p className="text-sm text-[#6B5A54] mb-2">
    🎯 {t("objectiveEmotionalLink", {
      score: objectiveInsight.toFixed(1),
    })}
  </p>
)}
{trend > 0.5 && (
  <p className="text-sm text-[#6B5A54] mb-2">
    📈 {t("emotionalMemoryImproving")}
  </p>
)}

{trend < -0.5 && (
  <p className="text-sm text-[#6B5A54] mb-2">
    🌧️ {t("emotionalMemoryChallenging")}
  </p>
)}

  {Math.abs(trend) <= 0.5 && (
    <p className="text-sm text-[#6B5A54] mb-2">
      ⚖️ {t("emotionalMemoryStable")}
    </p>
  )}

    </div>
  );
}
