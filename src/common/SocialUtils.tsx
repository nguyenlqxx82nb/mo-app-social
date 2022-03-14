import { IAssignmentItem, IAssignmentItemStatusSendDataToServer, IAssignmentItemAssignee, IAssignmentItemConversationItem, IFeatureAssign, IFilterFeatureAssign, IComment, IPageAssign, IAssignmentItemSocial, IAssignmentItemLastMessageFrom } from 'api';
import { ChattoolService, Constants, SocialService, JwtHelper, Color, FacebookService } from 'mo-app-common';
import { Router, ScreenType } from 'mo-app-comp';
import moment from 'moment';
import { IAttachment } from 'screens/ChatMain/Detail/Input/PickerModal';
import { uid } from 'uid';

export default class SocialUtils {

  private static STAFFS: Array<any>;

  static getNameStaffById(assignees: Array<IAssignmentItemAssignee>, status: number, staffId?: string, staffsData?: Array<any>): Promise<string> {
    return new Promise(async (resolve) => {
      let staffs = staffsData || this.STAFFS;
      if (!staffs) {
        this.STAFFS = await SocialService.getAllStaffs();
        staffs = this.STAFFS;
      }
      if (staffId) {
        const staffFound = staffs.find(staff => staff.id === staffId);
        if (!staffFound) {
          return resolve('—');
        }
        return resolve(staffFound.username);
      }

      if (!assignees || !assignees.length || !assignees[0]) {
        return resolve('—');
      }
      const staffAssignId = status !== 2 ? assignees[0].created_user : assignees[0].assignee_id;
      if (!staffAssignId) {
        return resolve('Hệ thống');
      }
      const staffAssignFound = staffs.find(staff => staff.id === staffAssignId);
      if (!staffAssignFound) {
        return resolve('—');
      }
      return resolve(staffAssignFound.username);
    });
  }

  static getStatusSendDataToServerOfAssignmentItem(assignment: IAssignmentItem, conversation?: any): IAssignmentItemStatusSendDataToServer {
    const data = { icon: ' ', message: ' ', type: 'icon' };
    this.convertMessageStatus(assignment, conversation);
    const stateSendDataToServer = conversation && conversation.specific_status_message;
    switch (stateSendDataToServer) {
      case Constants.SOCIAL.STATE_SEND_DATA_TO_SERVER.MESSAGE_USER_DISALLOW_APP:
        data.icon = 'mo-icn-error_user_block mo-lib-color-ff5454';
        data.message = 'i18n_profile_blocked_3rd_party_applications';
        break;
      case Constants.SOCIAL.STATE_SEND_DATA_TO_SERVER.MESSAGE_FAIL:
        data.icon = 'mo-icn-reply-alert';
        data.message = 'i18n_cannot_send';
        break;
      case Constants.SOCIAL.STATE_SEND_DATA_TO_SERVER.MESSAGE_SEND_MOBIO_FAIL:
        data.icon = 'mo-icn-reply-alert';
        data.message = 'i18n_cannot_send_message_to_mobio_server';
        break;
      case Constants.SOCIAL.STATE_SEND_DATA_TO_SERVER.MESSAGE_SEND_FACEBOOK_FAIL:
        data.icon = 'mo-icn-reply-alert';
        data.message = 'i18n_cannot_send_message_to_facebook_server';
        break;
      case Constants.SOCIAL.STATE_SEND_DATA_TO_SERVER.MESSAGE_SEND_ZALO_FAIL:
        data.icon = 'mo-icn-reply-alert';
        data.message = 'i18n_cannot_send_message_to_zalo_server';
        break;
      case Constants.SOCIAL.STATE_SEND_DATA_TO_SERVER.MESSAGE_SENT:
        data.icon = 'mo-icn-sent mo-lib-color-4e4e4e50';
        data.message = 'i18n_push_notification_status_send';
        break;
      case Constants.SOCIAL.STATE_SEND_DATA_TO_SERVER.MESSAGE_DELIVERED:
        data.icon = 'mo-icn-received mo-lib-color-4e4e4e50';
        data.message = 'interactive_in_campaign_interaction_value_sent_yes';
        break;
      case Constants.SOCIAL.STATE_SEND_DATA_TO_SERVER.MESSAGE_READ:
        data.icon = 'mo-icn-received mo-lib-color-29c7cc';
        data.message = 'i18n_read';
        break;
      case Constants.SOCIAL.STATE_SEND_DATA_TO_SERVER.MESSAGE_SENDING:
        data.type = 'image';
        data.message = 'single_mail_status_sent';
        break;
      case Constants.SOCIAL.STATE_SEND_DATA_TO_SERVER.COMMENT_SEND_FACEBOOK_FAIL:
        data.icon = 'mo-icn-reply-alert';
        data.message = 'i18n_cannot_send_comment_to_facebook_server';
        break;
    }
    return data;
  }

