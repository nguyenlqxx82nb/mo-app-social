export default class SocialConstants {

    public static readonly SUMMARY_KEY_CHECK: string = 'unreply';

    public static readonly RANGE_TIME_REVOKE_BEFORE = 15000;
    public static readonly MAX_PIN_ORDER = 9999999999;
    public static readonly PIN_ORDER_OF_USER_ASSIGN_FOCUS = 9999999998;

    public static readonly KEY_CHECK_WEB_LIVE_CHAT_USER_ONLINE = 'ONLINE';
    public static readonly KEY_CHECK_WEB_LIVE_CHAT_USER_OFFLINE = 'OFFLINE';

    public static readonly LOAD_DATA_ERROR = 'LOAD_DATA_ERROR';
    public static readonly LOAD_DATA_SUCESS = 'LOAD_DATA_SUCESS';
    public static readonly NO_LOAD_DATA = 'NO_LOAD_DATA';
}

export enum ETypeEventSocketSocial {
    NOTIFICATION_NEW
}
