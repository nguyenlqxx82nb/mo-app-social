package com.mobio.cdp.notification;


import com.facebook.react.bridge.ActivityEventListener;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.google.android.gms.tasks.OnCompleteListener;
import com.google.firebase.iid.FirebaseInstanceId;
import com.google.firebase.iid.InstanceIdResult;

import android.app.Activity;
import android.app.NotificationManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.util.Log;

import androidx.annotation.NonNull;
import com.google.android.gms.tasks.Task;
import com.google.firebase.messaging.FirebaseMessaging;
import com.mobio.cdp.callcenter.common.Common;
import com.mobio.cdp.common.MainCommon;
import com.mobio.cdp.notification.common.Constant;
import android.provider.Settings.Secure;
import java.util.Timer;

public class PushNotificationModule extends ReactContextBaseJavaModule implements ActivityEventListener {
    private static ReactApplicationContext reactContext;

    private SharedPreferences sharedPreferences;
    private SharedPreferences.Editor editor;
    private Timer T;
    private BroadcastReceiver mReceiver;
    public PushNotificationModule(ReactApplicationContext context) {
        super(context);
        reactContext = context;
        sharedPreferences = reactContext.getSharedPreferences(Constant.PREF_NAME, reactContext.MODE_PRIVATE);
        editor = sharedPreferences.edit();
    }

    @Override
    public String getName() {
        return "PushNotification";
    }

    @Override
    public void onActivityResult(Activity activity, int requestCode, int resultCode, Intent data) {

    }

    @Override
    public void onNewIntent(Intent intent) {

    }

    @ReactMethod
    public void getRegistrationToken(Callback callback) {
        FirebaseMessaging.getInstance().getToken().addOnCompleteListener(new OnCompleteListener<String>() {
            @Override
            public void onComplete(@NonNull Task<String> task) {
                if (!task.isSuccessful()) {
                    Log.d(Constant.LOG_TAG, "getInstanceId failed", task.getException());
                    callback.invoke(null);
                    return;
                }
                // Get new FCM registration token
                String token = task.getResult();
                Log.d(Constant.LOG_TAG, token);
                callback.invoke(token);
            }
        });
    }

    @ReactMethod
    public void scheduleExpiredNotification(float hoursExpiredLeft) {
        NotificationHelper.scheduleNotification(reactContext, hoursExpiredLeft, Constant.NOTIFY_ALARM_ID);
    }

    @ReactMethod
    public void getSocialMessageData(Callback callback) {
        callback.invoke(MainCommon.messageSocialData);
    }

    @ReactMethod
    public void removeSocialMessageData() {
        MainCommon.messageSocialData = null;
    }

    @ReactMethod
    public void clear() {
        editor.clear();
        editor.commit();

        NotificationHelper.cancelAlarmNotification(reactContext, Constant.NOTIFY_ALARM_ID);
        NotificationHelper.cancelAllNotification(reactContext);
    }

    @ReactMethod
    public void getDeviceId(Callback callback) {
        String android_id = Secure.getString(reactContext.getContentResolver(), Secure.ANDROID_ID);
        Log.d(Constant.LOG_TAG, "getDeviceId "+ android_id);
        callback.invoke(android_id);
    }

    @ReactMethod
    public void setValue(String key, String value) {
        if (key == null || value == null) {
            return;
        }
        editor.putString(key, value);
        editor.commit();
    }

    @ReactMethod
    public void remove(String key) {
        if (key == null) {
            return;
        }
        editor.remove(key);
        editor.commit();
    }

    /**
     * send social event
     * @param data
     */
    public static void sendSocialEvent(String data) {
        WritableMap payload = Arguments.createMap();
        payload.putString("data", data);
        reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit("notificationSocialEvent", payload);
    }

}
