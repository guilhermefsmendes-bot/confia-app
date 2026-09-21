import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Plus, Trash2, Heart, Award, Smile, Coffee, Users, Sparkles, ArrowRight, CircleCheckBig, Footprints, Route, ShieldCheck, X } from 'lucide-react';
import { Objective } from '../types';
import { useTranslation } from "react-i18next";
import { emitCompanionInteraction } from "../data/reactive/companionBrain/companionInteractionEvents";
import { GOAL_JOURNEYS_UPDATED_EVENT, readGoalJourney, recordGoalAttempt, summarizeGoalJourney, updateGoalJourney, type GoalBlocker, type GoalLevel } from "../data/personal/goalJourney";
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
const { t, i18n } = useTranslation();
  const [newText, setNewText] = useState('');
  const [newCategory, setNewCategory] = useState<'corporeo' | 'mental' | 'social' | 'nutricao'>('mental');
  const [showForm, setShowForm] = useState(false);
  const [journeyRevision, setJourneyRevision] = useState(0);
  const [editingJourneyId, setEditingJourneyId] = useState<string | null>(null);
  const [blockedObjectiveId, setBlockedObjectiveId] = useState<string | null>(null);
  const [whyDraft, setWhyDraft] = useState("");
  const [minimumDraft, setMinimumDraft] = useState("");
  const [normalDraft, setNormalDraft] = useState("");
  const [extraDraft, setExtraDraft] = useState("");

  useEffect(() => {
    const refresh = () => setJourneyRevision(value => value + 1);
    window.addEventListener(GOAL_JOURNEYS_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(GOAL_JOURNEYS_UPDATED_EVENT, refresh);
  }, []);

  const journeys = useMemo(() => {
    void journeyRevision;
    return new Map(objectives.map(objective => [objective.id, readGoalJourney(objective.id)]));
  }, [objectives, journeyRevision]);

  const blockerLabels: Record<GoalBlocker, string> = {
    energy: t("objectivesJourney.blockers.energy"),
    anxiety: t("objectivesJourney.blockers.anxiety"),
    forgot: t("objectivesJourney.blockers.forgot"),
    time: t("objectivesJourney.blockers.time"),
    too_hard: t("objectivesJourney.blockers.tooHard"),
    motivation: t("objectivesJourney.blockers.motivation"),
    other: t("objectivesJourney.blockers.other"),
  };

  const deriveJourneySteps = (objective: Objective) => {
    const normal = t(objective.text);
    const timed = normal.match(/(\d+)\s*(minutos?|mins?|minutes?|minutos?|minuti?)/i);
    if (timed) {
      const amount = Number(timed[1]);
      const minimumAmount = Math.max(1, Math.round(amount / 3));
      const extraAmount = Math.max(amount + 1, amount * 2);
      return {
        minimum: t("objectivesJourney.steps.timedMinimum", { count: minimumAmount }),
        normal,
        extra: t("objectivesJourney.steps.timedExtra", { count: extraAmount }),
      };
    }
    return {
      minimum: t("objectivesJourney.steps.defaultMinimum"),
      normal,
      extra: t("objectivesJourney.steps.defaultExtra"),
    };
  };
  const startJourneyEdit = (objective: Objective) => {
    const journey = readGoalJourney(objective.id);
    setEditingJourneyId(objective.id);
    const suggested = deriveJourneySteps(objective);
    setWhyDraft(journey?.why || "");
    setMinimumDraft(journey?.minimum || suggested.minimum);
    setNormalDraft(journey?.normal || suggested.normal);
    setExtraDraft(journey?.extra || suggested.extra);
  };

  const saveJourney = () => {
    if (!editingJourneyId) return;
    updateGoalJourney(editingJourneyId, {
      why: whyDraft.trim() || undefined,
      minimum: minimumDraft.trim() || undefined,
      normal: normalDraft.trim() || undefined,
      extra: extraDraft.trim() || undefined,
    });
    setEditingJourneyId(null);
  };

  const recordCompletionLevel = (objective: Objective, level: GoalLevel) => {
    recordGoalAttempt(objective.id, { date: new Date().toISOString(), outcome: "done", level });
    if (!objective.completed) handleObjectiveToggle(objective);
  };

  const recordBlocker = (objective: Objective, blocker: GoalBlocker) => {
    recordGoalAttempt(objective.id, { date: new Date().toISOString(), outcome: "blocked", blocker });
    setBlockedObjectiveId(null);
  };

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
      emitCompanionInteraction(
        "goal_completed",
        "objectives",
        {
          goalType: objective.category,
        }
      );

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
          bg: 'bg-[#B85F48]/10 text-[#934A38] border-[#B85F48]/20',
          badge: 'bg-[#B85F48]/10 text-[#934A38] border border-[#B85F48]/20',
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
          bg: 'bg-[#F3E3DC] text-[#8A5C50] border-[#F3E3DC]',
          badge: 'bg-[#F3E3DC] text-[#8A5C50] border border-[#B85F48]/15',
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
          bg: 'bg-[#F7F5F2] text-[#7A4E43] border-[#F7F5F2]',
          badge: 'bg-[#F7F5F2] text-[#7A4E43] border border-[#B85F48]/15',
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
            <div className="flex items-center gap-2 rounded-full border border-[#B85F48]/30 bg-white/95 px-4 py-2.5 text-[#934A38] shadow-[0_12px_30px_rgba(92,64,52,0.14)] backdrop-blur-sm">
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
                className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F3E3DC]"
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
      <section className="relative overflow-hidden rounded-[30px] border border-[#B85F48]/25 bg-gradient-to-br from-[#FFF9F5] via-white to-[#F3E3DC]/70 p-5 shadow-sm">
        <div
          className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-[#B85F48]/10 blur-2xl"
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
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[#B85F48]/25 bg-white text-[#934A38] shadow-sm">
                  <Award size={16} strokeWidth={2.2} />
                </span>

                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#934A38] font-display">
                  {t("objectivesPremium.eyebrow")}
                </span>
              </div>

              <h2 className="text-[22px] font-black leading-tight text-[#2F2926] font-display">
                {t("objectivesPremium.title")}
              </h2>

              <p className="mt-1.5 max-w-[290px] text-xs font-medium leading-relaxed text-[#7A6A64]">
                {t("objectivesPremium.subtitle")}
              </p>
            </div>

            <div className="shrink-0 rounded-2xl border border-[#B85F48]/20 bg-white/85 px-3 py-2 text-right shadow-sm">
              <div className="text-lg font-black leading-none text-[#2F2926] font-display">
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

                <p className="mt-1 text-sm font-black text-[#2F2926]">
                  {t("completedGoals", {
                    completed: completedCount,
                    total: objectives.length,
                  })}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-[#B85F48]/20 bg-[#FFF7F2] px-2.5 py-1.5 text-[#934A38]">
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
                className="h-full rounded-full bg-gradient-to-r from-[#B85F48] to-[#934A38]"
              />
            </div>

            <div className="mt-2 flex items-center justify-between gap-3">
              <span className="text-[10px] font-semibold text-[#9B857B]">
                {t("objectivesPremium.progressHint")}
              </span>

              <span className="shrink-0 text-[10px] font-black text-[#934A38]">
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
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#934A38]">
              {allObjectivesCompleted
                ? t("objectivesPremium.completedEyebrow")
                : t("objectivesPremium.nextStep")}
            </p>

            <h3 className="mt-0.5 text-base font-black text-[#2F2926] font-display">
              {allObjectivesCompleted
                ? t("objectivesPremium.completedTitle")
                : t("objectivesPremium.nextStepTitle")}
            </h3>
          </div>

          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border ${
              allObjectivesCompleted
                ? "border-[#B85F48]/30 bg-[#F3E3DC] text-[#934A38]"
                : "border-[#B85F48]/20 bg-white text-[#934A38] shadow-sm"
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
            className="relative overflow-hidden rounded-[28px] border border-[#B85F48]/30 bg-gradient-to-br from-[#FFF8F4] via-white to-[#F3E3DC] p-5 shadow-md shadow-[#B85F48]/10"
          >
            <div
              className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-[#B85F48]/10 blur-2xl"
              aria-hidden="true"
            />

            <div className="relative">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-wider ${featuredCategory.badge}`}>
                  {featuredCategory.icon}
                  <span>{featuredCategory.label}</span>
                </span>

                <span className="inline-flex items-center gap-1 rounded-full border border-[#B85F48]/15 bg-white px-2.5 py-1 text-[9px] font-black text-[#934A38]">
                  <Sparkles size={10} />
                  +{featuredObjective.xpReward} XP
                </span>
              </div>

              <p className="mt-4 text-[17px] font-black leading-snug text-[#2F2926] font-display">
                {t(featuredObjective.text)}
              </p>

              <p className="mt-2 text-xs font-medium leading-relaxed text-[#8A7770]">
                {journeys.get(featuredObjective.id)?.why
                  ? <>{t("objectivesJourney.whyItMatters")} <b>{journeys.get(featuredObjective.id)?.why}</b></>
                  : t("objectivesJourney.threeVersionsHint")}
              </p>

              {(() => {
                const journey = journeys.get(featuredObjective.id);
                const suggested = deriveJourneySteps(featuredObjective);
                const steps = {
                  minimum: journey?.minimum || suggested.minimum,
                  normal: journey?.normal || suggested.normal,
                  extra: journey?.extra || suggested.extra,
                };
                const summary = summarizeGoalJourney(journey);
                const successfulAttempts = journey?.attempts.filter(item => item.outcome === "done").slice(-6) || [];
                const suggestProgression = successfulAttempts.length >= 5;
                return (
                  <>
                    <div className="mt-4 rounded-2xl border border-[#EADBD3] bg-white/90 p-3">
                      <p className="text-[9px] font-black uppercase tracking-[.16em] text-[#A06E5B]">{t("objectivesJourney.todayStep")}</p>
                      <div className="mt-3 space-y-2">
                        {([
                          ["minimum", "🌱", t("objectivesJourney.levels.minimum"), steps.minimum],
                          ["normal", "🌿", t("objectivesJourney.levels.normal"), steps.normal],
                          ["extra", "🌳", t("objectivesJourney.levels.extra"), steps.extra],
                        ] as [GoalLevel,string,string,string][]).map(([level,emoji,label,text]) => (
                          <button key={level} type="button" onClick={() => recordCompletionLevel(featuredObjective, level)} className="flex min-h-[62px] w-full items-start gap-3 rounded-2xl border border-[#F0E5DF] bg-[#FFFCFA] p-3 text-left transition hover:border-[#B85F48]/35">
                            <span className="text-lg leading-none" aria-hidden="true">{emoji}</span>
                            <span className="min-w-0"><span className="block text-[9px] font-black uppercase tracking-wide text-[#934A38]">{label}</span><span className="mt-1 block text-[11px] font-bold leading-4 text-[#55433D]">{text}</span></span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <p className="mt-3 text-center text-[9px] font-black uppercase tracking-[.14em] text-[#A88A7D]">{t("objectivesJourney.howDidItGo")}</p>
                    <button type="button" onClick={() => setBlockedObjectiveId(featuredObjective.id)} className="mt-2 flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#F7F2EE] px-3 text-[10px] font-black text-[#765D52]"><ShieldCheck size={14}/>{t("objectivesJourney.couldNotToday")}</button>
                    <button type="button" onClick={() => startJourneyEdit(featuredObjective)} className="mt-2 flex min-h-9 w-full items-center justify-center gap-2 px-3 text-[10px] font-black text-[#934A38]"><Route size={13}/>{t("objectivesJourney.customizePath")}</button>
                    {suggestProgression && (
                      <div className="mt-3 rounded-2xl border border-[#DCE9DF] bg-[#F2F8F3] p-3 text-[10px] font-bold leading-4 text-[#587563]">
                        {t("objectivesJourney.progression", { count: successfulAttempts.length })}
                      </div>
                    )}
                    {summary.topBlocker && summary.topBlockerCount >= 2 && (
                      <div className="mt-3 rounded-2xl bg-[#FFF1EA] p-3 text-[10px] font-bold leading-4 text-[#7A5145]">
                        {t("objectivesJourney.repeatedBlocker", { blocker: blockerLabels[summary.topBlocker], count: summary.topBlockerCount })}
                      </div>
                    )}
                    {summary.returnAfterGap && <div className="mt-2 rounded-2xl bg-[#EEF5F0] p-3 text-[10px] font-bold text-[#587563]">{t("objectivesJourney.invisibleWin")}</div>}
                  </>
                );
              })()}
            </div>
          </motion.div>
        ) : allObjectivesCompleted ? (
          <div className="rounded-[28px] border border-[#B85F48]/25 bg-gradient-to-br from-[#FFF9F5] to-[#F3E3DC]/70 p-5 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-[#B85F48]/25 bg-white text-[#934A38] shadow-sm">
              <CircleCheckBig size={23} strokeWidth={2.3} />
            </div>

            <p className="mt-3 text-sm font-black text-[#2F2926]">
              {t("objectivesPremium.allDone")}
            </p>

            <p className="mx-auto mt-1.5 max-w-[290px] text-xs font-medium leading-relaxed text-[#8A7770]">
              {t("objectivesPremium.allDoneHint")}
            </p>
          </div>
        ) : (
          <div className="rounded-[24px] border border-dashed border-[#B85F48]/25 bg-[#FFF9F5] p-4 text-center">
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

              <h3 className="mt-0.5 text-base font-black text-[#2F2926] font-display">
                {t("objectivesPremium.smallWins")}
              </h3>
            </div>

            <span className="shrink-0 rounded-full border border-[#B85F48]/15 bg-[#FFF8F4] px-2.5 py-1 text-[9px] font-black text-[#A06E5B]">
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
                        ? "border-[#B85F48]/20 bg-gradient-to-r from-[#FFF8F4] to-[#FFFDFC]"
                        : "border-[#EEE5E0] bg-white shadow-sm hover:border-[#B85F48]/30 hover:shadow-md"
                    }`}
                  >
                    {objective.completed && (
                      <div
                        className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-[#B85F48]"
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
                            ? "border-[#B85F48] bg-[#B85F48] text-white shadow-sm shadow-[#B85F48]/20"
                            : "border-[#E7DDD7] bg-[#FCFAF8] text-[#B49B90] hover:border-[#B85F48] hover:bg-[#FFF5F0] hover:text-[#934A38]"
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
                            <span className="shrink-0 rounded-full bg-[#B85F48]/10 px-2 py-1 text-[8px] font-black uppercase tracking-wider text-[#934A38]">
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
                                ? "bg-[#F3E3DC] text-[#934A38]"
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
      <AnimatePresence>
        {editingJourneyId && (() => {
          const objective = objectives.find(item => item.id === editingJourneyId);
          if (!objective) return null;
          return <motion.section initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="rounded-[28px] border border-[#B85F48]/25 bg-white p-5 shadow-md">
            <div className="flex items-start justify-between gap-3"><div><p className="text-[9px] font-black uppercase tracking-[.18em] text-[#934A38]">{t("objectivesJourney.myPath")}</p><h3 className="mt-1 text-base font-black text-[#2F2926]">{t(objective.text)}</h3></div><button type="button" onClick={() => setEditingJourneyId(null)} className="p-2 text-slate-400"><X size={16}/></button></div>
            <label className="mt-4 block text-[10px] font-black text-[#765D52]">{t("objectivesJourney.whyWantThis")}</label><textarea value={whyDraft} onChange={e=>setWhyDraft(e.target.value.slice(0,300))} rows={2} placeholder={t("objectivesJourney.whyPlaceholder")} className="mt-1 w-full rounded-2xl border border-[#E8DDD4] p-3 text-xs outline-none"/>
            <div className="mt-3 grid gap-2">
              <input value={minimumDraft} onChange={e=>setMinimumDraft(e.target.value.slice(0,180))} placeholder={t("objectivesJourney.minimumPlaceholder")} className="min-h-11 rounded-2xl border border-[#E8DDD4] px-3 text-xs outline-none"/>
              <input value={normalDraft} onChange={e=>setNormalDraft(e.target.value.slice(0,180))} placeholder={t("objectivesJourney.normalPlaceholder")} className="min-h-11 rounded-2xl border border-[#E8DDD4] px-3 text-xs outline-none"/>
              <input value={extraDraft} onChange={e=>setExtraDraft(e.target.value.slice(0,180))} placeholder={t("objectivesJourney.extraPlaceholder")} className="min-h-11 rounded-2xl border border-[#E8DDD4] px-3 text-xs outline-none"/>
            </div>
            <button type="button" onClick={saveJourney} className="mt-4 min-h-11 w-full rounded-2xl bg-[#3F2C27] text-xs font-black text-white">{t("objectivesJourney.savePath")}</button>
          </motion.section>;
        })()}
        {blockedObjectiveId && (() => {
          const objective = objectives.find(item => item.id === blockedObjectiveId);
          if (!objective) return null;
          return <motion.section initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="rounded-[28px] border border-[#E8DDD4] bg-[#FFF9F5] p-5">
            <div className="flex items-start justify-between"><div><p className="text-[9px] font-black uppercase tracking-[.18em] text-[#A06E5B]">{t("objectivesJourney.noGuilt")}</p><h3 className="mt-1 text-base font-black text-[#2F2926]">{t("objectivesJourney.whatMadeHard")}</h3></div><button type="button" onClick={()=>setBlockedObjectiveId(null)} className="p-2 text-slate-400"><X size={16}/></button></div>
            <div className="mt-4 grid grid-cols-2 gap-2">{(Object.entries(blockerLabels) as [GoalBlocker,string][]).map(([id,label])=><button key={id} type="button" onClick={()=>recordBlocker(objective,id)} className="min-h-11 rounded-2xl border border-[#E8DDD4] bg-white px-3 text-[10px] font-black text-[#6B554D]">{label}</button>)}</div>
          </motion.section>;
        })()}
      </AnimatePresence>

      {/* 2D — Objetivo criado pelo utilizador */}
      {!showForm ? (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="flex w-full items-center justify-between rounded-[22px] border border-dashed border-[#B85F48]/25 bg-[#FFFCFA] px-4 py-3.5 text-left transition-all hover:border-[#B85F48]/45 hover:bg-[#FFF8F4] cursor-pointer"
        >
          <span className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl border border-[#B85F48]/20 bg-white text-[#934A38] shadow-sm">
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
          className="rounded-[26px] border border-[#B85F48]/20 bg-gradient-to-br from-white to-[#FFF9F5] p-5 space-y-4 shadow-md shadow-[#B85F48]/5"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[#B85F48]/20 bg-white text-[#934A38] shadow-sm">
              <Plus size={17} />
            </span>

            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-[#A88A7D]">
                {t("objectivesPremium.yourGoalEyebrow")}
              </p>

              <h3 className="mt-0.5 text-sm font-black text-[#2F2926]">
                {t("objectivesPremium.createOwnTitle")}
              </h3>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#2F2926]">{t("whatToAchieveToday")}</label>
            <input
              type="text"
             placeholder={t("goalPlaceholder")}
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              className="w-full px-4 py-3 text-xs border border-slate-200/80 rounded-xl focus:outline-none focus:border-[#B85F48] focus:ring-2 focus:ring-[#B85F48]/15 bg-[#F7F5F2] text-[#2F2926]"
              maxLength={70}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#2F2926]">{t("goalCategory")}</label>
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
                        ? 'bg-[#B85F48] border-[#B85F48] text-white shadow-md shadow-[#B85F48]/25'
                        : 'border-[var(--cf-border)] hover:border-slate-200 bg-[var(--cf-surface-soft)] text-[var(--cf-text-soft)]'
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
              className="flex-1 py-3 text-xs text-[var(--cf-text-soft)] hover:bg-[var(--cf-surface-soft)] rounded-xl font-bold border border-slate-200/60 cursor-pointer"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              className="flex-1 py-3 text-xs bg-gradient-to-r from-[#B85F48] to-[#D59375] hover:from-[#D59375] hover:to-[#C68060] text-white rounded-xl font-bold flex items-center justify-center gap-1 shadow-md shadow-[#B85F48]/20 cursor-pointer"
            >
              {t("saveGoal")}
            </button>
          </div>
        </motion.form>
      )}

    </div>
  );
};