  private static convertMessageStatus(assignment: IAssignmentItem, conversation?: IAssignmentItemConversationItem) {
    let { seen_time, updated_time, specific_send_time, specific_status_message } = assignment;
    if (conversation) {
      specific_status_message = conversation.specific_status_message;
      updated_time = conversation.created_time;
      specific_send_time = conversation.send_time;
    }

    if (specific_status_message === undefined) {
      assignment.specific_status_message = Constants.SOCIAL.STATE_SEND_DATA_TO_SERVER.MESSAGE_DELIVERED;
      conversation && (conversation.specific_status_message = Constants.SOCIAL.STATE_SEND_DATA_TO_SERVER.MESSAGE_DELIVERED);
    }

    if (!seen_time || specific_status_message !== Constants.SOCIAL.STATE_SEND_DATA_TO_SERVER.MESSAGE_DELIVERED) {
      return;
    }
    const seenTimeUnix = moment(seen_time).unix();
    if (seen_time) {
      if (seenTimeUnix - specific_send_time >= 0) {
        assignment.specific_status_message = Constants.SOCIAL.STATE_SEND_DATA_TO_SERVER.MESSAGE_READ;
        conversation && (conversation.specific_status_message = Constants.SOCIAL.STATE_SEND_DATA_TO_SERVER.MESSAGE_READ);
        return;
      }
      return;
    }
    if (updated_time && seenTimeUnix - moment(updated_time).unix() >= 0) {
      assignment.specific_status_message = Constants.SOCIAL.STATE_SEND_DATA_TO_SERVER.MESSAGE_READ;
      conversation && (conversation.specific_status_message = Constants.SOCIAL.STATE_SEND_DATA_TO_SERVER.MESSAGE_READ);
      return;
    }
  }

  static convertMilisecondToTime(milisecond: number) {
    const tempTime = moment.duration(milisecond);
    return moment.utc(tempTime.asMilliseconds()).format('HH:mm:ss');
  }

  static getBrowsingInformation(page_social_id: string, assignment: IAssignmentItem) {
    return new Promise((resolve) => {
      if (!assignment || !assignment.last_message || !assignment.last_message.from) {
        return resolve(false);
      }
      if (assignment.specific_browsing_information) {
        return resolve(false);
      }
      ChattoolService.getBrowsingInformation(page_social_id, assignment.last_message.from.id).then((result: any) => {
        if (!result || !result.code || result.code !== 200) {
          return resolve(false);
        }
        assignment.specific_browsing_information = {
          general_information: result.general_information,
          web_browsing_info: result.web_browsing_info,
          device_detail: result.device_detail,
        };
        return resolve(true);
      });
    });
  }

  static createNewReplyMessageOfConversation(assignment: IAssignmentItem, message: string, detect_id: string, attachments?: Array<any>) {
    const newMessage: IAssignmentItemConversationItem = {
      specific_message_for_page: true,
      attachments: attachments ? attachments : [],
      created_time: moment().unix(),
      created_user: JwtHelper.decodeToken().id,
      from_id: assignment.page_social_id,
      id: '',
      merchant_id: JwtHelper.decodeToken().merchantID,
      message: message || '',
      message_social_id: uid(32),
      message_type: attachments ? Constants.SOCIAL.MESSAGE_TYPE.INCLUDE_ATTACHMENTS : Constants.SOCIAL.MESSAGE_TYPE.MESSAGE_ONLY,
      page_social_id: assignment.page_social_id,
      social_type: assignment.specific_page_container ? assignment.specific_page_container.social_type : -1,
      specific_status_message: Constants.SOCIAL.STATE_SEND_DATA_TO_SERVER.MESSAGE_SENDING,
      specific_detect_message_id: detect_id
    };
    return newMessage;
  }

  static getMessageSourceFile = (data: any) => {
    if (!data) {
      return '';
    }
    if (!data.type) {
      return data;
    }
    if (data.type.includes('image/gif')) {
      return 'Đã gửi 1 ảnh gif';
    }
    if (data.type.includes('image')) {
      return 'Đã gửi 1 ảnh';
    }
    if (data.type.includes('video')) {
      return 'Đã gửi 1 video';
    }
    return 'Đã gửi 1 file';
  }

  static checkCurrentScreen = (screenType: ScreenType) => {
    if (!screenType || !Router.getCurrentScreen() || Router.getCurrentScreen().screenType !== screenType) {
      return false;
    }
    return true;
  }

