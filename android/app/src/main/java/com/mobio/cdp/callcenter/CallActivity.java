package com.mobio.cdp.callcenter;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Fragment;
import android.app.FragmentManager;
import android.app.FragmentTransaction;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.graphics.Typeface;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.appcompat.app.AppCompatActivity;
// import androidx.fragment.app.DialogFragment;
import androidx.lifecycle.LifecycleObserver;
import android.app.DialogFragment;

import android.util.Log;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowManager;
import android.view.animation.AlphaAnimation;
import android.view.animation.Animation;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.ImageButton;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.RelativeLayout;
import android.widget.TextView;
import android.widget.Toast;

import com.androidnetworking.AndroidNetworking;
import com.androidnetworking.error.ANError;
import com.androidnetworking.interfaces.JSONObjectRequestListener;
import com.bumptech.glide.Glide;
import com.mobio.cdp.MainActivity;
import com.mobio.cdp.R;
import com.mobio.cdp.callcenter.common.Common;
import com.mobio.cdp.callcenter.common.Constants;
import com.mobio.cdp.callcenter.common.MyFetchListener;
import com.mobio.cdp.callcenter.common.Notification;
import com.mobio.cdp.callcenter.common.Utils;
import com.mobio.cdp.callcenter.forward.ForwardDialog;
import com.mobio.cdp.common.MainCommon;
import com.stringee.call.StringeeCall.SignalingState;

import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;
import java.util.Timer;
import java.util.TimerTask;

public class CallActivity extends AppCompatActivity implements View.OnClickListener, LifecycleObserver {
    private LinearLayout mCallContainer;
    private LinearLayout mCallEndContainer;
    private TextView tvName;
    private TextView tvState;
    private TextView tvTop;
    private TextView tvEnd;
    private ImageButton btnAnswer;
    private ImageButton btnEnd;
    private ImageButton btnForward;
    private ImageButton btnSpeaker;
    private ImageView imgAvatar;
    private View vControl;
    private Button btnCallCenter;
    private Button btnCallPhone;
    private View vForward;
    private View vDialPad;
    private RelativeLayout vPadNumber;
    private View vTop;
    private TextView tvPadNumber;

    private boolean isMute = false;

    public static final int REQUEST_PERMISSION_CALL = 1;

    private boolean isAnswer;
    private String phoneNumber;
    private boolean isOngoingCall;
    private boolean isFromApp;
    private String id;
    private String name;
    private String avatar;
    private String callId;
    private int count = Common.countTime;
    private Timer T;
    private boolean countTime = false;
    private Timer timeoutT;

    private BroadcastReceiver mReceiver;
    private BroadcastReceiver mReceiverAnother;
    private BroadcastReceiver mReceiverFinish;
    private SharedPreferences sharePreferences;

    // @SuppressLint("ResourceAsColor")
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        sharePreferences = getSharedPreferences(Constants.PREF_NAME, MODE_PRIVATE);
        isAnswer = getIntent().getBooleanExtra("IS_ANSWER", false);
        phoneNumber = getIntent().getStringExtra("PHONE_NUMBER");
        callId = getIntent().getStringExtra("CALL_ID");
        isOngoingCall = getIntent().getBooleanExtra("IS_GOING_CALL", false);
        isFromApp = getIntent().getBooleanExtra("IS_FROM_APP", false);
        Log.d(Constants.LOG_TAG, "Init UI "+phoneNumber + " call_id = "+callId +" isOngoingCall = "+isOngoingCall + ", callState = " +Common.callState);

        // set status bar color
        //View view = getWindow().getDecorView();
        // setLightStatusBar();

