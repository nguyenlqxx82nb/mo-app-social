import { SocialUtils } from '../../common/index';
import { IAssignmentItem, IComment, IFeatureAssign, IPageAssign } from 'api';
import { Color, Constants, CustomIcon, FacebookService, pushModal, SocialService, Styles, toast } from 'mo-app-common';
import { AsyncImage, Dropdown, IModal, Indicator, NotificationModal, Router, ScreenType, VideoPlayer, ViewMoreHTML, WrapButton, WrapText, ZoomImageViewer } from 'mo-app-comp';
import React from 'react';
import { Keyboard, TouchableWithoutFeedback, View } from 'react-native';
import moment from 'moment';
import Languages from 'mo-app-common/src/Common/Languages';
import { SocialModalClassify, SocialModalUpdateComment } from '../../screens/Modals';
import PickerFileModal, { IAttachment } from '../ChatMain/Detail/Input/PickerModal';
import { ChatSocialDetailScreen } from '../../index';
import { SocialModalCopyClipboard } from '../../screens/Modals/CopyClipboard';

interface ISocialShareCommentScreenProps {
  assignment: IAssignmentItem;
  feature: IFeatureAssign;
  comment: IComment;
  fileSize?: number;
  avatarDimesion?: number;
  isSubComment?: boolean;
  containerStyle?: any;
  onDeleteComment?: () => void;
  onUpdateComment?: (comment: IComment, message: string, attachments: IAttachment[]) => void;
  onChangeHidden?: (page: IPageAssign, comment: IComment, onCallback?: Function) => void;
}
interface ISocialShareCommentScreenState {
  // comment: IComment;
  isLoaded?: boolean;
  classify?: number;
  isDisplayMenu?: boolean;
  isDisplayMessageStatus?: boolean;
  isUserMessagedToPage?: boolean;
  isHidenComment?: boolean;
  messageStatus?: number;
  supporter?: string;
  menuActions?: any[];
  commentActions?: any[];
}

export class SocialShareCommentScreen extends React.PureComponent<ISocialShareCommentScreenProps, ISocialShareCommentScreenState> {
  private dropDownMenuRef: Dropdown;
  private deleteModalRef: NotificationModal;
  private userAvatarDefault: string;
  private tempSelectedAttachments: any[] = [];

  static defaultProps = {
    avatarDimesion: 26,
    isSubComment: false,
    fileSize: 25
  }

  constructor(props: ISocialShareCommentScreenProps) {
    super(props);

    const comment = props.comment;
    this.tempSelectedAttachments = comment.attachments && comment.attachments.data && SocialUtils.convertAttachmentsToDisplayUpdateComment(comment.attachments.data) || [];
    const assignment = props.assignment;
    SocialUtils.getStatusSendDataToServerOfAssignmentItem(assignment, comment);
    const isSubComment = props.isSubComment;
    const menuActions = SocialUtils.getActionHeader(comment.specific_social_type, undefined, comment?.specific_classify, comment.is_hidden,
      comment.specific_is_page, comment.specific_feature, comment.specific_is_conversation, comment.specific_ignore_labels, false);

    this.state = {
      isLoaded: false,
      menuActions: menuActions,
      isDisplayMenu: menuActions && menuActions.length && isSubComment && comment.specific_status_message === Constants.SOCIAL.STATE_SEND_DATA_TO_SERVER.MESSAGE_DELIVERED ? true : false,
      isDisplayMessageStatus: isSubComment && comment.specific_status_message !== Constants.SOCIAL.STATE_SEND_DATA_TO_SERVER.MESSAGE_DELIVERED ? true : false,
      isUserMessagedToPage: !comment.specific_is_page && comment.specific_is_message ? true : false,
      isHidenComment: comment.is_hidden ? true : false,
      commentActions: comment && comment.specific_buttons || [],
      classify: comment.specific_classify,
      messageStatus: comment.specific_status_message,
    };
  }

  componentDidMount() {
    const { comment } = this.props;
    this.initData();
    comment.specific_update_view = this.setData;
  }

  componentWillUnmount() {
    const { comment } = this.props;
    comment.specific_update_view = undefined;
  }

