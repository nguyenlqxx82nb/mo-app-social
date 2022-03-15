package com.mobio.cdp.notification;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.SystemClock;
import android.os.Vibrator;
import android.service.notification.StatusBarNotification;
import android.util.Log;

import androidx.core.app.NotificationCompat;

import com.mobio.cdp.MainActivity;
import com.mobio.cdp.R;
import com.mobio.cdp.common.MainCommon;
import com.mobio.cdp.notification.common.Constant;
import com.mobio.cdp.notification.common.Utils;

import org.json.JSONObject;

import java.util.Map;
import java.util.Random;

import static androidx.core.content.ContextCompat.getSystemService;

public class NotificationHelper {

    public static void notifyMessage(Context context, Map<String, String> message) {
        SharedPreferences sharedPreferences = context.getSharedPreferences(Constant.PREF_NAME, context.MODE_PRIVATE);
        String authToken = sharedPreferences.getString(Constant.AUTH_TOKEN,null);
        if (Utils.checkAuthTokenExpired(authToken)) {
            return;
        }
        try {
            long[] pattern = new long[]{
                    0,300,100,300
            };
            JSONObject _dataObj = new JSONObject(message.get("data"));
            JSONObject dataObj = _dataObj.getJSONObject("data");
            // Log.d(Constant.LOG_TAG, "dataObj "+ dataObj);
            String socketType = dataObj.getString("socket_type");
            Log.d(Constant.LOG_TAG, "Socket type "+ socketType);
            if (socketType == null || MainCommon.isAppInActive) {
                return;
            }
            NotificationManager mNotificationManager;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                NotificationChannel channel = new NotificationChannel(Constant.CHANNEL_ID, Constant.CHANNEL_NAME, NotificationManager.IMPORTANCE_HIGH);
                channel.setDescription(Constant.CHANNEL_DESC);
                channel.setSound(null, null);
                channel.enableVibration(true);
                channel.setVibrationPattern(pattern);
                mNotificationManager = context.getSystemService(NotificationManager.class);
                mNotificationManager.createNotificationChannel(channel);
            } else {
                mNotificationManager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            }
            Random rand = new Random();

            Intent mainAppIntent = new Intent(context, MainActivity.class);
            String dataStr = dataObj.toString();
            mainAppIntent.putExtra("data", dataStr);
            mainAppIntent.putExtra("action", "NEW_SOCIAL_MESSAGE");
            //PendingIntent mainPendingIntent = PendingIntent.getService(context, 0, mainAppIntent, PendingIntent.FLAG_UPDATE_CURRENT);
            // Log.d(Constant.LOG_TAG, "dataStr = "+dataStr);
            PendingIntent mainPendingIntent = PendingIntent.getActivity(context, (int) (System.currentTimeMillis() & 0xfffffff),
                    mainAppIntent, PendingIntent.FLAG_UPDATE_CURRENT);
            String title = _dataObj.isNull("title") ? "" : _dataObj.getString("title");
            String body = _dataObj.isNull("body") ? "" : _dataObj.getString("body");
            NotificationCompat.Builder notificationBuilder =
                new NotificationCompat.Builder(context, Constant.CHANNEL_ID)
                    .setSmallIcon(R.drawable.icon_notification)
                    .setAutoCancel(true)
                    .setContentTitle(title).setVibrate(pattern)
                    .setContentIntent(mainPendingIntent)
                    .setContentText(body)
                    .setPriority(NotificationCompat.PRIORITY_MAX);

            Uri alarmSound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
            RingtoneManager.getRingtone(context, alarmSound).play();
            android.app.Notification messNotification = notificationBuilder.build();

            int notifyId = Constant.NOTIFY_MSG_ID + rand.nextInt(50000);
            mNotificationManager.notify(notifyId, messNotification);
        } catch (Exception ex) {
            Log.d(Constant.LOG_TAG, ex.getMessage());
        }
    }

    public static void scheduleNotification(Context context, float timeLeft, int notificationId) {
        Log.d(Constant.LOG_TAG, "scheduleNotification delay="+ timeLeft);
        NotificationManager mNotificationManager;
        long[] pattern = new long[]{
                0,300,100,300
        };
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(Constant.CHANNEL_ALARM_ID, Constant.CHANNEL_ALARM_NAME, NotificationManager.IMPORTANCE_DEFAULT);
            channel.setDescription(Constant.CHANNEL_ALARM_DESC);
            channel.setSound(null, null);
            channel.enableVibration(true);
            channel.setVibrationPattern(pattern);
            mNotificationManager = context.getSystemService(NotificationManager.class);
            mNotificationManager.createNotificationChannel(channel);
        } else {
            mNotificationManager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        }

        Intent mainAppIntent = new Intent(context, NotificationService.class);
        mainAppIntent.putExtra("action", "SCHEDULE_NOTIFICATION");
        PendingIntent mainPendingIntent = PendingIntent.getService(context, 0, mainAppIntent, PendingIntent.FLAG_UPDATE_CURRENT);

        NotificationCompat.Builder builder =
            new NotificationCompat.Builder(context, Constant.CHANNEL_ALARM_ID)
                .setSmallIcon(R.drawable.icon_notification)
                .setAutoCancel(true).setVibrate(pattern)
                .setContentTitle("Thời gian đăng nhập sắp hết hạn")
                .setContentIntent(mainPendingIntent)
                .setContentText("Thời gian đăng nhập sẽ hết hạn sau "+ timeLeft + " giờ tới.")
                .setPriority(NotificationCompat.PRIORITY_MAX);

        Notification notification = builder.build();

        Intent notificationIntent = new Intent(context, MyNotificationPublisher.class);
        notificationIntent.putExtra(MyNotificationPublisher.NOTIFICATION_ID, notificationId);
        notificationIntent.putExtra(MyNotificationPublisher.NOTIFICATION, notification);
        PendingIntent pendingIntent = PendingIntent.getBroadcast(context, notificationId, notificationIntent, PendingIntent.FLAG_CANCEL_CURRENT);

        long deltaTime = (long) ((7*24 -timeLeft)*60*60*1000);
        long alarmTimeAtUTC = System.currentTimeMillis() + deltaTime;
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, alarmTimeAtUTC, pendingIntent);
        Log.d(Constant.LOG_TAG, "alarmTimeAtUTC "+ alarmTimeAtUTC +", currentTimeMillis "+ System.currentTimeMillis() + ", timeLeft = "+ timeLeft +", delta time="+deltaTime);
    }

    public static void cancelAlarmNotification(Context context, int notificationId) {
        Intent notificationIntent = new Intent(context, MyNotificationPublisher.class);
        notificationIntent.putExtra(MyNotificationPublisher.NOTIFICATION_ID, notificationId);
        PendingIntent pendingIntent = PendingIntent.getBroadcast(context, notificationId, notificationIntent, PendingIntent.FLAG_CANCEL_CURRENT);

        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        alarmManager.cancel(pendingIntent);
    }

    public static void cancelAllNotification(Context context) {
        NotificationManager NM = (NotificationManager) context.getSystemService(context.NOTIFICATION_SERVICE);
        NM.cancelAll();
    }

}
