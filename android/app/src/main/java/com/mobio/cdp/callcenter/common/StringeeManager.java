package com.mobio.cdp.callcenter.common;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.util.Log;
import android.widget.Toast;

import androidx.annotation.NonNull;

import com.google.android.gms.tasks.OnCompleteListener;
import com.google.android.gms.tasks.Task;
import com.google.firebase.iid.FirebaseInstanceId;
import com.google.firebase.iid.InstanceIdResult;
import com.mobio.cdp.callcenter.CallActivity;
import com.mobio.cdp.common.MainCommon;
import com.stringee.StringeeClient;
import com.stringee.call.StringeeCall;
import com.stringee.call.StringeeCall2;
import com.stringee.exception.StringeeError;
import com.stringee.listener.StatusListener;
import com.stringee.listener.StringeeConnectionListener;

import org.json.JSONObject;

import java.util.Timer;
import java.util.TimerTask;

public class StringeeManager {

    private static Context mContext;
    private static SharedPreferences sharedPreferences;
    private SharedPreferences.Editor editor;
    private static boolean isAnswer;
    private static boolean isHangup;
    private static int count=0;
    private static Timer T;
    private static BroadcastReceiver mReceiver;
    private static String mCallId;
    private static boolean isMakeCall;
    private static String mPhoneTo;
    private String mPhoneFrom;
    private boolean mOpenProfile;

    public StringeeManager(Context context) {
        mContext = context;
        sharedPreferences = context.getSharedPreferences(Constants.PREF_NAME, context.MODE_PRIVATE);
        editor = sharedPreferences.edit();
        registerBroadcast();
    }

