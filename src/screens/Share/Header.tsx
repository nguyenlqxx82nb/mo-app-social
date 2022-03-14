import { SocialConstants, SocialUtils } from '../../common';
import { IAssignmentItem, IAssignmentItemConversationItem, IComment, IFeatureAssign, IMenuItem, IPageAssign } from 'api';
import { CdpService, changeHeaderHeight, Color, Config, Constants, CustomIcon, EventService, JwtHelper, SocialService, Styles, toast } from 'mo-app-common';
import { AsyncImage, ButtonRipple, Dropdown, Router, ScreenType, WrapText, pushModal, IModal } from 'mo-app-comp';
import React, { PureComponent } from 'react';
import { AppState, DeviceEventEmitter, EmitterSubscription, StyleSheet, TouchableOpacity, View } from 'react-native';
import SocialHistoryAssignModal from '../HistoryAssign';
import SocialAssignmentInformation from '../AssignmentInformation';
import SocialBrowserInformation from '..//BrowserInformation';
import Languages from 'mo-app-common/src/Common/Languages';
import { ITagItem } from '../Tags/Search';
import SocialTagsModal from '../Tags';
import SocialForwardChatScreen from '../Forward';
import { GET_DEFAULT_FILTER } from 'mo-app-common/src/Services/Social/SocialService';
import { TAB_SOCIAL_DEFAULT } from '../../define/DataDefine';
import moment from 'moment';
import { SocketManager } from 'mo-app-layout';
import { SocialModalClassify } from '../Modals';
const cloneDeep = require('clone-deep');

interface SocialShareHeaderScreenProps {
  assignment: IAssignmentItem;
  feature: IFeatureAssign;
  screenType: ScreenType;
  onDisplayMessageTag?: () => void;
  onClearText?: () => void;
  onRefreshData?: () => void;
  onSetAvatarForPage?: (avatar: string) => void;
  onUpdateConversations?: () => void;
  onBackgroundFetchData?: () => void;
  onSearchContent?: () => void;
  onUpdateConversationItem?: (conversationItem: IAssignmentItemConversationItem, fieldKey?: string) => void;
  onChangeHidden?: (page: IPageAssign, comment: IComment, onCallback: Function) => void;
}

interface SocialShareHeaderScreenState {
  userAvatarDefault?: string;
  userAvatar?: string;
  userName?: string;
  headerHeight?: number;
  visitorStatus: string;
  displayResolveButton: boolean;
  enabaleMenu?: boolean;
}

export class SocialShareHeaderScreen extends PureComponent<SocialShareHeaderScreenProps, SocialShareHeaderScreenState> {
  private dropDownMenuRef: Dropdown;
  private menuItems: IMenuItem[] = [];
  private assignTagsItems: ITagItem[] = [];
  private profileTagsItems: ITagItem[];
  private timerIntervalRevoke: any;
  private socketSubscription: EmitterSubscription;
  private dataSocketContainer: Map<string, any>;
  private timeOutNextProcess: any;
  private ignoreRevoke: boolean = false;

  constructor(props: SocialShareHeaderScreenProps) {
    super(props);

    this.dataSocketContainer = new Map();
    this.state = {
      userAvatarDefault: '',
      userAvatar: props.assignment && props.assignment.specific_avatar || '',
      userName: props.assignment && props.assignment.specific_username || '',
      headerHeight: 79,
      visitorStatus: props.assignment && props.assignment.specific_status_online || SocialConstants.KEY_CHECK_WEB_LIVE_CHAT_USER_OFFLINE,
      displayResolveButton: props.assignment && props.assignment.status && props.assignment.status !== 2 ? true : false,
      enabaleMenu: true,
    };
    props.assignment && (props.assignment.specific_loading_content = false);
    this.initSpecific();
  }

  componentDidMount() {
    const { assignment } = this.props;
    assignment && (assignment.specific_update_menu_header = this.initMenuItems);
    this.timerIntervalRevoke = setInterval(this.autoRevoke, 5000);
    AppState.addEventListener('change', this.handleAppStateChange);
    this.initUserAvatarDefault();
    this.initMenuItems();
    this.assignTagsItems = assignment && assignment.tags ? SocialService.convertTags(assignment.tags) : [];
    this.socketSubscription && this.socketSubscription.remove();
    this.socketSubscription = DeviceEventEmitter.addListener(Constants.EmitCode.SOCIAL_NOTIFICATION, this.handleSocket);
  }

  componentWillUnmount() {
    const { assignment } = this.props;
    AppState.removeEventListener('change', this.handleAppStateChange);
    clearInterval(this.timerIntervalRevoke);
    clearTimeout(this.timeOutNextProcess);
    this.socketSubscription && this.socketSubscription.remove();
    assignment && (assignment.specific_update_menu_header = undefined);
  }

  setData = () => {
    const { assignment } = this.props;
    this.setState({
      userAvatar: assignment && assignment.specific_avatar || '',
      userName: assignment && assignment.specific_username || '',
      visitorStatus: assignment && assignment.specific_status_online || SocialConstants.KEY_CHECK_WEB_LIVE_CHAT_USER_OFFLINE,
      displayResolveButton: assignment && assignment.status && assignment.status !== 2 ? true : false
    });
    this.initMenuItems();
  }

  private autoRevoke = () => {
    try {
      const { feature, assignment } = this.props;
      if (!feature || !assignment || !feature.filter || feature.ignoreRevoke || this.ignoreRevoke) {
        return;
      }
      if (!SocialService.validAssignmentWithFilter(assignment, feature.filter, this.ignoreRevoke)) {
        return this.handleBack();
      }
    } catch (err) {
      console.log('autoRevoke err', err);
    }
  }

  setIgnoreRevoke = (value: boolean) => {
    this.ignoreRevoke = value;
  }

  private handleAppStateChange = (nextAppState) => {
    const { assignment, onBackgroundFetchData } = this.props;
    if (SocketManager.getSocket()) {
    }
    if (nextAppState !== 'active') {
      return;
    }
    if (SocketManager.getSocket() && !SocketManager.getSocket().id) {
      assignment.specific_query = undefined;
      assignment.specific_conversations = undefined;
      assignment.specific_loading_content = false;

      onBackgroundFetchData && onBackgroundFetchData();
    }
  }

