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

  const weeklyPercentage = Math.round(
    (progress / 7) * 100
  );

  const remainingDays = Math.max(
    0,
    7 - progress
  );

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
          className="w-full rounded-2xl bg-gradient-to-r from-[#E5A88B] to-[#C97B5E] px-4 py-3 font-bold text-white shadow-md shadow-[#E5A88B]/20 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {t("weeklyGoal.start")}
        </button>
      </div>
    );
  }

  return (
    <>
      <section className="mt-6 overflow-hidden rounded-[30px] border border-[#E5A88B]/25 bg-gradient-to-br from-[#FFF9F5] via-white to-[#FFF3EC] shadow-sm">
        <div className="relative p-5">
          <div
            className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-[#E5A88B]/10 blur-3xl"
            aria-hidden="true"
          />

          <div className="relative">
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#E5A88B]/25 bg-white text-xl shadow-sm">
                  {weeklyGoal.medalUnlocked ? "🏅" : "🏆"}
                </div>

                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#C97B5E]">
                    {t("weeklyGoalPremium.pathEyebrow")}
                  </p>

                  <h3 className="mt-0.5 text-base font-black text-[#4E3B36]">
                    {t("weeklyGoalPremium.pathTitle")}
                  </h3>

                  <p className="mt-1 text-xs font-semibold leading-relaxed text-[#79665E]">
                    {weeklyGoal.title}
                  </p>
                </div>
              </div>

              <div className="shrink-0 rounded-2xl border border-[#E5A88B]/20 bg-white px-3 py-2 text-right shadow-sm">
                <div className="text-lg font-black leading-none text-[#4E3B36]">
                  {progress}/7
                </div>

                <div className="mt-1 text-[9px] font-black uppercase tracking-wider text-[#A88A7D]">
                  {t("weeklyGoal.days")}
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-[24px] border border-white bg-white/75 p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#A88A7D]">
                    {t("weeklyGoalPremium.continuity")}
                  </p>

                  <p className="mt-1 text-xs font-bold text-[#5D4942]">
                    {weeklyGoal.medalUnlocked
                      ? t("weeklyGoalPremium.pathComplete")
                      : t("weeklyGoalPremium.remaining", {
                          count: remainingDays
                        })}
                  </p>
                </div>

                <span className="rounded-full bg-[#FFF0E8] px-2.5 py-1 text-[10px] font-black text-[#C97B5E]">
                  {weeklyPercentage}%
                </span>
              </div>

              <div className="mt-5">
                <div className="relative">
                  <div
                    className="absolute left-[7%] right-[7%] top-5 h-1 rounded-full bg-[#F1E5DF]"
                    aria-hidden="true"
                  />

                  <div
                    className="absolute left-[7%] top-5 h-1 rounded-full bg-gradient-to-r from-[#E5A88B] to-[#C97B5E] transition-all duration-500"
                    style={{
                      width: `${
                        progress <= 1
                          ? 0
                          : ((Math.min(progress, 7) - 1) / 6) * 86
                      }%`
                    }}
                    aria-hidden="true"
                  />

                  <div className="relative grid grid-cols-7 gap-1">
                    {weekDates.map((date, index) => {
                      const completed =
                        completedDays.includes(date);

                      const hasRating =
                        !!weeklyGoal.dailyRatings?.[date];

                      const isToday =
                        date === today;

                      const isMissed =
                        date < today &&
                        !completed;

                      const disabled =
                        !completed &&
                        !canUseToday &&
                        !(
                          date < today &&
                          missedDays.includes(date)
                        );

                      return (
                        <button
                          key={date}
                          type="button"
                          onClick={() => openDay(date)}
                          disabled={disabled}
                          aria-label={t(
                            "weeklyGoalPremium.dayLabel",
                            {
                              day: index + 1
                            }
                          )}
                          className="group flex min-w-0 flex-col items-center disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <span
                            className={`relative z-10 flex h-10 w-10 max-w-full items-center justify-center rounded-full border text-[11px] font-black transition-all active:scale-95 ${
                              completed
                                ? "border-[#E5A88B] bg-[#E5A88B] text-white shadow-md shadow-[#E5A88B]/20"
                                : isToday
                                  ? "border-[#C97B5E] bg-white text-[#C97B5E] shadow-sm ring-4 ring-[#E5A88B]/10"
                                  : isMissed
                                    ? "border-[#E8D8D0] bg-[#FBF7F5] text-[#AD9489]"
                                    : "border-[#E8DDD7] bg-white text-[#9B857B]"
                            }`}
                          >
                            {completed ? (
                              <span className="text-sm">
                                ✓
                              </span>
                            ) : (
                              index + 1
                            )}

                            {hasRating && (
                              <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full border border-white bg-[#C97B5E] text-[7px] text-white">
                                ★
                              </span>
                            )}
                          </span>

                          <span
                            className={`mt-2 text-[8px] font-black uppercase tracking-tight ${
                              isToday
                                ? "text-[#C97B5E]"
                                : completed
                                  ? "text-[#8D746A]"
                                  : "text-[#B09B92]"
                            }`}
                          >
                            {isToday
                              ? t("weeklyGoalPremium.today")
                              : t(
                                  "weeklyGoalPremium.shortDay",
                                  {
                                    day: index + 1
                                  }
                                )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between gap-3 border-t border-[#F0E5DF] pt-3">
                <p className="text-[10px] font-semibold leading-relaxed text-[#9A857C]">
                  {t("weeklyGoalPremium.tapHint")}
                </p>

                {!weeklyGoal.medalUnlocked && (
                  <span className="shrink-0 text-[9px] font-black text-[#C97B5E]">
                    {t("weeklyGoalPremium.credits", {
                      count: Math.max(0, 2 - todayCredits)
                    })}
                  </span>
                )}
              </div>
            </div>

            {weeklyGoal.medalUnlocked && (
              <div className="mt-4 rounded-[24px] border border-[#E5A88B]/25 bg-gradient-to-r from-[#FFF0E8] to-[#FFF8F4] p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">
                    🏅
                  </div>

                  <div>
                    <p className="text-sm font-black text-[#4E3B36]">
                      {t("weeklyGoal.completed")}
                    </p>

                    <p className="mt-1 text-xs font-medium leading-relaxed text-[#7A6A64]">
                      {t("weeklyGoal.medalReady")}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {selectedDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#3F302B]/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[30px] border border-[#E5A88B]/20 bg-[#FFFCFA] p-6 shadow-2xl">
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
