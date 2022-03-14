import { IAssignmentItemTag, IAssignmentItemAssignee } from './AssignmentItem';

export interface IComment {
    id?: string;
    from?: IPostCommentFrom;
    message?: string;
    attachment?: ICommentAttachmentData;
    attachments?: ICommentAttachment;
    created_time?: string;
    is_hidden?: boolean;
    can_hide?: boolean;
    user_likes?: boolean;
    like_count?: number;
    comments?: {
        data?: Array<IComment>;
        specific_temp_data?: Array<IComment>;
        paging?: {
            cursors?: {
                after?: string;
                before?: string;
            }
            next?: string;
            previous?: string;
        }
        summary?: {
            can_comment?: boolean;
            canorder_comment?: string;
            total_count?: number;
        }
    };
    resolved_user?: string;
    assignees?: Array<IAssignmentItemAssignee>;
    specific_detect_id?: string;
    specific_mobio_comment_id?: string;
    specific_assignees?: Array<any>;
    specific_classify?: number;
    specific_comment_image?: number;
    specific_created_time?: any;
    specific_created_user?: string;
    specific_is_read?: string;
    specific_is_reply?: number;
    specific_is_conversation?: number;
    specific_is_message?: number; // khách hàng đã từng nhắn tin đến page
    specific_resolved_time?: string;
    specific_state?: number;
    specific_status?: number;
    specific_user_social_id?: string;
    specific_avatar?: string;
    specific_username?: string;
    specific_is_page?: boolean;
    specific_social_type?: number;
    specific_status_message?: number;
    specific_edit_content_typing?: any;
    specific_edit_attachments_typing?: Array<any>;
    specific_edit_url_file?: Array<string>;
    specific_feature?: number;
    specific_label_supporter?: string;

    specific_buttons?: Array<any>;
    specific_display_reply?: boolean;
    specific_display_foward?: boolean;
    specific_ignore_labels?: string;
    specific_display_reply_box?: boolean;
    specific_ignoreShowMore?: boolean;
    tags?: Array<IAssignmentItemTag>;
    social_type?: number; // dùng lấy avatar comment
    page_social_id?: string; // tương đương specific_user_social_id dùng lấy avatar comment
    token_auth?: string; // token_auth của page dùng lấy avatar comment
    token_refresh_auth?: string; // token_refresh_auth của page dùng lấy avatar comment
    specific_update_view?: () => void;
    specific_update_sub_comment_view?: () => void; // Dùng update số lượng comment
}

export interface IPostCommentFrom {
    name?: string;
    id?: string;
}

export interface ICommentAttachment {
    data?: Array<ICommentAttachmentData>;
}

export interface ICommentAttachmentData {
    description?: string;
    media?: ICommentAttachmentDataMedia;
    subattachments?: ICommentAttachmentData;
    target?: ICommentAttachmentDataTarget;
    type?: string;
    url?: string;
}

export interface ICommentAttachmentDataMedia {
    image?: {
        height?: number;
        src?: string;
        width?: number;
    };
    source?: string;
    file?: any;  //  file khi sửa comment lưu trên fontend;
}

export interface ICommentAttachmentDataTarget {
    id?: string;
    url?: string;
}
