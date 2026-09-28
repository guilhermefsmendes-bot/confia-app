package com.confiaolhaparadentro;
import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;
import android.content.SharedPreferences;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import java.util.*;
public class ConfiaMessagingService extends FirebaseMessagingService {
 @Override public void onNewToken(String token){DeviceState.prefs(this).edit().putString("fcmToken",token).apply();ConfiaDevicePlugin.tokenChanged(token);}
 @Override public void onMessageReceived(RemoteMessage message){
  Map<String,String> d=message.getData();SharedPreferences p=DeviceState.prefs(this);
  if(!"community".equals(d.get("kind"))||!p.getBoolean("community",false)||!Objects.equals(d.get("recipientUid"),p.getString("owner",""))||!NotificationManagerCompat.from(this).areNotificationsEnabled())return;
  String id=d.get("deliveryId"),chat=d.get("chatId"),post=d.get("postId"),reply=d.get("messageId");
  if(id==null||!id.matches("[a-f0-9]{64}")||!safe(chat)||!safe(post)||!safe(reply))return;
  synchronized(ConfiaMessagingService.class){
   Set<String> seen=new HashSet<>(p.getStringSet("seenDeliveries",Collections.emptySet()));if(seen.contains(id))return;
   // Native duplicate protection complements the server's atomic delivery claim.
   if(seen.size()>=500)seen.clear();seen.add(id);p.edit().putStringSet("seenDeliveries",seen).commit();
  }
  NoticeScheduler.channels(this);
  String url="confia://community?chatId="+chat+"&postId="+post+"&messageId="+reply;
  NotificationCompat.Builder n=new NotificationCompat.Builder(this,"confia_community").setSmallIcon(R.drawable.ic_notice).setContentTitle("CONFIA").setContentText(DeviceState.text(this,R.string.notice_reply)).setContentIntent(NoticeScheduler.link(this,url)).setVisibility(NotificationCompat.VISIBILITY_PRIVATE).setAutoCancel(true).setOnlyAlertOnce(true);
  try{NotificationManagerCompat.from(this).notify(id,6201,n.build());}catch(SecurityException ignored){}
 }
 private boolean safe(String s){return s!=null&&s.matches("[A-Za-z0-9_-]{1,200}");}
}