  public setData = async () => {
    const { comment, assignment, isSubComment } = this.props;
    const supporter: any = await this.getLabelSupporter(comment);
    SocialUtils.getStatusSendDataToServerOfAssignmentItem(assignment, comment);
    const menuActions = SocialUtils.getActionHeader(comment.specific_social_type, undefined, comment?.specific_classify, comment.is_hidden,
      comment.specific_is_page, comment.specific_feature, comment.specific_is_conversation, comment.specific_ignore_labels, false);
    this.dropDownMenuRef && this.dropDownMenuRef.setData(menuActions);

    this.setState({
      menuActions: menuActions,
      isDisplayMenu: menuActions && menuActions.length && isSubComment && comment.specific_status_message === Constants.SOCIAL.STATE_SEND_DATA_TO_SERVER.MESSAGE_DELIVERED ? true : false,
      isDisplayMessageStatus: isSubComment && comment.specific_status_message !== Constants.SOCIAL.STATE_SEND_DATA_TO_SERVER.MESSAGE_DELIVERED ? true : false,
      isUserMessagedToPage: !comment.specific_is_page && comment.specific_is_message ? true : false,
      isHidenComment: comment.is_hidden ? true : false,
      commentActions: comment && comment.specific_buttons || [],
      classify: comment.specific_classify,
      messageStatus: comment.specific_status_message,
      supporter: supporter
    });
  }

  private initData = async () => {
    const { comment } = this.props;
    const supporter: any = await this.getLabelSupporter(comment);
    this.userAvatarDefault = await SocialService.getDefaultAvatar();
    comment.specific_label_supporter = supporter;
    this.setState({ isLoaded: true, supporter: supporter });
  }

  private renderDropDownMenuBase = (_item) => {
    return (
      <View style={[Styles.Row, Styles.JustifyEnd, { width: 30, height: 30 }]}>
        <CustomIcon name={'popover_menu'} size={16} color={Color.text} />
      </View>
    );
  }

  private renderDropDownMenuItem = (item) => {
    return (
      <View style={[Styles.Row, Styles.AlignCenter, { height: 35, opacity: item.isDisable ? 0.5 : 1 }]}>
        <CustomIcon name={item.iconClass} size={18} color={item.iconColor} style={{ marginRight: 8 }} />
        <WrapText st={[Styles.Text_S_R,]} c={Color.text}>{item.label}</WrapText>
      </View>
    );
  }

  hanleUpdateView = () => {
    // this.forceUpdate();
  }

  private handleRestoreDefault = () => {
    const { comment } = this.props;
    this.tempSelectedAttachments = comment.attachments && comment.attachments.data && SocialUtils.convertAttachmentsToDisplayUpdateComment(comment.attachments.data) || [];
  }

  private handleMenuSelect = (item: any) => {
    const { assignment, comment, onDeleteComment, onUpdateComment, onChangeHidden } = this.props;
    if (!assignment || !assignment.specific_page_container) {
      return toast(Languages.ManipulationUnSuccess, 'error');
    }
    switch (item.key) {
      case 'hidden':
        onChangeHidden && onChangeHidden(assignment.specific_page_container, comment, this.setData);
        break;
      case 'change_classify':
        const clasifyModal = {
          content: <SocialModalClassify comment={comment} assignment={assignment} onCallback={() => { this.setState({ classify: comment.specific_classify }) }} />
        };
        pushModal(clasifyModal);
        break;
      case 'edit':
        const editModal = {
          content: <SocialModalUpdateComment comment={comment} selectedAttachments={this.tempSelectedAttachments}
            assignment={assignment} onCallback={this.hanleUpdateView} onMediaFilePressHandler={this.handleMediaFilePress}
            onClose={this.handleCloseCommentUpdate} onUpdateComment={onUpdateComment} onRestoreDefault={this.handleRestoreDefault} />
        };
        pushModal(editModal);
        break;
      case 'delete':
        const deleteModal: IModal = {
          content: <NotificationModal
            ref={(comp) => { this.deleteModalRef = comp; }}
            title={'Thông báo'}
            titleTextAlign={'left'}
            content={'Bạn có muốn xóa trả lời bình luận này?'}
            ignoreIcon={true}
            iconName={'error_connection'}
            iconColor={Color.primary}
            autoOpen={true}
            autoClose={false}
            overlayClose={false}
            buttons={[{ name: 'Đồng ý' }, { name: 'Hủy bỏ' }]}
            onOk={() => {
              this.deleteModalRef && this.deleteModalRef.hide();
              onDeleteComment && onDeleteComment();
            }}
            onCancel={() => {
              this.deleteModalRef && this.deleteModalRef.hide();
            }} />
        };
        pushModal(deleteModal);
        break;
    }
  }


