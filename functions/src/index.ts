import {initializeApp} from 'firebase-admin/app';
import {getFirestore,FieldValue,Timestamp} from 'firebase-admin/firestore';
import {getMessaging} from 'firebase-admin/messaging';
import {onDocumentCreated} from 'firebase-functions/v2/firestore';
import {deliverCommunityMessage,type DeliveryDeps} from './delivery';
initializeApp();const db=getFirestore();
const deps:DeliveryDeps={
 async chat(id){const s=await db.doc('chats/'+id).get(),d=s.data();return d&&Array.isArray(d.participants)&&typeof d.postId==='string'?{participants:d.participants,postId:d.postId}:null;},
 async enabled(uid){return (await db.doc(`users/${uid}/preferences/notifications`).get()).data()?.community===true;},
 async blocked(a,b){const [one,two]=await Promise.all([db.collection('blocks').where('blockerId','==',a).where('blockedUserId','==',b).limit(1).get(),db.collection('blocks').where('blockerId','==',b).where('blockedUserId','==',a).limit(1).get()]);return !one.empty||!two.empty;},
 async devices(uid){const s=await db.collection(`users/${uid}/devices`).limit(100).get();return s.docs.map(r=>({id:r.id,token:r.get('fcmToken'),enabled:r.get('notificationsEnabled')===true,updatedAt:r.get('updatedAt')?.toMillis?.()??0}));},
 async claim(id){const ref=db.doc('notificationDeliveries/'+id);return db.runTransaction(async tx=>{if((await tx.get(ref)).exists)return false;tx.create(ref,{status:'claimed',createdAt:FieldValue.serverTimestamp(),expiresAt:Timestamp.fromMillis(Date.now()+30*86400000)});return true;});},
 async send(token,data){await getMessaging().send({token,data,android:{priority:'high',ttl:86400000}});},
 async finish(id,status){await db.doc('notificationDeliveries/'+id).update({status,updatedAt:FieldValue.serverTimestamp()});},
 async removeToken(uid,id,token){const ref=db.doc(`users/${uid}/devices/${id}`);await db.runTransaction(async tx=>{const s=await tx.get(ref);if(s.get('fcmToken')===token)tx.delete(ref);});}
};
export const communityReplyCreated=onDocumentCreated({document:'chats/{chatId}/messages/{messageId}',region:'europe-west1',maxInstances:3,memory:'256MiB',retry:true},async event=>{
 const d=event.data?.data();if(!d)return;
 await deliverCommunityMessage(deps,{chatId:event.params.chatId,messageId:event.params.messageId,senderId:d.senderId,createdAt:d.createdAt?.toMillis?.()??Date.parse(event.time)});
});