        if (!Common.isInCall) {
            Log.d(Constants.LOG_TAG, "finish callState = "+Common.callState);
            finish();
            return;
        }
        cancelNotification();
        // setting for show activity in locked screen
        settingWakeLock();
        // cancelNotification();
        registerBroadcast();
        setContentView(R.layout.activity_call);
        initUI();
        checkPermission();
        count = Common.countTime;
        Log.d(Constants.LOG_TAG, "isAnswer = "+isAnswer+",countTime="+count + " callState=" + Common.callState);
        if (isAnswer) {
            cancelNotification();
            Utils.stopRingtone();
            Utils.stopVibration(getApplicationContext());
            updateAnswerState();
            if (Common.callState != SignalingState.ANSWERED) {
                Utils.initSound(this);
                sendBroadcastCallAction("ANSWER");
            }
        } else if (!isOngoingCall && Common.callState != SignalingState.ANSWERED) {
            Utils.startVibration(getApplicationContext());
        }
        Common.isForwardCall = false;
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        // this.endCall();
        Log.d(Constants.LOG_TAG, "onDestroy activity");
    }

    @Override
    public void onStop() {
        super.onStop();
        Log.d(Constants.LOG_TAG, "onStop incoming activity ");
        // this.unregisterBroadcast();
    }

    @Override
    public void onResume() {
        super.onResume();
        Log.d(Constants.LOG_TAG, "Incoming onResume "+ Common.currCallId);
        this.registerBroadcast();
    }

