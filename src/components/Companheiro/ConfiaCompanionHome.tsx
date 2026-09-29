import {memo,useEffect,useState} from 'react';
import {Backpack,ShoppingBag} from 'lucide-react';
import {useTranslation} from 'react-i18next';
import {Avatar} from '../Avatar';
import type {AvatarState} from '../../types';
import {getEquipped} from '../../storage/homeInventory';
import {getCompanionAccessories} from '../../data/homeItems';
import type {HomeDecisionInput} from '../../data/reactive/companionBrain/homeDecision';
import {CompanionVoice,type CompanionAction} from './CompanionVoice';
import {ConfiaDevice,isNativeAndroid} from '../../notifications/native';
interface Props{avatar:AvatarState;avatarCelebrating:boolean;avatarMemoryMessage:string;morningRating?:number;afternoonRating?:number;handlePetAvatar:()=>void;voiceInput:HomeDecisionInput;onCompanionAction:(target:CompanionAction)=>void;worldMood:'growing'|'settling'|'discovering'|'neutral';relationshipStage:string;relationshipObservationCount:number;}
const readAccessories=()=>{const equipped=getEquipped();return getCompanionAccessories().filter(x=>equipped.includes(x.id)).map(x=>x.id)};
function ConfiaCompanionHome({avatar,avatarCelebrating,avatarMemoryMessage,morningRating,afternoonRating,handlePetAvatar,voiceInput,onCompanionAction,worldMood,relationshipStage,relationshipObservationCount}:Props){
 const {t}=useTranslation();const [emotion,setEmotion]=useState('neutral');const [accessories,setAccessories]=useState(readAccessories);const [showWidgetSuggestion,setShowWidgetSuggestion]=useState(false);
 useEffect(()=>{const refresh=()=>setAccessories(readAccessories());const events=['confia:equipment-changed','storage','focus'];events.forEach(e=>window.addEventListener(e,refresh));return()=>events.forEach(e=>window.removeEventListener(e,refresh));},[]);
 useEffect(()=>{if(!isNativeAndroid())return;let cancelled=false;void ConfiaDevice.widgetInfo().then(({installed})=>{if(cancelled||installed)return;const key='confia_widget_suggestion_last_v1';const last=Number(localStorage.getItem(key)??0);const week=7*24*60*60*1000;if(!last||Date.now()-last>=week){setShowWidgetSuggestion(true);localStorage.setItem(key,String(Date.now()));}}).catch(()=>{});return()=>{cancelled=true;};},[]);
 const addWidget=()=>{void ConfiaDevice.pinWidget().then(()=>setShowWidgetSuggestion(false)).catch(()=>setShowWidgetSuggestion(false));};
 const reaction=emotion==='warm'||emotion==='concerned'?'supportive':emotion==='celebrating'||emotion==='encouraging'?'celebrating':emotion==='curious'?'curious':'neutral';
 const evolutionProgress=Math.max(0,Math.min(100,avatar.maxXp>0?(avatar.xp/avatar.maxXp)*100:0));
 const visualStage=avatar.level===1?1:avatar.level<=3?2:avatar.level<=5?3:avatar.level<=8?4:5;
 const nextFormLevel=avatar.level<2?2:avatar.level<4?4:avatar.level<6?6:avatar.level<9?9:null;
 return <section aria-label={t('companion')} className="space-y-3">
  <div className="flex items-center justify-between gap-2"><div><h2 className="text-lg font-bold text-[#674D44]">{t('companion')}</h2><p className="text-xs text-[#76584D]">{t('level')} {avatar.level} · {t('companionAging.'+relationshipStage,{count:relationshipObservationCount})}</p></div><div className="flex">
   <button type="button" onClick={()=>onCompanionAction('inventory')} className="flex h-12 w-12 items-center justify-center" aria-label={t('inventory')}><Backpack size={18}/></button>
   <button type="button" onClick={()=>onCompanionAction('shop')} className="flex h-12 w-12 items-center justify-center" aria-label={t('shop')}><ShoppingBag size={18}/></button>
  </div></div>
  <div className="flex min-h-52 justify-center"><Avatar avatar={avatar} onPet={handlePetAvatar} levelUpTrigger={avatarCelebrating} moodRating={voiceInput.todayLogged?(afternoonRating??morningRating):undefined} memoryMessage={avatarMemoryMessage} companionWorldMood={worldMood} reactionState={reaction} equippedAccessoryIds={accessories}/></div>
  <div className="rounded-[24px] border border-[#E9D9D1] bg-gradient-to-br from-white to-[#FFF7F2] p-4 shadow-[0_10px_28px_rgba(91,66,56,.055)]">
   <div className="flex items-center justify-between gap-3">
    <div><p className="text-[9px] font-black uppercase tracking-[.16em] text-[#A36A55]">{t('companionEvolutionPanel.eyebrow')}</p><p className="mt-1 text-sm font-black text-[#4A352F]">{t('stage'+visualStage+'Name')}</p></div>
    <span className="rounded-full border border-[#E8D5CA] bg-white px-2.5 py-1 text-[10px] font-black text-[#8A5A48]">{avatar.xp}/{avatar.maxXp} XP</span>
   </div>
   <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#EEE5DF]" role="progressbar" aria-label={t('companionEvolutionPanel.progressAria')} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(evolutionProgress)}>
    <div className="h-full rounded-full bg-gradient-to-r from-[#C98266] to-[#8A5A48] transition-[width] duration-500" style={{width:evolutionProgress+'%'}}/>
   </div>
   <p className="mt-2 text-[10px] font-semibold leading-4 text-[#806D65]">{nextFormLevel?t('companionEvolutionPanel.nextForm',{level:nextFormLevel}):t('companionEvolutionPanel.finalForm')}</p>
  </div>
  <CompanionVoice input={voiceInput} onAction={onCompanionAction} onEmotion={setEmotion}/>
  {showWidgetSuggestion&&<div className="rounded-3xl border border-[#E9D9D1] bg-[#FFFCFA] p-4 text-center shadow-[0_10px_28px_rgba(91,66,56,.045)]">
   <p className="text-sm font-medium leading-relaxed text-[#674D44]">{t('companionWidgetPrompt.message')}</p>
   <button type="button" onClick={addWidget} className="mt-3 min-h-12 rounded-full border border-[#DCC1B4] bg-white px-5 py-2 text-sm font-semibold text-[#844530]">{t('companionWidgetPrompt.action')}</button>
  </div>}
 </section>;
}
export default memo(ConfiaCompanionHome);
