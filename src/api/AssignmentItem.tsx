import { IComment } from './Comment';
import { IPageAssign } from './PageAssign';

export interface IAssignmentItem {
  assignees?: Array<IAssignmentItemAssignee>;
  classify?: number;
  id?: string;
  social_type?: number;// giá trị của socket trả về
  token_name?: string;// giá trị của socket trả về
  socket_type?: string;// giá trị của socket trả về
  page_id?: string;// giá trị của socket trả về
  comment_social_id?: string;
  conversation_social_id?: string;
  rating_social_id?: string;
  topic?: IAssignmentItemTopic;
  topic_id?: string;
  created_user?: string;
  is_reply?: number;
  last_message?: IAssignmentItemLastMessage;
  lastest_user_interacted_time?: string;
  message_time?: string;
  resolved_time?: string;
  seen_time?: string;
  social?: IAssignmentItemSocial;
  status?: number;
  tags?: Array<IAssignmentItemTag>;
  type?: number;
  unread_number?: number;
  unreply_time?: string;
  updated_time?: string;
  resolved_user_name?: string;
  resolved_user?: string;
  state?: any;
  page_social_id?: string;
  comment_image?: number;
  rating_number?: number;
  mobio_topic_id?: string;
  is_hold?: boolean;
  is_display_hold?: boolean;
  is_conversation?: number; // sử dụng để check khách hàng đã từng gửi tin nhắn
  pin_order?: number;
  topic_social_id?: string;
  topic_title?: string;
  title?: string;

  specific_tag_ids?: Array<string>; // sử dụng lưu trữ tag phân loại công việc nhận từ socket new hoặc reply
  specific_avatar?: string;
  specific_username?: string;
  specific_key_search?: string;
  specific_conversations?: Array<IAssignmentItemConversationItem>;
  specific_post_or_feed?: IPostOrFeed;
  specific_ratings?: IRating;
  specific_total_search?: number;
  specific_index_search?: number;
  specific_after_token_search?: string;
  specific_before_token_search?: string;
  specific_loading_content?: boolean;
  specific_show_button_scroll_bottom?: boolean;
  specific_show_icon_new_message?: boolean;
  specific_query?: IAssignmentItemQuery;
  specific_focus?: boolean;
  specific_content_typing?: any;
  specific_attachments_typing?: Array<any>;
  specific_is_auto_revoke_before?: boolean;
  specific_message_social_id?: string; // sử dụng để lưu khi nhận socket
  specific_detect_message_id?: string; // id fake message nhân viên gửi
  specific_attachments?: Array<any>; // sử dụng để lưu khi nhận socket
  specific_send_time?: number; // biến được nhận từ socket
  specific_status_message?: number; // Lưu trạng thái tin nhắn cuối cùng
  specific_profile?: {
    name: string;
    phone: string;
    originCustomer: any;
  };
  specific_is_assignment_correct_content_search?: boolean;
  specific_resolving?: boolean;
  specific_message_tag?: string;  // Lưu loại message tag khi gửi
  specific_browsing_information?: IBrowsingInformation; // Thông tin duyệt web dùng cho weblivechat
  specific_notification_id?: string;// id của tin socket
  specific_notification_is_read?: number;// trạng thái đọc socket
  specific_page_container?: IPageAssign;// page mà user_assign thuộc
  specific_message_error?: string; // khi bot chat tu dong khong gui attachment reply
  specific_message_quote?: IMessageQuote;
  specific_status_online?: string;
  specific_label_time_unreply?: string;
  specific_assign_staff_name?: string;
  specific_function_get_staff_name?: Function;
  specific_status_send_data_to_server_of_assignment_item?: IAssignmentItemStatusSendDataToServer;
  specific_remove_detail_screen?: () => void;
  specific_update_tag_activity_status?: () => void;
  specific_update_status_online?: (status: string) => void; // Hiện tại đang dùng update trạng thái online/offline
  specific_update_view_detail_screen?: (item?: IAssignmentItem) => void;
  specific_update_view_history_assign?: () => void;
  specific_update_view_exist_message?: (conversationItem: IAssignmentItemConversationItem, specific_key?: string, fieldKeyChange?: string) => void;
  specific_update_action_menu?: () => void;
  specific_update_avatar_name?: () => void;
  specific_update_menu_header?: () => void; // Cập nhật menu header
  specific_delete_comment_lv1?: () => void; // Xóa bình luận cấp 1 cho loại assign là Bình luận
  specific_history_assign?: IHistoryAssign;
  specific_ignore_push_conversation?: boolean; // đánh dấu không push message vào mảng (sử dụng cho gắn tag phân loại công việc không build message)
}