  private getNameMaxWidth = (avatarDimesion: number, isDisplayMenu: boolean, isDisplayMessageStatus: boolean,
    isHidenComment: boolean, isUserMessagedToPage: boolean) => {
    const menuWidth = isDisplayMenu ? 30 : 0;
    const messageStatusWidth = isDisplayMessageStatus ? 30 : 0;
    const messagedToPageWidth = isUserMessagedToPage ? 30 : 0;
    const hiddenCommentWidth = isHidenComment ? 30 : 0;
    return Constants.Width - 32 - avatarDimesion - menuWidth - messagedToPageWidth - hiddenCommentWidth - messageStatusWidth;
  }

  private getLabelSupporter = (comment: IComment) => {
    return new Promise(async resolve => {
      let supporter: string = 'Trả lời từ người dùng Facebook';
      switch (comment.specific_created_user) {
        case 'facebook':
          break;
        case 'youtube':
          supporter = 'Trả lời từ người dùng Youtube';
          break;
        case 'hệ thống':
          supporter = 'Trả lời từ hệ thống';
          break;
        default:
          const supporterLabel = await SocialUtils.getNameStaffById(undefined, undefined, comment.specific_created_user);
          supporter = `Trả lời bởi ${supporterLabel}`;
          break;
      }
      return resolve(supporter);
    });
  }

  private renderAttachments = (attachments: any[]) => {
    if (!attachments || !attachments.length) {
      return null;
    }
    return (
      attachments.map((item: any, index) => {
        if (item.type?.toLowerCase() === 'video' || item.type?.toLowerCase() === 'sound' || item.type?.toLowerCase() === 'video_inline') {
          return this.renderVideo(item, index);
        }
        if (item.type?.toLowerCase() === 'image' || item?.type?.toLowerCase() === 'gif' || item?.type?.toLowerCase() === 'sticker'
          || item.type?.toLowerCase() === 'animated_image_share' || item?.type?.toLowerCase() === 'added_photos'
          || item.type?.toLowerCase() === 'animated_image_autoplay' || item?.type?.toLowerCase() === 'animated_image_video_autoplay'
          || item.type === 'photo' || item.type === 'animated_image_video') {
          return this.renderImage(item, index);
        }
      })
    );
  }

  private renderVideo = (attachment: any, index) => {
    const source = attachment.media && attachment.media.source || '';
    if (!source) {
      return null;
    }
    return (
      <View style={{ marginTop: 5 }} key={`key_${index}`}>
        <VideoPlayer
          video={{ uri: source }}
          disableControlsAutoHide
        />
      </View>

    );
  }

  private renderImage = (attachment: any, index) => {
    const linkImg = attachment.media && attachment.media.image && attachment.media.image.src || '';
    if (!linkImg) {
      return null;
    }
    return (
      <TouchableWithoutFeedback
        key={`key_${index}`}
        onPress={() => { this.openZoomImageModal(linkImg); }}>
        <View style={{ marginTop: 5 }}>
          <AsyncImage source={{ uri: linkImg }} width={200} height={200} />
        </View>
      </TouchableWithoutFeedback>
    );
  }

  private openZoomImageModal = (link: any) => {
    const modal = {
      content: <ZoomImageViewer
        autoOpen={true}
        images={[link]}
        index={0}
      />
    };
    pushModal(modal);
  }

