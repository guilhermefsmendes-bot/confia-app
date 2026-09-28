package com.confiaolhaparadentro;
import android.appwidget.*;
import android.content.*;
import android.os.Bundle;
import android.graphics.*;
import android.view.View;
import android.widget.RemoteViews;
import org.json.JSONObject;
import java.util.Calendar;
import java.text.SimpleDateFormat;
import java.util.Locale;
public class HabitWidgetProvider extends AppWidgetProvider {
 public static boolean hasWidgets(Context c){return AppWidgetManager.getInstance(c).getAppWidgetIds(new ComponentName(c,HabitWidgetProvider.class)).length>0;}
 public static void updateAll(Context c){AppWidgetManager m=AppWidgetManager.getInstance(c);for(int id:m.getAppWidgetIds(new ComponentName(c,HabitWidgetProvider.class)))update(c,m,id);}
 @Override public void onUpdate(Context c,AppWidgetManager m,int[] ids){for(int id:ids)update(c,m,id);NoticeScheduler.scheduleMidnight(c);}
 @Override public void onAppWidgetOptionsChanged(Context c,AppWidgetManager m,int id,Bundle options){update(c,m,id);}
 @Override public void onEnabled(Context c){updateAll(c);NoticeScheduler.scheduleMidnight(c);}
 @Override public void onDisabled(Context c){NoticeScheduler.scheduleMidnight(c);}
 static void update(Context c,AppWidgetManager m,int id){
  JSONObject data;try{data=new JSONObject(DeviceState.prefs(c).getString("widget","{}"));}catch(Exception e){data=new JSONObject();}
  String name=data.optString("name","");boolean active=!name.isEmpty();int days=WidgetMath.current(data.optInt("days",0),data.optString("runEnd",""),NoticeScheduler.today());Calendar now=Calendar.getInstance();long mins=WidgetMath.remainingMinutes(now);
  RemoteViews v=new RemoteViews(c.getPackageName(),R.layout.widget_habit);
  v.setImageViewBitmap(R.id.habit_landscape,landscape(days,WidgetMath.progress(now)));
  v.setTextViewText(R.id.habit_title,DeviceState.text(c,R.string.widget_title));
  v.setTextViewText(R.id.habit_day,active?DeviceState.text(c,R.string.widget_day,days):DeviceState.text(c,R.string.widget_empty));
  v.setTextViewText(R.id.habit_name,active?data.optString("icon","🌱")+" "+name:"");
  v.setTextViewText(R.id.habit_streak,active?DeviceState.text(c,R.string.widget_streak,days)+(days>=30?" 🏆":""):"");
  v.setTextViewText(R.id.habit_time,DeviceState.text(c,R.string.widget_remaining,mins/60,mins%60));
  v.setTextViewText(R.id.habit_updated,DeviceState.text(c,R.string.widget_updated,new SimpleDateFormat("HH:mm",Locale.ROOT).format(now.getTime())));
  v.setTextViewText(R.id.habit_register,DeviceState.text(c,active?R.string.widget_register:R.string.widget_choose));
  Bundle options=m.getAppWidgetOptions(id);boolean small=options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT,180)<180||options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH,220)<170;
  for(int view:new int[]{R.id.habit_register,R.id.habit_streak,R.id.habit_time})v.setViewVisibility(view,small?View.GONE:View.VISIBLE);
  for(int view:new int[]{R.id.habit_title,R.id.habit_updated})v.setViewVisibility(view,small||options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT,180)<220?View.GONE:View.VISIBLE);
  v.setTextViewTextSize(R.id.habit_day,android.util.TypedValue.COMPLEX_UNIT_SP,active?(small?25:32):16);
  v.setOnClickPendingIntent(R.id.habit_widget,NoticeScheduler.link(c,active?"confia://habits":"confia://habits/setup"));
  v.setOnClickPendingIntent(R.id.habit_register,NoticeScheduler.link(c,active?"confia://habits/log":"confia://habits/setup"));
  v.setContentDescription(R.id.habit_widget,DeviceState.text(c,R.string.widget_title)+". "+(active?DeviceState.text(c,R.string.widget_day,days)+". "+name:DeviceState.text(c,R.string.widget_empty)));
  m.updateAppWidget(id,v);
 }
 private static Bitmap landscape(int days,float progress){
  Bitmap b=Bitmap.createBitmap(400,400,Bitmap.Config.ARGB_8888);Canvas c=new Canvas(b);Paint p=new Paint(3);float stage=Math.min(1,days/30f);
  c.clipPath(round());p.setShader(new LinearGradient(0,0,0,400,Color.rgb(249,242,222),Color.rgb(225,237,217),Shader.TileMode.CLAMP));c.drawRect(0,0,400,400,p);p.setShader(null);
  p.setColor(Color.rgb(255,250,222));c.drawCircle(310,100-stage*45,32,p);
  int ring=days<3?0xffa9693b:days<7?0xff99813c:days<14?0xff819e65:0xff426e51;
  p.setColor(ring);p.setAlpha(48);Path mountain=new Path();mountain.moveTo(-20,380);mountain.lineTo(95,170);mountain.lineTo(146,245);mountain.lineTo(252,88);mountain.lineTo(425,360);mountain.lineTo(420,410);mountain.close();c.drawPath(mountain,p);
  p.setAlpha(42);Path ridge=new Path();ridge.moveTo(-20,310);ridge.lineTo(120,260);ridge.lineTo(230,330);ridge.lineTo(350,240);ridge.lineTo(420,400);ridge.lineTo(-20,420);ridge.close();c.drawPath(ridge,p);
  p.setAlpha(255);p.setColor(0xfffff9e9);p.setStyle(Paint.Style.STROKE);p.setStrokeWidth(5);Path path=new Path();path.moveTo(135,410);path.cubicTo(95,350,295,332,248,283);path.cubicTo(220,255,245,250,264,221);c.drawPath(path,p);
  p.setColor(0x99ffffff);p.setStrokeWidth(5);c.drawArc(12,12,388,388,-90,360,false,p);p.setColor(ring);p.setStrokeCap(Paint.Cap.ROUND);c.drawArc(12,12,388,388,-90,360*progress,false,p);return b;
 }
 private static Path round(){Path p=new Path();p.addRoundRect(0,0,400,400,42,42,Path.Direction.CW);return p;}
}
