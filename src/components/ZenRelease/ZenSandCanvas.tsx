import {useEffect,useRef} from 'react';
export default function ZenSandCanvas({progress,irregular,onEnergy,label}:{progress:number;irregular:boolean;onEnergy:(n:number)=>void;label:string}){
 const painted=useRef({progress:0,amplitude:5});
 const ref=useRef<HTMLCanvasElement>(null),drawing=useRef<{x:number;y:number}|null>(null);
 useEffect(()=>{
  const canvas=ref.current;if(!canvas)return;
  let raf=0;const start=performance.now(),from={...painted.current};const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const draw=(fraction=1)=>{painted.current={progress:from.progress+(progress-from.progress)*fraction,amplitude:from.amplitude+((irregular?11:5)-from.amplitude)*fraction};const revealed=painted.current.progress;const rect=canvas.getBoundingClientRect();const dpr=Math.min(devicePixelRatio||1,1.5);const width=Math.max(1,Math.round(rect.width*dpr)),height=Math.max(1,Math.round(rect.height*dpr));if(canvas.width!==width)canvas.width=width;if(canvas.height!==height)canvas.height=height;const c=canvas.getContext('2d');if(!c)return;const w=canvas.width,h=canvas.height;
   const fill=c.createLinearGradient(0,0,w,h);fill.addColorStop(0,'#f1e3cb');fill.addColorStop(.5,'#e8d4b3');fill.addColorStop(1,'#f5ead7');c.fillStyle=fill;c.fillRect(0,0,w,h);
   for(let row=-5;row<45;row++){c.beginPath();for(let x=0;x<=w;x+=8){const y=row*h/34+Math.sin(x/w*7+row*.12)*painted.current.amplitude*dpr;x===0?c.moveTo(x,y):c.lineTo(x,y);}c.strokeStyle=row%2?'#cdb89466':'#fff9e799';c.lineWidth=dpr;c.stroke();}
   for(let i=0;i<120;i++){c.fillStyle=i%2?'#fff9eb99':'#b9a08233';c.fillRect((i*73%127)/127*w,(i*47%131)/131*h,dpr,dpr);}
   if(revealed>0){c.globalCompositeOperation='destination-out';const r=Math.max(1,Math.hypot(w,h)*.68*revealed);const mask=c.createRadialGradient(w*.5,h*.5,0,w*.5,h*.5,r);mask.addColorStop(0,'#000');mask.addColorStop(.72,'#000');mask.addColorStop(1,'transparent');c.fillStyle=mask;c.fillRect(0,0,w,h);c.globalCompositeOperation='source-over';}if(revealed>=1)c.clearRect(0,0,w,h);
  };const animate=(now:number)=>{const fraction=Math.min(1,(now-start)/180);draw(fraction);if(fraction<1&&!document.hidden)raf=requestAnimationFrame(animate);};
  if(reduced||document.hidden)draw();else raf=requestAnimationFrame(animate);
  const observer=new ResizeObserver(()=>draw(reduced?1:Math.min(1,(performance.now()-start)/180)));observer.observe(canvas);const visibility=()=>{if(document.hidden)cancelAnimationFrame(raf);};document.addEventListener('visibilitychange',visibility);
  return()=>{cancelAnimationFrame(raf);observer.disconnect();document.removeEventListener('visibilitychange',visibility);};
 },[progress,irregular]);
 return <canvas ref={ref} aria-label={label} className="absolute inset-0 h-full w-full touch-none rounded-[2rem]" onPointerDown={e=>{drawing.current={x:e.clientX,y:e.clientY};e.currentTarget.setPointerCapture(e.pointerId);}} onPointerMove={e=>{const old=drawing.current;if(!old)return;const distance=Math.hypot(e.clientX-old.x,e.clientY-old.y);drawing.current={x:e.clientX,y:e.clientY};onEnergy(Math.min(.035,distance/3500));}} onPointerUp={()=>{drawing.current=null;}} onPointerCancel={()=>{drawing.current=null;}} onLostPointerCapture={()=>{drawing.current=null;}}/>;
}
