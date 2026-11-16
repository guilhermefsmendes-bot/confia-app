import {memo,useEffect,useState} from 'react';
import {Backpack,ShoppingBag,Settings} from 'lucide-react';
import {useTranslation} from '../../i18n/useFeatureTranslation';
import {Avatar} from '../Avatar';
import type {AvatarState} from '../../types';
import {getEquipped} from '../../storage/homeInventory';
import {getCompanionAccessories} from '../../data/homeItems';
import {readCompanionPersonalContextConsent} from '../../data/reactive/companionContextConsent';
import type {HomeDecisionInput} from '../../data/reactive/companionBrain/homeDecision';
import {CompanionVoice,type CompanionAction} from './CompanionVoice';
interface Props{avatar:AvatarState;avatarCelebrating:boolean;avatarMemoryMessage:string;morningRating?:number;afternoonRating?:number;handlePetAvatar:()=>void;voiceInput:HomeDecisionInput;onCompanionAction:(target:CompanionAction)=>void;onOpenSettings:()=>void;worldMood:'growing'|'settling'|'discovering'|'neutral';relationshipStage:string;relationshipObservationCount:number;}
const readAccessories=()=>{const equipped=getEquipped();return getCompanionAccessories().filter(x=>equipped.includes(x.id)).map(x=>x.id)};

function ConfiaCompanionHome({avatar,avatarCelebrating,avatarMemoryMessage,morningRating,afternoonRating,handlePetAvatar,voiceInput,onCompanionAction,onOpenSettings,worldMood,relationshipStage,relationshipObservationCount}:Props){
 const {t}=useTranslation("companion");const [emotion,setEmotion]=useState('neutral');const [accessories,setAccessories]=useState(readAccessories);const personalContextEnabled=readCompanionPersonalContextConsent();
 useEffect(()=>{const refresh=()=>setAccessories(readAccessories());const events=['confia:equipment-changed','storage','focus'];events.forEach(e=>window.addEventListener(e,refresh));return()=>events.forEach(e=>window.removeEventListener(e,refresh));},[]);
 const reaction=emotion==='warm'||emotion==='concerned'?'supportive':emotion==='celebrating'||emotion==='encouraging'?'celebrating':emotion==='curious'?'curious':'neutral';
 return <section aria-label={t('companion')} className="space-y-3">
  <div className="flex items-center justify-between gap-2"><div><h2 className="text-lg font-bold text-[#674D44]">{t('companion')}</h2><p className="text-xs text-[#76584D]">{t('level')} {avatar.level}{personalContextEnabled ? " · " + t('companionAging.'+relationshipStage,{count:relationshipObservationCount}) : ""}</p></div><div className="flex">
   <button type="button" onClick={()=>onCompanionAction('inventory')} className="flex h-12 w-12 items-center justify-center" aria-label={t('inventory')}><Backpack size={18}/></button>
   <button type="button" onClick={()=>onCompanionAction('shop')} className="flex h-12 w-12 items-center justify-center" aria-label={t('shop')}><ShoppingBag size={18}/></button>
  </div></div>
  <div className="flex min-h-52 justify-center"><Avatar avatar={avatar} onPet={handlePetAvatar} levelUpTrigger={avatarCelebrating} moodRating={personalContextEnabled && voiceInput.todayLogged?(afternoonRating??morningRating):undefined} memoryMessage={personalContextEnabled?avatarMemoryMessage:""} companionWorldMood={personalContextEnabled?worldMood:"neutral"} reactionState={personalContextEnabled?reaction:"neutral"} equippedAccessoryIds={accessories}/></div>
  <div className="-mt-2 flex justify-center"><button type="button" onClick={onOpenSettings} className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--cf-muted)] transition-colors hover:bg-[#F4ECE7] hover:text-[#934A38]" aria-label={t('settings')} title={t('settings')}><Settings size={15} strokeWidth={1.8}/></button></div>

  <CompanionVoice input={personalContextEnabled ? {...voiceInput,allowPersonalContext:true} : {currentTab:voiceInput.currentTab,homeScreen:voiceInput.homeScreen,selectedDate:voiceInput.selectedDate,todayLogged:false,morningRating:0,afternoonRating:0,ratings:[],allowPersonalContext:false}} onAction={onCompanionAction} onEmotion={setEmotion}/>
 </section>;
}
export default memo(ConfiaCompanionHome);
