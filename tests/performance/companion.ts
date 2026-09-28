import {performance} from 'node:perf_hooks';
const values=new Map<string,string>();const storage={getItem:(k:string)=>values.get(k)??null,setItem:(k:string,v:string)=>values.set(k,v),removeItem:(k:string)=>values.delete(k)};
Object.assign(globalThis,{window:{localStorage:storage,addEventListener(){},dispatchEvent(){}},localStorage:storage});
const {getHomeCompanionBrainDecision}=await import('../../src/data/reactive/companionBrain/homeDecision');
const now=new Date(),day=(d:Date)=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const ratings=Array.from({length:90},(_,i)=>{const d=new Date(now);d.setDate(d.getDate()-89+i);return {date:day(d),morning:5+i%3,afternoon:6+i%2};});
values.set('confia_ratings_v2',JSON.stringify(ratings));
const events=Array.from({length:5000},(_,i)=>{const d=new Date(now.getTime()-(4999-i)*3600000);return {id:'m'+i,type:'mood',source:'daily_rating',schemaVersion:1,timestamp:d.toISOString(),localDate:day(d),value:5+i%4,metadata:{moment:i%2?'morning':'afternoon'}};});values.set('confia_personal_events_v1',JSON.stringify(events));
const input={currentTab:0,homeScreen:'home',selectedDate:day(now),todayLogged:true,morningRating:6,afternoonRating:7,ratings};
const times=[];const cpu=process.cpuUsage(),heap=process.memoryUsage().heapUsed;
for(let i=0;i<100;i++){const start=performance.now();getHomeCompanionBrainDecision(input);times.push(performance.now()-start)}
times.sort((a,b)=>a-b);console.log(JSON.stringify({p50:times[50],p95:times[95],max:times[99],cpu:process.cpuUsage(cpu),heapDelta:process.memoryUsage().heapUsed-heap,inputBytes:JSON.stringify(events).length}));
