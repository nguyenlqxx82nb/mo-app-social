package com.mobio.cdp.notification.common;

import android.util.Base64;
import android.util.Log;

import com.mobio.cdp.callcenter.common.Constants;

import org.json.JSONObject;

import java.util.Date;

public class Utils {
    public static boolean checkAuthTokenExpired(String authToken) {
        try {
            if (authToken == null) {
                return true;
            }
            String[] split_string = authToken.split("\\.");
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
            Log.d(Constants.LOG_TAG, "AuthToken now =" + now + ", int = "+ obj.getInt("exp"));

        } catch (Exception ex) {
            ex.printStackTrace();
            return true;
        }
        return false;
    }
}