//    @Override
    public void onPause() {
        Log.d(Constants.LOG_TAG, "onPause");
        super.onPause();
        this.unregisterBroadcast();
        if ((Common.callState == SignalingState.RINGING || Common.callState == SignalingState.CALLING)
                && !isOngoingCall && Common.isInCall) {
            Notification.notifyIncomingCall(this, phoneNumber, callId);
        }
        finish();
    }

    private void registerBroadcast() {
        if (mReceiver != null) {
            return;
        }
        IntentFilter intentFilter = new IntentFilter(Constants.STRINGEE_BROADCAST_STATE_CHANGED);
        mReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                onSignalingStateChangeHandler(intent);
            }
        };

        IntentFilter intentAnotherFilter = new IntentFilter(Constants.STRINGEE_BROADCAST_ANOTHER_CHANGED);
        mReceiverAnother = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                onHandledOnAnotherDeviceHandler(intent);
            }
        };

        IntentFilter intentFinishFilter = new IntentFilter(Constants.STRINGEE_BROADCAST_CALL_FINISH);
        mReceiverFinish = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                finish();
            }
        };

        try {
            Log.d(Constants.LOG_TAG, "registerBroadcast");
            registerReceiver(mReceiver, intentFilter);
            registerReceiver(mReceiverAnother, intentAnotherFilter);
            registerReceiver(mReceiverFinish, intentFinishFilter);
        } catch (Exception ex) {
            Log.d(Constants.LOG_TAG, "registerBroadcast "+ ex.getMessage());
        }
    }

    private void onSignalingStateChangeHandler(Intent intent) {
        String call_state = intent.getStringExtra("CALL_STATE");
        String call_id = intent.getStringExtra("CALL_ID");
        String to_alias = intent.getStringExtra("CALL_ALIAS");
        boolean is_from_app = intent.getBooleanExtra("IS_FROM_APP",false);
        Log.d(Constants.LOG_TAG, "Incoming activity is_from_app="+is_from_app+", isFromApp="+isFromApp+", call_state="+call_state);
//        int compare = (call_id).toLowerCase().trim().compareTo((callId).toLowerCase().trim());
//        Log.d(Constants.LOG_TAG, "Broadcast onSignalingStateChangeHandler call_state="+Common.callState +"*"+call_state + "callId="+callId+"call_id"+call_id+"*"+"compare="+compare);
//        if (compare != 0) {
//            return;
//        }
        switch (call_state) {
            case "ANSWERED":
                Utils.runOnUithread(new Runnable() {
                    @Override
                    public void run() {
                        startCountTimer();
                        //vControl.setVisibility(View.VISIBLE);
                        updateAnswerState();
                        if (!isOngoingCall) {
                            tvTop.setText("Tổng đài nhận cuộc gọi: " + Utils.formatPhoneNumber(to_alias));
                        }
                    }
                });
                break;
            case "RINGING":
                Utils.runOnUithread(new Runnable() {
                    @Override
                    public void run() {
                        if (isOngoingCall) {
                            tvState.setText("Đang đổ chuông");
                        }
                    }
                });
                break;
            case "ENDED":
                endCall();
                break;
            case "BUSY":
                endCall();
                break;
            default:
                break;
        }
    }

    private void onHandledOnAnotherDeviceHandler(Intent intent) {
        String call_state = intent.getStringExtra("CALL_STATE");
        String call_id = intent.getStringExtra("CALL_ID");
        String to_alias = intent.getStringExtra("CALL_ALIAS");
        boolean is_from_app = intent.getBooleanExtra("IS_FROM_APP",false);
//        if (is_from_app != isFromApp) {
//            return;
//        }
        int compare = (call_id).toLowerCase().trim().compareTo((callId).toLowerCase().trim());
        Log.d(Constants.LOG_TAG, "Broadcast onHandledOnAnotherDeviceHandler call_state="+call_state+ ",compare="+compare);
        if (compare != 0) {
            return;
        }
        switch (call_state) {
            case "ANSWERED":
                callId = call_id;
                endCall();
                break;
            case "BUSY":
                endCall();
                break;
            default:
                break;
        }
    }

    private void unregisterBroadcast() {
        try {
            if (mReceiver == null) {
                return;
            }
            unregisterReceiver(mReceiver);
            mReceiver = null;
        } catch (Exception e) {
            // just to make sure if the PowerManager crashes while acquiring a wake lock
            e.printStackTrace();
        }

        try {
            if (mReceiverAnother == null) {
                return;
            }
            unregisterReceiver(mReceiverAnother);
            mReceiverAnother = null;
        } catch (Exception e) {
            // just to make sure if the PowerManager crashes while acquiring a wake lock
            e.printStackTrace();
        }

        try {
            if (mReceiverFinish == null) {
                return;
            }
            unregisterReceiver(mReceiverFinish);
            mReceiverFinish = null;
        } catch (Exception e) {
            // just to make sure if the PowerManager crashes while acquiring a wake lock
            e.printStackTrace();
        }
    }

    private void settingWakeLock() {
        getWindow().addFlags(android.view.WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |
                android.view.WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD |
                android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON |
                android.view.WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON);
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
        }
    }

    private void initUI() {
        mCallContainer = (LinearLayout) findViewById(R.id.v_call);
        mCallEndContainer = (LinearLayout) findViewById(R.id.v_call_end);

        vForward =  findViewById(R.id.v_forward);

        tvTop = (TextView) findViewById(R.id.tv_top);
        tvName = (TextView) findViewById(R.id.tv_name);
        tvName.setText(Utils.formatPhoneNumber(phoneNumber));
        tvState = (TextView) findViewById(R.id.tv_state);
        TextView tv_speaker = (TextView) findViewById(R.id.tv_speaker);
        TextView tv_forward = (TextView) findViewById(R.id.tv_forward);
        tvEnd = (TextView) findViewById(R.id.tv_end);

        Typeface typefaceR = Typeface.createFromAsset(getAssets(), Constants.FONT_REGULAR);
        Typeface typefaceM = Typeface.createFromAsset(getAssets(), Constants.FONT_MEDIUM);
        Typeface typefaceB = Typeface.createFromAsset(getAssets(), Constants.FONT_BOLD);
        tvTop.setTypeface(typefaceR);
        tvName.setTypeface(typefaceB);
        tvState.setTypeface(typefaceR);
        tv_speaker.setTypeface(typefaceM);
        tv_forward.setTypeface(typefaceM);
        tvEnd.setTypeface(typefaceR);

        imgAvatar = (ImageView) findViewById(R.id.avatar);
        btnAnswer = (ImageButton) findViewById(R.id.btn_answer);
        btnAnswer.setOnClickListener(this);
        if (isOngoingCall) {
            btnAnswer.setVisibility(View.GONE);
        }

        ImageButton btnDigit = (ImageButton) findViewById(R.id.btn_digit);
        btnDigit.setOnClickListener(this);

        btnEnd = (ImageButton) findViewById(R.id.btn_end);
        btnEnd.setOnClickListener(this);

        btnForward = (ImageButton) findViewById(R.id.btn_forward);
        btnForward.setOnClickListener(this);
        btnSpeaker = (ImageButton) findViewById(R.id.btn_speaker);
        btnSpeaker.setOnClickListener(this);

        btnSpeaker.setBackgroundResource(Common.isSpeaker ? R.drawable.btn_speaker_on : R.drawable.btn_speaker_off);
        vControl = findViewById(R.id.v_control);
        vTop = findViewById(R.id.vTop);
        vDialPad = findViewById(R.id.v_dialPad);

        Log.d(Constants.LOG_TAG, "isSpeaker = "+Common.isSpeaker);

        if (Common.currProfile != null) {
            updateProfileInfo(Common.currProfile);
        } else {
            getProfile(phoneNumber, new MyFetchListener() {
                @Override
                public void onFetchSuccessfully(JSONObject profile) {
                    updateProfileInfo(profile);
                }
                @Override
                public void onFetchError(JSONObject error) {
                }
            });
        }
        if (isOngoingCall) {
            String centerNumber = sharePreferences.getString("PHONE_NUMBER", "");
            tvTop.setText("Tổng đài gọi đi: " + Utils.formatPhoneNumber(centerNumber));
//            vForward.setVisibility(View.INVISIBLE);
//            vDialPad.setVisibility(View.VISIBLE);
            removeView(vForward);
        } else {
//            vForward.setVisibility(View.VISIBLE);
//            vDialPad.setVisibility(View.INVISIBLE);
            removeView(vDialPad);
        }
        Log.d(Constants.LOG_TAG, "Common.callState = "+Common.callState);
        if (Common.callState == SignalingState.ANSWERED) {
            updateAnswerState();
            startCountTimer();
        } else if (Common.callState == SignalingState.CALLING) {
            tvState.setText(isOngoingCall ? "Đang gọi đi" : "Đang gọi đến");
        } else if (Common.callState == SignalingState.RINGING) {
            tvState.setText("Đang đổ chuông");
        }

        // init padNumber
        initPadNumberUI();
    }

    private void initPadNumberUI() {
        Typeface typefaceR = Typeface.createFromAsset(getAssets(), Constants.FONT_REGULAR);

        vPadNumber = findViewById(R.id.v_padNumber);
        vTop = findViewById(R.id.vTop);
        tvPadNumber = (TextView) findViewById(R.id.tv_padNumber);
        tvPadNumber.setTypeface(typefaceR);

        Button btn_1 = findViewById(R.id.btn_1);
        btn_1.setTypeface(typefaceR);
        btn_1.setOnClickListener(this);

        Button btn_2 = findViewById(R.id.btn_2);
        btn_2.setTypeface(typefaceR);
        btn_2.setOnClickListener(this);

        Button btn_3 = findViewById(R.id.btn_3);
        btn_3.setTypeface(typefaceR);
        btn_3.setOnClickListener(this);

        Button btn_4 = findViewById(R.id.btn_4);
        btn_4.setTypeface(typefaceR);
        btn_4.setOnClickListener(this);

        Button btn_5 = findViewById(R.id.btn_5);
        btn_5.setTypeface(typefaceR);
        btn_5.setOnClickListener(this);

        Button btn_6 = findViewById(R.id.btn_6);
        btn_6.setTypeface(typefaceR);
        btn_6.setOnClickListener(this);

        Button btn_7 = findViewById(R.id.btn_7);
        btn_7.setTypeface(typefaceR);
        btn_7.setOnClickListener(this);

        Button btn_8 = findViewById(R.id.btn_8);
        btn_8.setTypeface(typefaceR);
        btn_8.setOnClickListener(this);

        Button btn_9 = findViewById(R.id.btn_9);
        btn_9.setTypeface(typefaceR);
        btn_9.setOnClickListener(this);

        Button btn_10 = findViewById(R.id.btn_10);
        btn_10.setTypeface(typefaceR);
        btn_10.setOnClickListener(this);

        Button btn_11 = findViewById(R.id.btn_11);
        btn_11.setTypeface(typefaceR);
        btn_11.setOnClickListener(this);

        Button btn_12 = findViewById(R.id.btn_12);
        btn_12.setTypeface(typefaceR);
        btn_12.setOnClickListener(this);
    }

    private void updateProfileInfo(JSONObject profile) {
        if (Common.currProfile == null) {
            Common.currProfile = profile;
        }
        Utils.runOnUithread(new Runnable() {
            @Override
            public void run() {
                try {
                    id = profile.getString("id");
                    name = profile.getString("name");
                    avatar = profile.getString("avatar");
                    if (avatar != "") {
                        Glide.with(getApplicationContext())
                            .asBitmap().load(avatar)
                            .circleCrop()
                            .error(R.drawable.default_avatar)
                            .into(imgAvatar);
                    }
                    Log.d(Constants.LOG_TAG, " NAME = "+name);
                    if (name != "") {
                        tvName.setText(name);
                    }
                } catch (Exception ex) {
                    ex.printStackTrace();
                }
            }
        });
    }

    private void getProfile(String phoneNumber, MyFetchListener fetchListener) {
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

    private void startCountTimer() {
        Log.d(Constants.LOG_TAG, "startCountTimer");
        displayCountTime();
        countTime = true;
        T=new Timer();
        T.scheduleAtFixedRate(new TimerTask() {
            @Override
            public void run() {
            if (countTime) {
                displayCountTime();
                count++;
            }
            }
        }, 1000, 1000);
    }

    private void displayCountTime() {
        Utils.runOnUithread(new Runnable() {
            @Override
            public void run() {
                tvState.setText(Utils.convertTime(count));
            }
        });
    }

    private void stopTimer() {
        Log.d(Constants.LOG_TAG, "Call activity stop timer");
        countTime = false;
        if (T != null) {
            T.cancel();
            T = null;
        }

        if (count == 0) {
            Utils.runOnUithread(new Runnable() {
                @Override
                public void run() {
                    tvState.setText("00:00");
                }
            });
        }
        count = 0;
    }

    private void checkPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            List<String> lstPermissions = new ArrayList<>();

            if (ContextCompat.checkSelfPermission(this,
                    Manifest.permission.RECORD_AUDIO)
                    != PackageManager.PERMISSION_GRANTED) {
                lstPermissions.add(Manifest.permission.RECORD_AUDIO);
            }

            if (lstPermissions.size() > 0) {
                String[] permissions = new String[lstPermissions.size()];
                for (int i = 0; i < lstPermissions.size(); i++) {
                    permissions[i] = lstPermissions.get(i);
                }
                ActivityCompat.requestPermissions(this, permissions, REQUEST_PERMISSION_CALL);
                return;
            }
        }
    }

    private void cancelNotification() {
        NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        nm.cancel(Constants.NOTIFY_ID);
        Utils.postDelay(new Runnable() {
            @Override
            public void run() {
                nm.cancel(Constants.NOTIFY_ID);
            }
        }, 150);
    }

    private void updateAnswerState() {
        Utils.runOnUithread(new Runnable() {
            @Override
            public void run() {
                vControl.setVisibility(View.VISIBLE);
                btnAnswer.setVisibility(View.GONE);
                Log.d(Constants.LOG_TAG, "updateAnswerState "+isOngoingCall);
                if (!isOngoingCall) {
                    vForward.setVisibility(View.VISIBLE);
                }
            }
        });
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String permissions[], int[] grantResults) {
        boolean isGranted = false;
        if (grantResults.length > 0) {
            for (int i = 0; i < grantResults.length; i++) {
                if (grantResults[i] != PackageManager.PERMISSION_GRANTED) {
                    isGranted = false;
                    break;
                } else {
                    isGranted = true;
                }
            }
        }
        if (requestCode == REQUEST_PERMISSION_CALL) {
            if (!isGranted) {
                finish();
            }
        }
    }

    @Override
    public void onBackPressed() {
//        super.onBackPressed();
//        endCall();
    }

    @Override
    public void onClick(View view) {
        switch (view.getId()) {
            case R.id.btn_digit:
                vControl.setVisibility(View.INVISIBLE);
                vPadNumber.setVisibility(View.VISIBLE);
                ViewGroup.MarginLayoutParams p = (ViewGroup.MarginLayoutParams) vTop.getLayoutParams();
                p.setMargins(0, 30, 0, 0);
                view.requestLayout();
                break;
            case R.id.btn_forward:
                if (Common.callState == SignalingState.ANSWERED) {
                    openForwardDialog();
                } else {
                    Toast.makeText(this, "Chức năng chỉ được sử dụng khi bạn đang nghe cuộc gọi đến.", Toast.LENGTH_LONG).show();
                }
                break;
            case R.id.btn_speaker:
                Common.isSpeaker = !Common.isSpeaker;
                btnSpeaker.setBackgroundResource(Common.isSpeaker ? R.drawable.btn_speaker_on : R.drawable.btn_speaker_off);
                if (Common.audioManager != null) {
                    Common.audioManager.setSpeakerphoneOn(Common.isSpeaker);
                }
                break;
            case R.id.btn_answer:
                cancelNotification();
                sendBroadcastCallAction("ANSWER");
                updateAnswerState();
//                vControl.setVisibility(View.VISIBLE);
//                btnAnswer.setVisibility(View.GONE);
                break;
            case R.id.btn_end:
                endCallPressHandler();
                break;
            case R.id.btn_1:
                sendDigit("1");
                break;
            case R.id.btn_2:
                sendDigit("2");
                break;
            case R.id.btn_3:
                sendDigit("3");
                break;
            case R.id.btn_4:
                sendDigit("4");
                break;
            case R.id.btn_5:
                sendDigit("5");
                break;
            case R.id.btn_6:
                sendDigit("6");
                break;
            case R.id.btn_7:
                sendDigit("7");
                break;
            case R.id.btn_8:
                sendDigit("8");
                break;
            case R.id.btn_9:
                sendDigit("9");
                break;
            case R.id.btn_10:
                sendDigit("*");
                break;
            case R.id.btn_11:
                sendDigit("0");
                break;
            case R.id.btn_12:
                sendDigit("#");
//            case R.id.btn_call_phone:
//                Intent intent = new Intent(Intent.ACTION_DIAL, Uri.fromParts("tel", phoneNumber, null));
//                startActivity(intent);
//                finish();
//                break;
//            case R.id.btn_call_center:
//                callToPhone();
//                finish();
//                break;
        }
    }

    private void removeView(View _view) {
        ViewGroup parent = (ViewGroup) _view.getParent();
        if (parent != null) {
            parent.removeView(_view);
        }
    }

    private void callToPhone() {
        if (MainCommon.isAppInBackground) {
            try {
                Intent callIntent2 = new Intent(this, MainActivity.class);
                callIntent2.putExtra("CALL_PHONE", phoneNumber);
                callIntent2.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TASK | Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
                PendingIntent pendingIntent = PendingIntent.getActivity(this, (int) (System.currentTimeMillis() & 0xfffffff),
                        callIntent2, PendingIntent.FLAG_UPDATE_CURRENT);
                pendingIntent.send();
            } catch (PendingIntent.CanceledException ex) {
                ex.printStackTrace();
            }
        } else {
            Intent callIntent = new Intent(Constants.STRINGEE_BROADCAST_CALL_ACTION);
            // callIntent.putExtra("CALL_ID", callId);
            callIntent.putExtra("PHONE_TO", phoneNumber);
            callIntent.putExtra("ACTION", "CALL");
            callIntent.putExtra("OPEN_PROFILE", false);
            sendBroadcast(callIntent);
        }
    }

    private void openDigitDialog() {
        // DigitDialogFragment addBottomDialogFragment = DigitDialogFragment.newInstance(this);
        // Fragment newFragment = new DigitDialogFragment();
//        FragmentTransaction ft = getFragmentManager().beginTransaction();
//        ft.add(CONTENT_VIEW_ID, newFragment).commit();

//        FrameLayout frame = new FrameLayout(this);
//        frame.setId(CONTENT_VIEW_ID);
//        setContentView(frame, new FrameLayout.LayoutParams(
//                FrameLayout.LayoutParams.MATCH_PARENT, 250));
//
//        FragmentTransaction ft = getFragmentManager().beginTransaction();
//        ft.add(CONTENT_VIEW_ID, newFragment).commit();
//
//        if (savedInstanceState == null) {
//            Fragment newFragment = new DebugExampleTwoFragment();
//            FragmentTransaction ft = getFragmentManager().beginTransaction();
//            ft.add(CONTENT_VIEW_ID, newFragment).commit();
//        }
        // addBottomDialogFragment.show(getSupportFragmentManager(), DigitDialogFragment.TAG);
    }

    private void openForwardDialog() {
//        FragmentTransaction ft = getFragmentManager().beginTransaction();
//        Fragment prev = getFragmentManager().findFragmentByTag("forwardDialog");
//        if (prev != null) {
//            ft.remove(prev);
//        }
//        ft.addToBackStack(null);
//        FragmentManager manager = getFragmentManager();
//        DialogFragment dialogFragment = ForwardDialog.newInstance(this, callId);
//        dialogFragment.show(ft, "forwardDialog");
//        ForwardDialog forwardDialog = ForwardDialog.newInstance(this, callId);
//        forwardDialog.show(getSupportFragmentManager(), "forwardDialog");
        ForwardDialog addBottomDialogFragment = ForwardDialog.newInstance(this, callId);
        addBottomDialogFragment.show(getSupportFragmentManager(), DigitDialogFragment.TAG);
    }

    private void endCallPressHandler() {
        if (isOngoingCall || Common.callState == SignalingState.ANSWERED) {
            sendBroadcastCallAction("HANG_UP");
        } else {
            sendBroadcastCallAction("REJECT");
        }
        endCall();
    }

    private void sendBroadcastCallAction(String action) {
        Intent intent = new Intent(Constants.STRINGEE_BROADCAST_CALL_ACTION);
        intent.putExtra("CALL_ID", callId);
        intent.putExtra("ACTION", action);
        sendBroadcast(intent);
    }

    private void unregisterReceiver() {
        try {
            if (mReceiver == null) {
                return;
            }
            unregisterReceiver(mReceiver);
            mReceiver = null;
        } catch (Exception e) {
            // just to make sure if the PowerManager crashes while acquiring a wake lock
            e.printStackTrace();
        }

        try {
            if (mReceiverAnother == null) {
                return;
            }
            unregisterReceiver(mReceiverAnother);
            mReceiverAnother = null;
        } catch (Exception e) {
            // just to make sure if the PowerManager crashes while acquiring a wake lock
            e.printStackTrace();
        }
    }

    private void endCall() {
        unregisterReceiver();
        // stop timer
        stopTimer();

        Common.callState = SignalingState.CALLING;
        Common.isInCall = false;
        Common.currProfile = null;
        Utils.stopVibration(getApplicationContext());

        Utils.runOnUithread(new Runnable() {
            @Override
            public void run() {
                if (tvEnd != null) tvEnd.setVisibility(View.VISIBLE);
                if (mCallContainer != null)  mCallContainer.setVisibility(View.GONE);
                if (mCallEndContainer != null) mCallEndContainer.setVisibility(View.VISIBLE);
            }
        });
        // blink text
        blinkEndCallText();
        Utils.postDelay(new Runnable() {
            @Override
            public void run() {
                Log.d("Stringee", "Finish Call");
                Common.isForwardCall = false;
                unregisterBroadcast();
                finish();
            }
        }, 3000);
    }

    private void blinkEndCallText() {
        Utils.runOnUithread(new Runnable() {
            @Override
            public void run() {
                Animation anim = new AlphaAnimation(0.0f, 1.0f);
                anim.setDuration(500); //You can manage the blinking time with this parameter
                anim.setStartOffset(20);
                anim.setRepeatMode(Animation.REVERSE);
                anim.setRepeatCount(5);
                tvState.startAnimation(anim);
            }
        });
    }

    private void sendDigit(String digit) {
        String currText = tvPadNumber.getText().toString();
        tvPadNumber.setText(currText+digit);
        Intent intent = new Intent(Constants.STRINGEE_BROADCAST_CALL_ACTION);
        intent.putExtra("KEY", digit);
        intent.putExtra("ACTION", "DTMF");
        sendBroadcast(intent);
    }
}