    private void registerBroadcast() {
        IntentFilter intentFilter = new IntentFilter(Constants.STRINGEE_BROADCAST_CALL_ACTION);
        mReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                String callId = intent.getStringExtra("CALL_ID");
                String action = intent.getStringExtra("ACTION");
                mPhoneTo = intent.getStringExtra("PHONE_TO");
                mPhoneFrom = intent.getStringExtra("PHONE_FROM");
                mOpenProfile = intent.getBooleanExtra("OPEN_PROFILE", false);
                Log.d(Constants.LOG_TAG, "Stringee manager action="+action+", mOpenProfile = "+mOpenProfile);
                switch (action) {
                    case "HANG_UP":
                        hangup();
                        break;
                    case "REJECT":
                        reject();
                        break;
                    case "ANSWER":
                        answer();
                        break;
                    case "CALL":
                        makeCall(mPhoneTo);
                        break;
                    case "DTMF":
                        sendDTMF(intent);
                        break;
                    default:
                        break;
                }
            }
        };
        mContext.registerReceiver(mReceiver, intentFilter);
    }

    public static void answer() {
        Log.d(Constants.LOG_TAG, "Call answer "+Common.callState);
        if (Common.callState != StringeeCall.SignalingState.CALLING) {
            return;
        }
        if (Common.call != null) {
            Common.call.answer();
            return;
        }
        isAnswer = true;
    }

    public void hangup() {
        if (Common.call != null) {
            hangup(Common.call);
            endCall();
            return;
        }
        isHangup = true;
    }

    private static void hangup(StringeeCall stringeeCall) {
        if (stringeeCall != null) {
            Log.d(Constants.LOG_TAG, "Stringee HANG UP");
            stringeeCall.hangup();
        }
    }

    public void reject() {
        if (Common.call != null) {
            Log.d(Constants.LOG_TAG, "reject");
            Common.isRejectAction = true;
            Common.call.reject();
            Utils.postDelay(new Runnable() {
                @Override
                public void run() {
                    endCall();
                }
            }, 1000);
        }
    }

    public void sendDTMF(Intent intent) {
        String key = intent.getStringExtra("KEY");
        if (Common.call != null) {
            Log.d(Constants.LOG_TAG, "sendDTMF key="+key);
            Common.call.sendDTMF(key, new StatusListener() {
                @Override
                public void onSuccess() {
                }
                @Override
                public void onError(StringeeError error) {
                }
            });
        }
    }

    public void initAndConnectStringee(String accessToken) {
        // accessToken = sharedPreferences.getString(Constants.ACCESS_TOKEN, null);
        Log.d(Constants.LOG_TAG, "initAndConnectStringee accessToken "+accessToken);
        Common.client = new StringeeClient(mContext);
        Common.client.setConnectionListener(new StringeeConnectionListener() {
            @Override
            public void onConnectionConnected(final StringeeClient stringeeClient, boolean isReconnecting) {
                Log.d(Constants.LOG_TAG, "onStringeeConnectionConnected");
                onStringeeConnectedHandler();
            }

            @Override
            public void onConnectionDisconnected(StringeeClient stringeeClient, boolean isReconnecting) {
                Log.d(Constants.LOG_TAG, "onConnectionDisconnected");
                Intent intent = new Intent(Constants.STRINGEE_BROADCAST_CLIENT);
                intent.putExtra("EVENT", "OnConnectionDisConnected");
                mContext.sendBroadcast(intent);
            }

            @Override
            public void onIncomingCall(final StringeeCall stringeeCall) {
                onIncomingCallHandler(stringeeCall);
            }

            @Override
            public void onIncomingCall2(StringeeCall2 stringeeCall2) {

            }

            @Override
            public void onConnectionError(StringeeClient stringeeClient, final StringeeError stringeeError) {

            }

            @Override
            public void onRequestNewToken(StringeeClient stringeeClient) {
                // Get new token here and connect to Stringe server
                // onRequestTokenCallback.invoke();
            }

            @Override
            public void onCustomMessage(String s, JSONObject jsonObject) {

            }

            @Override
            public void onTopicMessage(String s, JSONObject jsonObject) {

            }
        });
        Common.client.connect(accessToken);
    }

    private void onStringeeConnectedHandler() {
        Log.d(Constants.LOG_TAG, "onConnectionConnected ");
        boolean isTokenRegistered = sharedPreferences.getBoolean(Constants.IS_TOKEN_REGISTERED, false);
        Log.d(Constants.LOG_TAG, "isTokenRegistered "+isTokenRegistered);
        if (!isTokenRegistered) {
            FirebaseInstanceId.getInstance().getInstanceId().addOnCompleteListener(new OnCompleteListener<InstanceIdResult>() {
                @Override
                public void onComplete(@NonNull Task<InstanceIdResult> task) {
                    if (!task.isSuccessful()) {
                        Log.d("Stringee", "getInstanceId failed", task.getException());
                        return;
                    }
                    //register push notification
                    String token = task.getResult().getToken();
                    Log.d(Constants.LOG_TAG, token);
                    Common.client.registerPushToken(token, new StatusListener() {
                        @Override
                        public void onSuccess() {
                            Log.d(Constants.LOG_TAG, "Register push token successfully.");
                            editor.putBoolean(Constants.IS_TOKEN_REGISTERED, true);
                            editor.putString(Constants.FIREBASE_TOKEN, token);
                            editor.commit();
                        }
                        @Override
                        public void onError(StringeeError error) {
                            Log.d(Constants.LOG_TAG, "Register push token unsuccessfully: " + error.getMessage());
                        }
                    });
                }
            });
        } else {
            String firebase_token = sharedPreferences.getString(Constants.FIREBASE_TOKEN, null);
            Log.d(Constants.LOG_TAG, "firebase_token "+firebase_token);
        }

        Intent intent = new Intent(Constants.STRINGEE_BROADCAST_CLIENT);
        intent.putExtra("EVENT", "OnConnectionConnected");
        mContext.sendBroadcast(intent);
    }

    private void onIncomingCallHandler(StringeeCall stringeeCall) {
        Utils.checkValidAuthToken(mContext, new MyStatusFetchListener() {
            @Override
            public void onFetchStatusSuccessfully(boolean isValid) {
                Log.d(Constants.LOG_TAG, "onFetchStatusSuccessfully "+ isValid);
                if (!isValid) {
                    SharedPreferences.Editor editor = sharedPreferences.edit();
                    String pushToken = sharedPreferences.getString(Constants.FIREBASE_TOKEN, "");
                    editor.clear();
                    editor.commit();
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
                    }
                    return;
                }

                String callId = stringeeCall.getCallId();
                Log.d(Constants.LOG_TAG, "onIncomingCall callId = "+callId + ",isInCall="+Common.isInCall +" isAppActive="+ MainCommon.isAppInActive);
                if (Common.isInCall && Common.callState != StringeeCall.SignalingState.CALLING) {
                    hangup(stringeeCall);
                    Log.d(Constants.LOG_TAG, "onIncomingCall need hangup");
                    return;
                }

                Utils.postDelay(new Runnable() {
                    @Override
                    public void run() {
                        try{
                            Common.call = stringeeCall;
                            mCallId = stringeeCall.getCallId();

                            Utils.initSoundManager(mContext);
                            Utils.playRingtone(mContext);

                            initAnswer(stringeeCall);

                            if (!Common.isInCall) {
                                showCallIncoming(stringeeCall, stringeeCall.getFrom());
                            }

                            Intent intent = new Intent(Constants.STRINGEE_BROADCAST_CLIENT);
                            intent.putExtra("EVENT", "OnIncomingCall");
                            mContext.sendBroadcast(intent);

                            if (isAnswer) {
                                isAnswer = false;
                                stringeeCall.answer();
                                return;
                            }
                            if (isHangup) {
                                isHangup = false;
                                hangup(stringeeCall);
                                endCall();
                                return;
                            }
                        } catch (Exception ex) {
                            ex.printStackTrace();
                        }
                    }
                },100);
            }
        });

    }

    private void initAnswer(StringeeCall stringeeCall) {
        stringeeCall.setCallListener(new StringeeCall.StringeeCallListener() {
            @Override
            public void onSignalingStateChange(StringeeCall stringeeCall, final StringeeCall.SignalingState signalingState, String s, int i, String s1) {
                onSignalingStateChangeHandler(stringeeCall, signalingState, s, i, s1);
            }

            @Override
            public void onError(StringeeCall stringeeCall, int i, String s) {
            }

            @Override
            public void onHandledOnAnotherDevice(StringeeCall stringeeCall, final StringeeCall.SignalingState signalingState, String s) {
                onHandledOnAnotherDeviceHandler(stringeeCall, signalingState, s);
            }

            @Override
            public void onMediaStateChange(StringeeCall stringeeCall, final StringeeCall.MediaState mediaState) {
                Log.d(Constants.LOG_TAG, "onHandledOnAnotherDevice="+mediaState);
            }

            @Override
            public void onLocalStream(final StringeeCall stringeeCall) {
            }

            @Override
            public void onRemoteStream(final StringeeCall stringeeCall) {
            }

            @Override
            public void onCallInfo(StringeeCall stringeeCall, final JSONObject jsonObject) {

            }
        });

        stringeeCall.ringing(new StatusListener() {
            @Override
            public void onSuccess() {
                Log.d("Stringee", "send ringing success");
            }
        });
    }

    private void showCallIncoming(StringeeCall stringeeCall, String from) {
        Log.d(Constants.LOG_TAG, "showCallIncoming "+stringeeCall.getCallId() +" module name="+Common.currModule);
        try {
            Common.isGoingCall = false;
            Common.countTime = 0;
            Common.isFromApp = true;
            Common.isInCall = true;
            Common.callState = StringeeCall.SignalingState.CALLING;

            if (Common.currModule.compareTo("Social") == 0 || !MainCommon.isAppInActive ) {
                Notification.notifyIncomingCall(mContext, from, stringeeCall.getCallId());
            } else {
                Intent fullScreenIntent = new Intent(mContext, CallActivity.class);
                fullScreenIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                fullScreenIntent.putExtra("CALL_ID", mCallId);
                fullScreenIntent.putExtra("PHONE_NUMBER", from);
                mContext.startActivity(fullScreenIntent);
            }
            Utils.settingWakeLock(mContext);
        } catch (Exception ex) {
            ex.printStackTrace();
        }
    }

    private void onSignalingStateChangeHandler(StringeeCall stringeeCall, final StringeeCall.SignalingState signalingState, String s, int i, String s1) {
        Log.d("Stringee", "onSignalingStateChangeHandler signalingState: " + signalingState + ", callState = " +Common.callState + ", callId=" + stringeeCall.getCallId()+ " toAlias " + stringeeCall.getToAlias() + " isInCall="+Common.isInCall);
        if (!Common.isInCall) {
            return;
        }
        StringeeCall.SignalingState prevCallState = Common.callState;
        Common.callState = signalingState;

        String callId = stringeeCall.getCallId();
        Intent intent = new Intent(Constants.STRINGEE_BROADCAST_STATE_CHANGED);
        intent.putExtra("CALL_ID", callId);
        intent.putExtra("CALL_STATE", signalingState.toString());
        intent.putExtra("CALL_ALIAS", stringeeCall.getToAlias());
        intent.putExtra("IS_FROM_APP", false);
        mContext.sendBroadcast(intent);

        switch (signalingState) {
            case ENDED:
                Log.d(Constants.LOG_TAG, "Notify miss call "+ prevCallState +", isForwardCall= "+Common.isForwardCall);
                if (prevCallState != StringeeCall.SignalingState.ANSWERED && !Common.isForwardCall) {
                    //Log.d(Constants.LOG_TAG, "Notify miss call "+ Common.callState +" "+StringeeCall.SignalingState.ANSWERED);
                    if (!Common.isGoingCall && !Common.isRejectAction) {
                        Notification.notifyMissCall(mContext, stringeeCall.getFrom());
                    }
                }
                endCall();
                playEndSound();
                break;
            case BUSY:
                endCall();
                if (Common.isGoingCall) {
                    Log.d(Constants.LOG_TAG, "Common.isGoingCall Busy "+Common.isGoingCall);
                    Utils.postDelay(new Runnable() {
                        @Override
                        public void run() {
                            Toast.makeText(mContext,"Máy bận", Toast.LENGTH_LONG).show();
                        }
                    }, 0);
                    playEndSound();
                }
                break;
            case ANSWERED:
                Utils.stopRingtone();
                Utils.stopVibration(mContext);
                startCountTime();
                break;
            default:
                break;
        }
    }

    private void onHandledOnAnotherDeviceHandler(StringeeCall stringeeCall, final StringeeCall.SignalingState signalingState, String s) {
        Log.d(Constants.LOG_TAG, "onHandledOnAnotherDeviceHandler="+signalingState +" inCall = "+Common.isInCall);
        if (!Common.isInCall) {
            return;
        }
        String callId = stringeeCall.getCallId();
        Intent intent = new Intent(Constants.STRINGEE_BROADCAST_ANOTHER_CHANGED);
        intent.putExtra("CALL_ID", callId);
        intent.putExtra("CALL_STATE", signalingState.toString());
        intent.putExtra("CALL_ALIAS", stringeeCall.getToAlias());
        intent.putExtra("IS_FROM_APP", false);
        mContext.sendBroadcast(intent);
        switch (signalingState) {
            case ANSWERED:
                Utils.postDelay(new Runnable() {
                    @Override
                    public void run() {
                        Toast.makeText(mContext,"Cuộc gọi đã được nghe trên thiết bị khác", Toast.LENGTH_LONG).show();
                    }
                }, 0);
                endCall();
                playEndSound();
                break;
            case BUSY:
                Log.d(Constants.LOG_TAG, "Notify miss call");
                Common.isRejectAction = true;
//                if (!Common.isGoingCall && !Common.isRejectAction) {
//                    Notification.notifyMissCall(mContext, stringeeCall.getFrom());
//                }
                playEndSound();
                endCall();
                break;
            default:
                break;
        }
    }

    private void makeCall(String to) {
        String from = sharedPreferences.getString("PHONE_NUMBER", "");
        Common.call = new StringeeCall(Common.client, from, to);
        Common.call.setVideoCall(false);
        Common.isGoingCall = true;
        isMakeCall = true;
        Common.call.setCallListener(new StringeeCall.StringeeCallListener() {
            @Override
            public void onSignalingStateChange(StringeeCall stringeeCall, final StringeeCall.SignalingState signalingState, String s, int i, String s1) {
                Log.e("Stringee", "======== Custom data: " + stringeeCall.getCustomDataFromYourServer() +" signalingState = "+signalingState);
                onSignalingStateChangeHandler(stringeeCall, signalingState, s, i, s1);
                if (isMakeCall) {
                    initMakeCall(stringeeCall, to);
                    isMakeCall = false;
                }
            }

            @Override
            public void onError(StringeeCall stringeeCall, int i, String s) {
            }

            @Override
            public void onHandledOnAnotherDevice(StringeeCall stringeeCall, StringeeCall.SignalingState signalingState, String s) {
                onHandledOnAnotherDeviceHandler(stringeeCall, signalingState, s);
            }

            @Override
            public void onMediaStateChange(StringeeCall stringeeCall, final StringeeCall.MediaState mediaState) {
            }

            @Override
            public void onLocalStream(final StringeeCall stringeeCall) {
            }

            @Override
            public void onRemoteStream(final StringeeCall stringeeCall) {
            }

            @Override
            public void onCallInfo(StringeeCall stringeeCall, final JSONObject jsonObject) {
            }
        });

        Common.call.makeCall();
    }

    private void initMakeCall(StringeeCall stringeeCall, String to) {
        mCallId = stringeeCall.getCallId();
        Common.call = stringeeCall;
        Common.callState = StringeeCall.SignalingState.CALLING;
        Common.countTime = 0;
        Common.isInCall = true;
        Common.isGoingCall = true;

        Intent intent = new Intent(Constants.STRINGEE_BROADCAST_CLIENT);
        intent.putExtra("EVENT", "OnMakeCall");
        intent.putExtra("OPEN_PROFILE", mOpenProfile);
        intent.putExtra("PHONE_NUMBER", to);
        mContext.sendBroadcast(intent);

        Utils.initSoundManager(mContext);

        Notification.notifyOngoingPhone(mContext, to, mCallId, -1);
        Utils.settingWakeLock(mContext);

        Utils.postDelay(new Runnable() {
            @Override
            public void run() {
                // show ongoing call
                Intent fullScreenIntent = new Intent(mContext, CallActivity.class);
                fullScreenIntent.addFlags(Intent.FLAG_ACTIVITY_BROUGHT_TO_FRONT | Intent.FLAG_ACTIVITY_NEW_TASK);
                fullScreenIntent.putExtra("CALL_ID", mCallId);
                fullScreenIntent.putExtra("PHONE_NUMBER", to);
                fullScreenIntent.putExtra("IS_GOING_CALL", true);
                // mContext.getApplicationContext().overridePendingTransition(R.anim.fadein, R.anim.fadeout);
                mContext.startActivity(fullScreenIntent);
            }
        },50);
    }

    private void startCountTime() {
        Log.d(Constants.LOG_TAG, "startCountTime");
        Common.countTime = 0;
        T=new Timer();
        T.scheduleAtFixedRate(new TimerTask() {
            @Override
            public void run() {
                Common.countTime += 1;
                showCallingNotify();
            }
        }, 1000, 1000);
        showCallingNotify();
    }

    private void showCallingNotify() {
        if (Common.countTime == 0 && !Common.isInCall) {
            stopTimer();
            return;
        }
        if (Common.call == null || !Common.isInCall) {
            stopTimer();
            return;
        }
        String callId = Common.call.getCallId();
        String phoneNumber = Common.isGoingCall ? mPhoneTo : Common.call.getFromAlias();
        // Log.d(Constants.LOG_TAG, "showCallingNotify="+Common.countTime +", from="+from);
        Notification.notifyOngoingPhone(mContext, phoneNumber, callId, Common.countTime);
    }

    private static void stopTimer() {
        Log.d(Constants.LOG_TAG, "Stop time");
        Utils.removeNotify(mContext, Constants.NOTIFY_ON_GOING_ID);
        if (T != null) {
            T.cancel();
            T = null;
        }
        Common.countTime = 0;
    }

    private void playEndSound() {
        if (Common.isForwardCall) {
            return;
        }
        Log.d(Constants.LOG_TAG, "playEndSound");
        Utils.runOnUithread(new Runnable() {
            @Override
            public void run() {
                Utils.playEndSound(mContext);
                Utils.postDelay(new Runnable() {
                    @Override
                    public void run() {
                        Utils.stopEndSound();
                    }
                }, 3000);
            }
        });
    }

    public void endCall() {
        Log.d(Constants.LOG_TAG, "endCall");
        isAnswer = false;
        isHangup = false;
        String phoneNumber = Common.isGoingCall ? mPhoneTo : Common.call.getFromAlias();
        Intent intent = new Intent(Constants.STRINGEE_BROADCAST_CLIENT);
        intent.putExtra("EVENT", "OnEndCall");
        intent.putExtra("callId", mCallId);
        intent.putExtra("time", Common.countTime);
        intent.putExtra("phoneNumber", phoneNumber);
        mContext.sendBroadcast(intent);

        Common.isInCall = false;
        Common.callState = StringeeCall.SignalingState.CALLING;
        Common.currProfile = null;
        Common.countTime = 0;
        Common.isSpeaker = false;
        Common.isForwardCall = false;
        Common.isRejectAction = false;

        Utils.stopVibration(mContext);
        Utils.stopRingtone();

        stopTimer();

        Utils.releaseWakeLock();
        Utils.removeNotify(mContext, Constants.NOTIFY_ON_GOING_ID);
        Utils.removeNotify(mContext, Constants.NOTIFY_ID);

        Common.call = null;

    }
}
