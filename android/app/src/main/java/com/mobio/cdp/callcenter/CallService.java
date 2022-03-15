package com.mobio.cdp.callcenter;


import android.app.IntentService;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Intent;
import android.util.Log;

import androidx.annotation.Nullable;

import com.mobio.cdp.MainActivity;
import com.mobio.cdp.callcenter.common.Common;
import com.mobio.cdp.callcenter.common.Constants;
import com.mobio.cdp.callcenter.common.Utils;
import com.mobio.cdp.common.MainCommon;
import com.stringee.call.StringeeCall;

public class CallService extends IntentService {
    private String portalId;
    private String userId;
    private StringeeCall stringeeCall;

    public CallService() {
        super("com.mobio.cdp.call.service");
    }

    @Override
    protected void onHandleIntent(@Nullable Intent callIntent) {
        boolean isSpeaker = callIntent.getBooleanExtra("IS_SPEAKER", false);
        if (isSpeaker) {
            setSpeaker(callIntent);
            return;
        }
        boolean isCall = callIntent.getBooleanExtra("IS_CALL", false);
        if (isCall) {
            makeCall(callIntent);
            return;
        }
        rejectCall(callIntent);
    }

    private void makeCall(Intent intent) {
        String phoneTo = intent.getStringExtra("PHONE_TO");
        int notifyId = intent.getIntExtra("NOTIFY_ID", 0);
        // String callId = intent.getStringExtra("CALL_ID");

        Log.d(Constants.LOG_TAG, "onCreate callPhone="+phoneTo+" isAppInBackground = "+MainCommon.isAppInBackground);
        if (phoneTo != null) {
            if (notifyId != 0) {
                NotificationManager manager = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
                manager.cancel(notifyId);
            }
        }

        if (MainCommon.isAppInBackground) {
            try {
                Intent callIntent2 = new Intent(this, MainActivity.class);
                callIntent2.putExtra("CALL_PHONE", phoneTo);
                callIntent2.putExtra("NOTIFICATION_ID", notifyId);
                callIntent2.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TASK | Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
                PendingIntent pendingIntent = PendingIntent.getActivity(this, (int) (System.currentTimeMillis() & 0xfffffff),
                        callIntent2, PendingIntent.FLAG_UPDATE_CURRENT);
                pendingIntent.send();
            } catch (PendingIntent.CanceledException ex) {
                ex.printStackTrace();
            }
        } else {
            Intent callIntent = new Intent(Constants.STRINGEE_BROADCAST_CALL_ACTION);
            // callIntent.addFlags(Intent.FLAG_ACTIVITY_BROUGHT_TO_FRONT | Intent.FLAG_ACTIVITY_NEW_TASK);
            callIntent.putExtra("PHONE_TO", phoneTo);
            callIntent.putExtra("ACTION", "CALL");
            callIntent.putExtra("OPEN_PROFILE", true);
            sendBroadcast(callIntent);
        }
    }

    private void setSpeaker(Intent callIntent) {
        boolean isSpeakerON = callIntent.getBooleanExtra("IS_SPEAKER_ON", false);
        if (Common.audioManager != null) {
            Common.audioManager.setSpeakerphoneOn(isSpeakerON);
            Common.isSpeaker = isSpeakerON;
        }
    }

    private void rejectCall(Intent callIntent) {
        String callId = callIntent.getStringExtra("CALL_ID");
        Log.d(Constants.LOG_TAG, "Reject intent callId="+callId);
        Intent hangupIntent = new Intent(Constants.STRINGEE_BROADCAST_CALL_ACTION);
        hangupIntent.putExtra("CALL_ID", callId);
        hangupIntent.putExtra("ACTION", "HANG_UP");
        sendBroadcast(hangupIntent);

        Intent intent = new Intent(Constants.STRINGEE_BROADCAST_STATE_CHANGED);
        intent.putExtra("CALL_ID", callId);
        intent.putExtra("CALL_STATE", "ENDED");
        intent.putExtra("CALL_ALIAS", "");
        sendBroadcast(intent);

        Utils.removeNotify(getApplicationContext(), Constants.NOTIFY_ID);
    }

//    private void saveCallLog() {
//        DatabaseHandler db = new DatabaseHandler(getApplicationContext());
//        Portal portal = db.getPortal(portalId, userId);
//
//        CallLog callLog = new CallLog();
//        callLog.setPortalId(portal.getId());
//        callLog.setUserId(userId);
//        callLog.setCallDuration(String.valueOf(0));
//        callLog.setDateTime(String.valueOf(System.currentTimeMillis()));
//        String hotline = Utils.formatHotline(stringeeCall.getFrom());
//        callLog.setHotline(Utils.formatHotline(hotline));
//        if (stringeeCall.isVideoCall()) {
//            callLog.setCallType(Constant.CALL_LOG_VIDEO);
//        } else {
//            callLog.setCallType(Constant.CALL_LOG_NORMAL);
//        }
//        callLog.setType(Constant.CALL_LOG_REJECTED);
//
//        db.insertCallLog(callLog);
//    }
}