  updateData = (currentNotificationData) => {
    this.socketSubscription && this.socketSubscription.remove();
    this.socketSubscription = DeviceEventEmitter.addListener(Constants.EmitCode.SOCIAL_NOTIFICATION, this.handleSocket);
    const { feature } = this.props;
    feature.itemSelected = undefined;
    this.setState({ userAvatar: '', userName: '—' });
    this.setState({ visitorStatus: SocialConstants.KEY_CHECK_WEB_LIVE_CHAT_USER_OFFLINE }, () => {
      this.initDataFromNotification(currentNotificationData);
    });
  }

  private initDataFromNotification = async (currentNotificationData) => {
    const currentAssignment = currentNotificationData;
    const { feature, assignment, onDisplayMessageTag, onClearText, onSetAvatarForPage, onRefreshData } = this.props;

    const featureCodeOfSocket = currentAssignment.socket_type ? SocialService.getFeatureTypeBySocialTypeSocket(currentAssignment.socket_type) : '';
    // featureCodeOfSocket rỗng khi mở từ comment
    if (featureCodeOfSocket && (featureCodeOfSocket !== Constants.SOCIAL.FEATURE_CODE.MESSAGE) && (featureCodeOfSocket !== Constants.SOCIAL.FEATURE_CODE.COMMENT)) {
      this.handleBack(false, 2000);
      return;
    }
    const result: any = await SocialService.getAllSocialPage();
    if (!result || !result.pages || !result.pages.length) {
      this.handleBack(false, 2000);
      return;
    }
    const pages = result.pages.filter(page => { return page.page_social_id === currentAssignment.page_social_id; });
    if (!pages || !pages.length) {
      this.handleBack(false, 2000);
      return;
    }
    const page = pages[0];
    currentAssignment.specific_page_container = page;
    await SocialService.getAvatarPage(page, false);
    await SocialService.getAllConfigPages([page]);

    let newAssignment;
    const defaultFilter = featureCodeOfSocket ? GET_DEFAULT_FILTER(featureCodeOfSocket) : undefined; // Trường hợp mở từ bình luận sẽ không có defaultFilter

    if (defaultFilter) {
      defaultFilter.object_id = currentAssignment.id;
      // defaultFilter && (defaultFilter.object_id = currentAssignment.id);
      const resultAssignment: any = await SocialService.getAssignments(currentAssignment.social_type, SocialUtils.getQueryFilter(defaultFilter, 1, 10));
      if (!resultAssignment || resultAssignment.code !== '001' || !resultAssignment.data) {
        return this.handleBack(false, 2000);
      }
      newAssignment = resultAssignment.data[0];
    }
    if (currentAssignment.id) { // Khách hàng đã từng nhắn tin đến page
      const resultAssignById: any = await SocialService.getAssignById(currentAssignment.social_type, page.id, currentAssignment.id, Constants.SOCIAL.FEATURE_CODE.MESSAGE);
      if (!resultAssignById || resultAssignById.code !== '001' || !resultAssignById.data) {
        this.handleBack(false, 2000);
        return;
      }
      newAssignment = resultAssignById.data[0];
      Object.assign(currentAssignment, newAssignment);
      this.assignTagsItems = currentAssignment && currentAssignment.tags ? SocialService.convertTags(currentAssignment.tags) : [];
    }

    if (defaultFilter && !SocialService.validAssignmentWithFilter(currentAssignment, defaultFilter, this.ignoreRevoke)) {
      this.handleBack(false, 2000);
      return;
    }

    this.setState({ visitorStatus: assignment && assignment.specific_status_online || SocialConstants.KEY_CHECK_WEB_LIVE_CHAT_USER_OFFLINE });
    if (!currentAssignment.specific_page_container) {
      this.handleBack(false, 2000);
      return;
    }
    const tabs: any = TAB_SOCIAL_DEFAULT([currentAssignment.specific_page_container], '');
    if (!tabs || !tabs.length || !tabs[0].features || !tabs[0].features.length) {
      this.handleBack(false, 2000);
      return;
    }
    const currentFeature = tabs[0].features.find(item => { return item.code === currentAssignment.type; });
    if (!currentFeature) {
      this.handleBack(false, 2000);
      return;
    }
    Object.assign(feature, currentFeature);
    Object.assign(assignment, currentAssignment);
    onClearText && onClearText();
    onSetAvatarForPage && onSetAvatarForPage(assignment.specific_page_container.icon || '');
    onDisplayMessageTag && onDisplayMessageTag();
    this.initMenuItems();
    SocialService.readAssignAssignment(feature, assignment, undefined);
    await SocialService.buildAvatarAndName(assignment);
    SocialService.runTimeProcess(assignment, feature.code, undefined);
    this.setState({
      userAvatar: assignment.specific_avatar, userName: assignment.specific_username,
      displayResolveButton: assignment && assignment.status && assignment.status !== 2 ? true : false
    });
    if (assignment.specific_page_container && assignment.specific_page_container.social_type === Constants.SOCIAL.TYPE.WEB_LIVE_CHAT && !assignment.specific_status_online) {
      await SocialService.chatToolGetStatusOnline(assignment, assignment.last_message.from.id);
      this.setState({ visitorStatus: assignment && assignment.specific_status_online || SocialConstants.KEY_CHECK_WEB_LIVE_CHAT_USER_OFFLINE });
    }
    if (!assignment.specific_conversations || !assignment.specific_conversations.length) {
      onRefreshData && onRefreshData();
    }
    await SocialService.getTagsAssignByIds(assignment, assignment.specific_page_container.social_type, feature.code);
    this.getProfileInfo(assignment);
  }

