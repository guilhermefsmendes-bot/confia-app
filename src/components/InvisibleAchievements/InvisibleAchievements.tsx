import { Eye, Footprints, Heart, LockKeyhole } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { InvisibleAchievement, InvisibleAchievementsProps } from './types';

export function InvisibleAchievements({ checkInDays, completedObjectives }: InvisibleAchievementsProps) {
  const { t } = useTranslation();
  const achievements: InvisibleAchievement[] = [
    { id: 'return', icon: 'heart', titleKey: 'returnTitle', descriptionKey: 'returnDescription', threshold: 3, value: checkInDays },
    { id: 'notice', icon: 'eye', titleKey: 'noticeTitle', descriptionKey: 'noticeDescription', threshold: 7, value: checkInDays },
    { id: 'action', icon: 'steps', titleKey: 'actionTitle', descriptionKey: 'actionDescription', threshold: 5, value: completedObjectives },
  ];
  const icons = { heart: Heart, eye: Eye, steps: Footprints } as const;
  const unlocked = achievements.filter((item) => item.value >= item.threshold).length;

  return (
    <section className="rounded-[28px] border border-[#BBA7D6]/20 bg-white/85 p-5 shadow-sm" aria-label={t('invisibleAchievements.title')}>
      <div className="flex items-start justify-between gap-3">
        <div><p className="text-[9px] font-black uppercase tracking-[.18em] text-[#8068A0]">{t('invisibleAchievements.eyebrow')}</p><h3 className="mt-1 text-base font-black text-[#493A35]">{t('invisibleAchievements.title')}</h3><p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{t('invisibleAchievements.subtitle')}</p></div>
        <div className="flex shrink-0 items-center gap-1 rounded-full bg-[#F1ECF7] px-2.5 py-1 text-[10px] font-black text-[#8068A0]"><LockKeyhole size={12} aria-hidden="true" />{unlocked}/3</div>
      </div>
      <div className="mt-4 grid gap-2">
        {achievements.map((item) => {
          const Icon = icons[item.icon as keyof typeof icons];
          const isUnlocked = item.value >= item.threshold;
          const progress = Math.min(100, (item.value / item.threshold) * 100);
          return <div key={item.id} className={`rounded-2xl border px-3 py-3 ${isUnlocked ? 'border-[#CDBBE0] bg-[#FAF7FC]' : 'border-slate-100 bg-slate-50/70'}`}>
            <div className="flex items-center gap-3"><div className={`flex h-9 w-9 items-center justify-center rounded-xl ${isUnlocked ? 'bg-[#EDE3F5] text-[#8068A0]' : 'bg-slate-100 text-slate-400'}`}><Icon size={16} aria-hidden="true" /></div><div className="min-w-0 flex-1"><p className="text-xs font-black text-[#493A35]">{t(`invisibleAchievements.${item.titleKey}`)}</p><p className="text-[10px] font-semibold text-slate-500">{t(`invisibleAchievements.${item.descriptionKey}`)}</p></div><span className="text-[10px] font-black text-[#8068A0]">{isUnlocked ? '✓' : `${Math.min(item.value, item.threshold)}/${item.threshold}`}</span></div>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)} aria-label={t('invisibleAchievements.progress')}><div className="h-full rounded-full bg-[#9A82B5] transition-[width] duration-500" style={{ width: `${progress}%` }} /></div>
          </div>;
        })}
      </div>
    </section>
  );
}

export default InvisibleAchievements;
