package com.confiaolhaparadentro;
import android.app.*;
import android.content.*;
import android.net.Uri;
import android.os.Build;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import java.util.Calendar;
import java.text.SimpleDateFormat;
import java.util.Locale;
public final class NoticeScheduler {
 public static final String REMINDER="confia.reminder",MIDNIGHT="confia.midnight";
 public static String today(){return new SimpleDateFormat("yyyy-MM-dd",Locale.ROOT).format(Calendar.getInstance().getTime());}
 public static PendingIntent alarm(Context c,String action){Intent i=new Intent(c,DeviceReceiver.class).setAction(action);return PendingIntent.getBroadcast(c,action.equals(REMINDER)?6101:6102,i,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);}
 public static void channels(Context c){if(Build.VERSION.SDK_INT>=26){NotificationManager m=c.getSystemService(NotificationManager.class);m.createNotificationChannel(new NotificationChannel("confia_community",DeviceState.text(c,R.string.notice_community),NotificationManager.IMPORTANCE_DEFAULT));m.createNotificationChannel(new NotificationChannel("confia_daily",DeviceState.text(c,R.string.notice_reminder),NotificationManager.IMPORTANCE_DEFAULT));}}
 public static void schedule(Context c){
  AlarmManager m=c.getSystemService(AlarmManager.class);m.cancel(alarm(c,REMINDER));
  android.content.SharedPreferences p=DeviceState.prefs(c);
  if(!p.getBoolean("reminder",false))return;
  String time=p.getString("time","20:30");if(!time.matches("([01][0-9]|2[0-3]):[0-5][0-9]"))time="20:30";
  Calendar next=Calendar.getInstance();next.set(Calendar.HOUR_OF_DAY,Integer.parseInt(time.substring(0,2)));next.set(Calendar.MINUTE,Integer.parseInt(time.substring(3)));next.set(Calendar.SECOND,0);next.set(Calendar.MILLISECOND,0);
  if(next.getTimeInMillis()<=System.currentTimeMillis()||today().equals(p.getString("completedDate",""))||today().equals(p.getString("lastReminderDate","")))next.add(Calendar.DAY_OF_YEAR,1);
  p.edit().putString("scheduledReminderDay",new SimpleDateFormat("yyyy-MM-dd",Locale.ROOT).format(next.getTime())).apply();
  // Inexact, once per day; no exact-alarm entitlement or continuous service.
  m.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP,next.getTimeInMillis(),alarm(c,REMINDER));
 }
 public static void scheduleMidnight(Context c){
  AlarmManager m=c.getSystemService(AlarmManager.class);m.cancel(alarm(c,MIDNIGHT));
  if(!HabitWidgetProvider.hasWidgets(c))return;
  Calendar next=Calendar.getInstance();next.add(Calendar.DAY_OF_YEAR,1);next.set(Calendar.HOUR_OF_DAY,0);next.set(Calendar.MINUTE,0);next.set(Calendar.SECOND,5);next.set(Calendar.MILLISECOND,0);
  m.setWindow(AlarmManager.RTC,next.getTimeInMillis(),600000,alarm(c,MIDNIGHT));
 }
 public static PendingIntent link(Context c,String url){Intent i=new Intent(c,MainActivity.class).setAction(Intent.ACTION_VIEW).setData(Uri.parse(url)).addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP|Intent.FLAG_ACTIVITY_SINGLE_TOP);return PendingIntent.getActivity(c,url.hashCode(),i,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);}
 public static void remind(Context c){
  android.content.SharedPreferences p=DeviceState.prefs(c);String day=today();
  if(!p.getBoolean("reminder",false)||!day.equals(p.getString("scheduledReminderDay",""))||day.equals(p.getString("completedDate",""))||day.equals(p.getString("lastReminderDate",""))){schedule(c);return;}
  if(NotificationManagerCompat.from(c).areNotificationsEnabled()){
   int[] phrases={R.string.notice_daily_1,R.string.notice_daily_2,R.string.notice_daily_3};int index=Calendar.getInstance().get(Calendar.DAY_OF_YEAR)%phrases.length;
   channels(c);NotificationCompat.Builder n=new NotificationCompat.Builder(c,"confia_daily").setSmallIcon(R.drawable.ic_notice).setContentTitle("CONFIA").setContentText(DeviceState.text(c,phrases[index])).setStyle(new NotificationCompat.BigTextStyle().bigText(DeviceState.text(c,phrases[index]))).setVisibility(NotificationCompat.VISIBILITY_PRIVATE).setContentIntent(link(c,"confia://checkin")).setAutoCancel(true);
   try{NotificationManagerCompat.from(c).notify(6101,n.build());p.edit().putString("lastReminderDate",day).apply();}catch(SecurityException ignored){}
  }
  schedule(c);
 }
}
