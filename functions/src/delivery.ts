import {createHash} from 'node:crypto';
export interface Device {id:string;token:string;enabled:boolean;updatedAt:number;language?:string;}
export interface DeliveryDeps {
 chat(id:string):Promise<{participants:string[];postId:string;listeningRequestId?:string}|null>;
 enabled(uid:string):Promise<boolean>;
 blocked(a:string,b:string):Promise<boolean>;
 devices(uid:string):Promise<Device[]>;
 claim(id:string):Promise<boolean>;
 send(token:string,data:Record<string,string>):Promise<void>;
 finish(id:string,status:string):Promise<void>;
 removeToken(uid:string,deviceId:string,token:string):Promise<void>;
}
const listeningCopy:Record<string,{title:string;body:string}>={
 pt:{title:'CONFIA · Nova mensagem',body:'Tens uma nova mensagem na tua conversa de apoio.'},
 en:{title:'CONFIA · New message',body:'You have a new message in your listening conversation.'},
 es:{title:'CONFIA · Nuevo mensaje',body:'Tienes un nuevo mensaje en tu conversación de apoyo.'},
 fr:{title:'CONFIA · Nouveau message',body:'Tu as un nouveau message dans ta conversation de soutien.'}
};
export async function deliverCommunityMessage(deps:DeliveryDeps,event:{chatId:string;messageId:string;senderId:string;createdAt:number},now=Date.now()) {
 if(!event.senderId||now-event.createdAt>86400000||event.createdAt>now+60000)return;
 const chat=await deps.chat(event.chatId);
 if(!chat||chat.participants.length!==2||!chat.participants.includes(event.senderId)||!chat.postId)return;
 const isListening=typeof chat.listeningRequestId==='string'&&chat.listeningRequestId.length>0;
 const listeningRequestId=isListening?chat.listeningRequestId as string:'';
 if(isListening&&(chat.postId!=='listen_'+listeningRequestId||!/^[A-Za-z0-9_-]{1,200}$/.test(listeningRequestId)))return;
 for(const uid of [...new Set(chat.participants)].filter(uid=>uid!==event.senderId)) {
  if(!await deps.enabled(uid)||await deps.blocked(event.senderId,uid))continue;
  const devices=await deps.devices(uid);
  for(const device of devices) {
   if(!device.enabled||!device.token||now-device.updatedAt>30*86400000)continue;
   const id=createHash('sha256').update([event.chatId,event.messageId,uid,device.id].join('/')).digest('hex');
   if(!await deps.claim(id))continue;
   // Claim before FCM: retries never send the same logical event/device twice.
   // FCM has no exactly-once transaction with Firestore. An ambiguous failure is
   // recorded, not retried; this favours no duplicate alerts over guaranteed delivery.
   try {
    const language=['pt','en','es','fr'].includes(device.language??'')?device.language as string:'pt';
    let data:Record<string,string>;
    if(isListening) {
     data={kind:'listening_message',recipientUid:uid,chatId:event.chatId,requestId:listeningRequestId,messageId:event.messageId,deliveryId:id,...listeningCopy[language]};
    } else {
     data={kind:'community',recipientUid:uid,chatId:event.chatId,postId:chat.postId,messageId:event.messageId,deliveryId:id};
    }
    await deps.send(device.token,data);
    await deps.finish(id,'sent');
   }catch(error){
    const code=String((error as {code?:string}).code??'unknown');
    if(['messaging/registration-token-not-registered','messaging/invalid-registration-token'].includes(code))await deps.removeToken(uid,device.id,device.token);
    await deps.finish(id,'failed');
   }
  }
 }
}