  static buildMessage = (assignment: any, data: any, type: string) => {
    const detect_message_id = uid(32);
    if (!data || !assignment || !assignment.specific_page_container) {
      return;
    }
    if (!assignment.specific_key_search) {
      if (assignment.last_message) {
        assignment.last_message.message = SocialUtils.getMessageSourceFile(data);
      }
      assignment.specific_status_message = Constants.SOCIAL.STATE_SEND_DATA_TO_SERVER.MESSAGE_SENDING;
      assignment.specific_detect_message_id = detect_message_id;
    }
    if (type === 'MESSAGE') {
      return SocialUtils.createNewReplyMessageOfConversation(assignment, data.trim(), detect_message_id);
    }
    // file hoặc image
    const attachments = [{
      title: data.name,
      href: data.uri,
      type: data.type.includes('image') ? 'IMAGE' : (data.type.includes('video') ? 'VIDEO' : 'file')
    }];
    return SocialUtils.createNewReplyMessageOfConversation(assignment, '', detect_message_id, attachments);
  }

  static convertFormData = (assignment: IAssignmentItem, newMessage: IAssignmentItemConversationItem, formData: FormData, file?: any, commentSocialId?: string) => {
    if (!assignment || !assignment.specific_page_container) {
      return;
    }
    if (file) {
      formData.append('source', file);
    }
    if (!file) {
      formData.append('message', newMessage.message);
    }
    if (assignment.specific_page_container.social_type !== Constants.SOCIAL.TYPE.FACEBOOK) {
      return;
    }
    if (commentSocialId) {
      formData.append('comment_social_id', commentSocialId);
    }
    if (newMessage.specific_message_tag) {
      formData.append('message_tag', newMessage.specific_message_tag);
    }
  }

  static sendMessage(feature: IFeatureAssign, assignment, message: string, commentSocialId?: string) {
    const newMessage = SocialUtils.buildMessage(assignment, message, 'MESSAGE');
    this.handleSendMessage(feature, assignment, newMessage, undefined, commentSocialId);
  }

  static sendAttachment(feature: IFeatureAssign, assignment: IAssignmentItem, attachments?: IAttachment[], commentSocialId?: string) {
    if (!attachments || !attachments.length) {
      return;
    }
    attachments.forEach((attachment: IAttachment) => {
      const newMessage = SocialUtils.buildMessage(assignment, attachment, 'ATTACHMENT');
      this.handleSendMessage(feature, assignment, newMessage, attachment, commentSocialId);
    });
  }

  static getQueryFilter(filter: IFilterFeatureAssign, page: number, per_page: number) {
    const query = { page: page, per_page: per_page };
    if (!filter) {
      return query;
    }
    const keys = Object.keys(filter);
    keys.forEach(key => {
      let value = filter[key];
      if (value === undefined || value === null || value === '') {
        return;
      }
      if (value instanceof Array) {
        if (!value.length) {
          return;
        }
        if (key === 'tags') {
          value = value.map(item => item.id);
        }
        query[key] = value.join(',');
        return;
      }
      query[key] = value;
    });
    return query;
  }

  static handleSendMessage(feature: IFeatureAssign, assignment: IAssignmentItem, newMessage: IAssignmentItemConversationItem, file?: any, commentSocialId?: string) {
    if (!assignment.specific_conversations) {
      return;
    }
    SocialService.processMessageConversation(assignment.specific_conversations, [newMessage]);
    assignment.specific_conversations.unshift(newMessage);
    let token = '';
    if (assignment.specific_page_container.social_type === Constants.SOCIAL.TYPE.FACEBOOK) {
      token = assignment.specific_page_container.token_auth;
    }
    file && (newMessage.specific_file = file);
    let formData: any = new FormData();
    SocialUtils.convertFormData(assignment, newMessage, formData, newMessage.specific_file, commentSocialId);
    formData.append('detect_message_id', newMessage.specific_detect_message_id);
    assignment.specific_update_view_detail_screen && assignment.specific_update_view_detail_screen(assignment);
    SocialService.sendMessageConversations(assignment.specific_page_container.social_type, assignment.specific_page_container.id, assignment.social.id, token, formData).then(res => {
      if (!res || !res.code || res.code !== '001') {
        this.updateStatusMessageOfConversation(assignment, newMessage, Constants.SOCIAL.STATE_SEND_DATA_TO_SERVER.MESSAGE_SEND_MOBIO_FAIL);
        if (!feature) {
          return;
        }
        feature.isReCallTabCount = true;
        return;
      }
      this.updateStatusMessageOfConversation(assignment, newMessage, Constants.SOCIAL.STATE_SEND_DATA_TO_SERVER.MESSAGE_SENT);
    }, _ => {
      this.updateStatusMessageOfConversation(assignment, newMessage, Constants.SOCIAL.STATE_SEND_DATA_TO_SERVER.MESSAGE_FAIL);
    });
  }

