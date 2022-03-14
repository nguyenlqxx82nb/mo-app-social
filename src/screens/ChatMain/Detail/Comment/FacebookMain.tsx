import { SocialUtils } from '../../../../common';
import { IAssignmentItem, IComment, IFeatureAssign, IPageAssign } from 'api';
import { Color, Constants, FacebookService, JwtHelper, SocialService, Styles, toast } from 'mo-app-common';
import { Indicator, ScreenType, WrapButton, } from 'mo-app-comp';
import React, { PureComponent } from 'react';
import { BackHandler, Keyboard, Platform, StyleSheet, View } from 'react-native';
import { SocialShareCommentScreen, SocialShareHeaderScreen, SocialShareKeyboardScreen, SocialSharePostOrFeedScreen } from '../../../Share';
import Languages from 'mo-app-common/src/Common/Languages';
import moment from 'moment';
import { ScrollView } from 'react-native-gesture-handler';
import SocialMessageInput from '../Input/SocialInputMessage';
import { IAttachment } from '../Input/PickerModal';
import { uid } from 'uid';
import { GET_DEFAULT_FILTER } from 'mo-app-common/src/Services/Social/SocialService';
import { TAB_SOCIAL_DEFAULT } from '../../../../define/DataDefine';

interface SocialNewsFacebookMainProps {
  assignment: IAssignmentItem;
  feature: IFeatureAssign;
  screenType: ScreenType;
  notificationData?: any;
  ignoreRevoke?: boolean;
}

interface SocialNewsFacebookMainScreenState {
  isLoading: boolean;
  comment: IComment;
  subComments: IComment[];
  disabledInputMessage?: boolean;
  displayLoadmoreComments?: boolean;
  avatarForPage?: string;
}

export class SocialNewsFacebookMainScreen extends PureComponent<SocialNewsFacebookMainProps, SocialNewsFacebookMainScreenState> {
  private header: SocialShareHeaderScreen;
  private subCommentRef: SocialShareCommentScreen[] = [];
  private postOrFeed: SocialSharePostOrFeedScreen;
  private readonly LEVEL_SUB_COMMENT = 2;
  private socialInputMessage: SocialMessageInput;
  private notificationData: any;

  constructor(props: SocialNewsFacebookMainProps) {
    super(props);
    const currentComment = props.assignment && props.assignment.specific_post_or_feed && props.assignment.specific_post_or_feed.specific_comments && props.assignment.specific_post_or_feed.specific_comments[0] || undefined;
    currentComment && (currentComment.specific_update_sub_comment_view = this.updateSubComments);
    this.state = {
      isLoading: true,
      displayLoadmoreComments: false,
      disabledInputMessage: false,
      comment: currentComment,
      subComments: currentComment && currentComment.comments && currentComment.comments.data || [],
      avatarForPage: props.assignment && props.assignment.specific_page_container && props.assignment?.specific_page_container?.icon || '',
    };
    this.notificationData = props.notificationData;
  }

  componentDidMount() {
    const { notificationData, assignment } = this.props;
    assignment && (assignment.specific_delete_comment_lv1 = this.deleteCommentLv1);
    if (Platform.OS === 'android') {
      BackHandler.addEventListener('hardwareBackPress', this.androidBack);
    }
    if (notificationData) {
      this.initAssignmentFromSocket(this.notificationData).then(() => {
        this.initData();
      });
      return;
    }
    this.initData();
  }

  componentWillUnmount() {
    const { assignment } = this.props;
    const { comment } = this.state;
    assignment && (assignment.specific_delete_comment_lv1 = undefined);
    comment && (comment.specific_update_sub_comment_view = undefined);
    if (Platform.OS === 'android') {
      BackHandler.removeEventListener('hardwareBackPress', this.androidBack);
    }
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (this.notificationData !== nextProps.notificationData) {
      this.setState({ isLoading: true });
      this.notificationData = nextProps.notificationData;
      this.initAssignmentFromSocket(this.notificationData).then(() => {
        setTimeout(() => {
          this.initData();
        }, 1000);
      });
    }
  }

  private deleteCommentLv1 = () => {
    const { assignment } = this.props;
    const currentComment = assignment && assignment.specific_post_or_feed && assignment.specific_post_or_feed.specific_comments && assignment.specific_post_or_feed.specific_comments[0] || undefined;
    if (currentComment) {
      return;
    }
    this.setState({ comment: undefined, subComments: [] });
  }

