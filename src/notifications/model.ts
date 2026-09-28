export type NoticeTarget = {kind:'community';chatId:string;postId:string;messageId?:string}|{kind:'checkin'}|{kind:'sky'}|{kind:'habit';action:'home'|'log'|'setup'};
export interface NoticePreferences { community:boolean; reminder:boolean; time:string; milestones:boolean; }
export const DEFAULT_NOTICES:NoticePreferences={community:false,reminder:false,time:'20:30',milestones:false};
export function validTime(value:string){return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);}
export function noticeTarget(raw:string):NoticeTarget|null {
 try {
  const u=new URL(raw);if(u.protocol!=='confia:')return null;
  const id=(k:string)=>{const s=u.searchParams.get(k)??'';return /^[A-Za-z0-9_-]{1,200}$/.test(s)?s:'';};
  if(u.hostname==='checkin')return {kind:'checkin'};
  if(u.hostname==='sky'||(u.hostname==='embrace'&&u.pathname==='/sky'))return {kind:'sky'};
  if(u.hostname==='home'&&u.pathname.startsWith('/habits'))return {kind:'habit',action:u.pathname==='/habits/log'?'log':u.pathname==='/habits/setup'?'setup':'home'};
  if(u.hostname==='habits')return {kind:'habit',action:u.pathname==='/log'?'log':u.pathname==='/setup'?'setup':'home'};
  if(u.hostname==='community'&&id('chatId')&&id('postId'))return {kind:'community',chatId:id('chatId'),postId:id('postId'),...(id('messageId')?{messageId:id('messageId')}:{})};
 }catch{}return null;
}