  static updateStatusMessageOfConversation(assignment: IAssignmentItem, newMessage: IAssignmentItemConversationItem, status: number) {
    newMessage.specific_status_message = status;
    assignment.specific_update_view_exist_message && assignment.specific_update_view_exist_message(newMessage, 'specific_detect_message_id');
    if (assignment.specific_status_message && assignment.specific_status_message === Constants.SOCIAL.STATE_SEND_DATA_TO_SERVER.MESSAGE_SENDING) {
      assignment.specific_status_message = status;
    }
  }

  static mergeComment(dataForSync, topic_mobio_id: string, comments: Array<IComment>, page: IPageAssign, item?: IAssignmentItem) {
    return new Promise(async resolve => {
      if (!dataForSync || !dataForSync.length) {
        return resolve(false);
      }
      const resultSyncComment: any = await SocialService.syncComment(page.social_type, topic_mobio_id, dataForSync);
      if (!resultSyncComment || !resultSyncComment.comments || !resultSyncComment.comments.length) {
        return resolve(false);
      }
      resultSyncComment.comments.forEach(async synComment => {
        const commentToSync = comments.find(subComment => subComment.id === synComment.comment_social_id);
        if (commentToSync) {
          await SocialService.updateSyncComment(commentToSync, synComment);
        }
        if (item && !commentToSync.specific_is_page && commentToSync.specific_is_conversation) {
          item.is_conversation = 1;
        }
      });
      return resolve(true);
    });
    // this.detectChanges();
  }

  static setClassifyStatus(classify: number): IClassifyStatus {
    const classifyStatus: IClassifyStatus = {
      iconName: 'bad',
      text: 'Tiêu cực',
      color: Color.red
    };
    switch (classify) {
      case Constants.SOCIAL.CLASSIFY.NEUTRAL:
        classifyStatus.iconName = 'normal';
        classifyStatus.text = 'Trung lập';
        classifyStatus.color = Color.text;
        break;
      case Constants.SOCIAL.CLASSIFY.POSITIVE:
        classifyStatus.iconName = 'emoticon';
        classifyStatus.text = 'Tích cực';
        classifyStatus.color = Color.green;
        break;
      default:
        break;
    }
    return classifyStatus;
  }

  static initDefaultClassify = () => {
    return [
      {
        iconName: 'emoticon',
        text: 'Tích cực',
        color: Color.green,
        value: Constants.SOCIAL.CLASSIFY.POSITIVE
      },
      {
        iconName: 'normal',
        text: 'Trung lập',
        color: Color.text,
        value: Constants.SOCIAL.CLASSIFY.NEUTRAL
      },
      {
        iconName: 'bad',
        text: 'Tiêu cực',
        color: Color.red,
        value: Constants.SOCIAL.CLASSIFY.NEGATIVE
      },
    ];
  }

  static getActionHeader(socialType: number, action: Function, classify: number, isHidden: boolean, isPage: boolean, featureType: number, hasConversation: number, ignoreLabels: string = '', isDashboard?: boolean) {
    return [
      {
        class: 'mo-lib-hover-009cdb',
        iconClass: isHidden ? 'view_coded_info' : 'hide_password',
        iconColor: Color.text,
        label: isHidden ? 'Hiển thị bình luận' : 'Ẩn bình luận',
        socialTypes: [Constants.SOCIAL.TYPE.FACEBOOK, Constants.SOCIAL.TYPE.INSTAGRAM],
        featureTypes: isDashboard ? [] : [Constants.SOCIAL.FEATURE_CODE.COMMENT, Constants.SOCIAL.FEATURE_CODE.TOPIC, Constants.SOCIAL.FEATURE_CODE.RATE],
        isPage: false,
        key: 'hidden',
        action: () => {
          action('hidden');
        }
      },
      {
        class: 'mo-lib-py-5px mo-lib-border-bottom-none mo-lib-color-5db200',
        iconClass: 'emoticon',
        iconColor: Color.text,
        label: 'Đổi trạng thái cảm xúc',
        iconClassRight: classify === 2 ? 'mo-icn-complete-step mo-lib-hover-4e4e4e' : undefined,
        socialTypes: [Constants.SOCIAL.TYPE.FACEBOOK, Constants.SOCIAL.TYPE.INSTAGRAM, Constants.SOCIAL.TYPE.YOUTUBE],
        featureTypes: [Constants.SOCIAL.FEATURE_CODE.COMMENT, Constants.SOCIAL.FEATURE_CODE.TOPIC, Constants.SOCIAL.FEATURE_CODE.RATE],
        isPage: false,
        key: 'change_classify',
        action: () => {
          action('change_classify');
        }
      },
      // {
      //     class: hasConversation ? 'mo-lib-hover-009cdb' : 'mo-lib-hover-009cdb mo-lib-disable',
      //     iconClass: 'mo-icn-send_message_social',
      //     label: 'label_send_message',
      //     socialTypes: [Constants.SOCIAL.TYPE.FACEBOOK],
      //     featureTypes: [],
      //     isPage: false,
      //     action: () => {
      //         action('send_message');
      //     }
      // },
      {
        class: 'mo-lib-hover-009cdb',
        iconClass: 'edit',
        iconColor: Color.text,
        label: 'Sửa',
        socialTypes: [Constants.SOCIAL.TYPE.FACEBOOK, Constants.SOCIAL.TYPE.YOUTUBE],
        featureTypes: isDashboard ? [] : [Constants.SOCIAL.FEATURE_CODE.COMMENT, Constants.SOCIAL.FEATURE_CODE.TOPIC, Constants.SOCIAL.FEATURE_CODE.RATE],
        isPage: true,
        key: 'edit',
        action: () => {
          action('edit');
        }
      },
      {
        class: 'mo-lib-color-ff5454',
        iconClass: 'delete',
        iconColor: Color.red,
        label: 'Xóa',
        socialTypes: [Constants.SOCIAL.TYPE.FACEBOOK, Constants.SOCIAL.TYPE.INSTAGRAM, Constants.SOCIAL.TYPE.YOUTUBE],
        featureTypes: isDashboard ? [] : [Constants.SOCIAL.FEATURE_CODE.COMMENT, Constants.SOCIAL.FEATURE_CODE.TOPIC, Constants.SOCIAL.FEATURE_CODE.RATE],
        isPage: true,
        key: 'delete',
        action: () => {
          action('delete');
        }
      },
      {
        class: 'mo-lib-color-ff5454',
        iconClass: 'close',
        iconColor: Color.red,
        label: 'Xóa',
        socialTypes: [Constants.SOCIAL.TYPE.YOUTUBE],
        featureTypes: isDashboard ? [] : [Constants.SOCIAL.FEATURE_CODE.COMMENT, Constants.SOCIAL.FEATURE_CODE.TOPIC],
        isPage: false,
        key: 'delete',
        action: () => {
          action('delete');
        }
      },
    ].filter(item => item.socialTypes.includes(socialType) && item.isPage === isPage && item.featureTypes.includes(featureType) && !ignoreLabels.includes(item.label));
  }

