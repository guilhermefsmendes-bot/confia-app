import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { WeeklyGoal } from "../types";

interface WeeklyGoalSectionProps {
  weeklyGoal: WeeklyGoal | null;
  onCreateGoal: (title: string) => void;
  onCompleteDay: (
    date: string,
    ease: number,
    note: string,
    recovery: boolean
  ) => void;
}

const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getWeekDates = (weekStart: string) => {
  const start = new Date(`${weekStart}T00:00:00`);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return getLocalDateString(date);
  });
};

const smiles = [
  { value: 1, emoji: "😞" },
  { value: 2, emoji: "🙁" },
  { value: 3, emoji: "😐" },
  { value: 4, emoji: "🙂" },
  { value: 5, emoji: "😄" },
];

export const WeeklyGoalSection: React.FC<WeeklyGoalSectionProps> = ({
  weeklyGoal,
  onCreateGoal,
  onCompleteDay,
}) => {
  const { t, i18n } = useTranslation();

  console.log(
    "WEEKLY GOAL - idioma:",
    i18n.language,
    "| título:",
    t("weeklyGoal.title"),
    "| dias:",
    t("weeklyGoal.days")
  );

  const [title, setTitle] = useState("");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedEase, setSelectedEase] = useState<number | null>(null);
  const [note, setNote] = useState("");

  const today = getLocalDateString();

  const weekDates = useMemo(
    () => (weeklyGoal ? getWeekDates(weeklyGoal.weekStart) : []),
    [weeklyGoal]
  );

  const completedDays = weeklyGoal?.completedDays ?? [];
  const progress = completedDays.length;

  const todayCredits = weeklyGoal?.dailyCredits?.[today] ?? 0;

  const missedDays = weekDates.filter(
    (date) => date < today && !completedDays.includes(date)
  );

  const selectedAlreadyCompleted = selectedDate
    ? completedDays.includes(selectedDate)
    : false;

  const selectedIsRecovery = selectedDate
    ? selectedDate < today && !selectedAlreadyCompleted
    : false;

  const canUseToday =
    !!weeklyGoal &&
    !weeklyGoal.medalUnlocked &&
    todayCredits < 2;

  const handleCreate = () => {
    const cleanTitle = title.trim();

    if (!cleanTitle) return;

    onCreateGoal(cleanTitle);
    setTitle("");
  };

  const openDay = (date: string) => {
    if (!weeklyGoal || weeklyGoal.medalUnlocked) return;

    const credits = weeklyGoal.dailyCredits?.[today] ?? 0;

    if (credits >= 2 && !completedDays.includes(date)) return;

    const existingRating = weeklyGoal.dailyRatings?.[date];

    setSelectedDate(date);
    setSelectedEase(existingRating?.ease ?? null);
    setNote(existingRating?.note ?? "");
  };

  const closeModal = () => {
    setSelectedDate(null);
    setSelectedEase(null);
    setNote("");
  };

  const handleSaveDay = () => {
    if (!selectedDate || !selectedEase) return;

    const credits = weeklyGoal?.dailyCredits?.[today] ?? 0;

    if (!selectedAlreadyCompleted && credits >= 2) return;

    onCompleteDay(
      selectedDate,
      selectedEase,
      note.trim(),
      selectedIsRecovery
    );

    closeModal();
  };

  if (!weeklyGoal) {
    return (
      <div className="mt-6 rounded-[28px] border border-amber-100 bg-gradient-to-br from-amber-50 to-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-2xl">
            🏆
          </div>

          <div>
            <h3 className="font-extrabold text-[#4E3B36]">
              {t("weeklyGoal.title")}
            </h3>

            <p className="text-sm text-[#7A6A64]">
              {t("weeklyGoal.subtitle")}
            </p>
          </div>
        </div>

        <div className="mb-3">
          <input
            type="text"
            value={title}
            onChange={(event) =>
              setTitle(event.target.value.slice(0, 20))
            }
            maxLength={20}
            placeholder={t("weeklyGoal.placeholder")}
            className="w-full rounded-2xl border border-amber-100 bg-white px-4 py-3 text-[#4E3B36] outline-none focus:border-amber-300"
          />

          <div className="mt-1 flex justify-between px-1 text-xs text-[#8A7770]">
            <span>{t("weeklyGoal.maxCharacters")}</span>
            <span>{title.length}/20</span>
          </div>
        </div>

        <p className="mb-4 text-sm leading-relaxed text-[#7A6A64]">
          {t("weeklyGoal.medalExplanation")}
        </p>

        <button
          type="button"
          onClick={handleCreate}
          disabled={!title.trim()}
          className="w-full rounded-2xl bg-[#4E3B36] px-4 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          {t("weeklyGoal.start")}
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="mt-6 rounded-[28px] border border-amber-100 bg-gradient-to-br from-amber-50 to-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-2xl">
              {weeklyGoal.medalUnlocked ? "🏅" : "🏆"}
            </div>

            <div>
              <h3 className="font-extrabold text-[#4E3B36]">
                {t("weeklyGoal.title")}
              </h3>

              <p className="font-semibold text-[#6E5B54]">
                {weeklyGoal.title}
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-lg font-extrabold text-[#4E3B36]">
              {progress}/7
            </div>

            <div className="text-xs text-[#8A7770]">
              {t("weeklyGoal.days")}
            </div>
          </div>
        </div>

        <div className="mb-5 h-3 overflow-hidden rounded-full bg-amber-100">
          <div
            className="h-full rounded-full bg-amber-400 transition-all duration-500"
            style={{ width: `${(progress / 7) * 100}%` }}
          />
        </div>

        <div className="mb-3 grid grid-cols-7 gap-1.5">
          {weekDates.map((date, index) => {
            const completed = completedDays.includes(date);
            const hasRating = !!weeklyGoal.dailyRatings?.[date];

            return (
              <button
                key={date}
                type="button"
                onClick={() => openDay(date)}
                disabled={
                  !completed &&
                  !canUseToday &&
                  !(date < today && missedDays.includes(date))
                }
                className={`relative flex h-11 items-center justify-center rounded-xl text-xs font-bold transition-transform active:scale-95 ${
                  completed
                    ? "bg-amber-400 text-white"
                    : "bg-white text-[#9B8B84] border border-amber-100"
                } disabled:cursor-not-allowed disabled:opacity-50`}
              >
                <span className="flex flex-col items-center justify-center leading-none">
                  <span className="text-xs font-extrabold">
                    {index + 1}
                  </span>

                  {completed && (
                    <span className="mt-0.5 text-[9px] leading-none">
                      ✓
                    </span>
                  )}
                </span>

                {hasRating && (
                  <span className="absolute -right-1 -top-1 text-[9px]">
                    ⭐
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <p className="mb-4 text-center text-xs text-[#8A7770]">
          {t("weeklyGoal.tapDay")}
        </p>

        {weeklyGoal.medalUnlocked && (
          <div className="rounded-2xl bg-amber-100 p-4 text-center">
            <div className="mb-1 text-2xl">🏅</div>

            <p className="font-extrabold text-[#4E3B36]">
              {t("weeklyGoal.completed")}
            </p>

            <p className="mt-1 text-sm text-[#7A6A64]">
              {t("weeklyGoal.medalReady")}
            </p>
          </div>
        )}
      </div>

      {selectedDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[30px] bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-extrabold text-[#4E3B36]">
                  {t("weeklyGoal.day")} {weekDates.indexOf(selectedDate) + 1}
                </h3>

                <p className="mt-1 text-sm text-[#7A6A64]">
                  {t("weeklyGoal.easeQuestion")}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500"
              >
                ✕
              </button>
            </div>

            <div className="mb-6">
              <p className="mb-3 text-center text-sm font-bold text-[#4E3B36]">
                {t("weeklyGoal.easeQuestion")}
              </p>

              <div className="grid grid-cols-5 gap-2">
                {smiles.map((smile) => {
                  const labels = {
                    1: t("weeklyGoal.ease1"),
                    2: t("weeklyGoal.ease2"),
                    3: t("weeklyGoal.ease3"),
                    4: t("weeklyGoal.ease4"),
                    5: t("weeklyGoal.ease5"),
                  };

                  return (
                    <button
                      key={smile.value}
                      type="button"
                      onClick={() => setSelectedEase(smile.value)}
                      className={`flex flex-col items-center justify-center gap-1 rounded-2xl p-2 transition-all ${
                        selectedEase === smile.value
                          ? "bg-amber-100 scale-105 shadow-sm"
                          : "bg-slate-50"
                      }`}
                    >
                      <span className="text-3xl">{smile.emoji}</span>

                      <span className="text-sm font-black text-[#4E3B36]">
                        {smile.value}
                      </span>

                      <span className="text-[9px] leading-tight text-center text-[#7A6A64]">
                        {labels[smile.value as 1 | 2 | 3 | 4 | 5]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mb-5">
              <label className="mb-2 block text-sm font-bold text-[#4E3B36]">
                {t("weeklyGoal.dayNote")}
              </label>

              <input
                type="text"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder={t("weeklyGoal.dayNotePlaceholder")}
                className="w-full rounded-2xl border border-amber-100 bg-slate-50 px-4 py-3 text-[#4E3B36] outline-none focus:border-amber-300"
              />
            </div>

            <button
              type="button"
              onClick={handleSaveDay}
              disabled={!selectedEase}
              className="w-full rounded-2xl bg-[#4E3B36] px-4 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              {t("weeklyGoal.saveDay")}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
