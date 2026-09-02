import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Plus, Trash2, Heart, Award, Smile, Coffee, Users, Sparkles, ArrowRight, CircleCheckBig, Footprints } from 'lucide-react';
import { Objective } from '../types';
import { useTranslation } from "react-i18next";
interface ObjectivosListProps {
  objectives: Objective[];
  onToggleComplete: (id: string) => void;
  onAddCustomObjective: (text: string, category: 'corporeo' | 'mental' | 'social' | 'nutricao') => void;
  onDeleteObjective: (id: string) => void;
}

export const ObjectivosList: React.FC<ObjectivosListProps> = ({

  objectives,
  onToggleComplete,
  onAddCustomObjective,
  onDeleteObjective
}) => {
const { t } = useTranslation();
  const [newText, setNewText] = useState('');
  const [newCategory, setNewCategory] = useState<'corporeo' | 'mental' | 'social' | 'nutricao'>('mental');
  const [showForm, setShowForm] = useState(false);

  /**
   * 2G — microcelebração transitória.
   *
   * Não representa estado persistente da aplicação.
   * Existe apenas para tornar a recompensa já atribuída
   * pelo App.tsx perceptível visualmente.
   */
  const [objectiveCelebration, setObjectiveCelebration] =
    useState<{
      id: string;
      xp: number;
    } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;
    onAddCustomObjective(newText.trim(), newCategory);
    setNewText('');
    setShowForm(false);
  };

  const handleObjectiveToggle = (
    objective: Objective
  ) => {
    const isCompleting = !objective.completed;

    if (isCompleting) {
      setObjectiveCelebration({
        id: objective.id,
        xp: objective.xpReward,
      });

      window.setTimeout(() => {
        setObjectiveCelebration(current =>
          current?.id === objective.id
            ? null
            : current
        );
      }, 1600);
    } else if (
      objectiveCelebration?.id === objective.id
    ) {
      setObjectiveCelebration(null);
    }

    onToggleComplete(objective.id);
  };

  const getCategoryStyles = (category: string) => {
    switch (category) {
      case 'corporeo':
        return {
          bg: 'bg-[#E5A88B]/10 text-[#C97B5E] border-[#E5A88B]/20',
          badge: 'bg-[#E5A88B]/10 text-[#C97B5E] border border-[#E5A88B]/20',
          icon: <Heart size={14} />,
          label: t("physical")
        };
      case 'mental':
        return {
          bg: 'bg-[#F5D6C6]/20 text-[#A06050] border-[#F5D6C6]/30',
          badge: 'bg-[#F5D6C6]/20 text-[#A06050] border border-[#F5D6C6]/30',
          icon: <Smile size={14} />,
         label: t("mental")
        };
      case 'social':
        return {
          bg: 'bg-[#FFF0E8] text-[#8A5C50] border-[#FFF0E8]',
          badge: 'bg-[#FFF0E8] text-[#8A5C50] border border-[#E5A88B]/15',
          icon: <Users size={14} />,
         label: t("social")
        };
      case 'acao':
        return {
          bg: 'bg-[#F2EDE8] text-[#765D52] border-[#E7DDD7]',
          badge: 'bg-[#F7F2EE] text-[#765D52] border border-[#E7DDD7]',
          icon: <Footprints size={14} />,
          label: t("objectivesPremium.actionCategory")
        };
      case 'nutricao':
      default:
        return {
          bg: 'bg-[#FAF5F0] text-[#7A4E43] border-[#FAF5F0]',
          badge: 'bg-[#FAF5F0] text-[#7A4E43] border border-[#E5A88B]/15',
          icon: <Coffee size={14} />,
         label: t("nutrition")
        };
    }
  };

  const completedCount = objectives.filter(o => o.completed).length;

  const completionPercentage =
    objectives.length > 0
      ? Math.round((completedCount / objectives.length) * 100)
      : 0;

  const earnedXp = objectives
    .filter(objective => objective.completed)
    .reduce((total, objective) => total + objective.xpReward, 0);

  const featuredObjective =
    objectives.find(objective => !objective.completed) ?? null;

  const remainingObjectives = featuredObjective
    ? objectives.filter(
        objective => objective.id !== featuredObjective.id
      )
    : objectives;

  const featuredCategory = featuredObjective
    ? getCategoryStyles(featuredObjective.category)
    : null;

  const allObjectivesCompleted =
    objectives.length > 0 &&
    completedCount === objectives.length;

  return (
    <div className="relative max-w-md mx-auto space-y-5 py-4">
      <AnimatePresence>
        {objectiveCelebration && (
          <motion.div
            key={objectiveCelebration.id}
            initial={{
              opacity: 0,
              y: 8,
              scale: 0.94
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1
            }}
            exit={{
              opacity: 0,
              y: -10,
              scale: 0.97
            }}
            transition={{
              duration: 0.28,
              ease: "easeOut"
            }}
            className="pointer-events-none fixed left-1/2 top-20 z-50 -translate-x-1/2"
            aria-live="polite"
          >
            <div className="flex items-center gap-2 rounded-full border border-[#E5A88B]/30 bg-white/95 px-4 py-2.5 text-[#C97B5E] shadow-[0_12px_30px_rgba(92,64,52,0.14)] backdrop-blur-sm">
              <motion.span
                initial={{
                  rotate: -12,
                  scale: 0.75
                }}
                animate={{
                  rotate: 0,
                  scale: 1
                }}
                transition={{
                  duration: 0.32,
                  ease: "easeOut"
                }}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FFF0E8]"
              >
                <Sparkles
                  size={14}
                  strokeWidth={2.3}
                />
              </motion.span>

              <motion.span
                initial={{
                  opacity: 0,
                  x: -4
                }}
                animate={{
                  opacity: 1,
                  x: 0
                }}
                transition={{
                  duration: 0.25,
                  delay: 0.05
                }}
                className="text-xs font-black tracking-wide"
              >
                +{objectiveCelebration.xp} XP
              </motion.span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2B — Identidade premium + progresso diário */}
      <section className="relative overflow-hidden rounded-[30px] border border-[#E5A88B]/25 bg-gradient-to-br from-[#FFF9F5] via-white to-[#FFF0E8]/70 p-5 shadow-sm">
        <div
          className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-[#E5A88B]/10 blur-2xl"
          aria-hidden="true"
        />

        <div
          className="pointer-events-none absolute -bottom-10 -left-8 h-28 w-28 rounded-full bg-[#F5D6C6]/15 blur-2xl"
          aria-hidden="true"
        />

        <div className="relative">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="mb-2 flex items-center gap-2">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[#E5A88B]/25 bg-white text-[#C97B5E] shadow-sm">
                  <Award size={16} strokeWidth={2.2} />
                </span>

                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#C97B5E] font-display">
                  {t("objectivesPremium.eyebrow")}
                </span>
              </div>

              <h2 className="text-[22px] font-black leading-tight text-[#4E3B36] font-display">
                {t("objectivesPremium.title")}
              </h2>

              <p className="mt-1.5 max-w-[290px] text-xs font-medium leading-relaxed text-[#7A6A64]">
                {t("objectivesPremium.subtitle")}
              </p>
            </div>

            <div className="shrink-0 rounded-2xl border border-[#E5A88B]/20 bg-white/85 px-3 py-2 text-right shadow-sm">
              <div className="text-lg font-black leading-none text-[#4E3B36] font-display">
                {completionPercentage}%
              </div>

              <div className="mt-1 text-[9px] font-extrabold uppercase tracking-wider text-[#A88A7D]">
                {t("objectivesPremium.today")}
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-[22px] border border-white/80 bg-white/75 p-4 shadow-sm backdrop-blur-sm">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#A88A7D]">
                  {t("objectivesPremium.todayProgress")}
                </p>

                <p className="mt-1 text-sm font-black text-[#4E3B36]">
                  {t("completedGoals", {
                    completed: completedCount,
                    total: objectives.length,
                  })}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-[#E5A88B]/20 bg-[#FFF7F2] px-2.5 py-1.5 text-[#C97B5E]">
                <Sparkles size={12} />

                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={earnedXp}
                    initial={{
                      opacity: 0,
                      y: 4,
                      scale: 0.94
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      scale: 1
                    }}
                    exit={{
                      opacity: 0,
                      y: -3
                    }}
                    transition={{
                      duration: 0.22,
                      ease: "easeOut"
                    }}
                    className="text-[10px] font-black"
                  >
                    +{earnedXp} XP
                  </motion.span>
                </AnimatePresence>
              </div>
            </div>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#F3E7E1]">
              <motion.div
                initial={false}
                animate={{
                  width: `${completionPercentage}%`
                }}
                transition={{
                  duration: 0.45,
                  ease: "easeOut"
                }}
                className="h-full rounded-full bg-gradient-to-r from-[#E5A88B] to-[#C97B5E]"
              />
            </div>

            <div className="mt-2 flex items-center justify-between gap-3">
              <span className="text-[10px] font-semibold text-[#9B857B]">
                {t("objectivesPremium.progressHint")}
              </span>

              <span className="shrink-0 text-[10px] font-black text-[#C97B5E]">
                {completedCount}/{objectives.length}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 2C — Próximo passo */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3 px-1">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#C97B5E]">
              {allObjectivesCompleted
                ? t("objectivesPremium.completedEyebrow")
                : t("objectivesPremium.nextStep")}
            </p>

            <h3 className="mt-0.5 text-base font-black text-[#4E3B36] font-display">
              {allObjectivesCompleted
                ? t("objectivesPremium.completedTitle")
                : t("objectivesPremium.nextStepTitle")}
            </h3>
          </div>

          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border ${
              allObjectivesCompleted
                ? "border-[#E5A88B]/30 bg-[#FFF0E8] text-[#C97B5E]"
                : "border-[#E5A88B]/20 bg-white text-[#C97B5E] shadow-sm"
            }`}
          >
            {allObjectivesCompleted ? (
              <CircleCheckBig size={19} strokeWidth={2.3} />
            ) : (
              <ArrowRight size={19} strokeWidth={2.3} />
            )}
          </div>
        </div>

        {featuredObjective && featuredCategory ? (
          <motion.div
            key={featuredObjective.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-[28px] border border-[#E5A88B]/30 bg-gradient-to-br from-[#FFF8F4] via-white to-[#FFF0E8] p-5 shadow-md shadow-[#E5A88B]/10"
          >
            <div
              className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-[#E5A88B]/10 blur-2xl"
              aria-hidden="true"
            />

            <div className="relative">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-wider ${featuredCategory.badge}`}>
                  {featuredCategory.icon}
                  <span>{featuredCategory.label}</span>
                </span>

                <span className="inline-flex items-center gap-1 rounded-full border border-[#E5A88B]/15 bg-white px-2.5 py-1 text-[9px] font-black text-[#C97B5E]">
                  <Sparkles size={10} />
                  +{featuredObjective.xpReward} XP
                </span>
              </div>

              <p className="mt-4 text-[17px] font-black leading-snug text-[#4E3B36] font-display">
                {t(featuredObjective.text)}
              </p>

              <p className="mt-2 text-xs font-medium leading-relaxed text-[#8A7770]">
                {t("objectivesPremium.nextStepHint")}
              </p>

              <button
                type="button"
                onClick={() =>
                  handleObjectiveToggle(featuredObjective)
                }
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#E5A88B] to-[#C97B5E] px-4 py-3.5 text-xs font-black text-white shadow-md shadow-[#E5A88B]/20 transition-transform active:scale-[0.98] cursor-pointer"
              >
                <Check size={16} strokeWidth={3} />
                {t("objectivesPremium.completeStep")}
              </button>
            </div>
          </motion.div>
        ) : allObjectivesCompleted ? (
          <div className="rounded-[28px] border border-[#E5A88B]/25 bg-gradient-to-br from-[#FFF9F5] to-[#FFF0E8]/70 p-5 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-[#E5A88B]/25 bg-white text-[#C97B5E] shadow-sm">
              <CircleCheckBig size={23} strokeWidth={2.3} />
            </div>

            <p className="mt-3 text-sm font-black text-[#4E3B36]">
              {t("objectivesPremium.allDone")}
            </p>

            <p className="mx-auto mt-1.5 max-w-[290px] text-xs font-medium leading-relaxed text-[#8A7770]">
              {t("objectivesPremium.allDoneHint")}
            </p>
          </div>
        ) : (
          <div className="rounded-[24px] border border-dashed border-[#E5A88B]/25 bg-[#FFF9F5] p-4 text-center">
            <p className="text-xs font-semibold text-[#8A7770]">
              {t("objectivesPremium.noObjectives")}
            </p>
          </div>
        )}
      </section>

      {/* 2C — Pequenas vitórias */}
      {remainingObjectives.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-end justify-between gap-3 px-1">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#A88A7D]">
                {t("objectivesPremium.smallWinsEyebrow")}
              </p>

              <h3 className="mt-0.5 text-base font-black text-[#4E3B36] font-display">
                {t("objectivesPremium.smallWins")}
              </h3>
            </div>

            <span className="shrink-0 rounded-full border border-[#E5A88B]/15 bg-[#FFF8F4] px-2.5 py-1 text-[9px] font-black text-[#A06E5B]">
              {completedCount}/{objectives.length}
            </span>
          </div>

          <div className="space-y-2.5">
            <AnimatePresence initial={false}>
              {remainingObjectives.map(objective => {
                const catStyles = getCategoryStyles(objective.category);

                return (
                  <motion.div
                    key={objective.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className={`group relative overflow-hidden rounded-[22px] border p-3.5 transition-all ${
                      objective.completed
                        ? "border-[#E5A88B]/20 bg-gradient-to-r from-[#FFF8F4] to-[#FFFDFC]"
                        : "border-[#EEE5E0] bg-white shadow-sm hover:border-[#E5A88B]/30 hover:shadow-md"
                    }`}
                  >
                    {objective.completed && (
                      <div
                        className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-[#E5A88B]"
                        aria-hidden="true"
                      />
                    )}

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          handleObjectiveToggle(objective)
                        }
                        aria-label={
                          objective.completed
                            ? t("objectivesPremium.markPending")
                            : t("objectivesPremium.markCompleted")
                        }
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border transition-all cursor-pointer ${
                          objective.completed
                            ? "border-[#E5A88B] bg-[#E5A88B] text-white shadow-sm shadow-[#E5A88B]/20"
                            : "border-[#E7DDD7] bg-[#FCFAF8] text-[#B49B90] hover:border-[#E5A88B] hover:bg-[#FFF5F0] hover:text-[#C97B5E]"
                        }`}
                      >
                        {objective.completed ? (
                          <Check
                            size={16}
                            strokeWidth={3}
                          />
                        ) : (
                          <span className="h-2 w-2 rounded-full border border-current" />
                        )}
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={`min-w-0 text-xs leading-relaxed ${
                              objective.completed
                                ? "font-semibold text-[#8D7B73]"
                                : "font-bold text-[#55433D]"
                            }`}
                          >
                            {t(objective.text)}
                          </p>

                          {objective.completed && (
                            <span className="shrink-0 rounded-full bg-[#E5A88B]/10 px-2 py-1 text-[8px] font-black uppercase tracking-wider text-[#C97B5E]">
                              {t("objectivesPremium.completedLabel")}
                            </span>
                          )}
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[8px] font-black uppercase tracking-wider ${catStyles.badge}`}
                          >
                            {catStyles.icon}
                            <span>{catStyles.label}</span>
                          </span>

                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[8px] font-black ${
                              objective.completed
                                ? "bg-[#FFF0E8] text-[#C97B5E]"
                                : "bg-[#FAF6F3] text-[#9B7B6D]"
                            }`}
                          >
                            <Sparkles size={9} />
                            +{objective.xpReward} XP
                          </span>
                        </div>
                      </div>

                      {objective.isCustom && (
                        <button
                          type="button"
                          onClick={() =>
                            onDeleteObjective(objective.id)
                          }
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[#C7B8B1] transition-colors hover:bg-red-50 hover:text-red-400 cursor-pointer"
                          title={t("remove")}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </section>
      )}
      {/* 2D — Objetivo criado pelo utilizador */}
      {!showForm ? (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="flex w-full items-center justify-between rounded-[22px] border border-dashed border-[#E5A88B]/25 bg-[#FFFCFA] px-4 py-3.5 text-left transition-all hover:border-[#E5A88B]/45 hover:bg-[#FFF8F4] cursor-pointer"
        >
          <span className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl border border-[#E5A88B]/20 bg-white text-[#C97B5E] shadow-sm">
              <Plus size={16} />
            </span>

            <span>
              <span className="block text-[10px] font-black uppercase tracking-[0.15em] text-[#A88A7D]">
                {t("objectivesPremium.yourGoalEyebrow")}
              </span>

              <span className="mt-0.5 block text-xs font-black text-[#5C4841]">
                {t("addCustomGoal")}
              </span>
            </span>
          </span>

          <span className="text-lg leading-none text-[#C7B1A7]">
            +
          </span>
        </button>
      ) : (
        <motion.form
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          onSubmit={handleSubmit}
          className="rounded-[26px] border border-[#E5A88B]/20 bg-gradient-to-br from-white to-[#FFF9F5] p-5 space-y-4 shadow-md shadow-[#E5A88B]/5"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[#E5A88B]/20 bg-white text-[#C97B5E] shadow-sm">
              <Plus size={17} />
            </span>

            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-[#A88A7D]">
                {t("objectivesPremium.yourGoalEyebrow")}
              </p>

              <h3 className="mt-0.5 text-sm font-black text-[#4E3B36]">
                {t("objectivesPremium.createOwnTitle")}
              </h3>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#4E3B36]">{t("whatToAchieveToday")}</label>
            <input
              type="text"
             placeholder={t("goalPlaceholder")}
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              className="w-full px-4 py-3 text-xs border border-slate-200/80 rounded-xl focus:outline-none focus:border-[#E5A88B] focus:ring-2 focus:ring-[#E5A88B]/15 bg-[#FAF5F0] text-[#4E3B36]"
              maxLength={70}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#4E3B36]">{t("goalCategory")}</label>
            <div className="grid grid-cols-4 gap-1.5">
              {(['mental', 'corporeo', 'social', 'nutricao'] as const).map(cat => {
                const styles = getCategoryStyles(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setNewCategory(cat)}
                    className={`p-2.5 border text-[10px] font-bold rounded-xl flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                      newCategory === cat
                        ? 'bg-[#E5A88B] border-[#E5A88B] text-white shadow-md shadow-[#E5A88B]/25'
                        : 'border-slate-100 hover:border-slate-200 bg-slate-50 text-slate-500'
                    }`}
                  >
                    {styles.icon}
                    <span>{styles.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1.5">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 py-3 text-xs text-slate-500 hover:bg-slate-50 rounded-xl font-bold border border-slate-200/60 cursor-pointer"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              className="flex-1 py-3 text-xs bg-gradient-to-r from-[#E5A88B] to-[#D59375] hover:from-[#D59375] hover:to-[#C68060] text-white rounded-xl font-bold flex items-center justify-center gap-1 shadow-md shadow-[#E5A88B]/20 cursor-pointer"
            >
              {t("saveGoal")}
            </button>
          </div>
        </motion.form>
      )}

    </div>
  );
};