  private getProfileInfo = async (assignment) => {
    if (!assignment.last_message || !assignment.last_message.from) {
      return;
    }
    const idSocial = assignment.last_message.from.id;
    let profile: any = SocialService.profilesBySocialIds.get(idSocial);
    let socialObj: any;
    if (profile) {
      socialObj = profile.social_name.find(item => item.social_id === idSocial);
      assignment.specific_username = socialObj.name || profile.social_name[0].name || profile.name;
      this.initSpecific();
      return this.setState({ userAvatar: assignment.specific_avatar || '', userName: assignment.specific_username || '' });
    }
    const resultProfiles: any = await this.getProfiles([idSocial]);
    if (!resultProfiles || !resultProfiles.length) {
      this.initSpecific();
      return this.setState({ userAvatar: assignment.specific_avatar || '', userName: assignment.specific_username || '' });
    }
    socialObj = resultProfiles[0].social_name.find(item => item.social_id === idSocial);
    if (!socialObj) {
      this.initSpecific();
      return this.setState({ userAvatar: assignment.specific_avatar, userName: assignment.specific_username });
    }
    assignment.specific_username = socialObj.name;
    this.initSpecific();
    this.setState({ userAvatar: assignment.specific_avatar || '', userName: assignment.specific_username || '' });
  }

  getProfiles = (idSocials: string[]) => {
    return new Promise(resolve => {
      CdpService.getProfileBySocialIds(idSocials).then(result => {
        if (!result || !result.data || !result.data.length) {
          return resolve(false);
        }
        const profiles = result.data;
        for (const profile of profiles) {
          const socials = [];
          if (profile.social_user && profile.social_user.length) {
            socials.push(...profile.social_user);
          }

          if (profile.social_name && profile.social_name.length) {
            socials.push(...profile.social_name);
          }
          if (!socials.length) {
            continue;
          }
          for (const social of socials) {
            SocialService.profilesBySocialIds.set(social.social_id, profile);
          }
        }
        resolve(result.data);
      });
    });
  }

  initSpecific = () => {
    const { assignment } = this.props;
    assignment && (assignment.specific_update_status_online = this.updateAssignment);
    assignment && (assignment.specific_update_view_detail_screen = this.updateViewDetailScreen);
    assignment && (assignment.specific_update_view_exist_message = this.updateViewExistMessage);
    assignment && (assignment.specific_update_tag_activity_status = this.handleUpdateActivityStatus);
    assignment && (assignment.specific_update_action_menu = this.initMenuItems);
    assignment && (assignment.specific_update_avatar_name = this.updateAvatarAndName);
  }

  private updateAssignment = (status: string) => {
    const { assignment } = this.props;
    if (!assignment) {
      return;
    }
    assignment.specific_status_online = status;
    this.setState({ visitorStatus: status });
  }

  private updateViewDetailScreen = () => {
    const { onDisplayMessageTag, onUpdateConversations } = this.props;
    onDisplayMessageTag && onDisplayMessageTag();
    onUpdateConversations && onUpdateConversations();
  }

  private updateViewExistMessage = (conversationItem: IAssignmentItemConversationItem, fieldKey?: string) => {
    const { onUpdateConversationItem } = this.props;
    if (!conversationItem || !fieldKey) {
      return;
    }
    onUpdateConversationItem(conversationItem, fieldKey);
  }

  private updateAvatarAndName = () => {
    const { assignment } = this.props;
    if (assignment && assignment.specific_username && assignment.specific_username !== '—') {
      this.setState({ userName: assignment.specific_username });
    }
    if (assignment && assignment.specific_avatar) {
      this.setState({ userAvatar: assignment.specific_avatar });
    }
  }

  private handleUpdateActivityStatus = () => {
    const { assignment } = this.props;
    this.disableAssignProfileTag(assignment);
  }

  private nextProcess = (dataContainer) => {
    if (dataContainer.length) {
      dataContainer.splice(0, 1);
    }
    this.processingDataSocket(dataContainer);
  }

  private handleSocket = (event) => {
    const { feature } = this.props;
    if (!feature || !feature.tabOrigin) {
      return;
    }
    if (!event || !event.body || (event.body.social_type && event.body.social_type.toString() !== `${feature.tabOrigin.social_type}`)) {
      return;
    }
    const body = event.body;
    const socketType = body.socket_type;
    const featureCodeOfSocket = SocialService.getFeatureTypeBySocialTypeSocket(socketType);
    if (feature.code !== featureCodeOfSocket) {
      return;
    }
    let dataContainer = this.dataSocketContainer.get(socketType);
    if (!dataContainer) {
      dataContainer = [];
      this.dataSocketContainer.set(socketType, dataContainer);
    }
    dataContainer.push({ body: body, isProcessing: false });
    this.processingDataSocket(dataContainer);
  }

  private mergeAssignment = (currentAssignment: IAssignmentItem, newAssignment: IAssignmentItem) => {
    if (newAssignment.type === Constants.SOCIAL.FEATURE_CODE.MESSAGE && newAssignment.last_message && newAssignment.last_message.from &&
      newAssignment.last_message.from.id === currentAssignment.social.id && newAssignment.social && newAssignment.social.id) {
      // tin nhắn đầu tiên chưa có conversation_social_id
      currentAssignment.social.id = newAssignment.social.id;
    }
    if (currentAssignment.social.id !== newAssignment.social.id) {
      return;
    }
    this.ignoreRevoke && (currentAssignment.id = newAssignment.id);
    if (currentAssignment.id !== newAssignment.id) {
      return;
    }
    SocialService.mergeAssignment(newAssignment, currentAssignment, currentAssignment);
  }