  private initAssignmentFromSocket = (notificationData) => {
    return new Promise(async resolve => {
      this.setState({
        isLoading: true,
        displayLoadmoreComments: false,
        disabledInputMessage: false,
        comment: undefined,
        subComments: [],
        avatarForPage: '',
      });
      const currentAssignment = notificationData;
      const featureCodeOfSocket = currentAssignment.socket_type ? SocialService.getFeatureTypeBySocialTypeSocket(currentAssignment.socket_type) : '';
      const defaultFilter = featureCodeOfSocket ? GET_DEFAULT_FILTER(featureCodeOfSocket) : undefined;
      if (!defaultFilter) {
        return resolve(false);
      }

      defaultFilter.object_id = currentAssignment.id;
      const result: any = await SocialService.getAllSocialPage();
      if (!result || !result.pages || !result.pages.length) {
        this.header && this.header.handleBack(false, 2000);
        return;
      }
      const pages = result.pages.filter(page => { return page.page_social_id === currentAssignment.page_social_id; });
      if (!pages || !pages.length) {
        this.header && this.header.handleBack(false, 2000);
        return;
      }
      const page = pages[0];
      await SocialService.getAvatarPage(page, false);
      await SocialService.getAllConfigPages([page]);
      const resultAssignment: any = await SocialService.getAssignments(currentAssignment.social_type, SocialUtils.getQueryFilter(defaultFilter, 1, 10));
      if (!resultAssignment || resultAssignment.code !== '001' || !resultAssignment.data || !resultAssignment.data.length) {
        this.header && this.header.handleBack(false, 1000);
        return resolve(false);
      }
      const newAssignment = resultAssignment.data[0];
      newAssignment.specific_page_container = page;
      const tabs: any = TAB_SOCIAL_DEFAULT([newAssignment.specific_page_container], '');
      if (!tabs || !tabs.length || !tabs[0].features || !tabs[0].features.length) {
        this.header && this.header.handleBack(false, 2000);
        return;
      }
      const currentFeature = tabs[0].features.find(item => { return item.code === currentAssignment.type; });
      if (!currentFeature) {
        this.header && this.header.handleBack(false, 2000);
        return;
      }
      const { assignment, feature } = this.props;
      Object.assign(feature, currentFeature);
      Object.assign(assignment, newAssignment);
      this.socialInputMessage && this.socialInputMessage.clearText();
      this.setState({ avatarForPage: assignment.specific_page_container && assignment.specific_page_container.icon || '' });
      SocialService.readAssignAssignment(feature, assignment, undefined);
      await SocialService.buildAvatarAndName(assignment);
      SocialService.runTimeProcess(assignment, feature.code, undefined);
      this.header && this.header.setData();
      return resolve(true);
    });
  }

  private async initData() {
    const { assignment } = this.props;
    if (!assignment || !assignment.specific_page_container) {
      this.setState({ isLoading: false });
      return;
    }
    if (assignment.specific_post_or_feed && assignment.specific_post_or_feed.specific_comments && assignment.specific_post_or_feed.specific_comments.length) {
      this.setState({ isLoading: false });
      return;
    }
    assignment.specific_post_or_feed = {
      id: `${assignment.social.id}`,
      social: assignment.social,
      comment_image: assignment.comment_image,
    };
    assignment.specific_loading_content = true;
    const resultPostDetail = this.getPostDetail();
    const resultComments = this.getComments();
    const resultPostDetailData = await resultPostDetail;
    const resultCommentsData = await resultComments;
    if (!resultPostDetailData) {
      this.setState({
        isLoading: false,
        comment: undefined,
        subComments: [],
        disabledInputMessage: true
      });
      return;
    }
    if (!resultCommentsData) {
      this.setState({
        isLoading: false,
        comment: undefined,
        subComments: [],
        disabledInputMessage: true
      });
      return;
    }
    assignment.specific_loading_content = false;
    const currentComment = assignment && assignment.specific_post_or_feed && assignment.specific_post_or_feed.specific_comments && assignment.specific_post_or_feed.specific_comments[0] || undefined;
    assignment.specific_update_action_menu && assignment.specific_update_action_menu();
    currentComment && (currentComment.specific_update_sub_comment_view = this.updateSubComments);
    this.setState({
      isLoading: false,
      comment: currentComment,
      subComments: currentComment && currentComment.comments && currentComment.comments.data || []
    });
    this.postOrFeed && this.postOrFeed.setData();
    this.header && this.header.setData();
  }

