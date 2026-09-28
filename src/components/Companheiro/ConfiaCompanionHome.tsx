import {memo,useEffect,useState} from 'react';
import {Backpack,ShoppingBag} from 'lucide-react';
import {useTranslation} from 'react-i18next';
import {Avatar} from '../Avatar';
import type {AvatarState} from '../../types';
import {getEquipped} from '../../storage/homeInventory';
import {getCompanionAccessories} from '../../data/homeItems';
import type {HomeDecisionInput} from '../../data/reactive/companionBrain/homeDecision';
import {CompanionVoice,type CompanionAction} from './CompanionVoice';
interface Props{avatar:AvatarState;avatarCelebrating:boolean;avatarMemoryMessage:string;morningRating?:number;afternoonRating?:number;handlePetAvatar:()=>void;voiceInput:HomeDecisionInput;onCompanionAction:(target:CompanionAction)=>void;worldMood:'growing'|'settling'|'discovering'|'neutral';relationshipStage:string;relationshipObservationCount:number;}
const readAccessories=()=>{const equipped=getEquipped();return getCompanionAccessories().filter(x=>equipped.includes(x.id)).map(x=>x.id)};
function ConfiaCompanionHome({avatar,avatarCelebrating,avatarMemoryMessage,morningRating,afternoonRating,handlePetAvatar,voiceInput,onCompanionAction,worldMood,relationshipStage,relationshipObservationCount}:Props){
 const {t}=useTranslation();const [emotion,setEmotion]=useState('neutral');const [accessories,setAccessories]=useState(readAccessories);
 useEffect(()=>{const refresh=()=>setAccessories(readAccessories());const events=['confia:equipment-changed','storage','focus'];events.forEach(e=>window.addEventListener(e,refresh));return()=>events.forEach(e=>window.removeEventListener(e,refresh));},[]);
 const reaction=emotion==='warm'||emotion==='concerned'?'supportive':emotion==='celebrating'||emotion==='encouraging'?'celebrating':emotion==='curious'?'curious':'neutral';
 return <section aria-label={t('companion')} className="space-y-3">
  <div className="flex items-center justify-between gap-2"><div><h2 className="text-lg font-bold text-[#674D44]">{t('companion')}</h2><p className="text-xs text-[#76584D]">{t('level')} {avatar.level} · {t('companionAging.'+relationshipStage,{count:relationshipObservationCount})}</p></div><div className="flex">
   <button type="button" onClick={()=>onCompanionAction('inventory')} className="flex h-12 w-12 items-center justify-center" aria-label={t('inventory')}><Backpack size={18}/></button>
   <button type="button" onClick={()=>onCompanionAction('shop')} className="flex h-12 w-12 items-center justify-center" aria-label={t('shop')}><ShoppingBag size={18}/></button>
  </div></div>
  <div className="flex min-h-52 justify-center"><Avatar avatar={avatar} onPet={handlePetAvatar} levelUpTrigger={avatarCelebrating} moodRating={voiceInput.todayLogged?(afternoonRating??morningRating):undefined} memoryMessage={avatarMemoryMessage} companionWorldMood={worldMood} reactionState={reaction} equippedAccessoryIds={accessories}/></div>
  <CompanionVoice input={voiceInput} onAction={onCompanionAction} onEmotion={setEmotion}/>
 </section>;
}
export default memo(ConfiaCompanionHome);
