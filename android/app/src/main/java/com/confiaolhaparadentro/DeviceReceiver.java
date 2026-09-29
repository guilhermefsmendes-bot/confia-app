package com.confiaolhaparadentro;
import android.content.*;
public class DeviceReceiver extends BroadcastReceiver {
 @Override public void onReceive(Context context,Intent intent){
  if(NoticeScheduler.REMINDER.equals(intent.getAction()))NoticeScheduler.remind(context);
  else NoticeScheduler.schedule(context);
  HabitWidgetProvider.updateAll(context);CompanionWidgetProvider.updateAll(context);NoticeScheduler.scheduleMidnight(context);
 }
}