export interface IHistoryAssign {
  history: IHistory[];
  paging?: {
    after_token?: string;
    before_token?: string;
  }
}

export interface IHistory {
  assign_time?: number;
  assignee_id?: string;
  from_staff_id?: string;
  from_staff_name?: string;
}
export interface IAssignmentItemEvent {
  code: string; // scroll-bottom;
  data: any; // dữ liệu cần gửi;
}
export interface IBrowsingInformation {
  general_information?: {
    visit_page_number?: number;
    total_message?: number;
    time_on_web?: number;
    time_on_current_web?: number;
    start_time_access?: number;
    come_from?: string;
    location?: string;
  };
  device_detail?: {
    browser?: string;
    ip_address?: string;
    name_device?: string;
    os?: string;
  };
  web_browsing_info?: {
    time_on_current_page?: number;
    time_on_current_web?: number;
    current_page_title?: string;
    current_page?: string;
  };
}

export interface IAssignmentItemQuery {
  per_page: number;
  after_token?: string;
  before_token?: string;
  search?: string;
  search_index?: number;
}

export interface IAssignmentItemSocial {
  id?: string;
  title?: string;
  parent_title?: string;
}

export interface IAssignmentItemTopic {
  name?: string;
}


export interface IAssignmentItemAssignee {
  assignee_id?: string;
  conversation_id?: string;
  created_time?: string;
  created_user?: any;
  id?: string;
  note?: any;
  status?: number;
  assign_tag_activity_status?: number;
}

export interface IAssignmentItemLastMessage {
  created_time?: any;
  from?: IAssignmentItemLastMessageFrom;
  message?: string;
}

export interface IAssignmentItemLastMessageFrom {
  id?: string;
  name?: string;
}

export interface IAssignmentItemTag {
  id?: string;
  properties?: IAssignmentItemTagProperties;
  value?: string;
}

export interface IAssignmentItemTagProperties {
  background_color?: string;
  foreground_color?: string;
}

export interface IAssignmentItemConversationItem {
  attachments?: any;
  created_time?: any;
  created_user?: string;
  resolved_user?: string;
  from_id?: string;
  id?: string;
  merchant_id?: string;
  message?: string;
  message_error?: string;
  message_quote?: IMessageQuote;
  message_social_id?: string;
  message_type?: number;
  page_social_id?: string;
  send_time?: any;
  social_type?: number;
  state?: number;
  thread_id?: string;
  to_id?: string;
  is_match?: number;
  updated_time?: number;
  resolved_time?: number;
  specific_show_avatar?: boolean;
  specific_message_for_page?: boolean;
  specific_show_staff_reply?: boolean;
  specific_sucking_point?: boolean;
  specific_status_message?: number; // trạng thái gửi tin nhắn của nhân viên
  specific_detect_message_id?: string; // id fake message nhân viên gửi
  specific_send_data?: FormData; // lưu thông tin của tin nhắn trước khi gửi
  specific_name_staff_support?: string;
  specific_name_staff_resolve?: string;
  specific_file?: string; // Lưu thông tin file
  specific_message_tag?: string; // Lưu thông tin message_tag
}