  private updateSubComments = () => {
    const { comment } = this.state;
    if (!comment || !comment.comments || !comment.comments.data) {
      return;
    }
    this.setState({ subComments: [] });
    this.setState({ subComments: [...comment.comments.data] });
  }

  private androidBack = () => {
    if (this.socialInputMessage && this.socialInputMessage.getDisplayQuickReplyStatus()) {
      return false;
    }
    this.header && this.header.handleBack(true);
    return false;
  }

  private getPostDetail = () => {
    const { assignment } = this.props;
    return new Promise(async resolve => {
      const post: any = await FacebookService.getDetailPost(assignment.social.id, assignment.specific_page_container.token_auth);
      if (!post || !post.id) {
        return resolve(false);
      }
      post.comment_image = assignment.comment_image;
      Object.assign(assignment.specific_post_or_feed, post);
      const dataSync: any = await SocialService.syncTopic(assignment.specific_page_container.social_type, assignment.specific_page_container.id, [{ topic_social_id: post.id, message: post.message }]);
      if (!dataSync || !dataSync.topics || !dataSync.topics.length) {
        assignment.specific_post_or_feed.specific_created_user = 'facebook';
        return resolve(true);
      }
      const topic = dataSync.topics[0];
      assignment.specific_post_or_feed.specific_created_user = topic.created_user || 'facebook';
      assignment.specific_post_or_feed.specific_share = true;
      assignment.specific_post_or_feed.specific_count_comment = true;
      assignment.specific_post_or_feed.specific_has_liked = post.likes && post.likes.summary ? post.likes.summary.has_liked : false;
      const total_comments = post.comments && post.comments.summary ? post.comments.summary.total_count : 0;
      const total_like = post.likes && post.likes.summary ? post.likes.summary.total_count : 0;
      assignment.specific_post_or_feed.specificPostActions = SocialUtils.buildTopictAction(assignment.specific_page_container, total_comments, total_like, 0, true);
      assignment.mobio_topic_id = topic.id;
      return resolve(true);
    });
  }

  private getComments = () => {
    const { assignment, feature } = this.props;
    const page = assignment.specific_page_container;
    return new Promise(async resolve => {
      if (!assignment.specific_post_or_feed || (assignment.specific_post_or_feed.specific_comments && assignment.specific_post_or_feed.specific_comments.length)) {
        return resolve(false);
      }
      const resultDetailComments: any = await FacebookService.getDetailComment(assignment.comment_social_id, page.token_auth);
      if (!resultDetailComments || !resultDetailComments.id) {
        return resolve(false);
      }
      const comment: any = await SocialService.createNewCommentByFB(resultDetailComments, assignment, page, feature.code);
      const commentSync = [{
        comment_social_id: comment.id,
        created_time: moment(comment.created_time).unix(),
        message: comment.message,
        parent_social_id: comment.id,
        user_social_id: comment.from ? comment.from.id : ''
      }];
      await SocialUtils.mergeComment(commentSync, assignment.topic_id, [comment], page, assignment);
      if (resultDetailComments.comments && resultDetailComments.comments.data && resultDetailComments.comments.data.length) {
        const dataForSync = [];
        const subComments = [];
        for (const subComment of resultDetailComments.comments.data) {
          const convertSubComment: any = await SocialService.createNewCommentByFB(subComment, { specific_username: assignment.specific_username }, page, feature.code);
          subComments.push(convertSubComment);
          dataForSync.push({
            comment_social_id: subComment.id,
            created_time: moment(subComment.created_time).unix(),
            message: subComment.message,
            parent_social_id: comment.id,
            user_social_id: subComment.from ? subComment.from.id : '',
          });
        }

        comment.comments = {
          data: subComments,
          paging: resultDetailComments.comments.paging,
        };

        await SocialUtils.mergeComment(dataForSync, assignment.topic_id, comment.comments.data, page);
      }
      assignment.specific_post_or_feed.specific_comments = [comment];
      if (resultDetailComments.comments && resultDetailComments.comments.paging && resultDetailComments.comments.paging.next) {
        this.setState({ displayLoadmoreComments: true });
      }
      return resolve(true);
    });
  }

