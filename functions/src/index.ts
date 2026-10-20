import {initializeApp} from 'firebase-admin/app';
import {getFirestore,FieldValue,Timestamp} from 'firebase-admin/firestore';
import {getMessaging} from 'firebase-admin/messaging';
import {onDocumentCreated,onDocumentUpdated} from 'firebase-functions/v2/firestore';
import {deliverCommunityMessage,type DeliveryDeps} from './delivery';
initializeApp();const db=getFirestore();
const deps:DeliveryDeps={
 async chat(id){const s=await db.doc('chats/'+id).get(),d=s.data();return d&&Array.isArray(d.participants)&&typeof d.postId==='string'?{participants:d.participants,postId:d.postId,listeningRequestId:typeof d.listeningRequestId==='string'?d.listeningRequestId:undefined}:null;},
 async enabled(uid){return (await db.doc(`users/${uid}/preferences/notifications`).get()).data()?.community===true;},
 async blocked(a,b){const [one,two]=await Promise.all([db.collection('blocks').where('blockerId','==',a).where('blockedUserId','==',b).limit(1).get(),db.collection('blocks').where('blockerId','==',b).where('blockedUserId','==',a).limit(1).get()]);return !one.empty||!two.empty;},
 async devices(uid){const s=await db.collection(`users/${uid}/devices`).limit(100).get();return s.docs.map(r=>({id:r.id,token:r.get('fcmToken'),enabled:r.get('notificationsEnabled')===true,updatedAt:r.get('updatedAt')?.toMillis?.()??0,language:r.get('language')}));},
 async claim(id){const ref=db.doc('notificationDeliveries/'+id);return db.runTransaction(async tx=>{if((await tx.get(ref)).exists)return false;tx.create(ref,{status:'claimed',createdAt:FieldValue.serverTimestamp(),expiresAt:Timestamp.fromMillis(Date.now()+30*86400000)});return true;});},
 async send(token,data){await getMessaging().send({token,data,android:{priority:'high',ttl:86400000}});},
 async finish(id,status){await db.doc('notificationDeliveries/'+id).update({status,updatedAt:FieldValue.serverTimestamp()});},
 async removeToken(uid,id,token){const ref=db.doc(`users/${uid}/devices/${id}`);await db.runTransaction(async tx=>{const s=await tx.get(ref);if(s.get('fcmToken')===token)tx.delete(ref);});}
};
export const communityReplyCreated=onDocumentCreated({document:'chats/{chatId}/messages/{messageId}',region:'europe-west1',maxInstances:3,memory:'256MiB',retry:true},async event=>{
 const d=event.data?.data();if(!d)return;
 await deliverCommunityMessage(deps,{chatId:event.params.chatId,messageId:event.params.messageId,senderId:d.senderId,createdAt:d.createdAt?.toMillis?.()??Date.parse(event.time)});
});