  private processingDataSocket = (dataContainer: Array<{ body: any, isProcessing: boolean }>) => {
    try {
      const { feature, assignment } = this.props;
      const data = dataContainer[0];
      if (!data || data.isProcessing) {
        return;
      }
      data.isProcessing = true;
      const body = data.body;
      switch (body.socket_type) {
        case 'REPLY_MESSAGE_SOCKET':
          body.is_reply = 1;
          const newAssignment: any = SocialService.buildAssignmentFromSocket(body, feature.code);
          this.mergeAssignment(assignment, newAssignment);
          break;
        case 'NEW_MESSAGE_SOCKET':
          body.is_reply = 0;
          const newMessageAssignment: any = SocialService.buildAssignmentFromSocket(body, feature.code);
          SocialService.convertsocialAttachment(newMessageAssignment, feature.tabOrigin.pages[0], 'specific_attachments');
          this.mergeAssignment(assignment, newMessageAssignment);
          this.setState({ displayResolveButton: assignment && assignment.status && assignment.status !== 2 ? true : false });
          SocialService.readAssignAssignment(feature, assignment, undefined);
          break;
        case 'SEEN_CONVERSATION_SOCKET':
          if (assignment.id !== body.conversation_id) {
            break;
          }
          assignment.seen_time = body.seen_time;
          assignment.specific_update_view_detail_screen && assignment.specific_update_view_detail_screen(assignment);
          break;
        case 'ASSIGN_CONVERSATION_SOCKET':
          if (assignment.id !== body.data.conversation.id) {
            break;
          }
          this.assignSocket('conversation', body);
          break;
        case 'ASSIGN_TAG_CONVERSATION_SOCKET':
          if (!body.data || !body.data.assign || !body.data.assign.length || assignment.id !== body.data.assign[0].conversation_id) {
            break;
          }
          this.updateUserAssignsSocket(body.social_type);
          break;
        case 'RESOLVED_CONVERSATION_SOCKET':
          if (assignment.id !== body.data.resolve_object_id) {
            break;
          }
          this.resolveSocket(assignment, body, feature);
          break;
        case 'VISITOR_CHANGE_STATUS':
          if (!assignment.last_message || !assignment.last_message.from || assignment.last_message.from.id !== body.visitor_id) {
            break;
          }
          this.onlineVisitor(assignment, body);
          break;
        case 'UPDATE_COMMENT_ASSIGN_TAG_ACTIVITY_STATUS_SOCKET':
        case 'UPDATE_CONVERSATION_ASSIGN_TAG_ACTIVITY_STATUS_SOCKET':
        case 'UPDATE_RATING_ASSIGN_TAG_ACTIVITY_STATUS_SOCKET':
          if (assignment.id !== body.object_id) {
            break;
          }
          this.updateTagsActivitySatus(body, assignment);
          break;


        case 'REPLY_COMMENT_TOPIC_SOCKET':
          SocialUtils.replyCommentTopicSocket(body, [assignment], feature);
          break;
        case 'POST_SUB_COMMENT_SOCKET': // chỉ nhận socket khi sub_comment không phải của adminFanpage;
          // doi Hoa trả thêm thông tin để ko cần call api từ FB
          if (body.social_type === 1) {
            SocialUtils.getCommentFB(body, [assignment], feature, false);
          }
          break;
        case 'ASSIGN_COMMENT_SOCKET':
          this.assignSocket('comment', body);
          break;
        case 'CLASSIFY_COMMENT_SOCKET':
          SocialUtils.classifyComment(body, [assignment]);
          break;
        // case 'DISLIKE_COMMENT_SOCKET':
        //   const dataChangeDisLike = { user_likes: false };
        //   this.updateComment(body, dataChangeDisLike); // đang lỗi do khi dislike webhook FB vẫn trả về like
        //   break;
        // case 'LIKE_COMMENT_SOCKET':
        //   const dataChangeLike = { user_likes: true };
        //   this.updateComment(body, dataChangeLike);
        //   break;
        case 'EDIT_COMMENT_TOPIC_SOCKET':
          const dataEdit: any = { message: body.data.content };
          if (body.data.photo) {
            dataEdit.attachments = {
              data: [{
                media: {
                  image: { src: body.data.photo }
                },
                type: 'photo',
              }]
            };
          }
          // video chưa có link
          SocialUtils.updateComment([assignment], undefined, body, dataEdit);
          break;
        case 'DELETE_COMMENT_TOPIC_SOCKET':
          SocialUtils.updateComment([assignment], undefined, body, {}, (assign) => {
            console.log('DELETE_COMMENT_TOPIC_SOCKET');
            this.initMenuItems();
            if (!SocialService.validAssignmentWithFilter(assign, feature.filter, this.ignoreRevoke)) {
              this.handleBack();
            }
          }, true);
          break;
        case 'UNHIDE_COMMENT_TOPIC_SOCKET':
          const dataChangeUnHide = { is_hidden: false };
          SocialUtils.updateComment([assignment], undefined, body, dataChangeUnHide);
          break;
        case 'HIDE_COMMENT_TOPIC_SOCKET':
          const dataChangeHide = { is_hidden: true };
          SocialUtils.updateComment([assignment], undefined, body, dataChangeHide);
          break;
        case 'ASSIGN_TAG_COMMENT_SOCKET':
          if (!body.data || !body.data.assign || !body.data.assign.length || assignment.id !== body.data.assign[0].comment_id) {
            break;
          }
          this.updateUserAssignsSocket(body.social_type);
          break;
        case 'RESOLVED_COMMENT_SOCKET':
          if (assignment.id !== body.data.resolve_object_id) {
            break;
          }
          this.resolveSocket(assignment, body, feature);
          break;

      }
    } catch (err) {
      console.log(err);
    }
    this.timeOutNextProcess = setTimeout(() => {
      this.nextProcess(dataContainer);
    }, 150);
  }

  private resolveSocket = (assignment, body, feature) => {
    assignment.is_reply = body.data.is_reply || 0;
    assignment.unread_number = 0;
    assignment.status = 2;
    assignment.resolved_time = body.resolved_time;
    assignment.resolved_user = body.resolved_user;
    this.setState({
      displayResolveButton: assignment && assignment.status && assignment.status !== 2 ? true : false
    });
    if (!SocialService.validAssignmentWithFilter(assignment, feature.filter, this.ignoreRevoke)) {
      this.handleBack();
      return;
    }
    SocialService.pushMessageOfConversation(assignment, assignment);
    return;
  }

  private updateUserAssignsSocket = async (social_type: number): Promise<any> => {
    const { assignment, feature } = this.props;
    const cloneFilter = cloneDeep(feature.filter);
    cloneFilter.object_id = assignment.id;
    const result: any = await SocialService.getAssignments(social_type, SocialUtils.getQueryFilter(cloneFilter, 1, 10));
    if (!result.code || result.code !== '001' || !result.data || !result.data.length) {
      return this.handleBack();
    }
    const userAssign = result.data[0];
    userAssign.specific_ignore_push_conversation = true;
    SocialService.mergeAssignment(userAssign, assignment, assignment);
    this.assignTagsItems = assignment && assignment.tags ? SocialService.convertTags(assignment.tags) : [];
    if (!SocialService.validAssignmentWithFilter(assignment, feature.filter, this.ignoreRevoke) && SocialUtils.checkCurrentScreen(ScreenType.SOCIAL_DETAIL)) {
      return this.handleBack();
    }
  }

