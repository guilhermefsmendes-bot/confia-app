import { useEffect, useRef, useState } from 'react';
import { Check, Droplets, Footprints, Pause, Sparkles, Wind } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getMicroHabitForContext } from './microHabits';

const icons = { breath: Wind, water: Droplets, grounding: Sparkles, movement: Footprints, rest: Pause } as const;

interface MicroHabitCardProps {
  onCompleted?: () => void;
}

export function MicroHabitCard({ onCompleted }: MicroHabitCardProps) {
  const { t } = useTranslation();
  const habit = getMicroHabitForContext();
  const [seconds, setSeconds] = useState(habit.durationSeconds);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const completionRef = useRef(onCompleted);
  const Icon = icons[habit.kind];

  useEffect(() => {
    completionRef.current = onCompleted;
  }, [onCompleted]);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setSeconds((current) => {
        if (current <= 1) {
          window.clearInterval(id);
          setRunning(false);
          setDone(true);
          completionRef.current?.();
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [running]);

  const progress = ((habit.durationSeconds - seconds) / habit.durationSeconds) * 100;

  return (
    <section className="rounded-[28px] border border-[#B85F48]/20 bg-white/85 p-5 shadow-sm" aria-label={t('microHabit.title')}>
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F8E8DF] text-[#A85F45]">
          <Icon size={19} aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[9px] font-black uppercase tracking-[.18em] text-[#B9785D]">{t('microHabit.eyebrow')}</p>
          <h3 className="mt-1 text-base font-black text-[#493A35]">{t(`microHabit.${habit.labelKey}`)}</h3>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{t(`microHabit.${habit.descriptionKey}`)}</p>
        </div>
      </div>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#F1E5DF]" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)} aria-label={t('microHabit.progress')}>
        <div className="h-full rounded-full bg-[#934A38] transition-[width] duration-500" style={{ width: `${progress}%` }} />
      </div>
      <div className="mt-3 flex items-center justify-between rounded-2xl bg-[#FFF8F4] px-4 py-3">
        <span className="text-xs font-bold text-[#806A61]" aria-live="polite">{done ? t('microHabit.completed') : running ? t('microHabit.inProgress') : t('microHabit.ready')}</span>
        <span className="text-xl font-black tabular-nums text-[#A85F45]" aria-label={`${seconds} seconds remaining`}>{seconds}s</span>
      </div>
      <button type="button" disabled={running || done} onClick={() => setRunning(true)} className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#934A38] px-4 py-3 text-xs font-black text-white shadow-md shadow-[#934A38]/15 transition hover:bg-[#B86C51] disabled:cursor-not-allowed disabled:opacity-60">
        {done ? <><Check size={16} aria-hidden="true" />{t('microHabit.completedButton')}</> : t('microHabit.start')}
      </button>
    </section>
  );
}

export default MicroHabitCard;