  static buildTopictAction(page, count_comment, count_like, count_dislike, share?: boolean) {
    const specificPostActions = [];
    if (page.social_type === Constants.SOCIAL.TYPE.FACEBOOK) {
      specificPostActions.push({
        key: 'like',
        label: `${count_like || 0}`,
        classValues: {
          'false': 'like',
          'true': 'liked',
        },
        fieldBind: 'specific_has_liked',
        tooltip: 'label_like',
        disable: false,
      });
    }
    if (page.social_type === Constants.SOCIAL.TYPE.INSTAGRAM) {
      specificPostActions.push({
        key: 'like',
        label: `${count_like || 0}`,
        classValues: {
          'false': 'mo-icn-like_insta mo-lib-font-size-12px mo-lib-mr-8px',
          'true': 'mo-icn-liked_insta mo-lib-font-size-12px mo-lib-mr-8px',
        },
        fieldBind: 'specific_has_liked',
        tooltip: 'label_like',
        disable: false,
      });
    }
    if (page.social_type === Constants.SOCIAL.TYPE.YOUTUBE) {
      specificPostActions.push(...[
        {
          key: 'like',
          label: `${count_like || 0}`,
          classValues: {
            'true': 'mo-icn-liked_fb mo-lib-font-size-16px mo-lib-mr-8px',
            'false': 'mo-icn-like_fb mo-lib-font-size-16px mo-lib-mr-8px',
          },
          fieldBind: 'specific_has_liked',
          tooltip: 'label_like',
          disable: false,
        },
        {
          key: 'dislike',
          label: `${count_dislike || 0}`,
          classValues: {
            'true': 'mo-icn-disliked_fb mo-lib-font-size-16px mo-lib-mr-8px',
            'false': 'mo-icn-dislike_fb mo-lib-font-size-16px mo-lib-mr-8px',
          },
          fieldBind: 'specific_has_disliked',
          tooltip: 'label_dislike',
          disable: false,
        }
      ]);
    }
    specificPostActions.push({
      key: 'comment',
      label: `${count_comment || 0}`,
      classValues: {
        'true': 'comment',
      },
      fieldBind: 'specific_count_comment',
      tooltip: 'i18n_social_comment',
      disable: false,
    });
    if (share) {
      specificPostActions.push({
        key: 'share',
        label: '',
        classValues: {
          'true': 'share',
        },
        fieldBind: 'specific_share',
        tooltip: 'label_share',
        disable: false,
      });
    }
    return specificPostActions;
  }

