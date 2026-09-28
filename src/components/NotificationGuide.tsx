import {useEffect,useRef} from 'react';
import {useTranslation} from 'react-i18next';
import type {NoticePermissionInfo} from '../notifications/native';
import {permissionStatus,type NoticeKind} from '../notifications/permission';
import {buttonClass,primaryClass} from './Habits/shared';
export default function NotificationGuide({kind,native,info,enabled,onClose,onEnable,onSettings}:{kind:NoticeKind;native:boolean;info:NoticePermissionInfo|null;enabled:boolean;onClose:()=>void;onEnable:()=>void;onSettings:()=>void}){
 const {t}=useTranslation();const ref=useRef<HTMLDialogElement>(null);const status=permissionStatus(info,kind),future=kind==='milestones',ready=status==='granted'&&enabled&&!future;
 useEffect(()=>{const dialog=ref.current;dialog?.showModal();return()=>dialog?.close();},[]);
 return <dialog ref={ref} onCancel={onClose} onClick={e=>{if(e.target===e.currentTarget)onClose();}} className="fixed inset-x-0 bottom-0 top-auto m-0 mx-auto max-h-[85dvh] w-full max-w-md overflow-auto rounded-t-3xl bg-[#fffaf3] p-6 text-[#43352b] backdrop:bg-black/35 sm:bottom-auto sm:top-[12vh] sm:rounded-3xl" aria-labelledby="notice-guide-title">
 <div className="flex items-start justify-between gap-3"><h3 id="notice-guide-title" className="text-xl font-semibold">{t('notifications.'+kind)}</h3><button className={buttonClass+' shrink-0'} onClick={onClose}>{t('notifications.close')}</button></div>
 <p className="mt-4 text-sm leading-6">{t('noticeHelp.description.'+kind)}</p>
 {!native?<p className="mt-4 rounded-2xl bg-white p-4 text-sm leading-6">{t('notifications.androidOnly')}</p>:<>
 <div className="mt-4 rounded-2xl bg-white p-4" role="status"><p className="text-xs font-semibold">{t('noticeHelp.state')}</p><p className="mt-2 font-semibold"><span aria-hidden="true">{status==='granted'?'✓ ':status==='denied'?'! ':'◦ '}</span><span>{t('noticeHelp.status.'+status)}</span></p>{!future&&<p className="mt-2 text-sm leading-6">{t(ready?'noticeHelp.ready':status==='denied'&&enabled?'noticeHelp.mismatch':status==='denied'?'noticeHelp.blocked':!enabled?'noticeHelp.preferenceOff':'noticeHelp.unknownHelp')}</p>}</div>
 {future?<p className="mt-4 text-sm leading-6">{t('notifications.future')}</p>:<>
 {!ready&&<><h4 className="mt-5 font-semibold">{t('noticeHelp.how')}</h4><ol className="mt-3 list-decimal space-y-3 pl-5 text-sm leading-6">{[0,1,2,3].map(index=><li key={index}>{t('noticeHelp.steps.'+kind+'.'+index)}</li>)}</ol></>}
 {(status==='notRequested'||status==='granted'&&!enabled)&&<button className={primaryClass+' mt-5 w-full'} onClick={onEnable}>{t('noticeHelp.enable')}</button>}
 <button className={(status==='denied'?primaryClass:buttonClass)+' mt-3 w-full'} onClick={onSettings}>{t(status==='denied'&&enabled?'noticeHelp.fix':'noticeHelp.open')}</button>
 {kind==='reminder'&&<p className="mt-3 text-xs leading-5">{t('noticeHelp.battery')}</p>}
 <p className="mt-3 text-xs leading-5">{t('noticeHelp.menus')}</p>
 </>}
 </>}
 {kind==='community'&&<div className="mt-5 border-t border-[#dacdbc] pt-4"><h4 className="text-sm font-semibold">{t('noticeHelp.privacyTitle')}</h4><p className="mt-1 text-xs leading-5">{t('noticeHelp.privacy')}</p></div>}
 </dialog>;
}
