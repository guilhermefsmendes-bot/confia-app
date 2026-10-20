package com.confiaolhaparadentro;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;
import android.content.SharedPreferences;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import java.util.*;

public class ConfiaMessagingService extends FirebaseMessagingService {
 @Override public void onNewToken(String token){
  DeviceState.prefs(this).edit().putString("fcmToken",token).apply();
  ConfiaDevicePlugin.tokenChanged(token);
 }

 @Override public void onMessageReceived(RemoteMessage message){
  Map<String,String> d=message.getData();
  SharedPreferences p=DeviceState.prefs(this);
  if(!p.getBoolean("community",false)
    ||!Objects.equals(d.get("recipientUid"),p.getString("owner",""))
    ||!NotificationManagerCompat.from(this).areNotificationsEnabled())return;

  String kind=d.get("kind");
  if("listening_closed".equals(kind)){
   String requestId=d.get("requestId");
   if(safe(requestId)){
    synchronized(ConfiaMessagingService.class){
     Set<String> closed=new HashSet<>(p.getStringSet("closedListeningRequests",Collections.emptySet()));
     if(closed.size()>=500)closed.clear();
     closed.add(requestId);
     p.edit().putStringSet("closedListeningRequests",closed).commit();
    }
    NotificationManagerCompat.from(this).cancel("listening_"+requestId,6202);
    NotificationManagerCompat.from(this).cancel("listening_message_"+requestId,6204);
   }
   return;
  }
  if("listening_message".equals(kind)){
   String requestId=d.get("requestId"),id=d.get("deliveryId"),chat=d.get("chatId"),messageId=d.get("messageId");
   if(!safe(requestId)||!safe(chat)||!safe(messageId)||id==null||!id.matches("[a-f0-9]{64}"))return;
   synchronized(ConfiaMessagingService.class){
    Set<String> closed=new HashSet<>(p.getStringSet("closedListeningRequests",Collections.emptySet()));
    if(closed.contains(requestId))return;
    Set<String> seen=new HashSet<>(p.getStringSet("seenDeliveries",Collections.emptySet()));
    if(seen.contains(id))return;
    if(seen.size()>=500)seen.clear();
    seen.add(id);p.edit().putStringSet("seenDeliveries",seen).commit();
   }
   NoticeScheduler.channels(this);
   String url="confia://listening?requestId="+requestId+"&mode=matched";
   String title=d.get("title"),body=d.get("body");
   if(title==null)title="CONFIA · Nova mensagem";
   if(body==null)body="Tens uma nova mensagem na tua conversa de apoio.";
   NotificationCompat.Builder n=new NotificationCompat.Builder(this,"confia_community")
    .setSmallIcon(R.drawable.ic_notice).setContentTitle(title).setContentText(body)
    .setContentIntent(NoticeScheduler.link(this,url))
    .setVisibility(NotificationCompat.VISIBILITY_PRIVATE).setAutoCancel(true).setOnlyAlertOnce(true);
   try{NotificationManagerCompat.from(this).notify("listening_message_"+requestId,6204,n.build());}catch(SecurityException ignored){}
   return;
  }
  if("listening_request".equals(kind)||"listening_match".equals(kind)){
   String requestId=d.get("requestId");
   if(!safe(requestId))return;
   synchronized(ConfiaMessagingService.class){
    Set<String> closed=new HashSet<>(p.getStringSet("closedListeningRequests",Collections.emptySet()));
    if(closed.contains(requestId))return;
   }
   long requestExpiresAt=0L;
   if("listening_request".equals(kind)){
    try{requestExpiresAt=Long.parseLong(d.get("expiresAt"));}catch(Exception ignored){return;}
    if(requestExpiresAt<=System.currentTimeMillis()){
     synchronized(ConfiaMessagingService.class){
      Set<String> closed=new HashSet<>(p.getStringSet("closedListeningRequests",Collections.emptySet()));
      if(closed.size()>=500)closed.clear();closed.add(requestId);
      p.edit().putStringSet("closedListeningRequests",closed).commit();
     }
     NotificationManagerCompat.from(this).cancel("listening_"+requestId,6202);
     return;
    }
   }
   NoticeScheduler.channels(this);
   String mode="listening_match".equals(kind)?"matched":"request";
   String url="confia://listening?requestId="+requestId+"&mode="+mode;
   String title=d.get("title");
   String body=d.get("body");
   if(title==null)title="CONFIA · Apoio humano";
   if(body==null)body="Há uma conversa de apoio disponível.";
   NotificationCompat.Builder n=new NotificationCompat.Builder(this,"confia_community")
    .setSmallIcon(R.drawable.ic_notice)
    .setContentTitle(title)
    .setContentText(body)
    .setContentIntent(NoticeScheduler.link(this,url))
    .setVisibility(NotificationCompat.VISIBILITY_PRIVATE)
    .setAutoCancel(true)
    .setOnlyAlertOnce(true);
   if("listening_request".equals(kind))n.setTimeoutAfter(Math.max(1L,requestExpiresAt-System.currentTimeMillis()));
   try{NotificationManagerCompat.from(this).notify("listening_"+requestId,6202,n.build());}catch(SecurityException ignored){}
   return;
  }

  if(!"community".equals(kind))return;
  String id=d.get("deliveryId"),chat=d.get("chatId"),post=d.get("postId"),reply=d.get("messageId");
  if(id==null||!id.matches("[a-f0-9]{64}")||!safe(chat)||!safe(post)||!safe(reply))return;
  synchronized(ConfiaMessagingService.class){
   Set<String> seen=new HashSet<>(p.getStringSet("seenDeliveries",Collections.emptySet()));
   if(seen.contains(id))return;
   // Native duplicate protection complements the server's atomic delivery claim.
   if(seen.size()>=500)seen.clear();
   seen.add(id);p.edit().putStringSet("seenDeliveries",seen).commit();
  }
  NoticeScheduler.channels(this);
  String url="confia://community?chatId="+chat+"&postId="+post+"&messageId="+reply;
  NotificationCompat.Builder n=new NotificationCompat.Builder(this,"confia_community")
   .setSmallIcon(R.drawable.ic_notice)
   .setContentTitle("CONFIA")
   .setContentText(DeviceState.text(this,R.string.notice_reply))
   .setContentIntent(NoticeScheduler.link(this,url))
   .setVisibility(NotificationCompat.VISIBILITY_PRIVATE)
   .setAutoCancel(true)
   .setOnlyAlertOnce(true);
  try{NotificationManagerCompat.from(this).notify(id,6201,n.build());}catch(SecurityException ignored){}
 }

 private boolean safe(String s){return s!=null&&s.matches("[A-Za-z0-9_-]{1,200}");}
}
