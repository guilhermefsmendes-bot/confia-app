package com.confiaolhaparadentro;
import android.Manifest;
import android.appwidget.AppWidgetManager;
import android.content.*;
import android.os.Build;
import android.provider.Settings;
import androidx.core.app.NotificationManagerCompat;
import com.getcapacitor.*;
import com.getcapacitor.annotation.*;
import com.google.firebase.messaging.FirebaseMessaging;
import java.lang.ref.WeakReference;
import java.util.UUID;
@CapacitorPlugin(name="ConfiaDevice",permissions={@Permission(alias="notices",strings={Manifest.permission.POST_NOTIFICATIONS})})
public class ConfiaDevicePlugin extends Plugin {
 private static WeakReference<ConfiaDevicePlugin> active=new WeakReference<>(null);
 @Override public void load(){active=new WeakReference<>(this);NoticeScheduler.channels(getContext());}
 public static void tokenChanged(String token){ConfiaDevicePlugin p=active.get();if(p!=null)p.notifyListeners("tokenChanged",new JSObject().put("token",token));}
 private boolean channelAllowed(String channel){if(Build.VERSION.SDK_INT<26)return true;android.app.NotificationChannel c=getContext().getSystemService(android.app.NotificationManager.class).getNotificationChannel(channel);return c==null||c.getImportance()!=android.app.NotificationManager.IMPORTANCE_NONE;}
 @PluginMethod public void info(PluginCall call){SharedPreferences p=DeviceState.prefs(getContext());String id=p.getString("deviceId","");if(id.isEmpty()){id=UUID.randomUUID().toString();p.edit().putString("deviceId",id).apply();}boolean allowed=NotificationManagerCompat.from(getContext()).areNotificationsEnabled();String state=allowed?"granted":Build.VERSION.SDK_INT>=33&&!p.getBoolean("noticePermissionAsked",false)?"notRequested":"denied";call.resolve(new JSObject().put("deviceId",id).put("permission",allowed).put("permissionState",state).put("communityChannel",channelAllowed("confia_community")).put("reminderChannel",channelAllowed("confia_daily")));}
 @PluginMethod public void requestNoticePermission(PluginCall call){if(Build.VERSION.SDK_INT>=33&&getPermissionState("notices")!=PermissionState.GRANTED){if(DeviceState.prefs(getContext()).getBoolean("noticePermissionAsked",false)){permissionResult(call);return;}DeviceState.prefs(getContext()).edit().putBoolean("noticePermissionAsked",true).apply();requestPermissionForAlias("notices",call,"permissionResult");}else permissionResult(call);}
 @PermissionCallback private void permissionResult(PluginCall call){call.resolve(new JSObject().put("granted",NotificationManagerCompat.from(getContext()).areNotificationsEnabled()));}
 @PluginMethod public void token(PluginCall call){try{FirebaseMessaging.getInstance().setAutoInitEnabled(true);FirebaseMessaging.getInstance().getToken().addOnCompleteListener(task->{if(task.isSuccessful()){String token=task.getResult();DeviceState.prefs(getContext()).edit().putString("fcmToken",token).apply();call.resolve(new JSObject().put("token",token));}else call.reject("token-unavailable");});}catch(Exception e){call.reject("firebase-unavailable");}}
 @PluginMethod public void configure(PluginCall call){
  SharedPreferences p=DeviceState.prefs(getContext());String owner=call.getString("owner","");String time=call.getString("time","20:30");
  if(!time.matches("([01][0-9]|2[0-3]):[0-5][0-9]")){call.reject("invalid-time");return;}
  if(!owner.equals(p.getString("owner",""))){p.edit().remove("widget").remove("lastReminderDate").remove("seenDeliveries").apply();NotificationManagerCompat.from(getContext()).cancelAll();}
  p.edit().putString("owner",owner).putBoolean("community",call.getBoolean("community",false)&&!owner.isEmpty()).putBoolean("reminder",call.getBoolean("reminder",false)).putString("time",time).putString("language",call.getString("language","pt")).putString("completedDate",call.getString("completedDate","")).apply();
  if(!p.getBoolean("community",false)){try{FirebaseMessaging.getInstance().setAutoInitEnabled(false);}catch(Exception ignored){}}
  if(!p.getBoolean("reminder",false)||NoticeScheduler.today().equals(p.getString("completedDate","")))NotificationManagerCompat.from(getContext()).cancel(6101);
  NoticeScheduler.channels(getContext());NoticeScheduler.schedule(getContext());HabitWidgetProvider.updateAll(getContext());CompanionWidgetProvider.updateAll(getContext());call.resolve();
 }
 @PluginMethod public void widget(PluginCall call){JSObject snapshot=call.getObject("snapshot",new JSObject());if(snapshot.toString().length()>2000){call.reject("invalid-widget");return;}DeviceState.prefs(getContext()).edit().putString("widget",snapshot.toString()).apply();HabitWidgetProvider.updateAll(getContext());CompanionWidgetProvider.updateAll(getContext());NoticeScheduler.scheduleMidnight(getContext());call.resolve();}
 @PluginMethod public void consumeLink(PluginCall call){SharedPreferences p=DeviceState.prefs(getContext());String url=p.getString("launchUrl","");p.edit().remove("launchUrl").apply();call.resolve(new JSObject().put("url",url));}
 @Override protected void handleOnNewIntent(Intent intent){if(intent.getData()!=null&&"confia".equals(intent.getData().getScheme()))notifyListeners("openLink",new JSObject().put("url",intent.getData().toString()),true);}
 @PluginMethod public void openNoticeSettings(PluginCall call){Intent fallback=new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS,android.net.Uri.parse("package:"+getContext().getPackageName()));Intent i=Build.VERSION.SDK_INT>=26?new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).putExtra(Settings.EXTRA_APP_PACKAGE,getContext().getPackageName()):fallback;try{getActivity().startActivity(i);call.resolve();}catch(RuntimeException first){try{getActivity().startActivity(fallback);call.resolve();}catch(RuntimeException second){call.reject("settings-unavailable");}}}
 @PluginMethod public void pinWidget(PluginCall call){boolean supported=false;if(Build.VERSION.SDK_INT>=26){AppWidgetManager m=AppWidgetManager.getInstance(getContext());supported=m.isRequestPinAppWidgetSupported();if(supported)m.requestPinAppWidget(new ComponentName(getContext(),CompanionWidgetProvider.class),null,null);}call.resolve(new JSObject().put("supported",supported));}
 @PluginMethod public void widgetInfo(PluginCall call){call.resolve(new JSObject().put("installed",CompanionWidgetProvider.hasWidgets(getContext())));}
}