// Notify opted-in listeners about a new peer-listening request.
// The notification intentionally contains only the topic, never the requester's note.
export const listeningSupportRequestCreated=onDocumentCreated({document:'listeningRequests/{requestId}',region:'europe-west1',maxInstances:3,memory:'256MiB',retry:true},async event=>{
 const request=event.data?.data();
 if(!request||request.status!=='waiting'||typeof request.requesterId!=='string'||typeof request.theme!=='string')return;
 if(request.expiresAt?.toMillis?.()<=Date.now())return;
 // Mark stale requests expired so old queue entries cannot crowd out fresh requests.
 const stale=await db.collection('listeningRequests').where('expiresAt','<=',Timestamp.fromMillis(Date.now())).limit(100).get();
 await Promise.allSettled(stale.docs.filter(d=>d.data().status==='waiting').map(d=>d.ref.update({status:'expired',expiredAt:FieldValue.serverTimestamp()})));
 const profiles=await db.collection('listeningProfiles').where('active','==',true).where('themes','array-contains',request.theme).get();
 const jobs=profiles.docs.filter(profile=>profile.id!==request.requesterId).map(async profile=>{
  const uid=profile.id;
  const prefs=(await db.doc(`users/${uid}/preferences/notifications`).get()).data();
  if(prefs?.community!==true)return;
  const [blockedForward,blockedReverse,devices]=await Promise.all([
   db.collection('blocks').where('blockerId','==',request.requesterId).where('blockedUserId','==',uid).limit(1).get(),
   db.collection('blocks').where('blockerId','==',uid).where('blockedUserId','==',request.requesterId).limit(1).get(),
   db.collection(`users/${uid}/devices`).limit(100).get()
  ]);
  if(!blockedForward.empty||!blockedReverse.empty)return;
  const eligibleDevices=devices.docs.filter(d=>d.get('notificationsEnabled')===true&&typeof d.get('fcmToken')==='string');
  const labels:Record<string,Record<string,string>>={
   pt:{anxiety:'ansiedade e pânico',depression:'tristeza e depressão',loneliness:'solidão',stress:'stress',relationships:'relações e família',grief:'luto e perda',selfEsteem:'autoestima',other:'outro tema'},
   en:{anxiety:'anxiety and panic',depression:'low mood',loneliness:'loneliness',stress:'stress',relationships:'relationships and family',grief:'grief and loss',selfEsteem:'self-esteem',other:'a personal topic'},
   es:{anxiety:'ansiedad y pánico',depression:'tristeza',loneliness:'soledad',stress:'estrés',relationships:'relaciones y familia',grief:'duelo',selfEsteem:'autoestima',other:'otro tema'},
   fr:{anxiety:'anxiété et panique',depression:'tristesse',loneliness:'solitude',stress:'stress',relationships:'relations et famille',grief:'deuil',selfEsteem:'estime de soi',other:'un sujet personnel'}
  };
  const copy:Record<string,{title:string;body:(label:string)=>string}>={
   pt:{title:'CONFIA · Alguém precisa de ser ouvido',body:label=>`Há um pedido sobre ${label}. Tens disponibilidade para ouvir?`},
   en:{title:'CONFIA · Someone needs to talk',body:label=>`Someone is asking to talk about ${label}. Are you available to listen?`},
   es:{title:'CONFIA · Alguien necesita hablar',body:label=>`Alguien necesita hablar sobre ${label}. ¿Estás disponible para escuchar?`},
   fr:{title:'CONFIA · Quelqu’un a besoin de parler',body:label=>`Une personne souhaite parler de ${label}. Es-tu disponible pour écouter ?`}
  };
  await Promise.allSettled(eligibleDevices.map(device=>{
   const lang=['pt','en','es','fr'].includes(device.get('language'))?String(device.get('language')):'pt';
   const label=labels[lang][request.theme]||labels[lang].other;
   return getMessaging().send({
    token:device.get('fcmToken') as string,
    data:{
     kind:'listening_request',recipientUid:uid,requestId:event.params.requestId,theme:request.theme,
     expiresAt:String(request.expiresAt.toMillis()),
     title:copy[lang].title,body:copy[lang].body(label),
     url:`confia://listening?requestId=${event.params.requestId}&mode=request`
    },
    android:{priority:'high',ttl:600000}
   });
  }));
 });
 await Promise.allSettled(jobs);
});


