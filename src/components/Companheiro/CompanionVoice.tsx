import {useEffect,useRef,useState} from 'react';
import {useTranslation} from 'react-i18next';
import {useCompanionVoice} from './useCompanionVoice';
import type {HomeDecisionInput} from '../../data/reactive/companionBrain/homeDecision';
import type {CompanionBrainCandidate} from '../../data/reactive/companionBrain/companionBrainTypes';
import {emitCompanionBrainEvent} from '../../data/reactive/companionBrain/companionBrainEvents';
export type CompanionAction=NonNullable<CompanionBrainCandidate['action']>['target']|'inventory'|'shop'|'record';
export function CompanionVoice({input,onAction,onEmotion}:{input:HomeDecisionInput;onAction:(target:CompanionAction)=>void;onEmotion?:(emotion:string)=>void}){
 const {t,i18n}=useTranslation();const {decision,shown}=useCompanionVoice(input);const root=useRef<HTMLDivElement>(null);
 const [clickReaction,setClickReaction]=useState<{label:string;index:number}|null>(null);
 const candidate=decision?.candidate;
 const translated=candidate&&i18n.exists(candidate.translationKey)?t(candidate.translationKey,candidate.translationValues):null;
 useEffect(()=>{
  let timer:ReturnType<typeof setTimeout>|undefined;
  const onButton=(event:Event)=>{
   const detail=(event as CustomEvent<{label?:string}>).detail;
   if(!detail?.label)return;
   setClickReaction(previous=>({label:detail.label!,index:(previous?.index??-1)+1}));
   clearTimeout(timer);timer=setTimeout(()=>setClickReaction(null),7000);
  };
  window.addEventListener('confia:avatar-button-reaction',onButton);
  return()=>{clearTimeout(timer);window.removeEventListener('confia:avatar-button-reaction',onButton);};
 },[]);
 const clickTranslated=clickReaction?t('companionClick.reactions.'+((clickReaction.index)%4),{label:clickReaction.label}):null;
 useEffect(()=>{
  onEmotion?.(candidate?.emotion??'neutral');
  if(!decision||!translated||!root.current)return;
  const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)&&!document.hidden){shown(decision);observer.disconnect();}},{threshold:.5});
  observer.observe(root.current);return()=>observer.disconnect();
 },[decision,translated,onEmotion]);
 if(clickTranslated)return <div ref={root} data-testid="companion-voice" data-rule="button-reaction" data-mode="reaction" className="relative rounded-3xl border border-[#E9D9D1] bg-[#FFFCFA] p-4 text-left shadow-[0_8px_24px_rgba(91,66,56,.045)] before:absolute before:-top-2 before:left-1/2 before:h-4 before:w-4 before:-translate-x-1/2 before:rotate-45 before:border-l before:border-t before:border-[#E9D9D1] before:bg-[#FFFCFA]">
  <p className="relative text-[9px] font-black uppercase tracking-[.15em] text-[#A36A55]">{t('companionClick.eyebrow')}</p>
  <p className="relative mt-1.5 text-sm font-medium leading-relaxed text-[#674D44]">{clickTranslated}</p>
 </div>;
 if(!translated)return <p className="px-4 py-2 text-center text-xs text-[#76584D]">{t('companionDaily.quiet')}</p>;
 const mode=candidate?.metadata?.mode==='suggestion'?'suggestion':'insight';
 const intent=candidate?.intent ?? (mode==='suggestion'?'suggest':'explain');
 const confidence=candidate?.confidence;
 return <div ref={root} data-testid="companion-voice" data-rule={candidate!.id} data-mode={mode} className="relative rounded-3xl border border-[#E9D9D1] bg-[#FFFCFA] p-4 text-left shadow-[0_8px_24px_rgba(91,66,56,.045)] before:absolute before:-top-2 before:left-1/2 before:h-4 before:w-4 before:-translate-x-1/2 before:rotate-45 before:border-l before:border-t before:border-[#E9D9D1] before:bg-[#FFFCFA]">
  <p data-intent={intent} data-confidence={confidence ?? 'moderate'} className="relative text-[9px] font-black uppercase tracking-[.15em] text-[#A36A55]">{t(`companionDaily.mode.${mode}`)}</p>
  <p className="relative mt-1.5 text-sm font-medium leading-relaxed text-[#674D44]">{translated}</p>
  {candidate?.action&&<button type="button" onClick={()=>{emitCompanionBrainEvent('companion_action_clicked',{target:candidate.action!.target,candidateId:candidate.id,intent:candidate.intent});onAction(candidate.action!.target)}} className="mt-3 min-h-12 rounded-full border border-[#DCC1B4] px-5 py-2 text-sm font-semibold text-[#844530]">{t(candidate.action.labelKey)}</button>}
 </div>;
}