  private assignSocket = (fieldAssign: string, body) => {
    const { feature, assignment } = this.props;
    const newAssignment = body && body.data && body.data[fieldAssign];
    newAssignment.page_social_id = body.page_social_id;
    const assignType = body && body.data && body.data.assignee_type;
    const pages = feature.tabOrigin ? feature.tabOrigin.pages : [];
    const pageContainer = pages.find(page => page.page_social_id === newAssignment.page_social_id);
    assignment.assignees.length = 0;
    assignment.assignees && newAssignment.assignees[0] && assignment.assignees.push(newAssignment.assignees[0]);
    this.initMenuItems();
    if (!pageContainer) {
      return;
    }
    newAssignment.specific_page_container = pageContainer;
    if ((assignType === 'TEAM') || !SocialService.validAssignmentWithFilter(newAssignment, feature.filter, this.ignoreRevoke)) {
      this.handleBack(false, 1000);
      return;
    }
  }

  private onlineVisitor = (assignment, body) => {
    assignment.specific_status_online = body.status;
    // SocialService.runTimeProcess(assignment, feature.code, this.handlerUpdateListViewItem, true); // TODO
    assignment && assignment.specific_update_status_online && assignment.specific_update_status_online(body.status);
    return;
  }

  private checkValidMenuItems = (menuItem: IMenuItem) => {
    const { feature } = this.props;
    if (!feature || !feature.tabOrigin || !feature.tabOrigin.social_type || menuItem.isIgnore) {
      return false;
    }
    if (!menuItem.socialTypes || !menuItem.socialTypes.length || !menuItem.featureCodes || !menuItem.featureCodes.length) {
      return true;
    }
    if (menuItem.socialTypes.find(socialType => socialType === feature.tabOrigin.social_type) &&
      menuItem.featureCodes.find(featureCode => featureCode === feature.code)) {
      return true;
    }
    return false;
  }

  private initMenuItems = () => {
    const { feature, assignment } = this.props;
    if (!feature || !assignment) {
      this.menuItems.length = 0;
      this.dropDownMenuRef && this.dropDownMenuRef.setData(this.menuItems);
      this.setState({ enabaleMenu: false });
      return;
    }
    if (feature.code === Constants.SOCIAL.FEATURE_CODE.COMMENT && (!assignment.specific_post_or_feed || !assignment.specific_post_or_feed.specific_comments || !assignment.specific_post_or_feed.specific_comments.length)) {
      this.menuItems.length = 0;
      this.dropDownMenuRef && this.dropDownMenuRef.setData(this.menuItems);
      this.setState({ enabaleMenu: false });
      return;
    }
    const defaultItems = this.menuItemsDefault();
    this.menuItems = defaultItems.filter(item => this.checkValidMenuItems(item));
    this.dropDownMenuRef && this.dropDownMenuRef.setData(this.menuItems);
    const menuProfileTag = this.menuItems.find(menu => { return menu.icon === 'add_tag_profile'; });
    if (!this.menuItems || !this.menuItems.length || !menuProfileTag) {
      this.menuItems.length = 0;
      this.dropDownMenuRef && this.dropDownMenuRef.setData(this.menuItems);
      this.setState({ enabaleMenu: false });
      return;
    }
    if (!assignment.assignees || !assignment.assignees.length || assignment.assignees[0].assign_tag_activity_status === 1) {
      this.menuItems.length = 0;
      this.dropDownMenuRef && this.dropDownMenuRef.setData(this.menuItems);
      return;
    }
    menuProfileTag.isDisable = false;
    this.dropDownMenuRef && this.dropDownMenuRef.setData(this.menuItems);
    if (this.menuItems && this.menuItems.length) {
      return this.setState({ enabaleMenu: true });
    }
    return this.setState({ enabaleMenu: false });
  }

  private menuItemsDefault = () => {
    const { assignment, feature, onSearchContent, onChangeHidden } = this.props;
    const page = assignment && assignment.specific_page_container || undefined;
    const currentComment = assignment && assignment.specific_post_or_feed && assignment.specific_post_or_feed.specific_comments && assignment.specific_post_or_feed.specific_comments[0] || undefined;
    const defaultMenus: IMenuItem[] = [
      {
        icon: 'view_detail',
        name: assignment.type === Constants.SOCIAL.FEATURE_CODE.MESSAGE ? 'Thông tin cuộc hội thoại' : 'Thông tin bình luận',
        onSelect: () => {
          Router.push(<SocialAssignmentInformation assignment={assignment} />);
        }
      },
      {
        icon: 'browsing_info',
        name: 'Thông tin duyệt web',
        socialTypes: [Constants.SOCIAL.TYPE.WEB_LIVE_CHAT],
        featureCodes: [Constants.SOCIAL.FEATURE_CODE.MESSAGE],
        onSelect: async () => {
          if (!assignment || !assignment.specific_page_container) {
            return toast(Languages.ManipulationUnSuccess, Constants.TOAST_TYPE.ERROR);
          }
          await SocialUtils.getBrowsingInformation(assignment.specific_page_container.page_social_id, assignment);
          Router.push(<SocialBrowserInformation assignment={assignment} />);
        }
      },
      {
        icon: 'hide_password',
        name: 'Ẩn bình luận',
        isIgnore: currentComment && !currentComment.is_hidden ? false : true,
        socialTypes: [Constants.SOCIAL.TYPE.FACEBOOK, Constants.SOCIAL.TYPE.ZALO, Constants.SOCIAL.TYPE.INSTAGRAM, Constants.SOCIAL.TYPE.YOUTUBE, Constants.SOCIAL.TYPE.LINE, Constants.SOCIAL.TYPE.WEB_LIVE_CHAT],
        featureCodes: [Constants.SOCIAL.FEATURE_CODE.COMMENT],
        onSelect: () => {
          onChangeHidden && onChangeHidden(page, currentComment, () => { this.initMenuItems(); });
        }
      },
      {
        icon: 'view_coded_info',
        name: 'Hiển thị bình luận',
        isIgnore: currentComment && currentComment.is_hidden ? false : true,
        socialTypes: [Constants.SOCIAL.TYPE.FACEBOOK, Constants.SOCIAL.TYPE.ZALO, Constants.SOCIAL.TYPE.INSTAGRAM, Constants.SOCIAL.TYPE.YOUTUBE, Constants.SOCIAL.TYPE.LINE, Constants.SOCIAL.TYPE.WEB_LIVE_CHAT],
        featureCodes: [Constants.SOCIAL.FEATURE_CODE.COMMENT],
        onSelect: () => {
          onChangeHidden && onChangeHidden(page, currentComment, () => { this.initMenuItems(); });
        }
      },
      {
        icon: 'emoticon',
        name: 'Đổi trạng thái cảm xúc',
        socialTypes: [Constants.SOCIAL.TYPE.FACEBOOK, Constants.SOCIAL.TYPE.ZALO, Constants.SOCIAL.TYPE.INSTAGRAM, Constants.SOCIAL.TYPE.YOUTUBE, Constants.SOCIAL.TYPE.LINE, Constants.SOCIAL.TYPE.WEB_LIVE_CHAT],
        featureCodes: [Constants.SOCIAL.FEATURE_CODE.COMMENT],
        onSelect: () => {
          const clasifyModal = {
            content: <SocialModalClassify comment={currentComment} assignment={assignment} onCallback={() => { currentComment && currentComment.specific_update_view && currentComment.specific_update_view(); }} />
          };
          pushModal(clasifyModal);
        }
      },
      {
        icon: 'search',
        name: 'Tìm nội dung',
        socialTypes: [Constants.SOCIAL.TYPE.FACEBOOK, Constants.SOCIAL.TYPE.ZALO, Constants.SOCIAL.TYPE.INSTAGRAM, Constants.SOCIAL.TYPE.YOUTUBE, Constants.SOCIAL.TYPE.LINE, Constants.SOCIAL.TYPE.WEB_LIVE_CHAT],
        featureCodes: [Constants.SOCIAL.FEATURE_CODE.MESSAGE],
        onSelect: () => {
          onSearchContent && onSearchContent();
        }
      },
      {
        icon: 'add_job_tag',
        name: 'Gắn tag phân loại công việc',
        onSelect: () => {
          this.openAssignTags();
        }
      },
      {
        icon: 'add_tag_profile',
        name: 'Gắn tag hành vi',
        isDisable: true,
        onSelect: () => {
          this.onProfileTags();
        }
      },
      {
        icon: 'assign_to',
        name: 'Chuyển tiếp',
        isIgnore: assignment && assignment.status ? false : true,
        onSelect: () => {
          Router.push(<SocialForwardChatScreen assignment={assignment} feature={feature} onForward={this.handleForward} />);
        }
      }

    ];
    return defaultMenus;
  }