// Let the requester know when a volunteer has claimed the request.
// The native notification opens the app directly on the listening flow.
export const listeningSupportMatched=onDocumentUpdated({document:'listeningRequests/{requestId}',region:'europe-west1',maxInstances:3,memory:'256MiB',retry:true},async event=>{
 const before=event.data?.before.data(),after=event.data?.after.data();
 if(!before||!after||before.status!=='waiting'||after.status!=='matched'||typeof after.requesterId!=='string'||typeof after.acceptedBy!=='string')return;
 const uid=after.requesterId;
 const [prefs,devices,blockedForward,blockedReverse]=await Promise.all([
  db.doc(`users/${uid}/preferences/notifications`).get(),
  db.collection(`users/${uid}/devices`).limit(100).get(),
  db.collection('blocks').where('blockerId','==',uid).where('blockedUserId','==',after.acceptedBy).limit(1).get(),
  db.collection('blocks').where('blockerId','==',after.acceptedBy).where('blockedUserId','==',uid).limit(1).get()
 ]);
 const canNotifyRequester=prefs.data()?.community===true&&blockedForward.empty&&blockedReverse.empty;
 if(canNotifyRequester){
 const eligibleDevices=devices.docs.filter(d=>d.get('notificationsEnabled')===true&&typeof d.get('fcmToken')==='string');
 const labels:Record<string,Record<string,string>>={
  pt:{anxiety:'ansiedade e pânico',depression:'tristeza e depressão',loneliness:'solidão',stress:'stress',relationships:'relações e família',grief:'luto e perda',selfEsteem:'autoestima',other:'outro tema'},
  en:{anxiety:'anxiety and panic',depression:'low mood',loneliness:'loneliness',stress:'stress',relationships:'relationships and family',grief:'grief',selfEsteem:'self-esteem',other:'a personal topic'},
  es:{anxiety:'ansiedad y pánico',depression:'tristeza',loneliness:'soledad',stress:'estrés',relationships:'relaciones y familia',grief:'duelo',selfEsteem:'autoestima',other:'otro tema'},
  fr:{anxiety:'anxiété et panique',depression:'tristesse',loneliness:'solitude',stress:'stress',relationships:'relations et famille',grief:'deuil',selfEsteem:'estime de soi',other:'un sujet personnel'}
 };
 const copy:Record<string,{title:string;body:(label:string)=>string}>={
  pt:{title:'CONFIA · Alguém está disponível para te ouvir',body:label=>`O teu pedido sobre ${label} foi aceite. Abre a CONFIA para conversar.`},
  en:{title:'CONFIA · Someone is ready to listen',body:label=>`Your request about ${label} was accepted. Open CONFIA to talk.`},
  es:{title:'CONFIA · Alguien está disponible para escucharte',body:label=>`Tu solicitud sobre ${label} fue aceptada. Abre CONFIA para conversar.`},
  fr:{title:'CONFIA · Quelqu’un est disponible pour t’écouter',body:label=>`Ta demande sur ${label} a été acceptée. Ouvre CONFIA pour discuter.`}
 };
 await Promise.allSettled(eligibleDevices.map(device=>{
  const lang=['pt','en','es','fr'].includes(device.get('language'))?String(device.get('language')):'pt';
  const label=labels[lang][String(after.theme)]||labels[lang].other;
  return getMessaging().send({
   token:device.get('fcmToken') as string,
   data:{
    kind:'listening_match',recipientUid:uid,requestId:event.params.requestId,theme:String(after.theme||'other'),
    title:copy[lang].title,body:copy[lang].body(label),
    url:`confia://listening?requestId=${event.params.requestId}&mode=matched`
   },
   android:{priority:'high',ttl:86400000}
  });
 }));
 }

 // Dismiss any already-delivered OS notifications for this request.
 // Sending a cancellation is harmless on devices that never showed it.
 const listeners=await db.collection('listeningProfiles').where('themes','array-contains',String(after.theme||'other')).get();
 await Promise.allSettled(listeners.docs.filter(profile=>profile.id!==uid).map(async profile=>{
  const listenerUid=profile.id;
  const prefs=(await db.doc(`users/${listenerUid}/preferences/notifications`).get()).data();
  if(prefs?.community!==true)return;
  const devices=await db.collection(`users/${listenerUid}/devices`).limit(100).get();
  const eligible=devices.docs.filter(device=>device.get('notificationsEnabled')===true&&typeof device.get('fcmToken')==='string');
  await Promise.allSettled(eligible.map(device=>getMessaging().send({
   token:device.get('fcmToken') as string,
   data:{kind:'listening_closed',recipientUid:listenerUid,requestId:event.params.requestId,theme:String(after.theme||'other')},
   android:{priority:'high',ttl:60000}
  })));
 }));
});


// Remove outstanding listening-request alerts when the requester cancels or
// when the queue expiry cleanup marks the request expired.
export const listeningSupportRequestClosed=onDocumentUpdated({document:'listeningRequests/{requestId}',region:'europe-west1',maxInstances:3,memory:'256MiB',retry:true},async event=>{
 const before=event.data?.before.data(),after=event.data?.after.data();
 if(!before||!after||typeof after.requesterId!=='string'||typeof after.theme!=='string')return;
 const waitingEnded=before.status==='waiting'&&['cancelled','expired'].includes(String(after.status));
 const matchedEnded=before.status==='matched'&&after.status==='closed';
 if(!waitingEnded&&!matchedEnded)return;
 const listeners=await db.collection('listeningProfiles').where('themes','array-contains',after.theme).get();
 await Promise.allSettled(listeners.docs.filter(profile=>matchedEnded||profile.id!==after.requesterId).map(async profile=>{
  const uid=profile.id;
  const prefs=(await db.doc(`users/${uid}/preferences/notifications`).get()).data();
  if(prefs?.community!==true)return;
  const devices=await db.collection(`users/${uid}/devices`).limit(100).get();
  const eligible=devices.docs.filter(device=>device.get('notificationsEnabled')===true&&typeof device.get('fcmToken')==='string');
  await Promise.allSettled(eligible.map(device=>getMessaging().send({
   token:device.get('fcmToken') as string,
   data:{kind:'listening_closed',recipientUid:uid,requestId:event.params.requestId,theme:after.theme},
   android:{priority:'high',ttl:60000}
  })));
 }));
});
