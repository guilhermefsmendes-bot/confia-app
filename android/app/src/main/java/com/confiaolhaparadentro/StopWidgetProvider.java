package com.confiaolhaparadentro;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.widget.RemoteViews;

public class StopWidgetProvider extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context,
                         AppWidgetManager appWidgetManager,
                         int[] appWidgetIds) {

        for (int appWidgetId : appWidgetIds) {

            Intent intent = new Intent(
                    Intent.ACTION_VIEW,
                    Uri.parse("confia://stop")
            );

            PendingIntent pendingIntent = PendingIntent.getActivity(
                    context,
                    0,
                    intent,
                    PendingIntent.FLAG_IMMUTABLE
            );

            RemoteViews views = new RemoteViews(
                    context.getPackageName(),
                    R.layout.widget_stop
            );

            views.setOnClickPendingIntent(
                    R.id.stop_button,
                    pendingIntent
            );

            appWidgetManager.updateAppWidget(
                    appWidgetId,
                    views
            );
        }
    }
}