  static classifyComment(bodySocket: any, assignmentItems, onCallback: any = undefined) {
    if (!assignmentItems || !assignmentItems.length || !bodySocket || !bodySocket.data) {
      return;
    }
    let currentAssignment = assignmentItems.find(post => post.comment_social_id === bodySocket.data.parent_social_id);
    if (bodySocket.data.comment_level === 1) {
      currentAssignment = assignmentItems.find(post => post.comment_social_id === bodySocket.data.comment_social_id);
    }
    if (!currentAssignment) {
      return;
    }
    if (bodySocket.data.comment_level === 1) {
      currentAssignment.classify = bodySocket.data.classify;
    }
    if (!currentAssignment.specific_post_or_feed || !currentAssignment.specific_post_or_feed.specific_comments || !currentAssignment.specific_post_or_feed.specific_comments.length) {
      return;
    }
    let commentPost: any;
    if (bodySocket.data.comment_level === 1) {
      commentPost = currentAssignment.specific_post_or_feed.specific_comments.find(item => item.id === bodySocket.data.comment_social_id);
    } else {
      commentPost = currentAssignment.specific_post_or_feed.specific_comments.find(item => item.id === bodySocket.data.parent_social_id);
    }
    if (!commentPost) {
      return;
    }
    if (bodySocket.data.comment_level === 1) {
      commentPost.specific_classify = bodySocket.data.classify;
      commentPost.specific_update_view && commentPost.specific_update_view();
      onCallback && onCallback(currentAssignment);
      return;
    }
    if (!commentPost.comments || !commentPost.comments.data || !commentPost.comments.data.length) {
      return;
    }
    const subComment = commentPost.comments.data.find(item => item.id === bodySocket.data.comment_social_id);
    if (!subComment) {
      return;
    }
    subComment.specific_classify = bodySocket.data.classify;
    subComment.specific_update_view && subComment.specific_update_view();
    onCallback && onCallback(currentAssignment);
  }

  static convertAttachmentsToDisplayUpdateComment = (attachments: any[]) => {
    if (!attachments || !attachments.length) {
      return;
    }
    attachments.forEach(attachment => {
      attachment.originType = attachment.type;
      attachment.uri = attachment.media && attachment.media.image && attachment.media.image.src;
      switch (attachment.originType) {
        case 'image':
        case 'gif':
        case 'sticker':
        case 'animated_image_share':
        case 'added_photos':
        case 'animated_image_autoplay':
        case 'animated_image_video_autoplay':
        case 'photo':
        case 'animated_image_video':
          attachment.type = 'image';
          break;
        case 'video':
        case 'sound':
        case 'videvideo_inlineo':
          attachment.type = 'video';
          break;

        default:
          break;
      }
    });
    return attachments;
  }

  static getCommentFB = async (body, assignmentsOfFeature: IAssignmentItem[], feature: IFeatureAssign, isReply?: boolean, onCallback?: Function) => {
    const assign = isReply ? assignmentsOfFeature.find(item => item.comment_social_id === body.data.parent_id) : assignmentsOfFeature.find(item => item.id === body.data.parent_id);
    if (!assign || !assign.specific_post_or_feed || !assign.specific_post_or_feed.specific_comments || !assign.specific_post_or_feed.specific_comments.length) {
      return;
    }
    const page = assign.specific_page_container;
    const parentComment = assign.specific_post_or_feed.specific_comments[0];
    if (!parentComment.comments || !parentComment.comments.data) {
      parentComment.comments = {
        data: []
      };
    }
    const comment_social_id = isReply ? body.data.comment.comment_social_id : body.data.comment_social_id;
    if (parentComment.comments.data.find(comment => comment.id === comment_social_id)) {
      return;
    }

    const resultDetailComments: any = await FacebookService.getDetailComment(comment_social_id, page.token_auth);
    if (!resultDetailComments) {
      return;
    }
    const assignees = isReply ? body.data.comment : {};
    const newSubComment: any = await SocialService.createNewCommentByFB(resultDetailComments, assignees, page, feature.code);
    const dataForSync = [{
      comment_social_id: newSubComment.id,
      created_time: moment(newSubComment.created_time).unix(),
      message: newSubComment.message,
      parent_social_id: parentComment.id,
      user_social_id: newSubComment.from && newSubComment.from.id || '',
    }];

    if (parentComment.comments.data.find(comment => comment.id === comment_social_id)) {
      return;
    }
    parentComment.comments.data.unshift(newSubComment);
    await SocialUtils.mergeComment(dataForSync, assign.topic_id, parentComment.comments.data, page);
    parentComment.specific_update_sub_comment_view && parentComment.specific_update_sub_comment_view();
    onCallback && onCallback(assign);
  }