  private handleForward = (assignType: string) => {
    const { feature, assignment } = this.props;
    if ((assignType === 'TEAM') || !SocialService.validAssignmentWithFilter(assignment, feature.filter, this.ignoreRevoke)) {
      this.handleBack(false, 1000);
      return;
    }
  }

  private openAssignTags = () => {
    const modal: IModal = {
      content: <SocialTagsModal
                  type={'assign'}
                  selectedTags={cloneDeep(this.assignTagsItems)}
                  title={'Gắn tag phân loại công việc'}
                  selectedTagTitle={'Tag phân loại công việc'}
                  onApplyHandler={this.onAssignTagsApply} />
    };
    pushModal(modal);
  }

  private onAssignTagsApply = async (tags: ITagItem[], enableApplyButton: any) => {
    const { assignment, feature } = this.props;
    // Router.pop();
    if (!tags || !assignment || !assignment.specific_page_container) {
      enableApplyButton();
      return toast(Languages.ManipulationUnSuccess, 'error');
    }
    const tagIds = tags.map(tag => {
      return tag.id;
    });
    const assignTags = await SocialService.assignTags(assignment.type, assignment.id, tagIds, assignment.specific_page_container.id);
    if (!assignTags || assignTags.code !== '001') {
      return toast(Languages.ManipulationUnSuccess, Constants.TOAST_TYPE.ERROR);
    }
    this.assignTagsItems = tags;
    toast(Languages.ManipulationSuccess, Constants.TOAST_TYPE.SUCCESS);
    this.handleApplyTags('assign', tags, assignment);
    if (!SocialService.validAssignmentWithFilter(assignment, feature.filter, this.ignoreRevoke) && SocialUtils.checkCurrentScreen(ScreenType.SOCIAL_DETAIL)) {
      return this.handleBack();
    }
  }

  private onProfileTags = async () => {
    const { assignment } = this.props;
    if (!assignment || !assignment.social || !assignment.last_message || !assignment.last_message.from) {
      return toast(Languages.ManipulationUnSuccess, Constants.TOAST_TYPE.ERROR);
    }
    const socialId = assignment.last_message.from.id;
    let profile = await SocialService.profilesBySocialIds.get(socialId);
    if (!profile) {
      const resultProfiles: any = await this.getProfiles([socialId]);
      if (!resultProfiles || !resultProfiles.length) {
        return toast(Languages.ManipulationUnSuccess, Constants.TOAST_TYPE.ERROR);
      }
      profile = resultProfiles[0];
    }
    this.profileTagsItems = [];
    profile.profile_tags && (this.profileTagsItems = SocialService.convertTags(profile.profile_tags));

    const modal: IModal = {
      content: 
        <SocialTagsModal
          fixTags={this.profileTagsItems}
          selectedTags={[]}
          type={'profile'}
          title={'Gắn tag hành vi'}
          selectedTagTitle={'Tag hành vi'}
          onApplyHandler={this.onProfileTagsApplyHandler}
        />
    };
    pushModal(modal);
  }

