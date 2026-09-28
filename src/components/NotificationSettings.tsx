import NotificationGuide from './NotificationGuide';
import {useNoticePermission} from '../notifications/useNoticePermission';
import {permissionStatus,type NoticeKind} from '../notifications/permission';
import {useState,useSyncExternalStore} from 'react';
import {useTranslation} from 'react-i18next';
import {allowNotices,updateNoticePreferences,getNoticeState,subscribeNotices,noticeRevision,syncNoticePreferences} from '../notifications/service';
import {ConfiaDevice} from '../notifications/native';
import {buttonClass,inputClass,primaryClass} from './Habits/shared';
export default function NotificationSettings(){
 const {t}=useTranslation();useSyncExternalStore(subscribeNotices,noticeRevision,noticeRevision);
 const {info,refresh}=useNoticePermission();const [guide,setGuide]=useState<NoticeKind|null>(null);
 const {preferences:p,native,syncError}=getNoticeState();const [asking,setAsking]=useState<'community'|'reminder'|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
 async function run(fn:()=>Promise<unknown>){setBusy(true);setError('');try{await fn();}catch{setError(t('notifications.error'));}finally{setBusy(false);void refresh();}}
 return <section className="space-y-4 rounded-3xl border border-[#D9C6B8] bg-white p-5" aria-labelledby="notification-settings-title"><h3 id="notification-settings-title" className="text-lg font-black">{t('notifications.title')}</h3>{!native&&<p className="text-sm leading-6">{t('notifications.androidOnly')}</p>}
 {(['community','reminder'] as const).map(kind=><div key={kind}><div className="flex min-h-12 items-center gap-2"><label htmlFor={'notice-'+kind} className="flex-1 text-sm font-bold">{t('notifications.'+kind)}</label><button type="button" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-[#765b48]" aria-label={t('noticeHelp.infoLabel',{name:t('notifications.'+kind)})} onClick={()=>{void refresh();setGuide(kind);}}><span aria-hidden="true" className="flex h-5 w-5 items-center justify-center rounded-full border text-xs font-bold">i</span></button><input id={'notice-'+kind} type="checkbox" role="switch" checked={p[kind]} disabled={!native||busy} onChange={e=>e.target.checked?setAsking(kind):void run(()=>updateNoticePreferences({[kind]:false}))}/></div>{native&&p[kind]&&permissionStatus(info,kind)==='denied'&&<button className="min-h-12 text-left text-xs leading-5 underline" onClick={()=>setGuide(kind)}>{t('noticeHelp.mismatch')}</button>}</div>)}
 <label className="block text-sm font-bold">{t('notifications.time')}<input type="time" className={inputClass} value={p.time} disabled={!native||busy} onChange={e=>void run(()=>updateNoticePreferences({time:e.target.value}))}/></label>
 <p className="text-xs leading-5">{t('notifications.timingHelp')}</p>
 <div className="text-sm"><div className="flex items-center justify-between"><p className="font-bold">{t('notifications.milestones')}</p><button type="button" className="h-12 w-12 rounded-full" aria-label={t('noticeHelp.infoLabel',{name:t('notifications.milestones')})} onClick={()=>setGuide('milestones')}><span aria-hidden="true">ⓘ</span></button></div><p className="mt-1 text-xs">{t('notifications.future')}</p></div>
 {asking&&<div className="space-y-3 rounded-2xl bg-[#F4F7EE] p-4" role="group" aria-label={t('notifications.permissionTitle')}><p className="text-sm leading-6">{t('notifications.explain.'+asking)}</p><button type="button" className={primaryClass} disabled={busy} onClick={()=>void run(async()=>{if(!await allowNotices(asking))setError(t('notifications.denied'));setAsking(null);})}>{t('notifications.allow')}</button><button type="button" className={buttonClass+' ml-2'} onClick={()=>setAsking(null)}>{t('notifications.later')}</button></div>}
 {error&&<p role="alert" className="text-sm">{error}</p>}{syncError&&<div><p role="status" className="text-sm">{t('notifications.syncPending')}</p><button className={buttonClass+' mt-2'} onClick={()=>void run(syncNoticePreferences)}>{t('notifications.retry')}</button></div>}
 {native&&<><button className={buttonClass+' w-full'} onClick={()=>void run(()=>ConfiaDevice.openNoticeSettings())}>{t('notifications.systemSettings')}</button><button className={buttonClass+' w-full'} onClick={()=>void run(async()=>{const result=await ConfiaDevice.pinWidget();if(!result.supported)setError(t('notifications.widgetManual'));})}>{t('notifications.addWidget')}</button></>}
 {guide&&<NotificationGuide kind={guide} native={native} info={info} enabled={p[guide]} onClose={()=>setGuide(null)} onEnable={()=>{const kind=guide;setGuide(null);if(kind!=='milestones')setAsking(kind);}} onSettings={()=>void run(()=>ConfiaDevice.openNoticeSettings())}/>}
 </section>;
}
