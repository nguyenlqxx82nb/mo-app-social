package com.mobio.cdp.callcenter.common;

import android.app.KeyguardManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.service.notification.StatusBarNotification;
import android.util.Log;
import android.widget.RemoteViews;

import androidx.core.app.NotificationCompat;

import com.androidnetworking.AndroidNetworking;
import com.androidnetworking.error.ANError;
import com.androidnetworking.interfaces.JSONObjectRequestListener;
import com.bumptech.glide.Glide;
import com.bumptech.glide.request.target.SimpleTarget;
import com.bumptech.glide.request.transition.Transition;
import com.mobio.cdp.callcenter.CallActivity;
import com.mobio.cdp.MainActivity;
import com.mobio.cdp.R;
import com.mobio.cdp.callcenter.CallService;

import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Random;


public class Notification {
    //replace your channel id, channel name, channel desc here
    private static final String CALL_CHANNEL_ID = "com.mobio.cdp.call.notification";
    private static final String CALL_CHANNEL_NAME = "Thông báo cuộc gọi";
    private static final String CALL_CHANNEL_GOING_NAME = "Thông báo đang có cuộc gọi";
    private static final String CALL_CHANNEL_DESC = "Kênh Mobio thông báo có cuộc gọi đến.";
    private static final String CALL_CHANNEL_GOING_DESC = "Kênh Mobio thông báo đang có cuộc gọi.";
    private static final String CALL_CHANNEL_GOING_ID = "com.mobio.cdp.call.notification.going";
    private static final String CALL_CHANNEL_MISS_CALL_ID = "com.mobio.cdp.call.notification.miss.call";

    private static Bundle getCurrentMissCallExtras(Context context) {
        Bundle extras = new Bundle();
        NotificationManager nm = (NotificationManager) context.getSystemService(context.NOTIFICATION_SERVICE);
        StatusBarNotification[] notifications =  nm.getActiveNotifications();
        for (StatusBarNotification notification : notifications) {
            if (notification.getId() == Constants.NOTIFY_CALLING_ID) {
                extras = notification.getNotification().extras;
            }
        }
        return  extras;
    }

    public static void notifyMissCall(Context context, String from) {
        NotificationManager mNotificationManager;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(CALL_CHANNEL_MISS_CALL_ID, CALL_CHANNEL_GOING_NAME, NotificationManager.IMPORTANCE_DEFAULT);
            channel.setDescription(CALL_CHANNEL_GOING_DESC);
            channel.setSound(null, null);
            mNotificationManager = context.getSystemService(NotificationManager.class);
            mNotificationManager.createNotificationChannel(channel);
        } else {
            mNotificationManager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        }
        Random rand = new Random();
        Intent intent = new Intent(context, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        PendingIntent callPendingIntent =
                PendingIntent.getService(context, (int) (System.currentTimeMillis() & 0xfffffff), intent, PendingIntent.FLAG_UPDATE_CURRENT);
        long[] pattern = {100,100};
        ArrayList<String> numberList =  new ArrayList<String>();
        Bundle currExtras = getCurrentMissCallExtras(context);
        ArrayList<String> currNumberList = currExtras.getStringArrayList("numberList");
        Log.d(Constants.LOG_TAG, "currNumberList = "+currNumberList);
        if (currNumberList == null) {
            currNumberList = new ArrayList<>();
        }
        currNumberList.add(Utils.buildMissCallMessage(from));
        Bundle extras = new Bundle();
        extras.putStringArrayList("numberList", currNumberList);
        NotificationCompat.InboxStyle inboxStyle = new NotificationCompat.InboxStyle();
        if (currNumberList.size() > 1) {
            for(int i=currNumberList.size() - 1; i >= 0; i--) {
                inboxStyle.addLine(currNumberList.get(i));
            }
        }
        String title = currNumberList.size() > 1 ? currNumberList.size() + " Cuộc gọi nhỡ" : "Cuộc gọi nhỡ";
        // Log.d(Constants.LOG_TAG, "currNumberList = "+currNumberList);
        NotificationCompat.Builder notificationBuilder =
                new NotificationCompat.Builder(context, CALL_CHANNEL_MISS_CALL_ID)
                        .setSmallIcon(R.drawable.missed_call)
                        .setVibrate(pattern)
                        .setAutoCancel(true)
                        .setContentTitle(title)
                        .setExtras(extras)
                        .setContentText(currNumberList.get(0))
                        .setPriority(NotificationCompat.PRIORITY_MAX)
                        .setCategory(NotificationCompat.CATEGORY_CALL);
                        //.addAction(R.drawable.ic_end_call, "Gọi lại", callPendingIntent);
        if (currNumberList.size() > 1) {
            notificationBuilder.setStyle(inboxStyle);
        }
        Uri alarmSound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
        RingtoneManager.getRingtone(context, alarmSound).play();
        android.app.Notification missCallNotification = notificationBuilder.build();
        //missCallNotification.sound = alarmSound;
        mNotificationManager.notify(Constants.NOTIFY_CALLING_ID, missCallNotification);
    }

