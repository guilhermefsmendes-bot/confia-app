import {useEffect,useRef,useState} from 'react';
import {useTranslation} from 'react-i18next';
import {App} from '@capacitor/app';
import {startBlowDetector} from '../../data/zen/breathAudio';
import {revealProgress} from '../../data/zen/blowSignal';
import {saveReflection,reflectionSummary,type Reflection,type ReleaseMethod} from '../../data/zen/reflection';
import {recordPersonalAnalytics} from '../../data/personal/personalAnalytics';
import ZenSandCanvas from './ZenSandCanvas';
import ZenRevealContent from './ZenRevealContent';
import {buttonClass,primaryClass} from '../Habits/shared';
type Stage='intro'|'requestingPermission'|'ready'|'blowing'|'revealing'|'settling'|'reflection'|'complete';
export default function ZenReleaseExperience({durationSeconds,onDone}:{durationSeconds:number;onDone:()=>void}){
 const {t}=useTranslation();const [stage,setStage]=useState<Stage>('intro'),[method,setMethod]=useState<ReleaseMethod>('touch'),[progress,setProgress]=useState(0),[irregular,setIrregular]=useState(false),[error,setError]=useState(false),[summary,setSummary]=useState({total:0,calmer:0});
 const [variant]=useState(()=>Math.floor(Math.random()*8));const amount=useRef(0),mode=useRef<ReleaseMethod>('touch'),recordedMethod=useRef<ReleaseMethod>('touch'),audio=useRef<ReturnType<typeof startBlowDetector>|null>(null),timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined),alive=useRef(true),saved=useRef(false),session=useRef('zen_'+Date.now()+'_'+Math.random().toString(36).slice(2)),lastUI=useRef(0),dirtyEnergy=useRef(0),began=useRef(false),heading=useRef<HTMLHeadingElement>(null);
 const stop=()=>{audio.current?.stop();audio.current=null;clearTimeout(timer.current);};
 const reflect=()=>{stop();setStage('reflection');};
 const energy=(value:number,unstable=false)=>{
  if(amount.current>=1||value<=0)return;
  amount.current=revealProgress(amount.current,value);setProgress(amount.current);setIrregular(unstable);clearTimeout(timer.current);
  if(amount.current>=1){stop();setStage('revealing');timer.current=setTimeout(()=>{if(alive.current)setStage('reflection');},1800);}
  else{setStage('blowing');timer.current=setTimeout(()=>{if(alive.current){setIrregular(false);setStage('settling');}},1500);}
 };
 const touch=()=>{stop();dirtyEnergy.current=0;mode.current='touch';recordedMethod.current='touch';setMethod('touch');setStage('ready');recordPersonalAnalytics('zen_experience_touch_mode');};
 const microphone=()=>{
  stop();setError(false);setStage('requestingPermission');mode.current='microphone';recordedMethod.current='microphone';setMethod('microphone');dirtyEnergy.current=0;
  recordPersonalAnalytics('zen_experience_microphone_mode');
  audio.current=startBlowDetector(frame=>{if(!alive.current)return;dirtyEnergy.current+=frame.energy;const now=performance.now();if(now-lastUI.current<100)return;lastUI.current=now;
   if(frame.calibrating){setStage('requestingPermission');return;}if(dirtyEnergy.current>0){energy(dirtyEnergy.current,frame.blowStability<.55);dirtyEnergy.current=0;}else setStage(old=>old==='requestingPermission'?'ready':old);
  },()=>{if(alive.current){touch();setError(true);}});
 };
 useEffect(()=>{
  alive.current=true;heading.current?.focus();if(!began.current){began.current=true;recordPersonalAnalytics('zen_experience_started');}
  const suspend=()=>{stop();if(alive.current){setIrregular(false);setStage(old=>['intro','reflection','complete'].includes(old)?old:'ready');mode.current='touch';setMethod('touch');}};
  const visibility=()=>{if(document.hidden)suspend();};const pagehide=()=>suspend();document.addEventListener('visibilitychange',visibility);window.addEventListener('pagehide',pagehide);
  const listener=App.addListener('appStateChange',({isActive})=>{if(!isActive)suspend();});
  return()=>{alive.current=false;stop();document.removeEventListener('visibilitychange',visibility);window.removeEventListener('pagehide',pagehide);void listener.then(handle=>handle.remove());};
 },[]);
 const finish=(response:Reflection)=>{if(saved.current)return;saved.current=true;saveReflection(session.current,response,recordedMethod.current,durationSeconds);setSummary(reflectionSummary());recordPersonalAnalytics('zen_experience_completed');setStage('complete');};
 return <section className="mx-auto w-full max-w-md space-y-5 px-2 py-6 text-[#43352b] motion-safe:animate-[zen-enter_.5s_ease-out]" aria-labelledby="zen-title" data-zen-stage={stage}>
  <style>{'@keyframes zen-enter{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}'}</style>
  <div className="text-center"><p className="text-xs font-semibold tracking-widest text-[#7b614d]">{t('zen.eyebrow')}</p><h2 id="zen-title" ref={heading} tabIndex={-1} className="mt-2 text-3xl font-semibold outline-none">{t('zen.title')}</h2><p className="mt-3 text-sm leading-6">{t('zen.invitation')}</p></div>
  {stage==='intro'?<div className="space-y-4 rounded-3xl bg-[#f6efdf] p-6"><h3 className="text-lg font-semibold">{t('zen.consentTitle')}</h3><p className="text-sm leading-6">{t('zen.privacy')}</p><button className={primaryClass+' w-full'} onClick={microphone}>{t('zen.allow')}</button><button className={buttonClass+' w-full'} onClick={touch}>{t('zen.noMic')}</button></div>:stage==='reflection'?<div className="space-y-4 rounded-3xl bg-[#f6efdf] p-6"><h3 className="text-center text-xl font-semibold">{t('zen.question')}</h3>{(['calmer','same','agitated'] as const).map(response=><button key={response} className={buttonClass+' w-full'} onClick={()=>finish(response)}>{t('zen.responses.'+response)}</button>)}</div>:stage==='complete'?<div className="space-y-4 rounded-3xl bg-[#edf3e8] p-6 text-center"><p className="text-lg font-semibold">{t('zen.thanks')}</p>{summary.total>=3&&<p className="text-sm leading-6">{t('zen.pattern',summary)}</p>}<button className={primaryClass+' w-full'} onClick={onDone}>{t('zen.done')}</button></div>:<>
   <div className="relative aspect-square w-full overflow-hidden rounded-[2rem] border border-[#d5c3a6] shadow-sm" data-testid="zen-garden" data-progress={progress.toFixed(3)}>
    <div aria-hidden={progress<.98}><ZenRevealContent message={t('zen.messages.'+variant)} variant={variant}/></div>
    <ZenSandCanvas progress={progress} irregular={irregular} label={t('zen.canvasLabel')} onEnergy={value=>{if(mode.current!=='touch')touch();energy(value);}}/>
   </div>
   <p className="text-center text-sm leading-6" role="status">{t(stage==='requestingPermission'?'zen.calibrating':progress>=1?'zen.pause':method==='microphone'?'zen.blow':'zen.touch')}</p>
   {error&&<p role="alert" className="text-sm leading-6">{t('zen.error')}</p>}
   <div className="flex flex-wrap justify-center gap-2">{progress<1&&<button className={buttonClass} onClick={()=>{if(mode.current!=='touch')touch();energy(.14);}}>{t('zen.release')}</button>}{method==='microphone'?<button className={buttonClass} onClick={touch}>{t('zen.noMic')}</button>:progress<1&&<button className={buttonClass} onClick={microphone}>{t('zen.useMic')}</button>}</div>
   <button className={primaryClass+' w-full'} onClick={reflect}>{t('zen.reflect')}</button>
  </>}
  {stage!=='complete'&&<button className={buttonClass+' mx-auto block'} onClick={()=>{stop();onDone();}}>{t('zen.leave')}</button>}
 </section>;
}
