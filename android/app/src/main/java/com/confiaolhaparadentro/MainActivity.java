package com.confiaolhaparadentro;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
public class MainActivity extends BridgeActivity {
 @Override protected void onCreate(Bundle state){
  registerPlugin(ConfiaDevicePlugin.class);
  if(getIntent()!=null&&getIntent().getData()!=null&&"confia".equals(getIntent().getData().getScheme()))DeviceState.prefs(this).edit().putString("launchUrl",getIntent().getData().toString()).apply();
  super.onCreate(state);
 }
}
