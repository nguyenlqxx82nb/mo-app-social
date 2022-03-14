import { IUserInfo } from 'mo-app-common';

export interface IPageAssign {
    id: string;
    name: string;
    page_social_id: string;
    social_type: number;
    token_auth: string;
    refresh_token: string;
    token_refresh_auth?: string;
    specific_checked?: boolean; // biến sử dụng riêng lưu trạng thánh đã chọn page; giá trị sẽ được set trong pipe moLibGetDataViewSocialPipe
    specific_loadImgError?: boolean; // biến sử dụng riêng cho trường hợp load avatar page lỗi;  giá trị sẽ được set trong pipe moLibGetDataViewSocialPipe
    specific_token_expire?: boolean; // giá trị sẽ được set trong pipe moLibGetDataViewSocialPipe

    template: Array<ITemplateQuickReply>;  // danh sách mẫu câu trả lời nhanh
    specific_message_tag: Array<IMessageTag>;
    specific_config?: any; // config lấy từ api
    staffs: Array<IStaff>; // staff theo quyền user hay manager, nếu manager sẽ thấy tất cả nhân viên trong team => dành cho bộ lọc
    staffsOfPage: Array<IStaff>; // danh sách tất cả nhân viên của page => danh cho tạo deal
    currentStaff: IUserInfo;
    reAssignTime?: number;
    icon?: string;
}

export interface IMessageSocialEmpty {
    tag: string;
    default: string;
}

export interface IMessageConnect {
    success: string;
    error: string;
}

export interface IMessageTag {
    message_tag?: string; // loại message tag
    name?: string; // Phuc vu cho dropdown
    restricted_words?: Array<string>;
    descriptions?: Array<IDescription>;
    message: string; // nội dung tags
    // messageTagPattern: Array<IValidPattern>;
    messageTagPattern: Array<any>;
}

export interface IDescription {
    key?: string;
    value?: string;
    type?: string;
    content?: Array<string>;
}

export interface ITemplateQuickReply {
    id?: string;
    value?: string;
    personalize?: Array<IPersonalize>;
}
export interface IPersonalize {
    key?: string;
    value?: string;
}

export interface IStaff {
    avatar?: any;
    create_time?: string;
    created_account?: string;
    email?: string;
    fullname?: string;
    id?: string;
    is_admin?: number;
    merchant_id?: string;
    phone_number?: string;
    status?: number;
    update_time?: string;
    username?: string;
}