    public static void notifyIncomingCall(Context context, String from, String callId) {
        KeyguardManager myKM = (KeyguardManager) context.getSystemService(Context.KEYGUARD_SERVICE);
        if(!myKM.inKeyguardRestrictedInputMode()) {
            // Log.d(Constants.LOG_TAG, "Screen is unlock");
            getProfile(from, context,
                new MyFetchListener() {
                    @Override
                    public void onFetchSuccessfully(JSONObject profile) {
                        Log.d(Constants.LOG_TAG, " Profile " + profile);
                        if (Utils.checkExistNotification(context, Constants.NOTIFY_ID)) {
                            if (profile != null) {
                                // Log.d(Constants.LOG_TAG, "notify Profile");
                                buildNotification(profile, from, context, callId);
                            }
                        }
                    }
                    @Override
                    public void onFetchError(JSONObject error) {
                        Log.d(Constants.LOG_TAG, " Profile error");
                    }
                });
        }

        buildNotification(null, from, context, callId);
        Utils.playRingtone(context);
    }

    private static void getProfile(String phoneNumber, Context context, MyFetchListener fetchListener) {
        SharedPreferences sharePreferences = context.getSharedPreferences(Constants.PREF_NAME, context.MODE_PRIVATE);
        String token = sharePreferences.getString(Constants.TOKEN, null);
        String hostPath = sharePreferences.getString(Constants.HOST_PROFILING, null);
        String merchantId = sharePreferences.getString(Constants.MERCHANT_ID, null);

        Log.d(Constants.LOG_TAG, "getProfile phoneNumber = " + phoneNumber + " , hostPath = " + hostPath + " , merchantId = " + merchantId + " , token = " + token);
        if (hostPath == null || token == null || merchantId == null) {
            return;
        }
        AndroidNetworking.get(hostPath.trim() + "search-users")
            .addQueryParameter("query", phoneNumber)
            .addQueryParameter("lang", "vi")
            .addQueryParameter("merchant_id", merchantId)
            .addHeaders("Accept", "application/json")
            .addHeaders("Content-Type", "application/json")
            .addHeaders("Authorization", "Bearer " + token)
            .addHeaders("X-Merchant-ID", merchantId)
            .build()
            .getAsJSONObject(new JSONObjectRequestListener() {
                @Override
                public void onResponse(JSONObject response) {
                    // do anything with response
                    Log.d(Constants.LOG_TAG, "onResponse OK " + response);
                    try {
                        if (response.getInt("code") == 200
                                && response.getJSONArray("customers") != null
                                && response.getJSONArray("customers").length() > 0) {
                            JSONObject item = response.getJSONArray("customers").getJSONObject(0);
                            JSONObject profile = new JSONObject();
                            profile.put("id", item.getString("id"));
                            profile.put("phoneNumber", phoneNumber);
                            profile.put("name", !item.isNull("name") ? item.getString("name") : "");
                            profile.put("avatar", !item.isNull("avatar") ? item.getString("avatar") : "");
                            Common.currProfile = profile;
                            fetchListener.onFetchSuccessfully(profile);
                        } else {
                            fetchListener.onFetchSuccessfully(null);
                        }
                    } catch (Exception ex) {
                        ex.printStackTrace();
                    }
                }
                @Override
                public void onError(ANError error) {
                    // handle error
                    Log.d(Constants.LOG_TAG, "Error Body = " + error.getErrorBody() + " detail = " + error.getErrorDetail() + " " + String.valueOf(error));
                    fetchListener.onFetchError(null);
                }
            });
    }

