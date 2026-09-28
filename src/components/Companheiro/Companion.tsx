import {memo} from 'react';
import {useTranslation} from 'react-i18next';
import {CompanionVoice,type CompanionAction} from './CompanionVoice';
import type {HomeDecisionInput} from '../../data/reactive/companionBrain/homeDecision';
function Companion({input,onAction}:{input:HomeDecisionInput;onAction:(target:CompanionAction)=>void}){
 const {t}=useTranslation();return <section className="space-y-4 pb-6"><h2 className="text-xl font-bold">{t('companionTitle')}</h2><p className="text-sm text-[#76584D]">{t('companionDaily.description')}</p><CompanionVoice input={input} onAction={onAction}/><div className="grid gap-2 sm:grid-cols-2">{(['progress','habits','breathe','patterns'] as const).map(target=><button key={target} type="button" className="min-h-12 rounded-2xl border border-[#E8DDD7] bg-white px-4 py-3 text-left text-sm" onClick={()=>onAction(target)}>{t('companionDaily.actions.'+target)} →</button>)}</div></section>;
}
export default memo(Companion);
