import {useEffect,useRef} from 'react';
import {useTranslation} from 'react-i18next';
import {useCompanionVoice} from './useCompanionVoice';
import type {HomeDecisionInput} from '../../data/reactive/companionBrain/homeDecision';
import type {CompanionBrainCandidate} from '../../data/reactive/companionBrain/companionBrainTypes';
export type CompanionAction=NonNullable<CompanionBrainCandidate['action']>['target']|'inventory'|'shop'|'record';
export function CompanionVoice({input,onAction,onEmotion}:{input:HomeDecisionInput;onAction:(target:CompanionAction)=>void;onEmotion?:(emotion:string)=>void}){
 const {t,i18n}=useTranslation();const {decision,shown}=useCompanionVoice(input);const root=useRef<HTMLDivElement>(null);
 const candidate=decision?.candidate;
 const translated=candidate&&i18n.exists(candidate.translationKey)?t(candidate.translationKey,candidate.translationValues):null;
 useEffect(()=>{
  onEmotion?.(candidate?.emotion??'neutral');
  if(!decision||!translated||!root.current)return;
  const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)&&!document.hidden){shown(decision);observer.disconnect();}},{threshold:.5});
  observer.observe(root.current);return()=>observer.disconnect();
 },[decision,translated,onEmotion]);
 if(!translated)return <p className="px-4 py-2 text-center text-xs text-[#76584D]">{t('companionDaily.quiet')}</p>;
 return <div ref={root} data-testid="companion-voice" data-rule={candidate!.id} className="rounded-3xl border border-[#E9D9D1] bg-[#FFFCFA] p-4 text-center">
  <p className="text-sm font-medium leading-relaxed text-[#674D44]">{translated}</p>
  {candidate?.action&&<button type="button" onClick={()=>onAction(candidate.action!.target)} className="mt-3 min-h-12 rounded-full border border-[#DCC1B4] px-5 py-2 text-sm font-semibold text-[#844530]">{t(candidate.action.labelKey)}</button>}
 </div>;
}
