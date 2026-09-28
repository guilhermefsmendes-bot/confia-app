import {appendPersonalEvents,readPersonalEvents} from '../personal/personalEventStorage';
import {makePersonalEvent,type InterventionEvent} from '../personal/personalEvent';
export type Reflection='calmer'|'same'|'agitated';
export type ReleaseMethod='microphone'|'touch';
export function saveReflection(id:string,response:Reflection,method:ReleaseMethod,durationSeconds:number){
 if(!['calmer','same','agitated'].includes(response))return;
 appendPersonalEvents([makePersonalEvent<InterventionEvent>({id,type:'intervention',source:'app_context',timestamp:new Date().toISOString(),value:null,metadata:{exercise:'five_minutes',durationSeconds:Math.max(0,Math.min(3600,durationSeconds)),method,response}})]);
}
export function reflectionSummary(){const sessions=readPersonalEvents().filter(e=>e.type==='intervention'&&e.metadata?.exercise==='five_minutes'&&['calmer','same','agitated'].includes(String(e.metadata?.response))).slice(-10);return {total:sessions.length,calmer:sessions.filter(e=>e.metadata?.response==='calmer').length};}
