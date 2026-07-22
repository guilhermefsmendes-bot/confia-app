package com.confiaolhaparadentro;

import android.os.Bundle;
import android.content.Intent;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        handleIntent(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        handleIntent(intent);
    }

    private void handleIntent(Intent intent) {
        if (intent != null && intent.getData() != null) {
            String url = intent.getData().toString();

            if (url.contains("stop")) {
                getBridge().getWebView().evaluateJavascript(
                    "window.location.hash='#stop';",
                    null
                );
            }
        }
    }
}
