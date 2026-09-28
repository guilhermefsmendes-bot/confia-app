package com.confiaolhaparadentro;
import android.content.Context;
import android.content.SharedPreferences;
import android.content.res.Configuration;
import java.util.Locale;
public final class DeviceState {
 public static SharedPreferences prefs(Context c){return c.getSharedPreferences("confia_device_v1",Context.MODE_PRIVATE);}
 public static Context localized(Context c){Configuration config=new Configuration(c.getResources().getConfiguration());config.setLocale(Locale.forLanguageTag(prefs(c).getString("language","pt")));return c.createConfigurationContext(config);}
 public static String text(Context c,int id,Object...args){return localized(c).getString(id,args);}
}
