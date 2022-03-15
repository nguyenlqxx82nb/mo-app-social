package com.mobio.cdp.callcenter.common;

import java.io.Serializable;

@SuppressWarnings("serial")
public class Profile implements Serializable {
    private String id;
    private String name;
    private String avatar;
    private Object email;
    private String phoneNumber;
    private Object secondaryPhone;
    private String encrypt;

    public Profile() {

    }

    public String getId() {
        if (id == null) {
            return "";
        }
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getAvatar() {
        return avatar;
    }

    public void setAvatar(String avatar) {
        this.avatar = avatar;
    }

    public String getPhoneNumber() {
        return  phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public Object getEmail() {
        return email;
    }

    public void setEmail(Object email) {
        this.email = email;
    }

    public Object getSecondaryPhone() {
        return secondaryPhone;
    }

    public void setSecondaryPhone(Object secondaryPhone) {
        this.secondaryPhone = secondaryPhone;
    }

}
