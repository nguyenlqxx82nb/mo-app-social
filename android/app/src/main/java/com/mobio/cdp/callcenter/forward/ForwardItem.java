package com.mobio.cdp.callcenter.forward;

public class ForwardItem {
    public String name;
    public String id;
    public long _id;
    public String thirdPartyId;


    public ForwardItem(String name, String id, String thirdPartyId) {
        this.name = name;
        this.id = id;
        this.thirdPartyId = thirdPartyId;

        long leftLimit = 10000L;
        long rightLimit = 1000000L;
        long generatedLong = leftLimit + (long) (Math.random() * (rightLimit - leftLimit));
        this._id = generatedLong;
    }
}
