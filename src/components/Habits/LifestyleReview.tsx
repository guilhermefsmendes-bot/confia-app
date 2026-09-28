import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { HabitRecord } from '../../data/habits/types';
import { dailyLifestyleReview,weeklyLifestyleReview } from '../../data/personal/lifestyleReview';
import { verifiedHabitSources } from '../../data/habits/sources';
export function SourceNote({id}:{id:string}) {
 const {t}=useTranslation(),source=verifiedHabitSources.find(s=>s.id===id);if(!source)return null;
 return <details className="mt-2 text-xs leading-5"><summary className="min-h-8 cursor-pointer font-semibold">{t('habitHub.review.why')}</summary><p>{t('habitHub.sources.explain.'+id)}</p><a className="inline-block min-h-11 py-3 underline" href={source.url} target="_blank" rel="noreferrer">{t('habitHub.review.source')} · {source.organization} · {t(source.titleKey)}</a></details>;
}
export default function LifestyleReview({records,date,today,compact=false}:{records:HabitRecord[];date:string;today:string;compact?:boolean}) {
 const {t,i18n}=useTranslation(),daily=useMemo(()=>dailyLifestyleReview(records,date),[records,date]),week=useMemo(()=>weeklyLifestyleReview(records,today),[records,today]);
 if(compact&&!daily.hasData)return null;
 return <div className="space-y-4">
 <section className="rounded-[28px] border border-[#E1D7C5] bg-[#FFFDF7] p-5" aria-label={t('habitHub.review.daily')}><h3 className="text-xl font-black">{t('habitHub.review.daily')}</h3>
 {!daily.hasData?<p className="mt-3 text-sm leading-6">{t('habitHub.review.empty')}</p>:<div className="mt-4 space-y-4 text-sm leading-6"><div><h4 className="font-bold">{t('habitHub.review.helped')}</h4>{daily.minutes>0&&<><p>{t('habitHub.review.movement',{minutes:daily.minutes})}</p><SourceNote id="movement"/></>}{daily.plants&&<><p>{t('habitHub.review.plants')}</p><SourceNote id="plants"/></>}{!daily.minutes&&!daily.plants&&<p>{t('habitHub.review.noted')}</p>}</div><div><h4 className="font-bold">{t('habitHub.review.observe')}</h4><p>{t('habitHub.review.'+(daily.late?'late':daily.energy?'energy':'limited'))}</p>{(daily.late||daily.energy)&&<SourceNote id="caffeine"/>}</div><div><h4 className="font-bold">{t('habitHub.review.tomorrow')}</h4><p>{t('habitHub.review.ideas.'+daily.idea)}</p></div></div>}
 <p className="mt-4 text-xs leading-5 text-[#6F5D51]">{t('habitHub.review.limits')}</p></section>
 {!compact&&<section className="rounded-[28px] border border-[#E8DDD7] bg-white p-5"><h3 className="text-xl font-black">{t('habitHub.review.week')}</h3><p className="mt-1 text-xs">{t('habitHub.review.weekWindow',{start:week.start,end:today})}</p><h4 className="mt-4 font-bold">{t('habitHub.review.food')}</h4>{week.recordedDays<3?<p className="mt-2 text-sm leading-6">{t('habitHub.review.empty')}</p>:<ul className="mt-2 space-y-2 text-sm">{week.food.filter(x=>x.recorded>0).slice(0,5).map(x=><li key={x.key}>{t('habitHub.food.'+x.key)} · {t('habitHub.nutrition.average',{value:new Intl.NumberFormat(i18n.language,{maximumFractionDigits:1}).format(x.average!),unit:t('habitHub.units.'+x.key),count:x.recorded})}</li>)}</ul>}<h4 className="mt-4 font-bold">{t('habitHub.exercise.title')}</h4><p className="mt-2 text-sm">{t('habitHub.review.movementWeek',{minutes:week.movement.minutes,days:week.activeDays})}</p><p className="mt-1 text-sm">{week.movement.activities.sort((a,b)=>b.count-a.count).slice(0,3).map(a=>t('habitHub.activities.'+a.activity)+' · '+a.count).join(' / ')}</p><p className="mt-3 text-xs leading-5">{t('habitHub.review.measuredOnly')}</p></section>}
 </div>;
}
