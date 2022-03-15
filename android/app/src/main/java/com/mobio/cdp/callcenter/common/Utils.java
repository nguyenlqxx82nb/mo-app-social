package com.mobio.cdp.callcenter.common;

import android.app.KeyguardManager;
import android.app.NotificationManager;
import android.content.Context;
import android.content.SharedPreferences;
import android.media.MediaPlayer;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Handler;
import android.os.Looper;
import android.os.PowerManager;
import android.os.Vibrator;
import android.service.notification.StatusBarNotification;
import android.util.Log;
import android.view.Gravity;
import android.widget.Toast;
import android.util.Base64; //org.apache.commons.codec.binary.Base64;
import org.json.JSONObject;

import java.text.SimpleDateFormat;
import java.util.Date;

import com.androidnetworking.AndroidNetworking;
import com.androidnetworking.error.ANError;
import com.androidnetworking.interfaces.JSONObjectRequestListener;
import com.mobio.cdp.R;

import java.util.Set;

public class Utils {

    private static PowerManager powerManager;
    private static PowerManager.WakeLock wakeLock;
    private static KeyguardManager.KeyguardLock lock;
    private static MediaPlayer player;
    private static SharedPreferences sharePreferences;

    public static void reportMessage(Context context, String message) {
        Toast toast = Toast.makeText(context, message, Toast.LENGTH_LONG);
        toast.setGravity(Gravity.CENTER, 0, 0);
        toast.show();
    }

    public static void postDelay(Runnable runnable, long delayMillis) {
        Handler handler = new Handler(Looper.getMainLooper());
        handler.postDelayed(runnable, delayMillis);
    }

    public static void runOnUithread(Runnable runnable) {
        Handler handler = new Handler(Looper.getMainLooper());
        handler.post(runnable);
    }

    public static void initSound(Context context) {
        runOnUithread(new Runnable() {
            @Override
            public void run() {
                if (Common.audioManager == null) {
                    Common.audioManager = StringeeAudioManager.create(context);
                    Common.audioManager.start(new StringeeAudioManager.AudioManagerEvents() {
                        @Override
                        public void onAudioDeviceChanged(StringeeAudioManager.AudioDevice selectedAudioDevice, Set<StringeeAudioManager.AudioDevice> availableAudioDevices) {
                            Common.audioManager.setSpeakerphoneOn(false);
                        }
                    });
                } else {
                    Common.audioManager.setSpeakerphoneOn(false);
                }
            }
        });
    }

    public static boolean checkExistNotification(Context context, int notifyId) {
        NotificationManager nm = (NotificationManager) context.getSystemService(context.NOTIFICATION_SERVICE);
        StatusBarNotification[] notifications =  nm.getActiveNotifications();
        for (StatusBarNotification notification : notifications) {
            if (notification.getId() == notifyId) {
                return true;
            }
        }
        return false;
    }

    public static void settingWakeLock(Context context) {
        Log.d(Constants.LOG_TAG, "settingWakeLock");
        lock = ((android.app.KeyguardManager) context.getSystemService(context.KEYGUARD_SERVICE)).newKeyguardLock(context.KEYGUARD_SERVICE);
        lock.disableKeyguard();

        powerManager = ((PowerManager) context.getSystemService(android.content.Context.POWER_SERVICE));
        int screenLockValue;

        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.LOLLIPOP) {
            screenLockValue = PowerManager.PROXIMITY_SCREEN_OFF_WAKE_LOCK;
        } else {
            try {
                screenLockValue = PowerManager.class.getField("PROXIMITY_SCREEN_OFF_WAKE_LOCK").getInt(null);
            } catch (Exception exc) {
                screenLockValue = 32; // default integer value of PROXIMITY_SCREEN_OFF_WAKE_LOCK
            }
        }
        wakeLock = powerManager.newWakeLock(screenLockValue, "com:mobio:cdp:incoming");

