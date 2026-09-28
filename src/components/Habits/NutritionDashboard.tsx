import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FOOD_TYPES,FOOD_ICONS,type FoodType,type HabitRecord } from '../../data/habits/types';
import { saveFoodItem } from '../../data/habits/actions';
import { dayFoodItems,nutritionTotals,type FoodRecord } from '../../data/habits/nutrition';
import { itemVolume } from '../../data/habits/catalog';
import { hasOlderHabits,loadOlderHabits } from '../../data/habits/sync';
import { DayPicker,buttonClass,primaryClass,type RunAction,formatDay } from './shared';
import FoodEditor from './FoodEditor';
import LifestyleReview from './LifestyleReview';
import './nutrition.css';
export function FoodItemLabel({record}:{record:FoodRecord}) {
 const {t,i18n}=useTranslation(),d=record.data;
 const amount=new Intl.NumberFormat(i18n.language,{maximumFractionDigits:1}).format(d.quantity);
 const volume=itemVolume(d);
 const countName=d.category==='fruit'&&d.unit==='item'&&d.subtype!=='unspecified';
 return <><strong>{countName?t('habitHub.detail.fruitCount.'+d.subtype,{count:d.quantity}):t('habitHub.catalog.'+d.category+'.'+d.subtype)}</strong>{!countName&&<span> · {amount} {t('habitHub.detail.units.'+d.unit,{count:d.quantity})}</span>}{volume!==undefined&&d.unit!=='ml'&&<span> · {volume} ml</span>}{(d.time||d.period)&&<span className="block text-xs text-[#6F5D51]">{d.time??t('habitHub.detail.periods.'+d.period)}</span>}</>;
}
export default function NutritionDashboard({records,today,run,onDone}:{records:HabitRecord[];today:string;run:RunAction;onDone:()=>void}) {
 const {t,i18n}=useTranslation();const [date,setDate]=useState(today),[editor,setEditor]=useState<{category:FoodType;record?:FoodRecord}|null>(null);
 const [limit,setLimit]=useState(7),[loading,setLoading]=useState(false),[loadError,setLoadError]=useState(false);
 const items=dayFoodItems(records,date),totals=nutritionTotals(records,date);
 const legacy=Object.entries(totals).filter(([key])=>!records.some(r=>r.kind==='foodItem'&&r.date===date&&r.data.category===key));
 const dates=[...new Set(records.filter(r=>r.kind==='nutrition'&&r.date<date).map(r=>r.date))].sort().reverse();
 return <div className="space-y-5">
  <section className="space-y-4 rounded-[28px] border border-[#C9D8BD] bg-[#F4F8EE] p-5"><DayPicker value={date} onChange={setDate}/><p className="text-sm leading-6">{t('habitHub.detail.help')}</p><div className="grid grid-cols-2 gap-3">{FOOD_TYPES.map(category=><button key={category} type="button" className={buttonClass+' text-left'} onClick={()=>setEditor({category})}><span className="block text-xl" aria-hidden="true">{FOOD_ICONS[category]}</span>{t('habitHub.food.'+category)}<span className="mt-1 block text-xs font-normal">{t('habitHub.detail.add')}</span></button>)}</div></section>
  <section className="rounded-[28px] border border-[#E8DDD7] bg-white p-5"><h3 className="text-xl font-black">{t('habitHub.detail.yourDay')}</h3>{!Object.keys(totals).length&&<p className="mt-3 text-sm">{t('habitHub.nutrition.empty')}</p>}<ul className="mt-3 space-y-3">{items.map(r=><li key={r.id} className="flex flex-wrap items-center gap-2 rounded-xl bg-[#FAF8F3] p-3 text-sm"><div className="min-w-0 flex-1"><FoodItemLabel record={r}/></div><button type="button" className={buttonClass} onClick={()=>setEditor({category:r.data.category,record:r})}>{t('habitHub.detail.edit')}</button><button type="button" aria-label={t('habitHub.detail.removeItem',{name:t('habitHub.catalog.'+r.data.category+'.'+r.data.subtype)})} className={buttonClass} onClick={()=>run(()=>saveFoodItem(date,{...r.data,deleted:true},r.id),t('habitHub.detail.removed'))}>×</button></li>)}</ul>
  {legacy.length>0&&<div className="mt-4 rounded-xl bg-[#FAF8F3] p-3 text-sm"><p className="mb-2 text-xs">{t('habitHub.detail.legacy')}</p>{legacy.map(([key,n])=><p key={key}>{t('habitHub.food.'+key)}: {n} {t('habitHub.units.'+key)}</p>)}<p className="mt-2 text-xs">{t('habitHub.detail.legacyHelp')}</p></div>}
  <button type="button" className={primaryClass+' mt-4 w-full'} onClick={onDone}>{t('habitHub.detail.finish')}</button></section>
  <LifestyleReview records={records} date={date} today={today}/>
  <details className="rounded-2xl border border-[#E8DDD7] bg-white p-4"><summary className="min-h-8 cursor-pointer font-bold">{t('habitHub.clock.history')}</summary>{dates.slice(0,limit).map(day=><details key={day} className="mt-3 text-sm"><summary className="min-h-11 cursor-pointer py-3">{formatDay(day,i18n.language)}</summary><ul className="space-y-2">{dayFoodItems(records,day).map(r=><li key={r.id}><FoodItemLabel record={r}/></li>)}</ul>{Object.entries(nutritionTotals(records,day)).map(([key,n])=><p key={key}>{t('habitHub.food.'+key)}: {new Intl.NumberFormat(i18n.language,{maximumFractionDigits:1}).format(n!)} {t('habitHub.units.'+key)}</p>)}</details>)}{(dates.length>limit||hasOlderHabits())&&<button type="button" disabled={loading} className={buttonClass+' mt-3'} onClick={async()=>{setLoading(true);setLoadError(false);try{if(dates.length<=limit)await loadOlderHabits();setLimit(n=>n+7);}catch{setLoadError(true);}finally{setLoading(false);}}}>{t('habitHub.detail.loadMore')}</button>}{loadError&&<p role="alert">{t('habitHub.error')}</p>}</details>
  {editor&&<FoodEditor key={date+(editor.record?.id??editor.category)} category={editor.category} initial={editor.record?.data} onClose={()=>setEditor(null)} onSave={data=>{const saved=run(()=>saveFoodItem(date,data,editor.record?.id),t('habitHub.encouragement.food'));if(saved)setEditor(null);return saved;}}/>}
 </div>;
}
