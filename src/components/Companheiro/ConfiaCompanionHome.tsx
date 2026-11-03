import {memo,useEffect,useState} from 'react';
import {Backpack,ShoppingBag} from 'lucide-react';
import {useTranslation} from '../../i18n/useFeatureTranslation';
import {Avatar} from '../Avatar';
import type {AvatarState} from '../../types';
import {getEquipped} from '../../storage/homeInventory';
import {getCompanionAccessories} from '../../data/homeItems';
import {readCompanionPersonalContextConsent,writeCompanionPersonalContextConsent} from '../../data/reactive/companionContextConsent';
import type {HomeDecisionInput} from '../../data/reactive/companionBrain/homeDecision';
import {CompanionVoice,type CompanionAction} from './CompanionVoice';
import {ConfiaDevice,isNativeAndroid} from '../../notifications/native';
interface Props{avatar:AvatarState;avatarCelebrating:boolean;avatarMemoryMessage:string;morningRating?:number;afternoonRating?:number;handlePetAvatar:()=>void;voiceInput:HomeDecisionInput;onCompanionAction:(target:CompanionAction)=>void;worldMood:'growing'|'settling'|'discovering'|'neutral';relationshipStage:string;relationshipObservationCount:number;}
const readAccessories=()=>{const equipped=getEquipped();return getCompanionAccessories().filter(x=>equipped.includes(x.id)).map(x=>x.id)};

function ConfiaCompanionHome({avatar,avatarCelebrating,avatarMemoryMessage,morningRating,afternoonRating,handlePetAvatar,voiceInput,onCompanionAction,worldMood,relationshipStage,relationshipObservationCount}:Props){
 const {t}=useTranslation("companion");const [emotion,setEmotion]=useState('neutral');const [accessories,setAccessories]=useState(readAccessories);const [showWidgetSuggestion,setShowWidgetSuggestion]=useState(false);const [personalContextEnabled,setPersonalContextEnabled]=useState(readCompanionPersonalContextConsent);
 const togglePersonalContext=()=>{const next=!personalContextEnabled;if(writeCompanionPersonalContextConsent(next))setPersonalContextEnabled(next);else setPersonalContextEnabled(false);};
 useEffect(()=>{const refresh=()=>setAccessories(readAccessories());const events=['confia:equipment-changed','storage','focus'];events.forEach(e=>window.addEventListener(e,refresh));return()=>events.forEach(e=>window.removeEventListener(e,refresh));},[]);
 useEffect(()=>{if(!isNativeAndroid())return;let cancelled=false;void ConfiaDevice.widgetInfo().then(({installed})=>{if(cancelled||installed)return;const key='confia_widget_suggestion_last_v1';const last=Number(localStorage.getItem(key)??0);const week=7*24*60*60*1000;if(!last||Date.now()-last>=week){setShowWidgetSuggestion(true);localStorage.setItem(key,String(Date.now()));}}).catch(()=>{});return()=>{cancelled=true;};},[]);
 const addWidget=()=>{void ConfiaDevice.pinWidget().then(()=>setShowWidgetSuggestion(false)).catch(()=>setShowWidgetSuggestion(false));};
 const reaction=emotion==='warm'||emotion==='concerned'?'supportive':emotion==='celebrating'||emotion==='encouraging'?'celebrating':emotion==='curious'?'curious':'neutral';
 return <section aria-label={t('companion')} className="space-y-3">
  <div className="flex items-center justify-between gap-2"><div><h2 className="text-lg font-bold text-[#674D44]">{t('companion')}</h2><p className="text-xs text-[#76584D]">{t('level')} {avatar.level}{personalContextEnabled ? " · " + t('companionAging.'+relationshipStage,{count:relationshipObservationCount}) : ""}</p></div><div className="flex">
   <button type="button" onClick={()=>onCompanionAction('inventory')} className="flex h-12 w-12 items-center justify-center" aria-label={t('inventory')}><Backpack size={18}/></button>
   <button type="button" onClick={()=>onCompanionAction('shop')} className="flex h-12 w-12 items-center justify-center" aria-label={t('shop')}><ShoppingBag size={18}/></button>
  </div></div>
  <div className="flex min-h-52 justify-center"><Avatar avatar={avatar} onPet={handlePetAvatar} levelUpTrigger={avatarCelebrating} moodRating={personalContextEnabled && voiceInput.todayLogged?(afternoonRating??morningRating):undefined} memoryMessage={personalContextEnabled?avatarMemoryMessage:""} companionWorldMood={personalContextEnabled?worldMood:"neutral"} reactionState={personalContextEnabled?reaction:"neutral"} equippedAccessoryIds={accessories}/></div>
  <section className="rounded-2xl border border-[#E8DDD7] bg-[#FFFCFA] p-3" aria-label={t("companionContext.title")}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-xs font-black text-[#674D44]">{t("companionContext.title")}</p><p className="mt-1 text-[10px] leading-4 text-[#806D65]">{t("companionContext.description")}</p></div><button type="button" aria-pressed={personalContextEnabled} onClick={togglePersonalContext} className={"min-h-11 shrink-0 whitespace-nowrap rounded-full border px-3 text-[10px] font-bold " + (personalContextEnabled?"border-[#B9D2B5] bg-[#EDF5EA] text-[#496D4D]":"border-[#E8DDD7] bg-white text-[#806D65]")}>{t(personalContextEnabled?"companionContext.enabled":"companionContext.disabled")}</button></div></section>
  <CompanionVoice input={personalContextEnabled ? {...voiceInput,allowPersonalContext:true} : {currentTab:voiceInput.currentTab,homeScreen:voiceInput.homeScreen,selectedDate:voiceInput.selectedDate,todayLogged:false,morningRating:0,afternoonRating:0,ratings:[],allowPersonalContext:false}} onAction={onCompanionAction} onEmotion={setEmotion}/>
  {showWidgetSuggestion&&<div className="rounded-3xl border border-[#E9D9D1] bg-[#FFFCFA] p-4 text-center shadow-[0_10px_28px_rgba(91,66,56,.045)]">
   <p className="text-sm font-medium leading-relaxed text-[#674D44]">{t('companionWidgetPrompt.message')}</p>
   <button type="button" onClick={addWidget} className="mt-3 min-h-12 rounded-full border border-[#DCC1B4] bg-white px-5 py-2 text-sm font-semibold text-[#844530]">{t('companionWidgetPrompt.action')}</button>
  </div>}
 </section>;
}
export default memo(ConfiaCompanionHome);