        wakeLock.acquire();
    }

    public static void releaseWakeLock() {
        try {
            if (wakeLock !=null && wakeLock.isHeld()) {
                wakeLock.release();
            }
        } catch (Exception e) {
            // just to make sure if the PowerManager crashes while acquiring a wake lock
            e.printStackTrace();
            Log.d(Constants.LOG_TAG, "on ex = "+e.getMessage());
        }
    }

    public static void removeNotify(Context context, int notifyId) {
        //remove notification
        Utils.stopRingtone();
        NotificationManager nm = (NotificationManager) context.getSystemService(context.NOTIFICATION_SERVICE);
        nm.cancel(notifyId);
    }

    public static String convertTime(int count) {
        int minute = (int)Math.floor(count / 60);
        int second = count - minute*60;
        String _m = minute < 10 ? "0"+minute : ""+minute;
        String _s = second < 10 ? "0"+second : ""+second;

        return _m +":"+_s;
    }

    public static String formatPhoneNumber(String phoneNumber) {
        if (phoneNumber == null) {
            return "";
        }
        String _phoneNumber = phoneNumber.replace("+84","0");
        StringBuilder sb = new StringBuilder(15);
        StringBuilder temp = new StringBuilder(_phoneNumber.toString());

        if (temp.length() < 7 || !isNumeric(_phoneNumber)) {
            return _phoneNumber;
        }

        char[] chars = temp.toString().toCharArray();
        for (int i = 0; i < chars.length; i++) {
            if (i == 3)
                sb.append(" ");
            else if (i == 6)
                sb.append(" ");
            sb.append(chars[i]);
        }

        return sb.toString();
    }

    public static boolean isNumeric(String strNum) {
        if (strNum == null) {
            return false;
        }
        try {
            double d = Double.parseDouble(strNum);
        } catch (NumberFormatException nfe) {
            return false;
        }
        return true;
    }

    public static String buildMissCallMessage(String phone) {
        String pattern = "HH:mm";
        SimpleDateFormat simpleDateFormat = new SimpleDateFormat(pattern);

        String date = simpleDateFormat.format(new Date());
        return "Từ số "+ formatPhoneNumber(phone) + "  vào lúc " + date;
    }

    public static void initSoundManager(Context context) {
        Utils.runOnUithread(new Runnable() {
            @Override
            public void run() {
                try {
                    if (Common.audioManager == null) {
                        Common.audioManager = StringeeAudioManager.create(context);
                        Common.audioManager.start(new StringeeAudioManager.AudioManagerEvents() {
                            @Override
                            public void onAudioDeviceChanged(StringeeAudioManager.AudioDevice selectedAudioDevice, Set<StringeeAudioManager.AudioDevice> availableAudioDevices) {
                                Log.d("StringeeAudioManager", "onAudioManagerDevicesChanged: " + availableAudioDevices + ", "
                                        + "selected: " + selectedAudioDevice);
                                Common.audioManager.setSpeakerphoneOn(false);
                            }
                        });
                    } else {
                        Common.audioManager.setSpeakerphoneOn(false);
                    }
                } catch (Exception ex) {
                    ex.printStackTrace();
                }

            }
        });
    }

    public static void playEndSound(Context context) {
        try {
            Common.endCallRing = RingtoneManager.getRingtone(context,  Uri.parse("android.resource://"+context.getPackageName()+ "/"+ R.raw.endcall));
            Common.endCallRing.play();
        } catch (Exception ex) {
            ex.printStackTrace();
        }
    }

    public static void stopEndSound() {
        try {
            if (Common.endCallRing != null) {
                Common.endCallRing.stop();
            }
        } catch (Exception ex) {
            ex.printStackTrace();
        }
    }

    public static void playRingtone(Context context) {
        runOnUithread(new Runnable() {
            @Override
            public void run() {
                try {
                    if (Common.audioManager == null) {
                        Common.audioManager = StringeeAudioManager.create(context);
                        Common.audioManager.start(new StringeeAudioManager.AudioManagerEvents() {
                            @Override
                            public void onAudioDeviceChanged(StringeeAudioManager.AudioDevice selectedAudioDevice, Set<StringeeAudioManager.AudioDevice> availableAudioDevices) {
                            }
                        });
                    }
                    if (Common.ringtone == null) {
                        sharePreferences = context.getSharedPreferences(Constants.PREF_NAME, context.MODE_PRIVATE);
                        String ringToneUrl = sharePreferences.getString("RING_TONE", "");
                        Log.d(Constants.LOG_TAG, "RING TONE "+ringToneUrl);
                        Uri ringtoneUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE);
                        Common.ringtone = RingtoneManager.getRingtone(context, ringtoneUri);
                        Common.ringtone.play();
                    } else {
                        Common.ringtone.play();
                    }
                } catch (Exception ex) {
                    ex.printStackTrace();
                }
            }
        });
    }

    public static void stopRingtone() {
        Utils.runOnUithread(new Runnable() {
            @Override
            public void run() {
                try {
                    if (Common.ringtone != null) {
                        Common.ringtone.stop();
                        Common.ringtone = null;
                    }
                } catch (Exception ex) {
                    ex.printStackTrace();
                }

            }
        });
    }

    public static boolean checkStringeeAccessTokenExpired(String accessToken) {
        try {
            if (accessToken == null) {
                return true;
            }
            String[] split_string = accessToken.split("\\.");
            String base64EncodedHeader = split_string[0];
            String base64EncodedBody = split_string[1];

            // Base64 base64Url = new Base64(true);
            byte[] decodedBytes = Base64.decode(base64EncodedBody, Base64.DEFAULT); //new String(base64Url.decode(base64EncodedBody));
            String decodedBodyString = new String(decodedBytes);
            JSONObject obj = new JSONObject(decodedBodyString);
            int exp = obj.getInt("exp");
            Date date = new Date();
            int now =  (int)Math.ceil(date.getTime() / 1000);
            if (now >= exp) {
                return true;
            }
            Log.d(Constants.LOG_TAG, "now =" + now + ", int = "+ obj.getInt("exp"));

        } catch (Exception ex) {
            ex.printStackTrace();
            return true;
        }
        return false;
    }

    public static void startVibration(Context context) {
        long[] pattern = new long[]{
                0,1000,500,1000,500,1000,500,1000,500,1000,500
        };
        Vibrator vibrator = (Vibrator) context.getSystemService(Context.VIBRATOR_SERVICE);
        vibrator.vibrate(pattern,  0); // repeats forever
    }

    public static void stopVibration(Context context) {
        Vibrator vibrator = (Vibrator) context.getSystemService(Context.VIBRATOR_SERVICE);
        vibrator.cancel();
    }

    public static void getAccessToken(Context context, MyFetchListener fetchListener) {
        try {
            sharePreferences = context.getSharedPreferences(Constants.PREF_NAME, context.MODE_PRIVATE);
            String token = sharePreferences.getString(Constants.TOKEN, null);
            String hostPath = sharePreferences.getString(Constants.HOST_CALL_CENTER, null);
            String merchantId = sharePreferences.getString(Constants.MERCHANT_ID, null);
            String staff_id = sharePreferences.getString(Constants.STAFF_ID, null);

            Log.d(Constants.LOG_TAG, "getAccessToken hostPath=" + hostPath +",staff_id=" + staff_id + ",merchantId="+merchantId+"token=" + token);
            if (hostPath == null || token == null) {
                return;
            }
            JSONObject data = new JSONObject();
            data.put("type", 1);
            data.put("staff_id", staff_id);
            AndroidNetworking.post(hostPath+"access_token")
                    .addQueryParameter("lang", "vi")
                    .addJSONObjectBody(data)
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
                                if (response.getInt("code") == 200) {
                                    fetchListener.onFetchSuccessfully(response.getJSONObject("data"));
                                } else {
                                    fetchListener.onFetchSuccessfully(null);
                                }
                            } catch (Exception ex) {
                                fetchListener.onFetchError(null);
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
        } catch (Exception ex) {
            ex.printStackTrace();
        }
    }

    public static void checkValidAuthToken(Context context, MyStatusFetchListener fetchListener) {
        try {
            sharePreferences = context.getSharedPreferences(Constants.PREF_NAME, context.MODE_PRIVATE);
            String token = sharePreferences.getString(Constants.TOKEN, null);
            String hostPath = sharePreferences.getString(Constants.HOST_ADM, null);
            String merchantId = sharePreferences.getString(Constants.MERCHANT_ID, null);

            Log.d(Constants.LOG_TAG, "getAccessToken hostPath=" + hostPath + ",merchantId="+merchantId+"token=" + token);
            if (hostPath == null || token == null) {
                fetchListener.onFetchStatusSuccessfully(false);
            }
            AndroidNetworking.get(hostPath+"jwt/action/status")
                // .addQueryParameter("lang", "vi")
                .addQueryParameter("jwt", "Bearer " + token)
                .addHeaders("Accept", "application/json")
                // .addHeaders("Content-Type", "application/json")
                //.addHeaders("Authorization", "Bearer " + token)
                // .addHeaders("X-Merchant-ID", merchantId)
                .build()
                .getAsJSONObject(new JSONObjectRequestListener() {
                    @Override
                    public void onResponse(JSONObject response) {
                        // do anything with response
                        Log.d(Constants.LOG_TAG, "checkValidAuthToken status OK " + response);
                        try {
                            if (response.getInt("code") == 200) {
                                boolean status = response.getBoolean("status");
                                fetchListener.onFetchStatusSuccessfully(status);
                            } else {
                                fetchListener.onFetchStatusSuccessfully(false);
                            }
                        } catch (Exception ex) {
                            fetchListener.onFetchStatusSuccessfully(false);
                            ex.printStackTrace();
                        }
                    }

                    @Override
                    public void onError(ANError error) {
                        // handle error
                        Log.d(Constants.LOG_TAG, "Error Body = " + error.getErrorBody() + " detail = " + error.getErrorDetail() + " " + String.valueOf(error));
                        fetchListener.onFetchStatusSuccessfully(false);
                    }
                });
        } catch (Exception ex) {
            ex.printStackTrace();
            fetchListener.onFetchStatusSuccessfully(false);
        }

    }


}
