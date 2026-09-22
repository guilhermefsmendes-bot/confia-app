import test from "node:test"; import assert from "node:assert/strict"; import { buildForecastSignals,buildCounterfactualSignals } from "../premiumIntelligence"; import { makePersonalEvent } from "../personalEvent";
const mood=(i:number,value:number,need?:string)=>makePersonalEvent({id:"m"+i,type:"checkin" as const,timestamp:new Date(2026,7,i+1,12).toISOString(),source:"daily_checkin" as const,value,metadata:{need}});
test("forecast needs repeated recent evidence",()=>{const e=Array.from({length:10},(_,i)=>mood(i,5,i>=6?"rest":"other"));assert.equal(buildForecastSignals(e,new Date(2026,7,11)).some(x=>x.need==="rest"),true)});
test("counterfactual refuses weak samples",()=>{assert.deepEqual(buildCounterfactualSignals(Array.from({length:10},(_,i)=>mood(i,5))),[])});
