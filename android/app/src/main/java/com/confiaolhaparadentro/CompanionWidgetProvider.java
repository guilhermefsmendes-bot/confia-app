package com.confiaolhaparadentro;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.LinearGradient;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.Shader;
import android.view.View;
import android.widget.RemoteViews;

import org.json.JSONArray;
import org.json.JSONObject;

public class CompanionWidgetProvider extends AppWidgetProvider {
    public static boolean hasWidgets(Context context) {
        return AppWidgetManager.getInstance(context)
                .getAppWidgetIds(new ComponentName(context, CompanionWidgetProvider.class)).length > 0;
    }

    private static final String ACTION_TOGGLE = "com.confiaolhaparadentro.COMPANION_WIDGET_TOGGLE";
    private static final String ACTION_DONE = "com.confiaolhaparadentro.COMPANION_WIDGET_DONE";

    public static void updateAll(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        int[] ids = manager.getAppWidgetIds(new ComponentName(context, CompanionWidgetProvider.class));
        for (int id : ids) update(context, manager, id);
    }

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
        for (int id : ids) update(context, manager, id);
        NoticeScheduler.scheduleMidnight(context);
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        String action = intent.getAction();
        int id = intent.getIntExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, AppWidgetManager.INVALID_APPWIDGET_ID);
        if (id == AppWidgetManager.INVALID_APPWIDGET_ID) return;

        if (ACTION_TOGGLE.equals(action)) {
            String key = "companion_widget_expanded_" + id;
            boolean expanded = DeviceState.prefs(context).getBoolean(key, false);
            DeviceState.prefs(context).edit().putBoolean(key, !expanded).apply();
            update(context, AppWidgetManager.getInstance(context), id);
        } else if (ACTION_DONE.equals(action)) {
            String day = NoticeScheduler.today();
            String progressDayKey = "companion_widget_objectives_day_" + id;
            String progressCountKey = "companion_widget_objectives_count_" + id;
            int count = day.equals(DeviceState.prefs(context).getString(progressDayKey, ""))
                    ? DeviceState.prefs(context).getInt(progressCountKey, 0)
                    : 0;
            int appCompleted = 0;
            try {
                JSONObject widget = new JSONObject(DeviceState.prefs(context).getString("widget", "{}"));
                JSONArray objectives = widget.optJSONArray("objectives");
                if (objectives != null) {
                    for (int i = 0; i < Math.min(5, objectives.length()); i++) {
                        JSONObject objective = objectives.optJSONObject(i);
                        if (objective != null && objective.optBoolean("completed", false)) appCompleted++;
                    }
                }
            } catch (Exception ignored) {}
            DeviceState.prefs(context).edit()
                    .putString(progressDayKey, day)
                    .putInt(progressCountKey, Math.min(5, Math.max(count, appCompleted) + 1))
                    .apply();
            update(context, AppWidgetManager.getInstance(context), id);
        }
    }

    @Override
    public void onDeleted(Context context, int[] appWidgetIds) {
        for (int id : appWidgetIds) {
            DeviceState.prefs(context).edit()
                    .remove("companion_widget_expanded_" + id)
                    .remove("companion_widget_objectives_day_" + id)
                    .remove("companion_widget_objectives_count_" + id)
                    .apply();
        }
    }

    private static PendingIntent broadcast(Context context, String action, int id, int requestCode) {
        Intent intent = new Intent(context, CompanionWidgetProvider.class);
        intent.setAction(action);
        intent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, id);
        return PendingIntent.getBroadcast(
                context,
                requestCode + id,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
    }

    static void update(Context context, AppWidgetManager manager, int id) {
        JSONObject data;
        try {
            data = new JSONObject(DeviceState.prefs(context).getString("widget", "{}"));
        } catch (Exception ignored) {
            data = new JSONObject();
        }

        String name = data.optString("name", "");
        boolean active = !name.isEmpty();
        int days = WidgetMath.current(
                data.optInt("days", 0),
                data.optString("runEnd", ""),
                NoticeScheduler.today()
        );
        int level = Math.max(1, Math.min(10, data.optInt("level", 1)));

        boolean expanded = DeviceState.prefs(context)
                .getBoolean("companion_widget_expanded_" + id, false);

        String today = NoticeScheduler.today();
        String progressDayKey = "companion_widget_objectives_day_" + id;
        String progressCountKey = "companion_widget_objectives_count_" + id;
        int widgetProgress = today.equals(DeviceState.prefs(context).getString(progressDayKey, ""))
                ? DeviceState.prefs(context).getInt(progressCountKey, 0)
                : 0;

        JSONArray objectives = data.optJSONArray("objectives");
        int appCompleted = 0;
        if (objectives != null) {
            for (int i = 0; i < Math.min(5, objectives.length()); i++) {
                JSONObject objective = objectives.optJSONObject(i);
                if (objective != null && objective.optBoolean("completed", false)) appCompleted++;
            }
        }
        int completed = Math.min(5, Math.max(widgetProgress, appCompleted));
        boolean allDone = completed >= 5;
        String objectiveIcon = "✨";
        if (!allDone && objectives != null && objectives.length() > 0) {
            JSONObject current = objectives.optJSONObject(Math.min(completed, objectives.length() - 1));
            if (current != null) objectiveIcon = current.optString("icon", "✨");
        }

        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_companion);
        views.setViewVisibility(R.id.companion_collapsed, expanded ? View.GONE : View.VISIBLE);
        views.setViewVisibility(R.id.companion_expanded, expanded ? View.VISIBLE : View.GONE);

        views.setImageViewBitmap(R.id.companion_avatar, avatarBitmap(level, allDone));
        views.setImageViewBitmap(R.id.companion_avatar_badge, avatarBitmap(level, allDone));

        views.setTextViewText(R.id.companion_days_badge, active ? String.valueOf(days) : "—");
        views.setTextViewText(R.id.companion_objective_badge, allDone ? "✓" : objectiveIcon);
        views.setTextViewText(
                R.id.companion_days,
                active ? DeviceState.text(context, R.string.companion_widget_days, days)
                        : DeviceState.text(context, R.string.companion_widget_no_habit)
        );
        views.setTextViewText(R.id.companion_action_icon, allDone ? "✓" : objectiveIcon);
        views.setTextViewText(
                R.id.companion_progress,
                DeviceState.text(context, R.string.companion_widget_progress, Math.min(5, completed + (allDone ? 0 : 1)), 5)
        );
        views.setTextViewText(
                R.id.companion_done,
                allDone ? DeviceState.text(context, R.string.companion_widget_all_done)
                        : DeviceState.text(context, R.string.companion_widget_done)
        );
        views.setViewVisibility(R.id.companion_done, allDone ? View.GONE : View.VISIBLE);

        views.setOnClickPendingIntent(
                R.id.companion_collapsed,
                broadcast(context, ACTION_TOGGLE, id, 1000)
        );
        views.setOnClickPendingIntent(
                R.id.companion_avatar_badge,
                broadcast(context, ACTION_TOGGLE, id, 2000)
        );
        views.setOnClickPendingIntent(
                R.id.companion_done,
                broadcast(context, ACTION_DONE, id, 3000)
        );
        views.setOnClickPendingIntent(
                R.id.companion_days_tile,
                NoticeScheduler.link(context, active ? "confia://habits" : "confia://habits/setup")
        );

        views.setContentDescription(
                R.id.companion_collapsed,
                DeviceState.text(context, R.string.companion_widget_description)
        );

        manager.updateAppWidget(id, views);
    }

    private static Bitmap avatarBitmap(int level, boolean celebrating) {
        Bitmap bitmap = Bitmap.createBitmap(240, 240, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bitmap);
        Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG);

        int stage = level == 1 ? 1 : level <= 3 ? 2 : level <= 5 ? 3 : level <= 8 ? 4 : 5;
        float inset = stage == 1 ? 49f : stage == 2 ? 55f : stage == 3 ? 50f : stage == 4 ? 45f : 39f;
        float top = stage == 1 ? 56f : stage == 2 ? 68f : stage == 3 ? 61f : stage == 4 ? 55f : 48f;
        float bottom = stage == 1 ? 214f : stage == 2 ? 207f : stage == 3 ? 212f : stage == 4 ? 218f : 224f;

        if (stage >= 3) {
            paint.setColor(Color.rgb(231, 164, 133));
            Path leftEar = new Path();
            leftEar.moveTo(66, 79); leftEar.lineTo(49, 47); leftEar.lineTo(86, 68); leftEar.close();
            Path rightEar = new Path();
            rightEar.moveTo(174, 79); rightEar.lineTo(191, 47); rightEar.lineTo(154, 68); rightEar.close();
            canvas.drawPath(leftEar, paint);
            canvas.drawPath(rightEar, paint);
        }

        paint.setShader(new LinearGradient(
                60, 48, 180, 220,
                Color.rgb(246, 212, 194),
                Color.rgb(200, 115, 91),
                Shader.TileMode.CLAMP
        ));
        canvas.drawOval(inset, top, 240f - inset, bottom, paint);
        paint.setShader(null);

        paint.setColor(Color.rgb(255, 248, 241));
        paint.setAlpha(stage == 1 ? 120 : 92);
        canvas.drawOval(74, top + 20, 132, top + 84, paint);
        paint.setAlpha(255);

        paint.setColor(Color.rgb(255, 249, 243));
        canvas.drawOval(stage >= 4 ? 70 : 76, stage >= 4 ? 140 : 136, stage >= 4 ? 170 : 164, bottom - 9, paint);

        paint.setColor(Color.rgb(74, 56, 51));
        if (stage == 1) {
            paint.setStyle(Paint.Style.STROKE);
            paint.setStrokeWidth(6);
            paint.setStrokeCap(Paint.Cap.ROUND);
            Path left = new Path();
            left.moveTo(76, 116); left.quadTo(91, 126, 104, 116);
            Path right = new Path();
            right.moveTo(136, 116); right.quadTo(149, 126, 164, 116);
            canvas.drawPath(left, paint);
            canvas.drawPath(right, paint);
            paint.setStyle(Paint.Style.FILL);
        } else if (celebrating) {
            paint.setStyle(Paint.Style.STROKE);
            paint.setStrokeWidth(7);
            paint.setStrokeCap(Paint.Cap.ROUND);
            Path left = new Path();
            left.moveTo(76, 116); left.quadTo(91, 103, 104, 116);
            Path right = new Path();
            right.moveTo(136, 116); right.quadTo(149, 103, 164, 116);
            canvas.drawPath(left, paint);
            canvas.drawPath(right, paint);
            paint.setStyle(Paint.Style.FILL);
        } else {
            float eye = stage >= 4 ? 8f : 7f;
            canvas.drawCircle(91, 116, eye, paint);
            canvas.drawCircle(149, 116, eye, paint);
        }

        paint.setColor(Color.rgb(216, 119, 112));
        paint.setAlpha(72);
        canvas.drawOval(62, 132, 83, 144, paint);
        canvas.drawOval(157, 132, 178, 144, paint);
        paint.setAlpha(255);

        if (stage > 1) {
            paint.setColor(Color.rgb(92, 63, 53));
            paint.setStyle(Paint.Style.STROKE);
            paint.setStrokeWidth(5);
            paint.setStrokeCap(Paint.Cap.ROUND);
            Path smile = new Path();
            smile.moveTo(103, 148);
            smile.quadTo(120, celebrating ? 166 : 158, 137, 148);
            canvas.drawPath(smile, paint);
            paint.setStyle(Paint.Style.FILL);
        }

        if (stage >= 4) {
            paint.setColor(Color.rgb(200, 115, 91));
            paint.setStyle(Paint.Style.STROKE);
            paint.setStrokeWidth(stage == 5 ? 12 : 9);
            paint.setStrokeCap(Paint.Cap.ROUND);
            Path tail = new Path();
            tail.moveTo(176, 174);
            tail.cubicTo(212, 158, 213, 201, 184, 201);
            canvas.drawPath(tail, paint);
            paint.setStyle(Paint.Style.FILL);
        }

        Path flame = new Path();
        float flameTop = stage >= 5 ? 19 : stage >= 3 ? 24 : 30;
        flame.moveTo(120, flameTop);
        flame.cubicTo(103, 47, 106, 64, 120, 75);
        flame.cubicTo(134, 64, 137, 47, 120, flameTop);
        flame.close();
        paint.setShader(new LinearGradient(
                120, flameTop, 120, 76,
                Color.rgb(255, 233, 168),
                Color.rgb(198, 101, 80),
                Shader.TileMode.CLAMP
        ));
        canvas.drawPath(flame, paint);
        paint.setShader(null);

        return bitmap;
    }
}