  private getMoreSubComments = async () => {
    this.setState({ displayLoadmoreComments: false });
    const { assignment, feature } = this.props;
    if (!feature || !assignment || !assignment.specific_page_container || !assignment.specific_post_or_feed
      || !assignment.specific_post_or_feed.specific_comments || !assignment.specific_post_or_feed.specific_comments.length) {
      return;
    }
    const comment = assignment.specific_post_or_feed.specific_comments[0];
    const nextUrl = comment.comments && comment.comments.paging && comment.comments.paging.next || undefined;
    const page = assignment.specific_page_container;
    if (!nextUrl || !page) {
      return;
    }
    const resultSubComments: any = await FacebookService.getNextUrl(nextUrl);
    if (!resultSubComments || !resultSubComments.data) {
      return;
    }
    const dataForSync = [];
    const subComments = [];
    for (const subComment of resultSubComments.data) {
      const convertSubComment: any = await SocialService.createNewCommentByFB(subComment, {}, page, feature.code);
      subComments.push(convertSubComment);
      dataForSync.push({
        comment_social_id: subComment.id,
        created_time: moment(subComment.created_time).unix(),
        message: subComment.message,
        parent_social_id: comment.id,
        user_social_id: subComment.from.id,
      });
    }
    await SocialUtils.mergeComment(dataForSync, assignment.topic_id, subComments, page);
    comment.comments.data.push(...subComments);
    comment.comments.paging = resultSubComments.paging;
    if (comment.comments.paging && comment.comments.paging.next) {
      this.setState({ displayLoadmoreComments: true });
    }
    this.setState({ subComments: [] });
    this.setState({ subComments: comment.comments.data });
    return;
  }

  private handleChangeHidden = async (page: IPageAssign, comment: IComment, onCallback: Function) => {
    const resultChangeDisplayComment: any = await FacebookService.changeDisplayComment(comment.id, page.token_auth, !comment.is_hidden);
    if (!resultChangeDisplayComment || !resultChangeDisplayComment.success) {
      return toast(Languages.ManipulationUnSuccess, 'error');
    }
    comment.is_hidden = !comment.is_hidden;
    comment.specific_update_view && comment.specific_update_view();
    onCallback && onCallback();
    return; //toast(Languages.ManipulationSuccess, 'success');
  }

  private handleActionPost = (action) => {
    switch (action.key) {
      case 'like':
      case 'dislike':
        this.handleLike(action);
        break;
      case 'share':
        toast(Languages.ManipulationUnSuccess, 'Chức năng này sẽ được phát triển ở phiên bản sau.');
        break;
      default:
        break;
    }
  }

  private handleLike = async (menu) => {
    const { assignment } = this.props;
    if (!assignment || !assignment.specific_post_or_feed || !assignment.specific_page_container || !assignment.specific_post_or_feed) {
      return toast(Languages.ManipulationUnSuccess, 'error');
    }
    const post = assignment.specific_post_or_feed;
    menu.disable = true;
    this.postOrFeed && this.postOrFeed.setData();
    const resultLikeOrDislike: any = await FacebookService.doLike(post.social.id, assignment.specific_page_container.token_auth, post[menu.fieldBind]);
    assignment.specific_post_or_feed[menu.fieldBind] = !assignment.specific_post_or_feed[menu.fieldBind];
    menu.disable = false;
    this.postOrFeed && this.postOrFeed.setData();
    if (!resultLikeOrDislike || !resultLikeOrDislike.success) {
      return toast(Languages.ManipulationUnSuccess, 'error');
    }
    return; // toast(Languages.ManipulationSuccess, 'success');
  }

  private handleDeleteComment = async (subComment: IComment, comment: IComment) => {
    const { assignment } = this.props;
    if (!assignment || !assignment.specific_page_container || !comment.comments || !comment.comments.data) {
      return toast(Languages.ManipulationUnSuccess, 'error');
    }

    const resultDeleteComment: any = await FacebookService.deleteComment(subComment.id, assignment.specific_page_container.token_auth);
    if (!resultDeleteComment || !resultDeleteComment.success) {
      return toast(Languages.ManipulationUnSuccess, 'error');
    }
    const subComments = comment.comments.data;
    comment.comments.data = subComments.filter(item => { return item.id !== subComment.id; });
    this.setState({ subComments: [...comment.comments.data] });
    return; //toast(Languages.ManipulationSuccess, 'success');
  }

  private convertAttachmentToDisplay = (attachment: IAttachment) => {
    if (attachment.type.indexOf('video') !== -1) {
      return {
        type: 'video',
        media: {
          source: attachment.uri
        }
      };
    }
    if (attachment.type.indexOf('image') !== -1) {
      return {
        type: 'photo',
        media: {
          image: {
            src: attachment.uri
          }
        }
      };
    }
  }

