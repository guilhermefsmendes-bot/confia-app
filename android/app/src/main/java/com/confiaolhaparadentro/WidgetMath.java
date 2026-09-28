package com.confiaolhaparadentro;
import java.text.SimpleDateFormat;
import java.util.*;
public final class WidgetMath {
 public static int current(int saved,String runEnd,String today){if(saved<=0||runEnd.isEmpty())return 0;try{SimpleDateFormat f=new SimpleDateFormat("yyyy-MM-dd",Locale.ROOT);f.setTimeZone(TimeZone.getTimeZone("UTC"));f.setLenient(false);long gap=(f.parse(today).getTime()-f.parse(runEnd).getTime())/86400000L;return gap>=0&&gap<=2?saved:0;}catch(Exception e){return 0;}}
 public static long remainingMinutes(Calendar now){Calendar end=(Calendar)now.clone();end.add(Calendar.DAY_OF_YEAR,1);end.set(Calendar.HOUR_OF_DAY,0);end.set(Calendar.MINUTE,0);end.set(Calendar.SECOND,0);end.set(Calendar.MILLISECOND,0);return Math.max(0,(end.getTimeInMillis()-now.getTimeInMillis()+59999)/60000);}
 public static float progress(Calendar now){Calendar start=(Calendar)now.clone();start.set(Calendar.HOUR_OF_DAY,0);start.set(Calendar.MINUTE,0);start.set(Calendar.SECOND,0);start.set(Calendar.MILLISECOND,0);Calendar end=(Calendar)start.clone();end.add(Calendar.DAY_OF_YEAR,1);return Math.max(0,Math.min(1,(float)(now.getTimeInMillis()-start.getTimeInMillis())/(end.getTimeInMillis()-start.getTimeInMillis())));}
}