  static getCommentInstagram = async (body, assignmentsOfFeature: IAssignmentItem[], feature: IFeatureAssign, isReply?: boolean, onCallback?: Function) => {
    const assign = isReply ? assignmentsOfFeature.find(item => item.comment_social_id === body.data.parent_id) : assignmentsOfFeature.find(item => item.id === body.data.parent_id);
    if (!assign || !assign.specific_post_or_feed || !assign.specific_post_or_feed.specific_comments || !assign.specific_post_or_feed.specific_comments.length) {
      return;
    }
    const page = assign.specific_page_container;
    const parentComment = assign.specific_post_or_feed.specific_comments[0];
    if (!parentComment.comments || !parentComment.comments.data) {
      parentComment.comments = {
        data: []
      };
    }
    const comment_social_id = isReply ? body.data.comment.comment_social_id : body.data.comment_social_id;
    if (parentComment.comments.data.find(comment => comment.id === comment_social_id)) {
      return;
    }

    const resultDetailComments: any = await FacebookService.getDetailSubCommentInstagram(comment_social_id, page.token_auth);
    if (!resultDetailComments) {
      return;
    }
    const assignees = isReply ? body.data.comment : {};
    const newSubComment: any = await SocialService.createNewCommentBySocket(resultDetailComments, assignees, page, feature.code);
    const dataForSync = [{
      comment_social_id: newSubComment.id,
      created_time: moment(newSubComment.created_time).unix(),
      message: newSubComment.message,
      parent_social_id: parentComment.id,
      user_social_id: newSubComment.username || '',
    }];

    if (parentComment.comments.data.find(comment => comment.id === comment_social_id)) {
      return;
    }
    parentComment.comments.data.unshift(newSubComment);
    await SocialUtils.mergeComment(dataForSync, assign.topic_id, parentComment.comments.data, page);
    parentComment.specific_update_sub_comment_view && parentComment.specific_update_sub_comment_view();
    onCallback && onCallback(assign);
  }

  static updateComment(assignmentsOfFeature: any[], onCallback: any, bodySocket: any, dataChange: any, removeFunction?: Function, isDelete?: boolean) {
    let currentAssignment: any;
    if (bodySocket.data.comment_level === 1) {
      currentAssignment = assignmentsOfFeature.find(post => post.comment_social_id === bodySocket.data.comment_social_id);
    } else {
      currentAssignment = assignmentsOfFeature.find(post => post.comment_social_id === bodySocket.data.parent_social_id);
    }
    if (!currentAssignment) {
      return;
    }
    if (!currentAssignment.specific_post_or_feed || !currentAssignment.specific_post_or_feed.specific_comments || !currentAssignment.specific_post_or_feed.specific_comments.length) {
      Object.keys(dataChange).forEach(key => {
        if (!currentAssignment.last_message || key !== 'message') {
          return;
        }
        currentAssignment.last_message.message = dataChange[key];
      });
      onCallback && onCallback(currentAssignment);
      currentAssignment.specific_delete_comment_lv1 && currentAssignment.specific_delete_comment_lv1();
      removeFunction(currentAssignment);
      return;
    }
    let commentPost: any;
    if (bodySocket.data.comment_level === 1) {
      commentPost = currentAssignment.specific_post_or_feed.specific_comments.find(item => item.id === bodySocket.data.comment_social_id);
    } else {
      commentPost = currentAssignment.specific_post_or_feed.specific_comments.find(item => item.id === bodySocket.data.parent_social_id);
    }
    if (!commentPost) {
      return;
    }
    if (bodySocket.data.comment_level === 1) {
      if (isDelete) {
        currentAssignment.specific_post_or_feed && currentAssignment.specific_post_or_feed.specific_comments && (currentAssignment.specific_post_or_feed.specific_comments.length = 0);
        currentAssignment.specific_delete_comment_lv1 && currentAssignment.specific_delete_comment_lv1();
        removeFunction(currentAssignment);
        return;
      }
      Object.keys(dataChange).forEach(key => {
        commentPost[key] = dataChange[key];
        if (!currentAssignment.last_message || key !== 'message') {
          return;
        }
        currentAssignment.last_message.message = dataChange[key];
      });
      commentPost.specific_update_view && commentPost.specific_update_view();
      onCallback && onCallback(currentAssignment);
      return;
    }
    if (!commentPost.comments || !commentPost.comments.data || !commentPost.comments.data.length) {
      return;
    }
    let subComment = commentPost.comments.data.find(item => item.id === bodySocket.data.comment_social_id);
    const indexComment = commentPost.comments.data.findIndex(item => item.id === bodySocket.data.comment_social_id);
    let indexCommentTemp = -1;
    if (!subComment && indexComment >= 0 && commentPost.comments.specific_temp_data && commentPost.comments.specific_temp_data.length) {
      subComment = commentPost.comments.specific_temp_data.find(item => item.id === bodySocket.data.comment_social_id);
      indexCommentTemp = commentPost.comments.specific_temp_data.findIndex(item => item.id === bodySocket.data.comment_social_id);
    }
    if (subComment) {
      if (isDelete) {
        indexCommentTemp < 0 ? commentPost.comments.data.splice(indexComment, 1) : commentPost.comments.specific_temp_data.splice(indexCommentTemp, 1);
        commentPost.specific_update_sub_comment_view && commentPost.specific_update_sub_comment_view();
        return;
      }
      Object.keys(dataChange).forEach(key => {
        subComment[key] = dataChange[key];
      });
      subComment.specific_update_view && subComment.specific_update_view();
      onCallback && onCallback(currentAssignment);
    }
  }

