package com.mobio.cdp.callcenter;

import com.facebook.react.bridge.ActivityEventListener;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.mobio.cdp.callcenter.common.Common;
import com.mobio.cdp.callcenter.common.Constants;
import com.mobio.cdp.callcenter.common.MyFetchListener;
import com.mobio.cdp.callcenter.common.MyStatusFetchListener;
import com.mobio.cdp.callcenter.common.Notification;
import com.mobio.cdp.callcenter.common.StringeeManager;
import com.mobio.cdp.callcenter.common.Utils;
import com.mobio.cdp.common.MainCommon;
import com.mobio.cdp.notification.NotificationHelper;
import com.stringee.StringeeClient;
import com.stringee.call.StringeeCall;
import com.stringee.call.StringeeCall2;
import com.stringee.exception.StringeeError;
import com.stringee.listener.StatusListener;
import com.stringee.listener.StringeeConnectionListener;

import android.app.Activity;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.util.Log;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.Map;
import java.util.Timer;
import java.util.TimerTask;

public class StringeeModule extends ReactContextBaseJavaModule implements ActivityEventListener {
    private static ReactApplicationContext reactContext;

    public static StringeeClient client;
    private SharedPreferences sharedPreferences;
    private SharedPreferences.Editor editor;
    private static Timer T;
    private static int countTime;
    private BroadcastReceiver mReceiver;
    private String mCallId;
    private boolean mOnGoingCall;
    private String mPhoneTo;
    private boolean mIsMakeCall;

    public StringeeModule(ReactApplicationContext context) {
        super(context);
        reactContext = context;
        sharedPreferences = reactContext.getSharedPreferences(Constants.PREF_NAME, reactContext.MODE_PRIVATE);
        editor = sharedPreferences.edit();
        this.registerBroadcast();
    }

