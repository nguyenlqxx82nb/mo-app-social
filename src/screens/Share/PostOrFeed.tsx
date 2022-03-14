import { SocialUtils } from '../../common';
import { IAssignmentItem, IFeatureAssign, IPostAction, IPostOrFeedAttachmentData } from 'api';
import { Color, Constants, CustomIcon, FacebookService, pushModal, Styles, toast } from 'mo-app-common';
import { AsyncImage, VideoPlayer, ViewMoreHTML, WrapButton, WrapText, ZoomImageViewer } from 'mo-app-comp';
import moment from 'moment';
import React, { PureComponent } from 'react';
import { Keyboard, Linking, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { SocialModalPostContent } from '../Modals';
import Languages from 'mo-app-common/src/Common/Languages';
import { SocialModalCopyClipboard } from '../../screens/Modals/CopyClipboard';

interface SocialSharePostOrFeedScreenProps {
  assignment: IAssignmentItem;
  feature: IFeatureAssign;
  hiddenOpenPost?: boolean;
  containerStyles?: any; // style
  onAction?: (action) => void;
}

interface SocialSharePostOrFeedScreenState {
  comment_image?: number;
  parent_title?: string;
  specific_created_user?: string;
  created_time?: string;
  message?: string;
  specificPostActions?: IPostAction[];
  attachmentsData?: IPostOrFeedAttachmentData[];
}

export class SocialSharePostOrFeedScreen extends PureComponent<SocialSharePostOrFeedScreenProps, SocialSharePostOrFeedScreenState> {
  static defaultProps = {
    containerStyles: {},
    hiddenOpenPost: false
  }

  constructor(props: SocialSharePostOrFeedScreenProps) {
    super(props);
    this.state = {
      comment_image: props.assignment && props.assignment.specific_post_or_feed && props.assignment.specific_post_or_feed.comment_image || 0,
      message: props.assignment && props.assignment.specific_post_or_feed && props.assignment.specific_post_or_feed.message || '',
      parent_title: props.assignment && props.assignment.specific_post_or_feed && props.assignment.specific_post_or_feed.social && props.assignment.specific_post_or_feed.social.parent_title || '',
      specific_created_user: '',
      created_time: props.assignment && props.assignment.specific_post_or_feed && props.assignment.specific_post_or_feed.created_time || '',
      specificPostActions: props.assignment && props.assignment.specific_post_or_feed && props.assignment.specific_post_or_feed.specificPostActions || [],
      attachmentsData: props.assignment && props.assignment.specific_post_or_feed && props.assignment.specific_post_or_feed.attachments && props.assignment.specific_post_or_feed.attachments.data || []
    };
  }

  componentDidMount() {
    const { assignment } = this.props;
    assignment && assignment.specific_post_or_feed && this.buildCreatedUser(assignment.specific_post_or_feed.specific_created_user);
  }

  setData = async () => {
    const { assignment } = this.props;
    if (!assignment || !assignment.specific_post_or_feed) {
      return;
    }
    this.setState({
      comment_image: assignment && assignment.specific_post_or_feed && assignment.specific_post_or_feed.comment_image || 0,
      message: assignment && assignment.specific_post_or_feed && assignment.specific_post_or_feed.message || '',
      parent_title: assignment && assignment.specific_post_or_feed && assignment.specific_post_or_feed.social && assignment.specific_post_or_feed.social.parent_title || '',
      created_time: assignment && assignment.specific_post_or_feed && assignment.specific_post_or_feed.created_time || '',
      specificPostActions: assignment && assignment.specific_post_or_feed && assignment.specific_post_or_feed.specificPostActions || [],
      attachmentsData: assignment && assignment.specific_post_or_feed && assignment.specific_post_or_feed.attachments && assignment.specific_post_or_feed.attachments.data || []
    });
    assignment.specific_post_or_feed && this.buildCreatedUser(assignment.specific_post_or_feed.specific_created_user);
  }

  private buildCreatedUser = async (specific_created_user: string) => {
    let createdUser = '';
    if (!specific_created_user) {
      return createdUser;
    }
    switch (specific_created_user) {
      case 'facebook':
        createdUser = 'Đăng bởi người dùng Facebook';
        break;
      case 'youtube':
        createdUser = 'Đăng bởi người dùng Youtube';
        break;
      case 'instagram':
        createdUser = 'Đăng bởi người dùng Instagram';
        break;
      default:
        const staffName = await SocialUtils.getNameStaffById(undefined, undefined, specific_created_user);
        createdUser = `Đăng bởi ${staffName}`;
        break;
    }
    this.setState({ specific_created_user: createdUser });
    return createdUser;
  }

  private openZoomImageModal = (attachment: IPostOrFeedAttachmentData) => {
    const links = [];
    attachment && attachment.media && attachment.media.image && attachment.media.image.src && links.push(attachment.media.image.src);
    if (!links || !links.length) {
      return;
    }
    const modal = {
      content: <ZoomImageViewer
        autoOpen={true}
        images={links}
        index={0}
      />
    };
    pushModal(modal);
  }

  private renderImage = (attachment: IPostOrFeedAttachmentData) => {
    const linkImg = attachment.media && attachment.media.image && attachment.media.image.src || '';
    if (!linkImg) {
      return null;
    }
    return (
      <TouchableWithoutFeedback
        onPress={() => { this.openZoomImageModal(attachment); }}>
        <View>
          <AsyncImage source={{ uri: linkImg }} width={Constants.Width - 32} height={200} />
        </View>
      </TouchableWithoutFeedback>
    );
  }

  private renderVideo = (attachment: IPostOrFeedAttachmentData) => {
    if (!attachment || !attachment.media || !attachment.media.source) {
      return null;
    }
    return (
      <VideoPlayer
        video={{ uri: attachment.media.source }}
        disableControlsAutoHide
      />
    );
  }

  private showParentPostContent = () => {
    Keyboard.dismiss();
    const { assignment } = this.props;
    if (!assignment || !assignment.specific_post_or_feed || !assignment.specific_post_or_feed.social) {
      return toast(Languages.ManipulationUnSuccess, 'error');
    }
    const modal = {
      content: <SocialModalPostContent content={assignment.specific_post_or_feed.social.parent_title} />
    };
    pushModal(modal);
  }

  private handleActionPost = (action) => {
    switch (action.key) {
      case 'like':
      case 'dislike':
        this.handleLike(action);
        break;
      case 'share':
        toast('Chức năng này sẽ được phát triển ở phiên bản sau.', 'warning');
        break;
      default:
        break;
    }
  }

  private handleLike = async (menu) => {
    const { specificPostActions } = this.state;
    const { assignment } = this.props;
    if (!assignment || !assignment.specific_post_or_feed || !assignment.specific_page_container || !assignment.specific_post_or_feed) {
      return toast(Languages.ManipulationUnSuccess, 'error');
    }
    const post = assignment.specific_post_or_feed;
    menu.disable = true;
    this.forceUpdate();
    const resultLikeOrDislike: any = await FacebookService.doLike(post.social.id, assignment.specific_page_container.token_auth, post[menu.fieldBind]);
    assignment.specific_post_or_feed[menu.fieldBind] = !assignment.specific_post_or_feed[menu.fieldBind];
    menu.disable = false;
    if (!resultLikeOrDislike || !resultLikeOrDislike.success) {
      return toast(Languages.ManipulationUnSuccess, 'error');
    }

    if (specificPostActions.length) {
      let currLike = specificPostActions[0].label && parseInt(specificPostActions[0].label);
      if (assignment.specific_post_or_feed[menu.fieldBind]) {
        currLike += 1;
      } else {
        currLike -= 1;
      }
      specificPostActions[0].label = `${currLike}`;
      assignment.specific_post_or_feed.specificPostActions = specificPostActions;
      this.setState({
        specificPostActions: specificPostActions
      });
    }

    this.forceUpdate();
  }

  private openPage = () => {
    const { assignment } = this.props;
    if (!assignment || !assignment.specific_page_container || !assignment.specific_page_container.social_type
      || !assignment.specific_post_or_feed || !assignment.specific_post_or_feed.id) {
      return;
    }
    switch (assignment.specific_page_container.social_type) {
      case Constants.SOCIAL.TYPE.FACEBOOK:
        const ids = assignment.specific_post_or_feed.id.split('_');
        if (ids.length !== 2) {
          return;
        }
        const facebookLink = `https://www.facebook.com/${ids[0]}/posts/${ids[1]}`;
        Linking.canOpenURL(facebookLink).then(supported => {
          if (supported) {
            Linking.openURL(facebookLink);
          }
        });
        break;
      case Constants.SOCIAL.TYPE.YOUTUBE:
        const youtubeLink = `https://www.youtube.com/watch?v=${assignment.specific_post_or_feed.id}`;
        Linking.canOpenURL(youtubeLink).then(supported => {
          if (supported) {
            Linking.openURL(youtubeLink);
          }
        });
        break;
      default:
        break;
    }
  }

  private handleOpenAttachment = (attachment: any) => {
    if (!attachment || !attachment.url) {
      return;
    }
    Linking.canOpenURL(attachment.url).then(supported => {
      if (supported) {
        Linking.openURL(attachment.url);
      }
    });
  }

  private showCopyModal = (content: string, title?: string) => {
		const modal = {
			content: <SocialModalCopyClipboard content={content} title={title} />
		};
		pushModal(modal);
	}

  render() {
    const { assignment, containerStyles, hiddenOpenPost } = this.props;
    const { specific_created_user, created_time, comment_image, message, attachmentsData, specificPostActions } = this.state;
    return (
      <View style={[containerStyles]}>
        <View style={[Styles.RowOnly, {}]}>
          <AsyncImage source={{ uri: assignment?.specific_page_container?.icon || '' }}
            width={26} height={26} style={{ overflow: 'hidden', borderRadius: 13, marginRight: 6 }} />
          <View style={{ flex: 1 }}>
            <View style={[Styles.RowOnly, Styles.JustifyBetween, { marginBottom: 4 }]}>
              <WrapText st={Styles.Text_M_M}>{assignment?.specific_page_container?.name || '-'}</WrapText>
              <View style={[Styles.RowOnly]}>
                {
                  !hiddenOpenPost &&
                  <TouchableOpacity onPress={this.openPage}>
                    <CustomIcon name={'link_to_fb'} size={16} style={{ color: Color.primary }} />
                  </TouchableOpacity>
                }
                {
                  !!comment_image &&
                  <TouchableOpacity
                    onPress={this.showParentPostContent}
                    style={[Styles.CenterItem, { marginLeft: 16, width: 18, height: 18, backgroundColor: Color.secondary, borderRadius: 9 }]}>
                    <View style={[Styles.RowCenter]}>
                      <CustomIcon name={'post_photos'} size={10} style={{ color: Color.background }} />
                    </View>
                  </TouchableOpacity>
                }
              </View>
            </View>
            <WrapText st={Styles.Text_S_R} styles={{ opacity: 0.5 }}>{specific_created_user}</WrapText>
            <WrapText st={Styles.Text_S_R} styles={{ opacity: 0.5 }}>{created_time ? moment(created_time).format('DD/MM/y HH:mm') : ''}</WrapText>
          </View>
        </View>
        {
          !!message &&
          <View style={[{ marginTop: 10 }]}>
            <ViewMoreHTML
              onCopy={(link) => { this.showCopyModal(link); }}
              text={message}
              textStyle={[Styles.Text_S_R]}
              textMoreStyle={[Styles.Text_M_R, { color: Color.primary, marginBottom: 10, marginTop: 5 }]}
              minHeight={62}
              minNumberLines={3} />
          </View>
        }
        { !!attachmentsData && !!attachmentsData.length && !!attachmentsData[0] && !!attachmentsData[0].type &&
          <View style={[{ marginTop: 10 }]}>
            {attachmentsData[0].type !== 'share' &&
              <View>
                {
                  (attachmentsData[0].type === 'photo' || attachmentsData[0].type === 'album' || attachmentsData[0].type === 'added_photos' || attachmentsData[0].type === 'new_album') &&
                  this.renderImage(attachmentsData[0])
                }
                {
                  (attachmentsData[0].type === 'video_inline' || attachmentsData[0].type === 'video_autoplay') &&
                  this.renderVideo(attachmentsData[0])
                }
              </View>
            }
            {
              attachmentsData[0].type === 'share' &&
              <View>
                {this.renderImage(attachmentsData[0])}
                <TouchableOpacity onPress={() => { this.handleOpenAttachment(attachmentsData[0]); }}>
                  <View style={[{ paddingVertical: 16, paddingHorizontal: 16, backgroundColor: Color.gray, width: '100%' }]}>
                    <WrapText st={Styles.Text_M_M} nl={1}>{attachmentsData[0].title}</WrapText>
                    <WrapText st={Styles.Text_S_R} styles={{ opacity: 0.7, marginTop: 10 }} nl={3}>{attachmentsData[0].description}</WrapText>
                  </View>
                </TouchableOpacity>
              </View>
            }
          </View>
        }
        <View style={[Styles.RowCenter, Styles.JustifyBetween, { width: '100%', marginTop: 16, paddingHorizontal: 26 }]}>
          {
            !!specificPostActions && !!specificPostActions.length && specificPostActions.map((action, index) => {
              return (
                <WrapButton
                  key={`key_${index}`}
                  text={action.label}
                  size={'ms'}
                  width={40}
                  iconLeft={action.classValues[assignment.specific_post_or_feed[action.fieldBind]]}
                  iconSize={14}
                  type={'none'}
                  active={true}
                  enable={!action.disable}
                  containerStyle={{ paddingVertical: 0, paddingHorizontal: 0 }}
                  onPress={() => { this.handleActionPost(action); }}
                />
              );
            })
          }
        </View>
      </View>
    );
  }
}