  private handleUpdateComment = async (comment: IComment, message: string, attachments: any[]) => {
    const { assignment } = this.props;
    const formData = new FormData();
    formData.append('message', message);
    comment.attachments && (comment.attachments.data = []);
    comment.message = message || '';
    if (attachments.length && attachments[0]) {
      const file = attachments[0];
      if (!file.originType) {
        formData.append('source', file);
      } else {
        const attachment_id = file.target && file.target.id || '';
        const attachment_url = file.media && file.media.image && file.media.image.src || '';
        formData.append('attachment_id', attachment_id);
        formData.append('attachment_url', attachment_url);
      }
      const convertAttachments = attachments.map(item => {
        return this.convertAttachmentToDisplay(item);
      });
      comment.attachments = {
        data: convertAttachments
      };
    }
    comment.specific_status_message = Constants.SOCIAL.STATE_SEND_DATA_TO_SERVER.MESSAGE_SENDING;
    comment.specific_update_view && comment.specific_update_view();
    const resultUpdateComment: any = await FacebookService.updateComment(comment.id, assignment.specific_page_container.token_auth, formData);
    if (!resultUpdateComment || !resultUpdateComment.success) {
      comment.specific_status_message = Constants.SOCIAL.STATE_SEND_DATA_TO_SERVER.MESSAGE_SEND_FACEBOOK_FAIL;
      comment.specific_update_view && comment.specific_update_view();
      return toast(Languages.ManipulationUnSuccess, 'error');
    }
    comment.specific_status_message = Constants.SOCIAL.STATE_SEND_DATA_TO_SERVER.MESSAGE_DELIVERED;
    comment.specific_update_view && comment.specific_update_view();
    return; // toast(Languages.ManipulationSuccess, 'success');
  }

  private handleSendComment = async (message?: string, attachments?: IAttachment[]) => {
    Keyboard.dismiss();
    const { assignment, feature } = this.props;
    if ((!message || !message.trim()) && (!attachments || !attachments.length)) {
      return toast(Languages.ManipulationUnSuccess, 'error');
    }
    if (!assignment || !assignment.specific_post_or_feed || !assignment.specific_page_container || !feature) {
      return toast(Languages.ManipulationUnSuccess, 'error');
    }
    const detect_comment_id = uid(32);
    const page = assignment.specific_page_container;
    const messageText = message.trim();
    // file && (newMessage.specific_file = file);
    let fileUpload;
    const tempData = {
      id: '',
      from: {
        id: page.page_social_id,
        name: page.name
      },
      message: messageText,
      attachment: fileUpload ? fileUpload : '',
      created_time: moment(),
      is_hidden: false,
      like_count: 0,
      user_likes: false,
    };
    const newComment: any = await SocialService.createNewCommentByFB(tempData, {}, page, feature.code);
    newComment.specific_created_user = JwtHelper.decodeToken().id;
    newComment.specific_avatar = page.icon;
    newComment.specific_detect_id = detect_comment_id;
    newComment.specific_username = page.name;
    newComment.specific_status_message = Constants.SOCIAL.STATE_SEND_DATA_TO_SERVER.MESSAGE_SENDING;
    if (attachments && attachments.length) {
      const convertAttachments = attachments.map(item => {
        return this.convertAttachmentToDisplay(item);
      });
      newComment.attachments = {
        data: convertAttachments
      };
    }

    attachments && (newComment.specific_file = attachments[0]);
    let formData: any = new FormData();
    newComment.specific_file && SocialUtils.convertFormData(assignment, newComment, formData, newComment.specific_file);
    newComment.message && SocialUtils.convertFormData(assignment, newComment, formData);
    formData.append('detect_comment_id', newComment.specific_detect_id);
    const comment = assignment.specific_post_or_feed.specific_comments.find(item => item.id === assignment.comment_social_id);
    if (!comment) {
      return toast(Languages.ManipulationUnSuccess, 'error');
    }
    if (!comment.comments || !comment.comments.data) {
      comment.comments = {
        data: []
      };
    }
    comment.comments.data.unshift(newComment);
    this.setState({ subComments: [] });
    this.setState({ subComments: [...comment.comments.data] });
    this.sendReplyComment(assignment, page, formData, newComment);
  }

