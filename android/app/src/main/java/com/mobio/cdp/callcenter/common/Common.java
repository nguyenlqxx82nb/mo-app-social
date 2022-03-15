package com.mobio.cdp.callcenter.common;

import android.graphics.Bitmap;
import android.media.Ringtone;

import com.stringee.StringeeClient;
import com.stringee.call.StringeeCall;

import org.json.JSONObject;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

public class Common {
    public static StringeeClient client;
    public static StringeeCall call;
    public static Map<String, StringeeCall> callsMap = new HashMap<>();
    public static StringeeCall.SignalingState callState = StringeeCall.SignalingState.CALLING;
    public static StringeeAudioManager audioManager;
    public static boolean isInCall = false;
    public static String currCallId = null;
    public static Ringtone ringtone;
    public static Ringtone endCallRing;
    public static String callPhone = "";
    public static ArrayList<String> callIds = new ArrayList<String>();
    public static JSONObject  currProfile;
    public static Bitmap avatarBm;
    public static int countTime = 0;
    public static boolean isSpeaker = false;
    public static boolean isFromApp = false;
    public static String currModule = "";
    public static boolean isGoingCall = false;
    public static boolean isForwardCall = false;
    public static boolean isRejectAction = false;
}
