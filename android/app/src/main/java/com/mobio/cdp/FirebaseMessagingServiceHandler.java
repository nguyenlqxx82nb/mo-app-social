package com.mobio.cdp;

import android.util.Log;
import androidx.annotation.NonNull;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;
import com.mobio.cdp.callcenter.common.Constants;
import com.mobio.cdp.notification.NotificationHelper;
import com.mobio.cdp.callcenter.StringeeModule;

import java.util.Map;

public class FirebaseMessagingServiceHandler extends FirebaseMessagingService {

    @Override
    public void onNewToken(@NonNull String s) {
        StringeeModule.updateDeviceToken(s, getApplicationContext());
    }

    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        Log.d(Constants.LOG_TAG, "onMessageReceived " + remoteMessage);
        Map<String, String> data = remoteMessage.getData();
        if (data == null || data.size() < 0) {
            return;
        }
        StringeeModule.handleIncomingMessage(getApplicationContext(), data);
        NotificationHelper.notifyMessage(getApplicationContext(), data);
    }
}
