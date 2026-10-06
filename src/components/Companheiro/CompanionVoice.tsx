import {useEffect,useRef,useState} from 'react';
import {useTranslation} from 'react-i18next';
import {useCompanionVoice} from './useCompanionVoice';
import type {HomeDecisionInput} from '../../data/reactive/companionBrain/homeDecision';
import type {CompanionBrainCandidate} from '../../data/reactive/companionBrain/companionBrainTypes';
import {emitCompanionBrainEvent} from '../../data/reactive/companionBrain/companionBrainEvents';
export type CompanionAction=NonNullable<CompanionBrainCandidate['action']>['target']|'inventory'|'shop'|'record';
export function CompanionVoice({input,onAction,onEmotion}:{input:HomeDecisionInput;onAction:(target:CompanionAction)=>void;onEmotion?:(emotion:string)=>void}){
 const {t,i18n}=useTranslation();const {decision,shown}=useCompanionVoice(input);const root=useRef<HTMLDivElement>(null);const [open,setOpen]=useState(true);
 const candidate=decision?.candidate;
 const translationKey=candidate?.translationKey;
 const fallbackKey=candidate?.metadata?.family?`companionDaily.${candidate.metadata.family}.0`:translationKey;
 const resolvedKey=translationKey&&i18n.exists(translationKey)?translationKey:(fallbackKey&&i18n.exists(fallbackKey)?fallbackKey:null);
 const translated=candidate&&resolvedKey?t(resolvedKey,candidate.translationValues):null;
 const isSynergy=candidate?.metadata?.family==='lifestyleSynergy';
 useEffect(()=>{
  onEmotion?.(candidate?.emotion??'neutral');
  if(!decision||!translated||!root.current)return;
  const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)&&!document.hidden){shown(decision);observer.disconnect();}},{threshold:.5});
  observer.observe(root.current);return()=>observer.disconnect();
 },[decision,translated,onEmotion]);
 if(!translated)return <p className="px-4 py-2 text-center text-xs text-[#76584D]">{t('companionDaily.quiet')}</p>;
 const mode=candidate?.metadata?.mode==='suggestion'?'suggestion':'insight';
 const intent=candidate?.intent ?? (mode==='suggestion'?'suggest':'explain');
 const confidence=candidate?.confidence;
 return <div ref={root} data-testid="companion-voice" data-rule={candidate!.id} data-mode={mode} className="relative rounded-[28px] border border-[#E8D8CF] bg-[linear-gradient(145deg,#fffdfa,#fff7f2)] text-left shadow-[0_10px_30px_rgba(91,66,56,.07)] before:absolute before:-top-2 before:left-1/2 before:h-4 before:w-4 before:-translate-x-1/2 before:rotate-45 before:border-l before:border-t before:border-[#E8D8CF] before:bg-[#fffdfa]">
  <button type="button" aria-expanded={open} onClick={()=>setOpen(v=>!v)} className="relative flex min-h-12 w-full items-center justify-between gap-3 px-4 py-3 text-left">
   <span className="flex min-w-0 items-center gap-2"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F3E3DA] text-sm">🧠</span><span className="truncate text-[10px] font-black uppercase tracking-[.13em] text-[#A36A55]">{isSynergy?t("companionSynergy.title"):t(`companionDaily.mode.${mode}`)}</span></span>
   <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#E5D2C7] bg-white text-[#8A5A48] transition-transform duration-200 ${open?'rotate-180':''}`} aria-hidden="true">⌄</span>
  </button>
  {open&&<div className="border-t border-[#EFE1D9] px-4 pb-4 pt-3">
   <p data-intent={intent} data-confidence={confidence ?? 'moderate'} className="sr-only">{t(`companionDaily.mode.${mode}`)}</p>
   <p className="whitespace-pre-line text-sm font-medium leading-[1.65] text-[#674D44]">{translated}</p>
   {isSynergy&&<div className="mt-3 rounded-2xl border border-[#E9D8CF] bg-white/75 px-3 py-2 text-[10px] font-semibold leading-4 text-[#806D65]">{t("companionSynergy.hypothesis")}</div>}
   {candidate?.action&&<button type="button" onClick={()=>{emitCompanionBrainEvent('companion_action_clicked',{target:candidate.action!.target,candidateId:candidate.id,intent:candidate.intent});onAction(candidate.action!.target)}} className="mt-3 min-h-12 rounded-full border border-[#DCC1B4] bg-white px-5 py-2 text-sm font-semibold text-[#844530]">{t(candidate.action.labelKey)}</button>}
  </div>}
 </div>;
}