  private onProfileTagsApplyHandler = async (tags: ITagItem[], enableApplyButton: any) => {
    if (!tags || !tags.length || this.profileTagsItems.length === tags.length) {
      enableApplyButton();
      return toast('Vui lòng chọn tag');
    }
    const { assignment, feature } = this.props;
    if (!assignment || !assignment.social || !assignment.last_message || !assignment.last_message.from || !tags || !tags.length) {
      return toast(Languages.ManipulationUnSuccess, Constants.TOAST_TYPE.ERROR);
    }
    if (assignment && assignment.assignees && assignment.assignees.length && assignment.assignees[0].assign_tag_activity_status === 1) {
      return toast(Languages.ManipulationUnSuccess, Constants.TOAST_TYPE.ERROR);
    }
    const socialId = assignment && assignment.last_message && assignment.last_message.from && assignment.last_message.from.id;
    if (!socialId || !feature || !feature.tabOrigin || !feature.tabOrigin.social_type) {
      return toast(Languages.ManipulationUnSuccess, Constants.TOAST_TYPE.ERROR);
    }
    const dataRequest: any = {
      tags: tags.map(tag => {
        return { id: tag.id, num_increase: 1 };
      }),
      staff_id: JwtHelper.decodeToken().id
    };

    let keyServiceUpdateTag = Constants.TAG.KEY_UPDATE_TAG_SOCIAL;
    dataRequest.profile_id = null;
    dataRequest.social_info = {
      social_id: socialId,
      social_type: feature.tabOrigin.social_type,
    };
    const profile = await SocialService.profilesBySocialIds.get(socialId);
    if (profile && profile.id) {
      dataRequest.profile_id = profile.id;
      keyServiceUpdateTag = Constants.TAG.KEY_UPDATE_TAG_PROFILE_ID;
    }
    const config = Config.TAG_CONFIG_API().find(item => item.key === keyServiceUpdateTag);
    if (!config) {
      return;
    }
    const dataConfig = config.data;
    const resultUpdateCustomer: any = await EventService.updateTag(dataConfig, undefined, dataRequest);
    if (!resultUpdateCustomer || !resultUpdateCustomer.tags || resultUpdateCustomer.code !== 200) {
      return toast(Languages.ManipulationUnSuccess, Constants.TOAST_TYPE.ERROR);
    }
    assignment.assignees[0].assign_tag_activity_status = 1;
    toast(Languages.ManipulationSuccess, Constants.TOAST_TYPE.SUCCESS);
    const newTags = profile && profile.profile_tags ? [...profile.profile_tags] : [];
    resultUpdateCustomer.tags.forEach(newTag => {
      if (newTags.find(tag => tag.id === newTag.id)) {
        return;
      }
      newTags.push({
        id: newTag.id,
        tag: newTag.name,
      });
    });
    if (profile) {
      profile.profile_tags = newTags;
      SocialService.profilesBySocialIds.set(socialId, profile);
    }
    this.updateTagActivityStatus(assignment);
    this.handleApplyTags('profile', newTags, assignment);
  }

  private updateTagActivityStatus = (assignment: IAssignmentItem) => {
    if (!assignment || !assignment.assignees || !assignment.assignees.length) {
      return;
    }
    this.disableAssignProfileTag(assignment);
    const assigneeID = assignment.assignees[0].id;
    const dataAssignTag = {
      object_type: assignment.type,
      object_assignee_id: assigneeID,
      object_id: assignment.id,
      page_social_id: assignment.page_social_id,
      social_type: assignment.specific_page_container && assignment.specific_page_container.social_type,
      page_id: assignment.specific_page_container && assignment.specific_page_container.id,
    };
    SocialService.assignTagActivityStatus(1, dataAssignTag);
  }

  private updateTagsActivitySatus(body, assignment: IAssignmentItem) {
    if (!assignment || !assignment.assignees || !assignment.assignees.length || assignment.assignees[0].id !== body.object_assignee_id) {
      return;
    }
    const tempAssign = Object.assign({}, assignment.assignees[0]);
    tempAssign.assign_tag_activity_status = body.assign_tag_activity_status;
    assignment.assignees[0] = tempAssign;
    this.disableAssignProfileTag(assignment);
  }

  private disableAssignProfileTag = (assignment: IAssignmentItem) => {
    if (!assignment) {
      return;
    }
    const menuProfileTag = this.menuItems.find(menu => { return menu.icon === 'add_tag_profile'; });
    menuProfileTag && (menuProfileTag.isDisable = true);
    this.dropDownMenuRef && this.dropDownMenuRef.setData(this.menuItems);
  }

  private handleApplyTags = (type: string, tags: any[], assignment: IAssignmentItem) => {
    if (type === 'assign') {
      const convertTags = tags.map(tag => {
        return {
          id: tag.id,
          value: tag.name,
          properties: {
            background_color: tag.bgColor,
            foreground_color: tag.color
          }
        };
      });
      assignment.tags = convertTags;
      return;
    }

    // profile tag
    if (assignment.specific_profile && assignment.specific_profile.originCustomer) {
      assignment.specific_profile.originCustomer.profile_tags = tags;
    }
  }

  private initUserAvatarDefault = async () => {
    this.setState({ userAvatarDefault: await SocialService.getDefaultAvatar() });
  }

  /**
   * back process
   * @param ignoreRouterPop
   * @param forceBack
   * @returns
   */
  private backProcess = (ignoreRouterPop: boolean = false, forceBack: boolean = false) => {
    const { assignment, screenType, feature } = this.props;
    if (!feature || screenType !== ScreenType.SOCIAL_NEWS && screenType !== ScreenType.SOCIAL_DETAIL) {
      if (forceBack) {
        Router.pop();
      }
      return;
    }
    if (screenType === ScreenType.SOCIAL_NEWS) {
      if (!SocialUtils.checkCurrentScreen(ScreenType.SOCIAL_NEWS) && !forceBack) {
        return;
      }
      DeviceEventEmitter.emit(Constants.EmitCode.UPDATE_SOCIAL_CHAT_MAIN_LIST, { featureCode: feature.code });
      Router.pop();
      return;
    }

    // SOCIAL_DETAIL
    if (!SocialUtils.checkCurrentScreen(ScreenType.SOCIAL_DETAIL) && !forceBack) {
      return;
    }

    // TODO
    changeHeaderHeight(0);
    // assignment.specific_remove_detail_screen = undefined;
    assignment.specific_update_status_online = undefined;
    assignment.specific_update_view_detail_screen = undefined;
    assignment.specific_update_view_exist_message = undefined;
    assignment.specific_update_tag_activity_status = undefined;
    assignment.specific_update_action_menu = undefined;
    assignment.specific_update_avatar_name = undefined;
    DeviceEventEmitter.emit(Constants.EmitCode.UPDATE_SOCIAL_CHAT_MAIN_LIST, { featureCode: feature.code });
    if (!ignoreRouterPop) {
      Router.pop();
    }
  }