export interface IMessageQuote {
  attachments?: Array<any>;
  created_time?: number;
  created_user?: string;
  from_id?: string;
  merchant_id?: string;
  message?: string;
  message_social_id?: string;
  message_type?: number;
  page_social_id?: string;
  send_time?: number;
  social_type?: number;
  state?: number;
  thread_id?: string;
  to_id?: string;
  updated_time?: number;
  message_quote_type?: string; // 'REPLIED_PRIVATE'
}

export interface IPostOrFeed {
  id?: string;
  from?: IPostOrFeedFrom;
  message?: string;
  title?: string;
  attachments?: IPostOrFeedAttachment;
  likes?: IPostOrFeedLikes;
  created_time?: string;
  full_picture?: string;
  status_type?: string;
  comment_image?: number;
  social?: {
    id?: string;
    parent_id?: string;
    parent_title?: string;
    title?: string;
  };

  specific_video_image_youtube?: string;
  specific_video_youtube?: IPostOrFeedAttachmentData;
  specific_video_views?: number;
  specific_description?: string;
  specific_display_description?: boolean;

  specific_created_user?: string;
  specific_comments?: Array<IComment>;
  specificPostActions?: Array<IPostAction>;
  specific_share?: boolean;
  specific_count_comment?: boolean;
  specific_has_liked?: boolean;
}

export interface IPostAction {
  key?: string;
  label?: string;
  value?: any;
  classValues?: any;
  fieldBind?: string;
  disable?: boolean;
  tooltip?: string;
}

export interface IRating {
  id?: string;
  reviewer?: IRatingReviewer;

  review_text?: string;
  publish_time?: string;
  recommendation_type?: string;
  rating_number?: number;

  assignees?: Array<IAssignmentItemAssignee>;
  status?: number;
  resolved_time?: any;
  resolved_user?: string;
  created_time?: any;
  tags?: Array<any>;

  rating_social_id?: string;

  specific_classify?: number;
  specific_is_message?: number;
  specific_created_user?: string;
  specific_created_time?: string;
  comments?: {
    data?: Array<IComment>,
    specific_temp_data?: Array<IComment>;
    paging?: {
      cursors?: {
        after?: string;
        before?: string;
      }
      next?: string;
      previous?: string;
    }
  };
  specific_is_page?: boolean;
  specific_avatar?: string;
  specific_username?: string;
  specific_content_typing?: string;
  specific_attachments_typing?: any;
}

export interface IRatingReviewer {
  name?: string;
  id?: string;
}

export interface IPostOrFeedFrom {
  name?: string;
  id?: string;
}

export interface IPostOrFeedAttachment {
  data?: Array<IPostOrFeedAttachmentData>;
}

export interface IPostOrFeedAttachmentData {
  description?: string;
  media?: IPostOrFeedAttachmentDataMedia;
  subattachments?: IPostOrFeedAttachment;
  target?: IPostOrFeedAttachmentDataTarget;
  title?: string;
  type?: string;
  url?: string;
}

export interface IPostOrFeedAttachmentDataMedia {
  image?: IPostOrFeedAttachmentDataMediaImage;
  source?: any;
}

export interface IPostOrFeedAttachmentDataMediaImage {
  height?: number;
  src?: string;
  width?: number;
}

export interface IPostOrFeedAttachmentDataTarget {
  id?: string;
  url?: string;
}

export interface IPostOrFeedLikes {
  data?: Array<any>;
  summary?: IPostOrFeedLikesSummary;
}

export interface IPostOrFeedLikesSummary {
  total_count?: number;
  can_like?: boolean;
  has_liked?: boolean;
}

export interface IAssignmentItemTag {
  id?: string;
  properties?: IAssignmentItemProperties;
  value?: string;
}

export interface IAssignmentItemProperties {
  background_color?: string;
  foreground_color?: string;
}

export interface IAssignmentItemStatusSendDataToServer {
  icon: string,
  message: string,
  type: string,
}