  private handleAction = async (action) => {
    const { comment, assignment } = this.props;
    action.disable = true;
    this.setState({ commentActions: [...comment.specific_buttons] });
    if (action.key === 'send_message') {
      if (!assignment || !assignment.specific_page_container || !assignment.last_message || !assignment.last_message.from || !assignment.last_message.from.id) {
        action.disable = false;
        this.setState({ commentActions: [...comment.specific_buttons] });
        return toast(Languages.ManipulationUnSuccess, 'error');
      }
      const page = assignment.specific_page_container;
      const resultConversations: any = await SocialService.getConversationByUserSocialId(page.social_type, page.id, assignment.last_message.from.id);
      if (!resultConversations || resultConversations.code === 404) {
        action.disable = false;
        this.setState({ commentActions: [...comment.specific_buttons] });
        return toast(Languages.ManipulationUnSuccess, 'error');
      }
      let conversation;
      if (!resultConversations.conversations || !resultConversations.conversations.id || resultConversations.is_exist === 0
        || (resultConversations.conversations.conversation_social_id === resultConversations.conversations.id)) {
        // Khách hàng chưa từng nhắn tin đến page
        const conversationSocialId = resultConversations && resultConversations.conversations && resultConversations.conversations.conversation_social_id || comment?.from?.id;
        conversation = SocialUtils.getDefaultUserAssign({ id: conversationSocialId }, { id: comment?.from?.id || '' });
      } else {
        conversation = resultConversations.conversations;
      }
      // Thêm các trường để initData
      conversation.page_social_id = page.page_social_id;
      conversation.social_type = page.social_type;
      let conversationAssignment: any = {};
      let conversationFeature: any = {};
      Router.replaceFrom(<ChatSocialDetailScreen
        assignment={conversationAssignment}
        notificationData={conversation}
        screenType={ScreenType.SOCIAL_DETAIL}
        ignoreRevoke={true}
        commentSocialId={comment.id}
        feature={conversationFeature} />, { screenType: ScreenType.SOCIAL_DETAIL, id: conversation.id });
      action.disable = false;
      this.setState({ commentActions: [...comment.specific_buttons] });
      return;
    }

    if (!assignment || !assignment.specific_page_container) {
      action.disable = false;
      this.setState({ commentActions: [...comment.specific_buttons] });
      return toast(Languages.ManipulationUnSuccess, 'error');
    }
    const resultDoLike = await FacebookService.doLike(comment.id, assignment.specific_page_container.token_auth, comment[action.fieldBind]);
    if (!resultDoLike) {
      action.disable = false;
      this.setState({ commentActions: [...comment.specific_buttons] });
      return toast(Languages.ManipulationUnSuccess, 'error');
    }
    action.disable = false;
    comment[action.fieldBind] = !comment[action.fieldBind];
    this.setState({ commentActions: [...comment.specific_buttons] });
    return;// toast(Languages.ManipulationSuccess, 'success');
  }

  private handleMediaFilePress = () => {
    Keyboard.dismiss();
    const modal = {
      content: <PickerFileModal selectSingleItem={true} typeUploads={['image', 'video']} onImageSelected={this.onImageSelectedHandler} />
    };
    pushModal(modal);
  }

  private onImageSelectedHandler = (attachments: any[]) => {
    const { fileSize, comment, assignment, onUpdateComment } = this.props;
    // const { selectedAttachments } = this.state;
    const tempAttachments = [];
    if (fileSize) {
      for (const attachment of attachments) {
        if (fileSize * 1024 * 1024 < attachment.fileSize) {
          continue;
        }
        tempAttachments.push(attachment);
      }
      if (tempAttachments.length !== attachments.length) {
        toast(`Kích thước tối đa của File không vượt quá ${fileSize}MB`, 'warning');
      }
    }
    this.tempSelectedAttachments = tempAttachments;
    setTimeout(() => {
      const editModal = {
        content: <SocialModalUpdateComment comment={comment} selectedAttachments={this.tempSelectedAttachments}
          assignment={assignment} onCallback={this.hanleUpdateView} onMediaFilePressHandler={this.handleMediaFilePress}
          onClose={this.handleCloseCommentUpdate} onUpdateComment={onUpdateComment} />
      };
      pushModal(editModal);
    }, 0);


  }

  private handleCloseCommentUpdate = () => {
    const { comment } = this.props;
    this.tempSelectedAttachments = comment.attachments && comment.attachments.data && SocialUtils.convertAttachmentsToDisplayUpdateComment(comment.attachments.data) || [];
  }

