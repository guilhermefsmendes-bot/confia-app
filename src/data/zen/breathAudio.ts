import {BlowSignal} from './blowSignal';
export type BlowFrame=ReturnType<BlowSignal['sample']>;
export function startBlowDetector(onFrame:(frame:BlowFrame)=>void,onError:()=>void){
 let stopped=false,stream:MediaStream|undefined,context:AudioContext|undefined,source:MediaStreamAudioSourceNode|undefined,filter:BiquadFilterNode|undefined,analyser:AnalyserNode|undefined,raf=0;
 const ended: Array<{track:MediaStreamTrack;listener:()=>void}>=[];
 const stop=()=>{if(stopped)return;stopped=true;cancelAnimationFrame(raf);ended.forEach(({track,listener})=>track.removeEventListener('ended',listener));stream?.getTracks().forEach(track=>track.stop());source?.disconnect();filter?.disconnect();analyser?.disconnect();if(context&&context.state!=='closed')void context.close().catch(()=>{});};
 const ready=(async()=>{
  try{
   // Called only after the explicit consent button. No recording or network sink.
   context=new AudioContext();await context.resume();if(stopped)return;
   stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false},video:false});
   if(stopped){stream.getTracks().forEach(track=>track.stop());return;}
   source=context.createMediaStreamSource(stream);filter=context.createBiquadFilter();filter.type='highpass';filter.frequency.value=300;
   analyser=context.createAnalyser();analyser.fftSize=512;source.connect(filter);filter.connect(analyser);
   const buffer=new Float32Array(512),signal=new BlowSignal();let previous=performance.now();
   stream.getAudioTracks().forEach(track=>{const listener=()=>{if(!stopped){stop();onError();}};ended.push({track,listener});track.addEventListener('ended',listener,{once:true});});
   const tick=(now:number)=>{if(stopped)return;if(now-previous>=32){const dt=(now-previous)/1000;previous=now;analyser!.getFloatTimeDomainData(buffer);let sum=0;for(const value of buffer)sum+=value*value;onFrame(signal.sample(Math.sqrt(sum/buffer.length),dt));}if(!stopped)raf=requestAnimationFrame(tick);};
   raf=requestAnimationFrame(tick);
  }catch{if(!stopped){stop();onError();}}
 })();
 return {stop,ready};
}