  /**
   * back handle
   * @param ignoreRouterPop
   * @param timeout
   * @param forceBack
   * @returns
   */
  handleBack = (ignoreRouterPop: boolean = false, timeout: number = 0, forceBack: boolean = false) => {
    if (!timeout) {
      return this.backProcess(ignoreRouterPop, forceBack);
    }
    setTimeout(() => {
      return this.backProcess(ignoreRouterPop, forceBack);
    }, timeout);
  }

  private renderDropDownMenuBase = (_item) => {
    return (
      <View style={[Styles.ButtonIcon, Styles.CenterItem, { marginRight: 0, marginLeft: 0 }]}>
        <CustomIcon name={'popover_menu'} size={20} color={Color.text} />
      </View>
    );
  }

  private renderDropDownMenuItem = (item) => {
    return (
      <View style={[Styles.Row, Styles.AlignCenter, { height: 35, opacity: item.isDisable ? 0.5 : 1 }]}>
        <CustomIcon name={item.icon} size={18} color={Color.text} style={{ marginRight: 8 }} />
        <WrapText st={[Styles.Text_S_R,]} c={Color.text}>{item.name}</WrapText>
      </View>
    );
  }

  private handleResolve = () => {
    const { assignment } = this.props;
    const page = assignment.specific_page_container;
    if (assignment.specific_status_message === 1 || assignment.specific_status_message === 2) {
      return;
    }
    this.setState({
      displayResolveButton: false
    });
    switch (assignment.type) {
      case Constants.SOCIAL.FEATURE_CODE.MESSAGE:
        SocialService.resolveConversation(page.social_type, page.id, assignment.id).then(this.setResolveAssignment);
        break;
      case Constants.SOCIAL.FEATURE_CODE.COMMENT:
        SocialService.resolveComment(page.social_type, page.id, assignment.id).then(this.setResolveAssignment);
        break;
      case Constants.SOCIAL.FEATURE_CODE.RATE:
        SocialService.resolveRating(page.social_type, page.id, assignment.id).then(this.setResolveAssignment);
        break;
      default:
        this.setState({
          displayResolveButton: true
        });
    }
  }

  private setResolveAssignment = (res) => {
    const { assignment, feature } = this.props;
    if (res.code !== '001') {
      toast(Languages.ManipulationUnSuccess, Constants.TOAST_TYPE.ERROR);
      this.setState({ displayResolveButton: true });
      return;
    }
    toast(Languages.ManipulationSuccess, Constants.TOAST_TYPE.SUCCESS);
    if (assignment.status === 2) {
      return;
    }
    assignment.status = 2;
    this.setState({ displayResolveButton: false });
    assignment.resolved_time = moment().format();
    assignment.resolved_user = JwtHelper.decodeToken().id;
    if (!SocialService.validAssignmentWithFilter(assignment, feature.filter, this.ignoreRevoke)) {
      this.handleBack();
      return;
    }
  }

  private onMenuSelectHandler = (item: IMenuItem) => {
    item.onSelect();
  }

  private historyAssign = () => {
    const { assignment, feature } = this.props;
    const modal = {
      content: <SocialHistoryAssignModal assignment={assignment} feature={feature} />
    };
    pushModal(modal);
  }

  render() {
    const { userAvatarDefault, userAvatar, userName, headerHeight, visitorStatus, displayResolveButton, enabaleMenu } = this.state;
    const maxHeaderWidth = Constants.Width - 160;

    return (
      <View style={[Styles.Header, { paddingLeft: 5, paddingRight: 0, height: headerHeight }]}>
        <View style={{ flex: 1 }}>
          <View style={{ flex: 1 }}>
            <View style={[Styles.Row, Styles.JustifyBetween, { flex: 1 }]}>

              <View style={[Styles.Row]}>
                <ButtonRipple name={'nav_back'} size={16} color={Color.text} onPress={() => {this.handleBack(false, 0, true);}} />
                <TouchableOpacity activeOpacity={1} onPress={() => { this.handleBack(false, 0, true); }}>
                    <AsyncImage source={{ uri: userAvatar }} width={26} height={26} radius={13}
                      iconDefault={userAvatarDefault}
                      style={{ marginLeft: 5, marginRight: 8 }} />
                    {visitorStatus === SocialConstants.KEY_CHECK_WEB_LIVE_CHAT_USER_ONLINE &&
                      <View style={styles.statusIcon}>
                        <CustomIcon name={'call_status'} size={8} color={Color.green} />
                      </View>
                    }
                  </TouchableOpacity>
                <WrapText st={Styles.Text_L_B} onPress={() => { this.handleBack(false, 0, true); }} styles={[{ maxWidth: maxHeaderWidth }]}>{userName}</WrapText>
              </View>

              {
                <View style={Styles.Row}>
                  {
                    !!displayResolveButton &&
                    <ButtonRipple name={'mark_done'} size={20} color={Color.green} onPress={this.handleResolve} />
                  }
                  <Dropdown
                    ref={(comp: any) => { this.dropDownMenuRef = comp; }}
                    enable={enabaleMenu}
                    align={'right'}
                    height={35}
                    width={230}
                    renderBase={this.renderDropDownMenuBase}
                    renderItem={this.renderDropDownMenuItem}
                    pickerStyleOverrides={{}}
                    dropdownOffset={{ top: 35, right: 15 }}
                    onItemSelected={this.onMenuSelectHandler}
                    data={this.menuItems}
                  />
                </View>
              }
            </View>
            {
              headerHeight === 79 &&
              <View style={[{ marginLeft: 35, height: 35 }]}>
                <View style={{width: 190}}>
                  <ButtonRipple
                    radius={1}
                    onPress={this.historyAssign}>
                    <View style={[Styles.RowCenter, {height: 30, paddingHorizontal: 10}]}>
                      <CustomIcon name={'assign_to'} size={20} color={Color.primary} />
                      <WrapText st={[Styles.Text_M_R, { marginLeft: 6 }]} c={Color.primary}>{'Lịch sử phân công'}</WrapText>
                    </View>
                  </ButtonRipple>
                </View>
                
              </View>
            }
          </View>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  statusIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    width: 10,
    height: 10,
    borderRadius: 10,
    position: 'absolute',
    top: 0,
    right: 6,
    paddingLeft: 1,
    paddingTop: 1
  },
});
