package com.mobio.cdp.callcenter.common;

import org.json.JSONObject;

public interface MyFetchListener {
    public void onFetchSuccessfully(JSONObject object);
    public void onFetchError(JSONObject error);
    //public void onFetchStatusSuccessfully(boolean status);
}
