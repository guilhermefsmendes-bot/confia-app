// Transient signal characteristics only; never a clinical or emotional score.
export class BlowSignal {
 private baseline=.012; private smooth=0; private previous=0; private elapsed=0; private active=false; private duration=0;
 sample(rms:number,dt:number){
  dt=Math.max(0,Math.min(.1,dt));this.elapsed+=dt;
  this.smooth+=(Math.max(0,rms)-this.smooth)*.3;
  const calibrating=this.elapsed<.7;
  if(calibrating)this.baseline+=(rms-this.baseline)*.12;
  const threshold=Math.max(.018,this.baseline*2.2+.006);
  this.active=!calibrating&&this.smooth>threshold*(this.active?.72:1);
  if(!this.active)this.baseline+=(Math.min(rms,threshold)-this.baseline)*.008;
  this.duration=this.active?this.duration+dt:0;
  const blowIntensity=this.active?Math.min(1,(this.smooth-threshold*.65)/Math.max(.08,threshold*2)):0;
  const blowStability=Math.max(0,1-Math.abs(this.smooth-this.previous)/Math.max(.025,this.smooth));this.previous=this.smooth;
  return {blowIntensity,blowDuration:this.duration,blowStability,calibrating,energy:this.duration>.12?blowIntensity*dt*.32:0};
 }
}
export function revealProgress(previous:number,energy:number){return Math.min(1,Math.max(0,previous+Math.max(0,energy)));}