  static replyCommentTopicSocket(body, assignmentsOfFeature: IAssignmentItem[], feature: IFeatureAssign, onCallback?: Function) {
    if (!body.data || !body.data.parent_id) {
      return;
    }
    if (!assignmentsOfFeature || !assignmentsOfFeature.length) {
      return;
    }
    const userAssignComment = assignmentsOfFeature.find(item => item.comment_social_id === body.data.parent_id);
    if (!userAssignComment) {
      return;
    }
    userAssignComment.is_reply = body.send_status === 'DELIVERED' ? 1 : userAssignComment.is_reply;
    userAssignComment.is_display_hold = body.is_display_hold;
    body.is_hold && (userAssignComment.is_hold = body.is_hold);
    userAssignComment.pin_order = body.pin_order;
    if (!userAssignComment.specific_post_or_feed || !userAssignComment.specific_post_or_feed.specific_comments || !userAssignComment.specific_post_or_feed.specific_comments.length) {
      onCallback && onCallback(userAssignComment);
      return;
    }
    const comment = userAssignComment.specific_post_or_feed.specific_comments[0];
    const subComments = comment.comments ? comment.comments.data : [];
    const commentDetect = subComments.find(subComment => subComment.specific_detect_id === body.detect_comment_id);
    if (commentDetect) {
      console.log('attachments', JSON.parse(JSON.stringify(body.attachments)));
      if (commentDetect.attachments && body.attachments) {
        commentDetect.attachments.data = !Array.isArray(body.attachments) ? [body.attachments] : [];
      }
      if (body.data.comment) {
        commentDetect.id = body.data.comment.comment_social_id;
        SocialService.updateSyncComment(commentDetect, body.data.comment);
      }
      switch (body.send_status) {
        case 'DELIVERED':
          commentDetect.specific_status_message = Constants.SOCIAL.STATE_SEND_DATA_TO_SERVER.MESSAGE_DELIVERED;
          break;
        case 'SEND_ERROR':
          commentDetect.specific_status_message = Constants.SOCIAL.STATE_SEND_DATA_TO_SERVER.MESSAGE_FAIL;
          break;
        case 'USER_DISALLOW_APP':
          commentDetect.specific_status_message = Constants.SOCIAL.STATE_SEND_DATA_TO_SERVER.MESSAGE_USER_DISALLOW_APP;
          break;
        case 'SEND_FACEBOOK_ERROR':
          commentDetect.specific_status_message = Constants.SOCIAL.STATE_SEND_DATA_TO_SERVER.COMMENT_SEND_FACEBOOK_FAIL;
          break;
        case 'SEND_INSTAGRAM_ERROR':
          commentDetect.specific_status_message = Constants.SOCIAL.STATE_SEND_DATA_TO_SERVER.COMMENT_SEND_INSTAGRAM_FAIL;
          break;
        default:
          commentDetect.specific_status_message = Constants.SOCIAL.STATE_SEND_DATA_TO_SERVER.MESSAGE_FAIL;
          break;
      }
      onCallback && onCallback(userAssignComment);
      comment.specific_update_sub_comment_view && comment.specific_update_sub_comment_view();
      return;
    }
    switch (body.social_type) {
      case Constants.SOCIAL.TYPE.FACEBOOK:
        SocialUtils.getCommentFB(body, assignmentsOfFeature, feature, true, onCallback);
        break;
      case Constants.SOCIAL.TYPE.INSTAGRAM:
        SocialUtils.getCommentInstagram(body, assignmentsOfFeature, feature, true, onCallback);
        break;
      // case Constants.SOCIAL.TYPE.YOUTUBE:
      // 	const { feature } = this.props;
      // 	this.getCommentSocial(body, true, feature);
      // 	break;
      default:
        break;
    }
  }

  static getDefaultUserAssign(social: IAssignmentItemSocial, from: IAssignmentItemLastMessageFrom): IAssignmentItem {
    return {
      assignees: [
        {
          assignee_id: '',
          conversation_id: '',
          created_time: moment().format(),
          created_user: null,
        }
      ],
      id: '',
      last_message: { from: from },
      social: social,
      tags: [],
      type: Constants.SOCIAL.FEATURE_CODE.MESSAGE,
      specific_conversations: [],
      lastest_user_interacted_time: moment().format(),
      specific_username: '-',
      specific_avatar: ''
    };
  }

}

interface IClassifyStatus {
  iconName: string;
  text: string;
  color: string;
}