    private static void buildNotification(JSONObject profile, String phoneNumber, Context context, String callId) {
        try {
            long[] pattern = new long[]{
                    0,1000,500,1000,500,1000,500,1000,500,1000,500,1000,500,1000,500,1000,500,1000,500,1000,500
            };
            NotificationManager mNotificationManager;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                NotificationChannel channel = new NotificationChannel(CALL_CHANNEL_ID, CALL_CHANNEL_NAME,  NotificationManager.IMPORTANCE_HIGH);
                channel.setDescription(CALL_CHANNEL_DESC);
                channel.setSound(null, null);
                channel.enableVibration(true);
                channel.setVibrationPattern(pattern);
                mNotificationManager = context.getSystemService(NotificationManager.class);
                mNotificationManager.createNotificationChannel(channel);
            } else {
                mNotificationManager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            }

            Intent fullScreenIntent = new Intent(context, CallActivity.class);
            fullScreenIntent.putExtra("CALL_ID", callId);
            fullScreenIntent.putExtra("PHONE_NUMBER", phoneNumber);
            PendingIntent fullScreenPendingIntent = PendingIntent.getActivity(context, (int) (System.currentTimeMillis() & 0xfffffff),
                    fullScreenIntent, PendingIntent.FLAG_CANCEL_CURRENT);

            RemoteViews notifyView = new RemoteViews(context.getPackageName(), R.layout.incoming_call_notification);
            String name = profile != null ? profile.getString("name") : "";
            name = name.trim() == "" ? "Đang gọi đến" : name;
            notifyView.setTextViewText(R.id.tv_portal_name, name);
            notifyView.setTextViewText(R.id.tv_hotline,  Utils.formatPhoneNumber(phoneNumber));

            Intent rejectIntent = new Intent(context, CallService.class);
            rejectIntent.putExtra("CALL_ID", callId);
            rejectIntent.putExtra("IS_FROM_APP", Common.isFromApp);

            PendingIntent rejectPendingIntent =
                    PendingIntent.getService(context, (int) (System.currentTimeMillis() & 0xfffffff), rejectIntent, PendingIntent.FLAG_UPDATE_CURRENT);
            notifyView.setOnClickPendingIntent(R.id.v_reject, rejectPendingIntent);

            Intent answerIntent = new Intent(context, CallActivity.class);
            answerIntent.putExtra("CALL_ID", callId);
            answerIntent.putExtra("IS_ANSWER", true);
            answerIntent.putExtra("PHONE_NUMBER", phoneNumber);

            PendingIntent answerPendingIntent = PendingIntent.getActivity(context, (int) (System.currentTimeMillis() & 0xfffffff),
                    answerIntent, PendingIntent.FLAG_UPDATE_CURRENT);
            notifyView.setOnClickPendingIntent(R.id.v_answer, answerPendingIntent);

            NotificationCompat.Builder notificationBuilder =
                new NotificationCompat.Builder(context, CALL_CHANNEL_ID)
                    .setSmallIcon(R.drawable.incoming_call)
                    .setSound(null)
                    .setOngoing(true).setVibrate(pattern)
                    .setPriority(NotificationCompat.PRIORITY_MAX)
                    .setCategory(NotificationCompat.CATEGORY_CALL)
                    .setCustomContentView(notifyView)
                    .setCustomBigContentView(notifyView)
                    .setFullScreenIntent(fullScreenPendingIntent, true);
            String avatar = profile != null ? profile.getString("avatar") : null;
            android.app.Notification incomingCallNotification = notificationBuilder.build();
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
               incomingCallNotification.headsUpContentView = incomingCallNotification.bigContentView = notifyView;
            }
            if (avatar != null && avatar != "") {
                Utils.runOnUithread(new Runnable() {
                    @Override
                    public void run() {
                        Glide.with(context.getApplicationContext())
                            .asBitmap().load(avatar).circleCrop()
                            .into(new SimpleTarget<Bitmap>() {
                                @Override
                                public void onResourceReady(Bitmap res, Transition<? super Bitmap> t) {
                                    // builder.setLargeIcon(res);
                                    Log.d("Stringee", "load ok");
                                    Common.avatarBm = res;
                                    notifyView.setImageViewBitmap(R.id.iv_logo, Common.avatarBm);
                                    mNotificationManager.notify(Constants.NOTIFY_ID, incomingCallNotification);
                                }
                            });
                    }
                });
            }
            mNotificationManager.notify(Constants.NOTIFY_ID, incomingCallNotification);
        } catch (Exception ex) {
            ex.printStackTrace();
            Log.d("Stringee", ex.getMessage());
        }
    }

    public static void notifyOngoingPhone(Context context, String from, String callId, int countTime) {
        if (Common.currProfile == null) {
            getProfile(from, context,
                new MyFetchListener() {
                    @Override
                    public void onFetchSuccessfully(JSONObject profile) {
                        Log.d(Constants.LOG_TAG, " Profile " + profile);
                        if (Utils.checkExistNotification(context, Constants.NOTIFY_ON_GOING_ID)) {
                            if (profile != null) {
                                buildOngoingNotify(context, from, callId, profile, countTime);
                            }
                        }
                    }
                    @Override
                    public void onFetchError(JSONObject error) {
                        Log.d(Constants.LOG_TAG, " Profile error");
                    }
                });
        }
        buildOngoingNotify(context, from, callId, Common.currProfile, countTime);
    }

    private static void buildOngoingNotify(Context context, String from, String callId, JSONObject profile, int countTime) {
        try {
            NotificationManager mNotificationManager;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                NotificationChannel channel = new NotificationChannel(CALL_CHANNEL_GOING_ID, CALL_CHANNEL_NAME, NotificationManager.IMPORTANCE_DEFAULT);
                channel.setDescription(CALL_CHANNEL_DESC);
                channel.setSound(null, null);
                mNotificationManager = context.getSystemService(NotificationManager.class);
                mNotificationManager.createNotificationChannel(channel);
            } else {
                mNotificationManager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            }

            String name = profile != null ? profile.getString("name") : Utils.formatPhoneNumber(from);
            name = name == "" ? Utils.formatPhoneNumber(from) : name;
            String text = countTime < 0 ? "Đang gọi" : Utils.convertTime(countTime) ;

            RemoteViews notifyView = Common.isSpeaker ? new RemoteViews(context.getPackageName(), R.layout.calling_notification_2) : new RemoteViews(context.getPackageName(), R.layout.calling_notification);
            notifyView.setTextViewText(R.id.tv_name, name);
            notifyView.setTextViewText(R.id.tv_time, text);
            Intent intent = new Intent(context, CallActivity.class);

            Intent speakerIntent = new Intent(context, CallService.class);
            speakerIntent.putExtra("IS_SPEAKER", true);
            speakerIntent.putExtra("IS_SPEAKER_ON", !Common.isSpeaker);
            PendingIntent speakerPendingIntent =
                    PendingIntent.getService(context, (int) (System.currentTimeMillis() & 0xfffffff), speakerIntent, PendingIntent.FLAG_UPDATE_CURRENT);

            Intent rejectIntent = new Intent(context, CallService.class);
            rejectIntent.putExtra("CALL_ID", callId);
            PendingIntent rejectPendingIntent =
                    PendingIntent.getService(context, (int) (System.currentTimeMillis() & 0xfffffff), rejectIntent, PendingIntent.FLAG_UPDATE_CURRENT);

            notifyView.setOnClickPendingIntent(R.id.img_end_call, rejectPendingIntent);
            notifyView.setOnClickPendingIntent(R.id.img_speaker, speakerPendingIntent);

            Intent answerIntent = new Intent(context, CallActivity.class);
            answerIntent.putExtra("CALL_ID", callId);
            answerIntent.putExtra("PHONE_NUMBER", from);
            answerIntent.putExtra("IS_GOING_CALL", Common.isGoingCall);
            PendingIntent answerPendingIntent = PendingIntent.getActivity(context, (int) (System.currentTimeMillis() & 0xfffffff),
                    answerIntent, PendingIntent.FLAG_UPDATE_CURRENT);

            NotificationCompat.Builder notificationBuilder =
                    new NotificationCompat.Builder(context, CALL_CHANNEL_GOING_ID)
                        .setSmallIcon(R.drawable.incoming_call)
                        .setSound(null)
                        // .setOngoing(true)
                        .setCustomContentView(notifyView)
                        .setCustomBigContentView(notifyView)
                        .setContentIntent(answerPendingIntent)
                        .setPriority(NotificationCompat.PRIORITY_MAX)
                        .setCategory(NotificationCompat.CATEGORY_CALL);
            android.app.Notification callNotification = notificationBuilder.build();
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                callNotification.headsUpContentView = callNotification.bigContentView = notifyView;
            }
            mNotificationManager.notify(Constants.NOTIFY_ON_GOING_ID, callNotification);
        } catch (Exception ex) {
            ex.printStackTrace();
        }
    }

    private static NotificationManager createChannel(Context context) {
        NotificationManager mNotificationManager;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(CALL_CHANNEL_ID, CALL_CHANNEL_NAME, NotificationManager.IMPORTANCE_HIGH);
            channel.setDescription(CALL_CHANNEL_DESC);
            channel.setSound(null, null);
            mNotificationManager = context.getSystemService(NotificationManager.class);
            mNotificationManager.createNotificationChannel(channel);
        } else {
            mNotificationManager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        }
        return mNotificationManager;
    }


}
