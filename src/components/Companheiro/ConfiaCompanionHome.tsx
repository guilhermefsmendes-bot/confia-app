import {memo,useEffect,useMemo,useState} from 'react';
import {Backpack,ShoppingBag,BrainCircuit,Utensils,Footprints,Moon,HeartPulse,Target,ChevronDown,Sparkles} from 'lucide-react';
import {useTranslation} from 'react-i18next';
import {Avatar} from '../Avatar';
import type {AvatarState} from '../../types';
import {getEquipped} from '../../storage/homeInventory';
import {getCompanionAccessories} from '../../data/homeItems';
import type {HomeDecisionInput} from '../../data/reactive/companionBrain/homeDecision';
import {CompanionVoice,type CompanionAction} from './CompanionVoice';
import {ConfiaDevice,isNativeAndroid} from '../../notifications/native';
import {getHabitSnapshot} from '../../data/habits/store';
import {collectCompanionData} from '../../data/companionData';
import {buildLifestyleSynergyCandidate} from '../../data/reactive/companionBrain/lifestyleSynergy';
import {LifestyleMirror} from '../Habits/LifestyleMirror';
interface Props{avatar:AvatarState;avatarCelebrating:boolean;avatarMemoryMessage:string;morningRating?:number;afternoonRating?:number;handlePetAvatar:()=>void;voiceInput:HomeDecisionInput;onCompanionAction:(target:CompanionAction)=>void;worldMood:'growing'|'settling'|'discovering'|'neutral';relationshipStage:string;relationshipObservationCount:number;}
const readAccessories=()=>{const equipped=getEquipped();return getCompanionAccessories().filter(x=>equipped.includes(x.id)).map(x=>x.id)};
function ConfiaCompanionHome({avatar,avatarCelebrating,avatarMemoryMessage,morningRating,afternoonRating,handlePetAvatar,voiceInput,onCompanionAction,worldMood,relationshipStage,relationshipObservationCount}:Props){
 const {t}=useTranslation();const [emotion,setEmotion]=useState('neutral');const [accessories,setAccessories]=useState(readAccessories);const [showWidgetSuggestion,setShowWidgetSuggestion]=useState(false);
 useEffect(()=>{const refresh=()=>setAccessories(readAccessories());const events=['confia:equipment-changed','storage','focus'];events.forEach(e=>window.addEventListener(e,refresh));return()=>events.forEach(e=>window.removeEventListener(e,refresh));},[]);
 useEffect(()=>{if(!isNativeAndroid())return;let cancelled=false;void ConfiaDevice.widgetInfo().then(({installed})=>{if(cancelled||installed)return;const key='confia_widget_suggestion_last_v1';const last=Number(localStorage.getItem(key)??0);const week=7*24*60*60*1000;if(!last||Date.now()-last>=week){setShowWidgetSuggestion(true);localStorage.setItem(key,String(Date.now()));}}).catch(()=>{});return()=>{cancelled=true;};},[]);
 const addWidget=()=>{void ConfiaDevice.pinWidget().then(()=>setShowWidgetSuggestion(false)).catch(()=>setShowWidgetSuggestion(false));};
 const reaction=emotion==='warm'||emotion==='concerned'?'supportive':emotion==='celebrating'||emotion==='encouraging'?'celebrating':emotion==='curious'?'curious':'neutral';
 const [showSynergy,setShowSynergy]=useState(false);const [analysisTick,setAnalysisTick]=useState(0);
 useEffect(()=>{const refresh=()=>setAnalysisTick(v=>v+1);const events=['confia:habit-write','confia:objective-completed','storage','focus'];events.forEach(e=>window.addEventListener(e,refresh));return()=>events.forEach(e=>window.removeEventListener(e,refresh));},[]);
 const records=getHabitSnapshot().records;
 const synergy=useMemo(()=>{const companionData=collectCompanionData();return buildLifestyleSynergyCandidate(records,companionData,new Date());},[analysisTick,voiceInput.ratings]);
 const synergyText=synergy?.translationKey?t(synergy.translationKey,synergy.translationValues):null;
 return <section aria-label={t('companion')} className="space-y-3">
  <div className="flex items-center justify-between gap-2"><div><h2 className="text-lg font-bold text-[#674D44]">{t('companion')}</h2><p className="text-xs text-[#76584D]">{t('level')} {avatar.level} · {t('companionAging.'+relationshipStage,{count:relationshipObservationCount})}</p></div><div className="flex">
   <button type="button" onClick={()=>onCompanionAction('inventory')} className="flex h-12 w-12 items-center justify-center" aria-label={t('inventory')}><Backpack size={18}/></button>
   <button type="button" onClick={()=>onCompanionAction('shop')} className="flex h-12 w-12 items-center justify-center" aria-label={t('shop')}><ShoppingBag size={18}/></button>
  </div></div>
  <div className="flex min-h-52 justify-center"><Avatar avatar={avatar} onPet={handlePetAvatar} levelUpTrigger={avatarCelebrating} moodRating={voiceInput.todayLogged?(afternoonRating??morningRating):undefined} memoryMessage={avatarMemoryMessage} companionWorldMood={worldMood} reactionState={reaction} equippedAccessoryIds={accessories}/></div>
  <CompanionVoice input={voiceInput} onAction={onCompanionAction} onEmotion={setEmotion}/>
  <div className="relative overflow-hidden rounded-[28px] border border-[#DCCFC8] bg-[linear-gradient(145deg,#fffdfa_0%,#f7f1ff_48%,#fff7ef_100%)] shadow-[0_14px_34px_rgba(91,66,56,.08)]">
   <div className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full bg-[#E8DFFF]/60 blur-2xl"/>
   <div className="pointer-events-none absolute -bottom-14 -left-8 h-28 w-28 rounded-full bg-[#F7DCCF]/50 blur-2xl"/>
   <button type="button" onClick={()=>setShowSynergy(v=>!v)} aria-expanded={showSynergy} className="relative flex min-h-20 w-full items-center gap-4 px-4 py-3 text-left">
    <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] border border-white/80 bg-white/75 shadow-sm">
     <BrainCircuit size={25} className="text-[#745A86]"/>
     <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-[#D6B77A] ring-2 ring-white"/>
     <span className="absolute -bottom-1 -left-1 h-2.5 w-2.5 rounded-full bg-[#B98C7A] ring-2 ring-white"/>
    </div>
    <div className="min-w-0 flex-1">
     <div className="flex items-center gap-2"><p className="text-[9px] font-black uppercase tracking-[.17em] text-[#866A94]">{t('companionSynergy.eyebrow')}</p><Sparkles size={12} className="text-[#B48C52]"/></div>
     <p className="mt-1 text-[15px] font-black text-[#4A394B]">{t('companionSynergy.title')}</p>
     <p className="mt-0.5 text-[10px] font-semibold text-[#806D65]">{t('companionSynergy.subtitle')}</p>
    </div>
    <ChevronDown size={21} className={`shrink-0 text-[#745A86] transition-transform duration-200 ${showSynergy?'rotate-180':''}`}/>
   </button>
   <div className="relative px-4 pb-4">
    <div className="flex items-center justify-center gap-2 pb-1 opacity-90">
     {[{icon:<Utensils size={13}/>,key:'food'},{icon:<Footprints size={13}/>,key:'movement'},{icon:<Moon size={13}/>,key:'sleep'},{icon:<HeartPulse size={13}/>,key:'mood'},{icon:<Target size={13}/>,key:'objectives'}].map((node,i)=><div key={node.key} className="flex items-center"><span className="flex h-8 w-8 items-center justify-center rounded-full border border-white bg-white/80 text-[#80658B] shadow-sm">{node.icon}</span>{i<4&&<span className="h-px w-3 bg-[#D7C9D6]"/>}</div>)}
    </div>
    {showSynergy&&<div className="mt-3 rounded-[22px] border border-white/80 bg-white/70 p-4 backdrop-blur-sm">
     <div className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EEE6F4] text-[#745A86]"><BrainCircuit size={16}/></span><p className="text-xs font-black text-[#59445F]">{t('companionSynergy.analysisTitle')}</p></div>
     <p className="mt-3 whitespace-pre-line text-sm font-medium leading-[1.65] text-[#674D44]">{synergyText??t('companionSynergy.waiting')}</p>
     {synergy&&<div className="mt-3 rounded-2xl border border-[#E8D8CF] bg-[#FFFDFB] px-3 py-2 text-[10px] font-semibold leading-4 text-[#806D65]">{t('companionSynergy.hypothesis')}</div>}
     <div className="mt-3 flex items-center justify-between gap-3 text-[9px] font-bold uppercase tracking-[.12em] text-[#9A7C70]"><span>{t('companionSynergy.sources')}</span><span>{t('companionSynergy.window')}</span></div>
     <div className="mt-4"><LifestyleMirror records={records} today={new Date().toISOString().slice(0,10)}/></div>
    </div>}
   </div>
  </div>
  {showWidgetSuggestion&&<div className="rounded-3xl border border-[#E9D9D1] bg-[#FFFCFA] p-4 text-center shadow-[0_10px_28px_rgba(91,66,56,.045)]">
   <p className="text-sm font-medium leading-relaxed text-[#674D44]">{t('companionWidgetPrompt.message')}</p>
   <button type="button" onClick={addWidget} className="mt-3 min-h-12 rounded-full border border-[#DCC1B4] bg-white px-5 py-2 text-sm font-semibold text-[#844530]">{t('companionWidgetPrompt.action')}</button>
  </div>}
 </section>;
}
export default memo(ConfiaCompanionHome);