  getMessageStatus = (messageStatus: number) => {
    const result = {
      icon: undefined,
      message: '',
    };
    switch (messageStatus) {
      case Constants.SOCIAL.STATE_SEND_DATA_TO_SERVER.MESSAGE_SENDING:
        result.icon =
          <View style={[{ justifyContent: 'center', alignItems: 'center', flexDirection: 'row', marginRight: 5 }]}>
            <Indicator isShow={true} color={Color.textSecondary} size={14} />
          </View>;
        result.message = '';
        break;
      case Constants.SOCIAL.STATE_SEND_DATA_TO_SERVER.MESSAGE_SENT:
        result.icon = <CustomIcon name={'mark_selected'} size={16} color={Color.textSecondary} />;
        result.message = 'Đã gửi';
        break;
      case Constants.SOCIAL.STATE_SEND_DATA_TO_SERVER.MESSAGE_DELIVERED:
        result.icon = <CustomIcon name={'received'} size={16} color={Color.textSecondary} />;
        result.message = 'Đã nhận';
        break;
      case Constants.SOCIAL.STATE_SEND_DATA_TO_SERVER.MESSAGE_READ:
        result.icon = <CustomIcon name={'received'} size={16} color={Color.secondary} />;
        result.message = 'Đã đọc';
        break;
      case Constants.SOCIAL.STATE_SEND_DATA_TO_SERVER.MESSAGE_FAIL:
        result.icon = <CustomIcon name={'error_connection'} size={16} color={Color.red} />;
        result.message = 'Vui lòng kiểm tra kết nối mạng và gửi lại tin nhắn';
        break;
      case Constants.SOCIAL.STATE_SEND_DATA_TO_SERVER.MESSAGE_SEND_MOBIO_FAIL:
        result.icon = <CustomIcon name={'error_connection'} size={16} color={Color.red} />;
        result.message = 'Vui lòng kiểm tra kết nối mạng và gửi lại tin nhắn';
        break;
      case Constants.SOCIAL.STATE_SEND_DATA_TO_SERVER.COMMENT_SEND_FACEBOOK_FAIL:
        result.icon = <CustomIcon name={'error_connection'} size={16} color={Color.red} />;
        result.message = 'Không gửi được bình luận đến máy chủ Facebook';
        break;
      case Constants.SOCIAL.STATE_SEND_DATA_TO_SERVER.COMMENT_SEND_INSTAGRAM_FAIL:
        result.icon = <CustomIcon name={'error_connection'} size={16} color={Color.red} />;
        result.message = 'Không gửi được bình luận đến máy chủ Instagram';
        break;
      case Constants.SOCIAL.STATE_SEND_DATA_TO_SERVER.MESSAGE_SEND_FACEBOOK_FAIL:
        result.icon = <CustomIcon name={'error_connection'} size={16} color={Color.red} />;
        result.message = 'Không gửi được tin nhắn đến máy chủ Facebook';
        break;
      case Constants.SOCIAL.STATE_SEND_DATA_TO_SERVER.MESSAGE_SEND_ZALO_FAIL:
        result.icon = <CustomIcon name={'error_connection'} size={16} color={Color.red} />;
        result.message = 'Không gửi được tin nhắn đến máy chủ Zalo';
        break;
      case Constants.SOCIAL.STATE_SEND_DATA_TO_SERVER.MESSAGE_USER_DISALLOW_APP:
        result.icon = <CustomIcon name={'error_user_block'} size={126} color={Color.red} />;
        result.message = 'Profile đã chặn ứng dụng, website của bên thứ 3';
        break;
    }
    return result;

  }

  private renderMessageStatus = (messageStatus: number) => {
    return this.getMessageStatus(messageStatus).icon;
  }

  private showCopyModal = (content: string, title?: string) => {
		const modal = {
			content: <SocialModalCopyClipboard content={content} title={title} />
		};
		pushModal(modal);
	}