    private void registerBroadcast() {
        if (mReceiver != null) {
            return;
        }
        IntentFilter intentFilter = new IntentFilter(Constants.STRINGEE_BROADCAST_CLIENT);
        mReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                String event = intent.getStringExtra("EVENT");

                Log.d(Constants.LOG_TAG, "STRINGEE_BROADCAST_CLIENT event="+event);
                switch (event) {
                    case "OnIncomingCall":
                        onIncomingCallHandler();
                        break;
                    case "OnConnectionDisConnected":
                        onConnectionDisConnectedHandler();
                        break;
                    case "OnConnectionConnected":
                        onConnectionConnectedHandler();
                        break;
                    case "OnMakeCall":
                        onMakeCallHandler(intent);
                        break;
                    case "OnEndCall":
                        onEndCallHandler(intent);
                        break;
                }
            }
        };

        reactContext.registerReceiver(mReceiver, intentFilter);
    }

    private void onConnectionDisConnectedHandler() {
        reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit("onStringeeDisConnected", null);
    }

    private void onConnectionConnectedHandler() {
        WritableMap payload3 = Arguments.createMap();
        payload3.putString("userId", Common.client.getUserId());
        reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit("onStringeeDidConnected", payload3);
    }

    private void onIncomingCallHandler() {
        try{
            if (Common.call == null) {
                return;
            }
            String callId = Common.call.getCallId();
            String from = Common.call.getFrom();
            String to = Common.call.getTo();
            String fromAlias = Common.call.getFromAlias();
            String toAlias = Common.call.getToAlias();
            int callType = 2;
            String customDataFromYourServer = Common.call.getCustomDataFromYourServer();

            WritableMap payload2 = Arguments.createMap();
            payload2.putString("callId", callId);
            payload2.putString("from", from);
            payload2.putString("to", to);
            payload2.putString("fromAlias", fromAlias);
            payload2.putString("toAlias", toAlias);
            payload2.putInt("callType", 2);
            payload2.putString("customDataFromYourServer", customDataFromYourServer);
            reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                    .emit("onStringeeIncomingCall", payload2);
        } catch (Exception ex) {
            ex.printStackTrace();
        }
    }

    private void onMakeCallHandler(Intent intent) {
        boolean openProfile = intent.getBooleanExtra("OPEN_PROFILE", false);
        String phoneNumber = intent.getStringExtra("PHONE_NUMBER");

        WritableMap payload4 = Arguments.createMap();
        payload4.putString("callId", Common.call.getCallId());
        payload4.putBoolean("openProfile", openProfile);
        payload4.putString("toPhone", phoneNumber);
        reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit("onStringeeDidMakeCall", payload4);
    }

    private void onEndCallHandler(Intent intent) {
        String callId = intent.getStringExtra("callId");
        String phoneNumber = intent.getStringExtra("phoneNumber");
        int time = intent.getIntExtra("time", 0);
        WritableMap payload = Arguments.createMap();
        payload.putString("callId", callId);
        payload.putInt("time", time);
        payload.putString("phoneNumber", phoneNumber);
        reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit("onStringeeEndCall", payload);
    }

    @Override
    public String getName() {
        return "MoCallCenter";
    }

    @Override
    public void onActivityResult(Activity activity, int requestCode, int resultCode, Intent data) {

    }

    @Override
    public void onNewIntent(Intent intent) {

    }

    @ReactMethod
    public void initAndConnect(String token) {
        Log.d(Constants.LOG_TAG, "Stringee init "+ token);
        if (Common.client != null) {
            Common.client.connect(token);
        } else {
            StringeeManager manager = new StringeeManager(reactContext);
            manager.initAndConnectStringee(token);
        }
    }

    @ReactMethod
    public void makeCall(String from, String to) {
        Intent intent = new Intent(Constants.STRINGEE_BROADCAST_CALL_ACTION);
        intent.putExtra("ACTION", "CALL");
        intent.putExtra("PHONE_TO", to);
        reactContext.sendBroadcast(intent);
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

    @ReactMethod
    public void clear() {
        unregisterPushToken();
        editor.clear();
        editor.commit();

        Utils.postDelay(new Runnable() {
            @Override
            public void run() {
                disconnect();
            }
        }, 1000);
    }

    @ReactMethod
    public void updateCurrModule(String moduleName) {
        Common.currModule = moduleName;
        Log.d(Constants.LOG_TAG, "Module name = "+Common.currModule);
    }

    private void hangup(String callId) {
        StringeeCall stringeeCall = Common.callsMap.get(callId);
        Log.d(Constants.LOG_TAG, "Hangup "+ callId);
        if (stringeeCall != null) {
            hangup(stringeeCall);
            // endCall(callId);
        } else {
            // endCall(callId);
        }
    }

    private void hangup(StringeeCall stringeeCall) {
        if (stringeeCall != null) {
            Log.d(Constants.LOG_TAG, "StringeeCall hangup 1");
            stringeeCall.hangup();
        }
    }

    private void reject(String callId) {
        StringeeCall stringeeCall = Common.callsMap.get(callId);
        if (stringeeCall != null) {
            stringeeCall.reject();
            // endCall(callId);
        } else {
            // endCall(callId);
        }
    }


    private  void disconnect() {
        if (Common.client != null) {
            Log.d(Constants.LOG_TAG, "Disconnect Stringee");
            Common.client.disconnect();
        }
    }

    private void reconnect(String token) {
        if (Common.client != null) {
            Log.d(Constants.LOG_TAG, "Reconnect Stringee token = " + token);
            if (token != null) {
                Common.client.connect(token);
            }
        }
    }

    private void unregisterPushToken() {
        if (Common.client == null ) {
            return;
        }
        Common.client.unregisterPushToken(sharedPreferences.getString(Constants.FIREBASE_TOKEN, ""), new StatusListener() {
            @Override
            public void onSuccess() {
                Log.d("Stringee", "Unregister push token successfully.");
                editor.remove(Constants.FIREBASE_TOKEN);
                editor.remove(Constants.IS_TOKEN_REGISTERED);
                editor.commit();
            }

            @Override
            public void onError(StringeeError error) {
                Log.d("Stringee", "Unregister push token unsuccessfully: " + error.getMessage());
            }
        });
    }

    public static void updateDeviceToken(String deviceToken, Context context) {
        SharedPreferences sharedPreferences = context.getSharedPreferences(Constants.PREF_NAME, reactContext.MODE_PRIVATE);
        SharedPreferences.Editor editor = sharedPreferences.edit();
        editor.putBoolean(Constants.IS_TOKEN_REGISTERED, false);
        editor.putString(Constants.FIREBASE_TOKEN, deviceToken);
        editor.commit();
        if (Common.client != null && Common.client.isConnected()) {
            Common.client.registerPushToken(deviceToken, new StatusListener() {
                @Override
                public void onSuccess() {
                    Log.d(Constants.LOG_TAG, "New register push token successfully. "+ deviceToken);
                    editor.putBoolean(Constants.IS_TOKEN_REGISTERED, true);
                    editor.putBoolean(Constants.IS_TOKEN_REGISTERED, true);
                    editor.putString(Constants.FIREBASE_TOKEN, deviceToken);
                    editor.commit();
                }
            });
        }
    }

    public static void handleIncomingMessage(Context context, Map<String, String> data) {
        String pushFromStringee = data.get("stringeePushNotification");
        SharedPreferences share = context.getSharedPreferences(Constants.PREF_NAME, context.MODE_PRIVATE);
        String accessToken = share.getString(Constants.ACCESS_TOKEN,null);
        Log.d(Constants.LOG_TAG, "Message incoming data payload: " + data + ", accessToken = "+accessToken);
        if (pushFromStringee == null || MainCommon.isAppInActive || Constants.ACCESS_TOKEN == null) {
            return;
        }
        if (!Utils.checkStringeeAccessTokenExpired(accessToken)) {
            Utils.checkValidAuthToken(context, new MyStatusFetchListener() {
                @Override
                public void onFetchStatusSuccessfully(boolean isValid) {
                    Log.d(Constants.LOG_TAG, "onFetchStatusSuccessfully "+ isValid);
                    if (!isValid) {
                        resetData(context, accessToken);
                        return;
                    } else {
                        processIncomingMessageWithToken(context, data, accessToken);
                    }
                }
            });
        }
    }

    public static void resetData(Context context, String accessToken) {
        SharedPreferences sharedPreferences = context.getSharedPreferences(Constants.PREF_NAME, reactContext.MODE_PRIVATE);
        SharedPreferences.Editor editor = sharedPreferences.edit();
        String pushToken = sharedPreferences.getString(Constants.FIREBASE_TOKEN, "");

        unregisterPushNotification(accessToken, pushToken, context);

        editor.clear();
        editor.commit();
    }

    public static void unregisterPushNotification(String accessToken, String pushToken, Context context) {
        if (Common.client != null && pushToken != null) {
            Common.client.unregisterPushToken(pushToken, new StatusListener() {
                @Override
                public void onSuccess() {
                    Common.client.disconnect();
                    Common.client = null;
                }
                @Override
                public void onError(StringeeError error) {
                    Log.d("Stringee", "Unregister push token er: " + error.getMessage());
                }
            });
            return;
        }
    }

    private static void processIncomingMessageWithToken(Context context, Map<String, String> data, String accessToken) {
        try {
            JSONObject jsonObject = new JSONObject(data.get("data"));
            String callStatus = jsonObject.optString("callStatus", null);
            String callId = jsonObject.optString("callId", null);
            String from = jsonObject.getJSONObject("from").getString("alias");
            Log.d(Constants.LOG_TAG, "onIncomingMessageReceived  isInCall=" + Common.isInCall + " from =" + from +" callStatus = "+callStatus +" callId="+callId);
            if (callId != null && callStatus != null) {
                sendBroadcastCallStatus(context, callStatus, callId);
                switch (callStatus) {
                    case "started":
                        if (Common.isInCall) {
                            return;
                        }
                        Common.isInCall = true;
                        Common.currProfile = null;
                        Common.avatarBm = null;
                        Common.callState = StringeeCall.SignalingState.CALLING;
                        //make a notification when app in background or killed
                        if (Common.client != null) {
                            Common.client.connect(accessToken);
                        } else {
                            StringeeManager manager = new StringeeManager(context);
                            manager.initAndConnectStringee(accessToken);
                        }
                        Notification.notifyIncomingCall(context, from, callId);
                        // startIncomingCallTimer(context);
                        break;
                    case "answered":
                        // stopIncomingCallTimer();
                        removeNotify(context);
                        break;
                    case "ended":
                        // stopIncomingCallTimer();
                        Utils.removeNotify(context, Constants.NOTIFY_ON_GOING_ID);
                        removeNotify(context);
                        Common.isInCall = false;
                        break;
                    case "agentEnded":
                        // stopIncomingCallTimer();
                        if (!Common.isInCall) {
                            Utils.removeNotify(context, Constants.NOTIFY_ON_GOING_ID);
                            break;
                        }
                        removeNotify(context);
                        Common.isInCall = false;
                        break;
                }
            }
        } catch (JSONException e) {
            e.printStackTrace();
        }
    }

    private static void sendBroadcastCallStatus(Context context, String callStatus, String callId) {
        Intent intent = new Intent(Constants.CALL_STATUS_INTENT);
        intent.putExtra("CALL_STATUS", callStatus);
        intent.putExtra("CALL_ID", callId);

        context.sendBroadcast(intent);
    }

    private static void removeNotify(Context context) {
        //remove notification
        Utils.stopRingtone();
        Utils.removeNotify(context, Constants.NOTIFY_ID);
    }

    private static void startIncomingCallTimer(Context context) {
        countTime = 0;
        Log.d(Constants.LOG_TAG, "startIncomingCallTimer "+countTime);
        T=new Timer();
        T.scheduleAtFixedRate(new TimerTask() {
            @Override
            public void run() {
                if (countTime > 30 && Common.isInCall) {
                    Log.d(Constants.LOG_TAG, "timeout incoming call "+countTime);
                    Utils.removeNotify(context, Constants.NOTIFY_ON_GOING_ID);
                    removeNotify(context);
                    Common.isInCall = false;
                    countTime = 0;
                    stopIncomingCallTimer();
                    return;
                }
                countTime++;
            }
        }, 1000, 1000);
    }

    private static void stopIncomingCallTimer() {
        if (T != null) {
            T.cancel();
            T = null;
        }
    }

}
