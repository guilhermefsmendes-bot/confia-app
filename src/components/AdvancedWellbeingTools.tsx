import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Activity, Download, Mic, Moon, ShieldCheck, Sparkles, Timer, Upload, Watch, MessageCircleHeart } from "lucide-react";
import type { DailyRating, Objective } from "../types";
import { getLocalCalendarDate } from "../utils/date";

type Tab = "year" | "past" | "timeline" | "vault" | "voice" | "fatigue" | "biometrics" | "export";
type Need = "listen" | "space" | "ground" | "company";
type Biometric = { date: string; sleepMinutes?: number; restingHeartRate?: number; steps?: number };
const needKeys = [
  ["listen"],
  ["space"],
  ["ground"],
  ["company"]
] as const;
const toneWords: Record<string,string[]> = {
  calm:["calmo","calma","tranquilo","tranquila","seguro","segura","bem","calm"],
  anxious:["ansioso","ansiosa","medo","receio","preocupado","preocupada","pânico","panic"],
  low:["triste","cansado","cansada","sozinho","sozinha","vazio","vazia","exausto","exausta","sad"]
};
function toneOf(value:string) {
  const lower=value.toLocaleLowerCase();
  const scores=Object.entries(toneWords).map(([k,words])=>[k,words.reduce((n,w)=>n+(lower.includes(w)?1:0),0)] as const);
  const top=scores.sort((x,y)=>y[1]-x[1])[0];
  return top?.[1] ? top[0] : "neutral";
}
function downloadFile(name:string, content:string, type="text/plain") {
  const url=URL.createObjectURL(new Blob([content],{type}));
  const a=document.createElement("a"); a.href=url; a.download=name; a.click(); URL.revokeObjectURL(url);
}
export default function AdvancedWellbeingTools({ratings,objectives}:{ratings:DailyRating[];objectives:Objective[]}) {
  const { t } = useTranslation();
  const [tab,setTab]=useState<Tab>("year");
  const [pastDate,setPastDate]=useState(ratings.at(-2)?.date ?? ratings[0]?.date ?? "");
  const [pastReply,setPastReply]=useState("");
  const [voiceText,setVoiceText]=useState("");
  const [listening,setListening]=useState(false);
  const recognition=useRef<any>(null);
  const [seconds,setSeconds]=useState(0);
  const [biometrics,setBiometrics]=useState<Biometric[]>([]);
  const [need,setNeed]=useState<Need>("listen");
  useEffect(()=>{const started=Date.now();const id=window.setInterval(()=>{if(document.visibilityState==="visible")setSeconds(Math.floor((Date.now()-started)/1000));},1000);return()=>clearInterval(id)},[]);
  useEffect(()=>()=>recognition.current?.stop?.(),[]);
  const currentYear=new Date().getFullYear();
  const monthly=useMemo(()=>Array.from({length:12},(_,i)=>{const values:number[]=[];ratings.forEach(r=>{if(Number(r.date.slice(0,4))===currentYear&&Number(r.date.slice(5,7))===i+1){if(typeof r.morning==="number")values.push(r.morning);if(typeof r.afternoon==="number")values.push(r.afternoon)}});return {month:i+1,average:values.length?values.reduce((x,y)=>x+y,0)/values.length:null}}),[ratings,currentYear]);
  const lowDays=useMemo(()=>ratings.filter(r=>{const v=[r.morning,r.afternoon].filter((x):x is number=>typeof x==="number");return v.length>0&&v.reduce((x,y)=>x+y,0)/v.length<=4}).slice(-12).reverse(),[ratings]);
  const selected=ratings.find(r=>r.date===pastDate);
  const tone=toneOf(voiceText);
  const startVoice=()=>{const Speech=(window as any).SpeechRecognition||(window as any).webkitSpeechRecognition;if(!Speech)return;const r=new Speech();r.lang="pt-PT";r.continuous=true;r.interimResults=true;r.onresult=(e:any)=>{let out="";for(let i=e.resultIndex;i<e.results.length;i++)out+=e.results[i][0].transcript;if(out)setVoiceText(v=>(v+" "+out).trim().slice(0,3000))};r.onend=()=>setListening(false);r.onerror=()=>setListening(false);recognition.current=r;r.start();setListening(true)};
  const exportData=(json:boolean)=>{const data={generatedAt:new Date().toISOString(),ratings,objectives:objectives.map(o=>({text:o.text,category:o.category,completed:o.completed})),note:"Não inclui conteúdo efémero de voz, pensamentos ou Blind Vent."};const body=json?JSON.stringify(data,null,2):"CONFIA — resumo\n\nRegistos: "+ratings.length+"\nObjetivos concluídos: "+objectives.filter(o=>o.completed).length+"\n\n"+ratings.map(r=>r.date+": "+(r.morning??"—")+"/"+(r.afternoon??"—")).join("\n");downloadFile("confia-export-"+getLocalCalendarDate()+"."+(json?"json":"txt"),body,json?"application/json":"text/plain")};
  const tabs:[Tab,string][]=[["year",t("advancedWellbeing.year")],["past",t("advancedWellbeing.past")],["timeline",t("advancedWellbeing.timeline")],["vault",t("advancedWellbeing.vault")],["voice",t("advancedWellbeing.voice")],["fatigue",t("advancedWellbeing.fatigue")],["biometrics",t("advancedWellbeing.biometrics")],["export",t("advancedWellbeing.export")]];
  return <section className="mt-4 overflow-hidden rounded-[28px] border border-[#B85F48]/20 bg-white shadow-sm">
    <header className="border-b border-slate-100 p-5">
      <div className="flex items-start gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#F3E3DC] text-[#934A38]"><Sparkles size={18}/></div><div><p className="text-[9px] font-black uppercase tracking-[.18em] text-[#B9785D]">{t("advancedWellbeing.eyebrow")}</p><h3 className="text-sm font-black text-[#2F2926]">{t("advancedWellbeing.title")}</h3><p className="mt-1 text-xs leading-5 text-slate-500">{t("advancedWellbeing.privacy")}</p></div></div>
      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">{tabs.map(([id,label])=><button key={id} type="button" aria-pressed={tab===id} onClick={()=>setTab(id)} className={"min-h-10 shrink-0 rounded-2xl px-3 text-[11px] font-black "+(tab===id?"bg-[#2F2926] text-white":"bg-[#FFF8F4] text-[#795B50]")}>{label}</button>)}</div>
    </header>
    <div className="p-5">
      {tab==="year" && <div><h4 className="font-black text-[#2F2926]">{t("advancedWellbeing.yearTitle")}</h4><p className="mt-1 text-xs text-slate-500">{t("advancedWellbeing.yearDesc")}</p><div className="mt-5 grid grid-cols-12 items-end gap-1.5">{monthly.map(x=><div key={x.month} className="flex flex-col items-center gap-1"><div className="flex h-32 w-full items-end"><div className="w-full rounded-t-lg bg-[#B85F48]/70" style={{height:(x.average===null?4:Math.max(6,x.average*10))+"%"}}/></div><span className="text-[9px] text-slate-400">{x.month}</span></div>)}</div><p className="mt-3 text-[10px] font-bold text-slate-400">{ratings.length} {t("advancedWellbeing.records")}</p></div>}
      {tab==="past" && <div><h4 className="font-black text-[#2F2926]">{t("advancedWellbeing.pastTitle")}</h4><p className="mt-1 text-xs text-slate-500">{t("advancedWellbeing.pastDesc")}</p><select value={pastDate} onChange={e=>setPastDate(e.target.value)} className="mt-4 min-h-11 w-full rounded-2xl border border-slate-200 px-3">{ratings.map(r=><option key={r.date} value={r.date}>{r.date}</option>)}</select>{selected&&<div className="mt-4 rounded-2xl bg-[#FFF8F4] p-4"><p className="text-xs font-black text-[#795B50]">{t("advancedWellbeing.pastDay", {morning:selected.morning??"—", afternoon:selected.afternoon??"—"})}</p><textarea value={pastReply} onChange={e=>setPastReply(e.target.value.slice(0,1200))} className="mt-3 min-h-28 w-full rounded-2xl border border-[#B85F48]/25 bg-white p-3 text-sm" placeholder={t("advancedWellbeing.pastPlaceholder")}/></div>}</div>}
      {tab==="timeline" && <div><h4 className="font-black text-[#2F2926]">{t("advancedWellbeing.timelineTitle")}</h4><p className="mt-1 text-xs text-slate-500">{t("advancedWellbeing.timelineDesc")}</p><div className="mt-4 space-y-2">{lowDays.length?lowDays.map(r=><div key={r.date} className="rounded-2xl border border-slate-100 p-3"><div className="flex justify-between"><span className="text-xs font-black text-[#2F2926]">{r.date}</span><span className="text-xs font-black text-[#934A38]">{((r.morning??r.afternoon??0)+(r.afternoon??r.morning??0))/2}/10</span></div>{r.note&&<p className="mt-1 text-xs text-slate-500">{r.note}</p>}</div>):<p className="rounded-2xl bg-[#FFF8F4] p-4 text-xs text-slate-500">{t("advancedWellbeing.noData")}</p>}</div></div>}
      {tab==="vault" && <div><h4 className="font-black text-[#2F2926]">{t("advancedWellbeing.vaultTitle")}</h4><p className="mt-1 text-xs text-slate-500">{t("advancedWellbeing.vaultDesc")}</p><div className="mt-4 grid gap-2">{needKeys.map(([id])=><button key={id} type="button" onClick={()=>setNeed(id)} className={"min-h-12 rounded-2xl border px-4 text-left text-xs font-bold "+(need===id?"border-[#934A38] bg-[#F3E3DC]":"border-slate-100")}>{t("advancedWellbeing."+id)}</button>)}</div><div className="mt-4 flex gap-2 rounded-2xl border border-[#B85F48]/15 bg-[#FFF8F4] p-3 text-[10px] font-bold text-[#795B50]"><MessageCircleHeart size={16} className="mt-0.5 shrink-0"/><span>{t("advancedWellbeing.privateSupportNote")}</span></div></div>}
      {tab==="voice" && <div><h4 className="font-black text-[#2F2926]">{t("advancedWellbeing.voiceTitle")}</h4><p className="mt-1 text-xs text-slate-500">{t("advancedWellbeing.voiceDesc")}</p><textarea value={voiceText} onChange={e=>setVoiceText(e.target.value.slice(0,3000))} className="mt-4 min-h-36 w-full rounded-2xl border border-slate-200 p-3 text-sm" placeholder={t("advancedWellbeing.voicePlaceholder")}/><div className="mt-2 flex gap-2"><button type="button" onClick={startVoice} disabled={listening} className="flex min-h-10 items-center gap-2 rounded-2xl bg-[#2F2926] px-4 text-xs font-black text-white"><Mic size={14}/>{listening?t("advancedWellbeing.listening"):t("advancedWellbeing.speak")}</button>{listening&&<button type="button" onClick={()=>recognition.current?.stop?.()} className="rounded-2xl border px-4 text-xs font-black">{t("advancedWellbeing.stop")}</button>}</div>{voiceText&&<p className="mt-3 rounded-2xl bg-[#FFF8F4] p-3 text-xs font-bold text-[#795B50]">{t("advancedWellbeing.toneSignal", { tone: t("advancedWellbeing."+(tone==="neutral"?"neutral":tone)) })}.</p>}</div>}
      {tab==="fatigue" && <div><h4 className="font-black text-[#2F2926]">{t("advancedWellbeing.fatigueTitle")}</h4><p className="mt-1 text-xs text-slate-500">{t("advancedWellbeing.fatigueDesc")}</p><div className="mt-5 flex items-center gap-4 rounded-2xl bg-[#FFF8F4] p-4"><Timer size={24} className="text-[#934A38]"/><div><p className="text-2xl font-black text-[#2F2926]">{Math.floor(seconds/60)} min</p><p className="text-[10px] font-bold text-slate-500">{t("advancedWellbeing.session")}</p></div></div>{seconds>=2700&&<p className="mt-3 rounded-2xl bg-amber-50 p-4 text-xs font-bold text-amber-800">{t("advancedWellbeing.longSession")}</p>}</div>}
      {tab==="biometrics" && <div><h4 className="font-black text-[#2F2926]">{t("advancedWellbeing.bioTitle")}</h4><p className="mt-1 text-xs text-slate-500">{t("advancedWellbeing.bioDesc")}</p><label className="mt-4 flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-[#934A38]/40 bg-[#FFF8F4] text-xs font-black text-[#795B50]"><Upload size={15}/>{t("advancedWellbeing.import")}<input type="file" accept="application/json" className="hidden" onChange={async e=>{const f=e.target.files?.[0];if(!f)return;try{const p=JSON.parse(await f.text());const items=Array.isArray(p)?p:p.data;if(!Array.isArray(items))throw Error();setBiometrics(items.slice(0,90))}catch{setBiometrics([])}}}/></label>{biometrics.length>0&&<div className="mt-4 grid grid-cols-3 gap-2"><div className="rounded-2xl bg-[#FFF8F4] p-3 text-center"><Moon size={15} className="mx-auto"/><b className="block text-sm">{Math.round(biometrics.reduce((a,b)=>a+(b.sleepMinutes??0),0)/biometrics.length)}m</b><span className="text-[9px] text-slate-400">{t("advancedWellbeing.sleep")}</span></div><div className="rounded-2xl bg-[#FFF8F4] p-3 text-center"><Activity size={15} className="mx-auto"/><b className="block text-sm">{Math.round(biometrics.reduce((a,b)=>a+(b.restingHeartRate??0),0)/(biometrics.filter(b=>typeof b.restingHeartRate==="number").length||1))}</b><span className="text-[9px] text-slate-400">{t("advancedWellbeing.heart")}</span></div><div className="rounded-2xl bg-[#FFF8F4] p-3 text-center"><Watch size={15} className="mx-auto"/><b className="block text-sm">{biometrics.length}</b><span className="text-[9px] text-slate-400">{t("advancedWellbeing.days")}</span></div></div>}</div>}
      {tab==="export" && <div><h4 className="font-black text-[#2F2926]">{t("advancedWellbeing.exportTitle")}</h4><p className="mt-1 text-xs text-slate-500">{t("advancedWellbeing.exportDesc")}</p><div className="mt-4 grid gap-2 sm:grid-cols-2"><button type="button" onClick={()=>exportData(false)} className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#2F2926] text-xs font-black text-white"><Download size={15}/>{t("advancedWellbeing.txt")}</button><button type="button" onClick={()=>exportData(true)} className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border text-xs font-black text-[#2F2926]"><Download size={15}/>{t("advancedWellbeing.json")}</button></div><div className="mt-4 flex gap-2 rounded-2xl bg-emerald-50 p-3 text-[10px] font-bold text-emerald-800"><ShieldCheck size={15}/>{t("advancedWellbeing.exportSafe")}</div></div>}
    </div>
  </section>;
}