  render() {
    const { avatarDimesion, isSubComment, containerStyle, comment } = this.props;
    const { isLoaded, isDisplayMenu, isDisplayMessageStatus, isHidenComment, isUserMessagedToPage, menuActions,
      commentActions, classify, messageStatus, supporter } = this.state;

    const nameMaxWidth = this.getNameMaxWidth(avatarDimesion, isDisplayMenu, isDisplayMessageStatus, isHidenComment, isUserMessagedToPage);
    if (!comment || !isLoaded) {
      return null;
    }

    return (
      <View style={[Styles.JustifyBetween, containerStyle]}>
        <View style={[Styles.Row, Styles.AlignCenter, Styles.JustifyBetween]}>
          <View style={[Styles.Row, Styles.AlignCenter]}>
            <AsyncImage source={{ uri: comment.specific_avatar || '' }}
              width={avatarDimesion}
              height={avatarDimesion}
              radius={avatarDimesion / 2}
              iconDefault={this.userAvatarDefault}
              style={{ marginRight: 6 }} />
            <WrapText st={Styles.Text_S_SB} styles={[{ maxWidth: nameMaxWidth }]}>{comment.from && comment.from.name || ''}</WrapText>
            {
              !!isUserMessagedToPage &&
              <CustomIcon name={'contacted'} size={18} color={Color.green} style={{ marginLeft: 10 }} />
            }
            {!!isHidenComment &&
              <CustomIcon name={'hide_password'} size={16} style={{ marginLeft: 10 }} />
            }
          </View>

          {!!isDisplayMenu &&
            <Dropdown
              ref={(comp: any) => { this.dropDownMenuRef = comp; }}
              align={'right'}
              height={35}
              width={comment.specific_is_page ? 90 : 200}
              renderBase={this.renderDropDownMenuBase}
              renderItem={this.renderDropDownMenuItem}
              pickerStyleOverrides={{}}
              dropdownOffset={{ top: 35, right: 15 }}
              onItemSelected={this.handleMenuSelect}
              data={menuActions}
            />
          }
          {
            !!isDisplayMessageStatus && this.renderMessageStatus(messageStatus)
          }
        </View>
        <View style={{ marginBottom: 6 }}>
          {
            !!isSubComment && !!comment.specific_is_page &&
            <WrapText st={[Styles.Text_T_R, {}]} styles={[{ opacity: 0.5, marginBottom: 6, marginLeft: avatarDimesion + 6 }]}>{supporter || '-'}</WrapText>
          }
          <View style={[Styles.RowCenter]}>
            {/* {
              !!isDisplayMessageStatus && <CustomIcon name={'resend_mess'} size={20} color={Color.primary} />
            } */}
            {
              !!comment.message && !!comment.message.trim() &&
              <View style={{ borderRadius: 2, padding: 8, backgroundColor: Color.gray, opacity: isDisplayMessageStatus ? 0.5 : 1, marginLeft: avatarDimesion + 6 }}>
                <ViewMoreHTML
                  onCopy={(link) => { this.showCopyModal(link); }}
                  textStyle={[Styles.Text_S_R, {}]}
                  textMoreStyle={[Styles.Text_S_R, { color: Color.primary, marginVertical: 8 }]}
                  text={comment.message.trim()}
                  minNumberLines={3}
                  minHeight={62} />
              </View>
            }
          </View>
          {
            !!isDisplayMessageStatus && !!this.getMessageStatus(messageStatus).message &&
            <WrapText st={[Styles.Text_T_R, { marginLeft: avatarDimesion + 6 }]} c={Color.red} styles={[{ marginTop: 6 }]} nl={2}>
              {this.getMessageStatus(messageStatus).message}
            </WrapText>
          }
          {
            !!comment.attachments && !!comment.attachments.data &&
            <View style={{ marginLeft: avatarDimesion + 6 }}>
              {
                this.renderAttachments(comment.attachments.data)
              }
            </View>
          }
          <View style={[Styles.Row, { marginTop: 6, marginLeft: avatarDimesion + 6 }]}>
            <WrapText st={Styles.Text_T_R} styles={{ opacity: 0.5 }}>{comment.created_time ? moment(comment.created_time).format('DD/MM/y HH:mm') : ''}</WrapText>
            {!comment.specific_is_page &&
              <View style={[Styles.RowCenter, { marginLeft: 20 }]}>
                <CustomIcon name={SocialUtils.setClassifyStatus(classify).iconName} size={10} color={SocialUtils.setClassifyStatus(classify).color} />
                <WrapText st={[Styles.Text_T_R, { marginLeft: 5 }]} c={SocialUtils.setClassifyStatus(classify).color}>{SocialUtils.setClassifyStatus(classify).text}</WrapText>
              </View>
            }
          </View>
          <View style={[Styles.Row, { marginLeft: avatarDimesion + 6 }]}>
            {
              !!commentActions && commentActions.map((action, index) => {
                if ((action.fieldBind === 'specific_is_conversation' && comment?.specific_is_conversation && !comment?.specific_is_page)
                  || (action.fieldBind !== 'specific_is_conversation')) {
                  return (
                    <WrapButton
                      key={`key_${index}`}
                      text={action.label}
                      size={'ms'}
                      width={action.key === 'like' ? 80 : 120}
                      iconLeft={action.classValues[comment[action.fieldBind] ? comment[action.fieldBind] : false]}
                      iconSize={14}
                      type={'none'}
                      active={true}
                      enable={!action.disable}
                      containerStyle={{ marginRight: 20 }}
                      onPress={() => { this.handleAction(action); }}
                    />
                  );
                }
                return null;
              })
            }
          </View>
        </View>
      </View>
    );
  }
}