  private sendReplyComment = async (assignment: IAssignmentItem, page: IPageAssign, formData: FormData, newComment: IComment) => {
    const resultSendComment: any = await SocialService.sendComment(page.social_type, page.id, assignment.specific_post_or_feed.id, assignment.comment_social_id, this.LEVEL_SUB_COMMENT, formData);
    if (!resultSendComment || resultSendComment.code !== '001') {
      newComment.specific_status_message = Constants.SOCIAL.STATE_SEND_DATA_TO_SERVER.MESSAGE_SEND_MOBIO_FAIL;
      newComment.specific_update_view && newComment.specific_update_view();
      return;
    }
    assignment.is_reply = 1;
    // newComment.specific_status_message = Constants.SOCIAL.STATE_SEND_DATA_TO_SERVER.MESSAGE_DELIVERED;
    // newComment.specific_update_view && newComment.specific_update_view();
    return;
  }

  render() {
    const { assignment, feature, screenType } = this.props;
    const { isLoading, comment, subComments, avatarForPage, disabledInputMessage, displayLoadmoreComments } = this.state;
    return (
      <View style={Styles.container}>
        <SocialShareHeaderScreen
          ref={(comp) => { this.header = comp; }}
          assignment={assignment}
          feature={feature}
          onSetAvatarForPage={() => { this.setState({ avatarForPage: assignment.specific_page_container.icon || '' }); }}
          screenType={screenType}
          onChangeHidden={this.handleChangeHidden} />

        {
          !!isLoading &&
          <View style={styles.loadingRow}>
            <Indicator isShow={true} color={Color.textSecondary} />
          </View>
        }

        {
          !isLoading &&
          <ScrollView 
            showsVerticalScrollIndicator={false}>
            <View style={{ flex: 1 }}>
              <SocialSharePostOrFeedScreen
                ref={(comp) => { this.postOrFeed = comp; }}
                assignment={assignment}
                feature={feature}
                containerStyles={{ marginTop: 20, marginHorizontal: 16 }}
                onAction={this.handleActionPost} />
              {
                !comment && <View style={{ marginTop: 20 }} />
              }
              {
                !!comment &&
                <View>
                  <View style={[Styles.Divider, { marginVertical: 16 }]} />
                  <View style={{ marginHorizontal: 16 }}>
                    <SocialShareCommentScreen
                      key={'key_0'}
                      assignment={assignment}
                      feature={feature}
                      comment={comment}
                      onChangeHidden={this.handleChangeHidden} />
                    {
                      !!subComments && subComments.map((subComment, subIndex) => {
                        return (
                          <SocialShareCommentScreen
                            key={`sub_${subIndex}`}
                            ref={(sub) => this.subCommentRef[subComment.id] = sub}
                            containerStyle={{ marginLeft: 32 }}
                            isSubComment={true}
                            avatarDimesion={20}
                            assignment={assignment}
                            feature={feature}
                            comment={subComment}
                            onUpdateComment={this.handleUpdateComment}
                            onDeleteComment={() => { this.handleDeleteComment(subComment, comment); }}
                            onChangeHidden={this.handleChangeHidden} />
                        );
                      })
                    }
                    {
                      !!displayLoadmoreComments &&
                      <View style={[Styles.CenterItem, { marginBottom: 14 }]}>
                        <WrapButton
                          text={'Tải thêm bình luận'}
                          containerStyle={[{ paddingVertical: 10 }]}
                          textStyle={[Styles.Text_L_M, { color: Color.primary }]}
                          textColor={Color.primary}
                          active={true}
                          borderColor={Color.red}
                          iconLeft={'reset'}
                          iconSize={14}
                          size={'s'}
                          width={200}
                          type={'border'}
                          onPress={this.getMoreSubComments}
                        />
                      </View>
                    }
                  </View>
                </View>
              }

            </View>
          </ScrollView>
        }

        <SocialMessageInput
          ref={(comp: any) => { this.socialInputMessage = comp; }}
          disabled={disabledInputMessage}
          isDisplayMessageTag={false}
          assignment={assignment}
          onMessageTagPress={undefined}
          avatarForPage={avatarForPage}
          fileSize={25}
          typeUploads={['image', 'video']}
          attachmentIcon={'upload_photo'}
          onSend={this.handleSendComment}
          selectSingleItem={true}
          hasMessageTag={false} />

        <SocialShareKeyboardScreen />

      </View>
    );
  }
}


const styles = StyleSheet.create({
  loadingRow: {
    height: 50,
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignContent: 'center',
  },
});

