package com.mobio.cdp.notification;

import android.app.IntentService;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Intent;
import android.util.Log;

import androidx.annotation.Nullable;

import com.mobio.cdp.MainActivity;

public class NotificationService extends IntentService {

    public NotificationService() {
        super("com.mobio.cdp.notification.service");
    }

    @Override
    protected void onHandleIntent(@Nullable Intent intent) {
        try {
            String data = intent.getStringExtra("data");
            String action = intent.getStringExtra("action");
            Log.d("onHandleIntent ", "notification service "+action);
            Intent mainIntent = new Intent(this, MainActivity.class);
            mainIntent.setAction(action);
            mainIntent.putExtra("data", data);
            mainIntent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);
            PendingIntent pendingIntent = PendingIntent.getActivity(this, (int) (System.currentTimeMillis() & 0xfffffff),
                    mainIntent, PendingIntent.FLAG_UPDATE_CURRENT);
            pendingIntent.send();
        } catch (Exception ex) {
            Log.d("onHandleIntent ", ex.getMessage());
        }
    }
}