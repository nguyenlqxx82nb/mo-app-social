import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Constants, Styles, CustomIcon, Color, SocialService, Utils, toast, pushModal } from 'mo-app-common';
import { IAssignmentItem, IAssignmentItemTag, IFeatureAssign } from '../../../../api';
import { SocialConstants, SocialUtils } from '../../../../common';
import { AsyncImage, WrapText, ToggleButton, Router, Spinner, BallIndicator, ScreenType, ButtonRipple } from 'mo-app-comp';
import moment from 'moment';
import Languages from 'mo-app-common/src/Common/Languages';
import SocialBrowserInformation from '../../../BrowserInformation';
import { SocialNewsFacebookMainScreen, SocialNewsInstagramMainScreen } from '../../Detail/Comment';
import { ChatSocialDetailScreen } from '../../Detail';
import styles from './styles';

export interface ISocialAssignmentItemProps {
  assignment: IAssignmentItem;
  type: any;
  feature: IFeatureAssign;
  lastIndex: boolean;
  detectChanges?: (item: IAssignmentItem) => void;
}

export interface ISocialAssignmentItemState {
  maxNameWidth: any;
  searchWord: string;
  avatarDefault: string;
}

export class SocialAssignmentItem extends React.PureComponent<ISocialAssignmentItemProps, ISocialAssignmentItemState>{
  specific_interval_build_time_unreply: any;
  private disableChangePin: boolean;
  private disableChangeHold: boolean;
  private hasProfileTag: boolean;

  constructor(props: ISocialAssignmentItemProps) {
    super(props);
    this.state = {
      maxNameWidth: '100%',
      searchWord: undefined,
      avatarDefault: ''
    };
  }

  componentDidMount() {
    // const { assignment, feature, detectChanges } = this.props;
    // SocialService.buildInfo(assignment, feature.tabOrigin.social_type, feature.code, detectChanges);
    this.initAvatarDefault();
    this.runTime();
  }

  initAvatarDefault = async () => {
    this.setState({ avatarDefault: await SocialService.getDefaultAvatar() });
  }

  componentWillUnmount() {
    if (this.specific_interval_build_time_unreply) {
      clearInterval(this.specific_interval_build_time_unreply);
      this.specific_interval_build_time_unreply = null;
    }
  }

  componentWillReceiveProps(nextProps: ISocialAssignmentItemProps) {
    const { searchWord } = this.state;
    if (nextProps.feature && nextProps.feature.specific_filter_search_value !== searchWord && nextProps.feature.specific_filter_search_type === 'content') {
      this.setState({ searchWord: nextProps.feature.specific_filter_search_value });
    }
  }

  private handleRuntime = () => {
    const { assignment, feature, detectChanges } = this.props;
    SocialService.runTimeProcess(assignment, feature.code, detectChanges);
  }

  private runTime = () => {
    this.handleRuntime();
    this.specific_interval_build_time_unreply = setInterval(() => {
      this.handleRuntime();
    }, 30000);
  }


  onClickAssignmentHandler = () => {
    const { feature, assignment, detectChanges } = this.props;
    feature.itemSelected = assignment;
    SocialService.readAssignAssignment(feature, assignment, detectChanges);
    const page = assignment && assignment.specific_page_container || undefined;
    if (!page) {
      return;
    }
    if (feature && feature.code && feature.code === Constants.SOCIAL.FEATURE_CODE.MESSAGE) {
      return Router.push(<ChatSocialDetailScreen
        assignment={assignment}
        detectChanges={detectChanges}
        screenType={ScreenType.SOCIAL_DETAIL}
        feature={feature} />, { screenType: ScreenType.SOCIAL_DETAIL, id: assignment.id });
    }

    if (feature && feature.code && feature.code === Constants.SOCIAL.FEATURE_CODE.COMMENT) {
      console.log('page', page.social_type);
      switch (page.social_type) {
        case Constants.SOCIAL.TYPE.FACEBOOK:
          Router.push(<SocialNewsFacebookMainScreen
            assignment={assignment}
            screenType={ScreenType.SOCIAL_NEWS}
            feature={feature} />, { screenType: ScreenType.SOCIAL_NEWS, id: assignment.id });
          break;
        case Constants.SOCIAL.TYPE.INSTAGRAM:
          Router.push(<SocialNewsInstagramMainScreen
            assignment={assignment}
            screenType={ScreenType.SOCIAL_NEWS}
            feature={feature} />, { screenType: ScreenType.SOCIAL_NEWS, id: assignment.id });
          break;
      }
    }

  }

  handlerChangeHold = () => {
    const { feature, assignment, detectChanges } = this.props;
    if (this.disableChangeHold) {
      return;
    }
    this.disableChangeHold = true;
    const page = assignment.specific_page_container;
    let isHold = false;
    if (!assignment.is_hold) {
      assignment.is_hold = true;
      isHold = true;
    }
    const body = {
      page_social_id: page.page_social_id,
      social_type: page.social_type,
      object_id: assignment.id,
      object_type: feature.code,
      is_hold: isHold
    };
    SocialService.changeHoldAssignmentStatus(body).then(result => {
      this.disableChangeHold = false;
      if (!result || result.code !== '001') {
        this.errorHold();
        return;
      }
      assignment.is_hold = isHold;
      detectChanges(assignment);
      // toast(Languages.ManipulationSuccess, Constants.TOAST_TYPE.SUCCESS);
    }, _ => {
      this.errorHold();
    });
  }

  private errorHold() {
    const { assignment, detectChanges } = this.props;
    this.disableChangeHold = false;
    // this.checkboxHold && this.checkboxHold.setChecked(userAssign.is_hold);
    assignment.is_hold = assignment.is_hold ? false : true;
    detectChanges(assignment);
    toast(Languages.ManipulationUnSuccess, 'error');
  }

  handlerChangePin = () => {
    const { feature, assignment, detectChanges } = this.props;
    if (this.disableChangePin) {
      return;
    }
    this.disableChangePin = true;
    const page = assignment.specific_page_container;
    const is_pin_order = assignment.pin_order && assignment.pin_order !== SocialConstants.PIN_ORDER_OF_USER_ASSIGN_FOCUS ? false : true;
    const body = {
      page_social_id: page.page_social_id,
      social_type: page.social_type,
      object_id: assignment.id,
      object_type: feature.code.valueOf(),
      is_pin_order: is_pin_order
    };

    // const currentPinOrder = assignment.pin_order;

    SocialService.changePinOrderAssignment(body).then(result => {
      this.disableChangePin = false;
      if (!result || result.code !== '001') {
        this.errorPin(is_pin_order);
        return;
      }
      assignment.pin_order = result.data.pin_order;
      detectChanges(assignment);
      feature.specific_sort_assignments && feature.specific_sort_assignments(assignment);
    }).catch(_ => {
      this.disableChangePin = false;
      this.errorPin(is_pin_order);
    });
  }

  private errorPin(isPin: boolean) {
    toast(Languages.ManipulationUnSuccess, 'error');
    const { assignment, detectChanges } = this.props;
    this.disableChangePin = false;
    isPin && (assignment.pin_order = null);
    detectChanges(assignment);
  }

  private setLabelStaffAssign = () => {
    const { assignment, detectChanges } = this.props;
    SocialUtils.getNameStaffById(assignment.assignees, 2, assignment.status === 2 ? assignment.resolved_user : undefined).then(staffName => {
      if (assignment.specific_assign_staff_name !== staffName) {
        assignment.specific_assign_staff_name = staffName;
        detectChanges(assignment);
      }
    });
  }

  onBrowserPressHandler = async () => {
    const { assignment } = this.props;
    if (!assignment || !assignment.specific_page_container) {
      return toast(Languages.ManipulationUnSuccess, 'error');
    }
    await SocialUtils.getBrowsingInformation(assignment.specific_page_container.page_social_id, assignment);
    const modal = {
      content: <SocialBrowserInformation assignment={assignment} isModal={true} />
    };
    pushModal(modal);
  }

  handleAvatarError = () => {
    const { assignment } = this.props;
    const { avatarDefault } = this.state;
    assignment && (assignment.specific_avatar = avatarDefault);
  }

  renderAvatar = () => {
    const { assignment } = this.props;
    const { avatarDefault } = this.state;
    assignment && !assignment.specific_avatar && (assignment.specific_avatar = avatarDefault);
    return (
      <View style={{ marginRight: 8 }}>
        <AsyncImage source={{ uri: assignment.specific_avatar }} iconDefault={avatarDefault} onError={this.handleAvatarError} width={36} height={36} radius={18} />
        {assignment.specific_status_online === SocialConstants.KEY_CHECK_WEB_LIVE_CHAT_USER_ONLINE &&
          <View style={styles.statusIcon}>
            <CustomIcon name={'call_status'} size={8} color={Color.green} />
          </View>
        }
      </View>
    );
  }

  renderTags = () => {
    const { assignment } = this.props;
    const hasTags = assignment.tags && assignment.tags.length > 0;
    if (!hasTags) {
      return null;
    }
    return (
      <View style={[Styles.Row, Styles.AlignCenter]}>
        {
          assignment.tags.map((tag: IAssignmentItemTag, index: number) => {
            if (index < 3) {
              return (
                <View style={{ backgroundColor: tag.properties.background_color, width: 8, height: 8, borderRadius: 4, marginRight: 5 }} />
              );
            }
            return null;
          })
        }
        {
          assignment.tags.length > 3 &&
          <WrapText st={Styles.Text_TS_R}>{`+${assignment.tags.length - 3}`}</WrapText>
        }
      </View>
    );
  }

  renderMessage = (maxTextWidth: number) => {
    const { feature, assignment, detectChanges } = this.props;
    const { searchWord } = this.state;
    if (assignment.is_reply) {
      const stateSendDataToServer = assignment.specific_status_message;
      SocialUtils.getStatusSendDataToServerOfAssignmentItem(assignment);
      if (stateSendDataToServer !== assignment.specific_status_message) {
        detectChanges(assignment);
      }

    }

    return (
      <View style={[Styles.RowCenter, Styles.JustifyBetween, { marginBottom: 5 }]}>
        <WrapText st={[(assignment.unread_number !== 0 && (!feature?.itemSelected || assignment.id !== feature?.itemSelected?.id) ? Styles.Text_S_SB : Styles.Text_S_R), { width: maxTextWidth, maxHeight: 20 }]}
          searchWords={searchWord ? [searchWord] : undefined} highlightStyle={{ backgroundColor: Color.text, color: Color.background }}>
          {assignment.type === Constants.SOCIAL.FEATURE_CODE.RATE ? assignment?.social?.title : assignment?.last_message?.message}</WrapText>
        { feature.specific_show_status_send_data_assignment && (assignment.is_reply || (!assignment.is_reply && assignment.specific_status_message < Constants.SOCIAL.STATE_SEND_DATA_TO_SERVER.MESSAGE_FAIL)) &&
          <View>
            {
              assignment.specific_status_message === Constants.SOCIAL.STATE_SEND_DATA_TO_SERVER.MESSAGE_SENDING && <BallIndicator color={Color.text} size={12} />
            }
            {
              assignment.specific_status_message === Constants.SOCIAL.STATE_SEND_DATA_TO_SERVER.MESSAGE_SENT && <CustomIcon name={'mark_selected'} size={12} color={Color.textSecondary} />
            }
            {
              assignment.specific_status_message === Constants.SOCIAL.STATE_SEND_DATA_TO_SERVER.MESSAGE_DELIVERED && <CustomIcon name={'received'} size={12} color={Color.textSecondary} />
            }
            {
              assignment.specific_status_message === Constants.SOCIAL.STATE_SEND_DATA_TO_SERVER.MESSAGE_READ && <CustomIcon name={'received'} size={12} color={Color.secondary} />
            }
            {
              assignment.specific_status_message === Constants.SOCIAL.STATE_SEND_DATA_TO_SERVER.MESSAGE_SENDING && <Spinner size={'small'} timeout={0} mode={'full'} />
            }
            {
              assignment.specific_status_message === Constants.SOCIAL.STATE_SEND_DATA_TO_SERVER.MESSAGE_FAIL && <CustomIcon name={'error_user_block'} size={12} color={Color.red} />
            }
            {
              assignment.specific_status_message < Constants.SOCIAL.STATE_SEND_DATA_TO_SERVER.MESSAGE_FAIL && <CustomIcon name={'error_connection'} size={12} color={Color.red} />
            }
          </View>
        }
      </View>
    );
  }

  renderReplyStatus = (isUnread: boolean) => {
    const { assignment, feature } = this.props;
    const isRenderReplyStatus = feature && feature.filter && feature.filter.status === '1' ? true : false;
    if (assignment.is_reply) {
      return (
        <View style={[Styles.RowCenter, { height: 35 }]}>
          <CustomIcon name={'responded_message'} size={10} color={Color.secondary} />
          <WrapText st={[isUnread ? Styles.Text_T_SB : Styles.Text_T_R, { marginLeft: 5 }]} c={Color.secondary}>{'Đã trả lời'}</WrapText>
        </View>
      );
    }
    if (!isRenderReplyStatus) {
      return <View style={[Styles.RowCenter, { height: 12 }]} />;
    }

    if (assignment.specific_label_time_unreply === 'Tin nhắn mới' || assignment.specific_label_time_unreply === 'Bình luận mới') {
      return (
        <View style={[Styles.RowCenter, { height: 35 }]}>
          <CustomIcon name={'new_message'} size={10} color={Color.primary} />
          <WrapText st={[isUnread ? Styles.Text_T_SB : Styles.Text_T_R, { marginLeft: 5 }]} c={Color.primary}>{Utils.capitalize(assignment.specific_label_time_unreply)}</WrapText>
        </View>
      );
    }

    if (assignment.specific_label_time_unreply !== 'Tin nhắn mới' && assignment.specific_label_time_unreply !== 'Bình luận mới') {
      return (
        <View style={[Styles.RowCenter, { height: 35 }]}>
          <CustomIcon name={'new_message'} size={10} color={Color.red} />
          <WrapText st={[isUnread ? Styles.Text_T_SB : Styles.Text_T_R, { marginLeft: 5 }]} c={Color.red}>{Utils.capitalize(assignment.specific_label_time_unreply)}</WrapText>
        </View>
      );
    }
  }

  renderButtons = () => {
    const { feature, assignment } = this.props;
    return (
      <View style={[Styles.RowCenter]}>
        {
          feature?.tabOrigin?.social_type === Constants.SOCIAL.TYPE.WEB_LIVE_CHAT &&
          // <TouchableOpacity
          //   onPress={this.onBrowserPressHandler}>
          //   <CustomIcon name={'browsing_info'} size={16} color={Color.primary} style={{ marginRight: 8 }} />
          // </TouchableOpacity>
          <ButtonRipple 
            onPress={this.onBrowserPressHandler} 
            name={'browsing_info'} 
            size={16}
            color={Color.primary}
            containerStyle={{ marginRight: 8 }}
            width={30}
            height={30} />
        }
        {
          !!assignment.assignees && !!assignment.assignees?.length && !!assignment.assignees[0] &&
          assignment.assignees[0].assignee_id === Constants.StaffId && assignment.status !== 2 &&
          <View style={[Styles.Row]}>
            {
              !!assignment.is_display_hold &&
              <ToggleButton
                iconOff={'checkbox_empty'}
                iconOn={'checkbox'}
                isChecked={assignment.is_hold}
                onButtonPress={this.handlerChangeHold}
              />
            }
            {
              <ToggleButton
                iconOff={'unpin'}
                iconOn={'pinned'}
                isChecked={!!assignment.pin_order && assignment.pin_order !== SocialConstants.PIN_ORDER_OF_USER_ASSIGN_FOCUS}
                onButtonPress={this.handlerChangePin}
              />
            }
          </View>
        }
      </View>
    );
  }

  renderSupporterInfo = () => {
    const { feature, assignment } = this.props;
    if (feature.specific_is_filter_all_staff) {
      this.setLabelStaffAssign();
    }
    return (
      feature.specific_is_filter_all_staff &&
      <View style={[Styles.RowCenter, { paddingLeft: 8, marginBottom: 8 }]}>
        <CustomIcon name={assignment.status === 1 ? 'assign_to' : 'mark_done'} color={assignment.status === 1 ? Color.textSecondary : Color.green} size={20} style={{ marginRight: 10 }} />
        <View style={{ backgroundColor: assignment.status === 1 ? Color.primary : Color.green, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 15 }}>
          <WrapText st={[Styles.Text_S_R]} c={'#fff'}>{assignment.specific_assign_staff_name}</WrapText>
        </View>
      </View>
    );
  }

  private calcMaxNameWidth = () => {
    const { assignment } = this.props;
    if (!assignment || !assignment.tags || !assignment.tags.length) {
      const tempMaxNameWidth = this.hasProfileTag ? Constants.Width - 110 : Constants.Width - 90;
      this.setState({ maxNameWidth: tempMaxNameWidth });
      return;
    }
    if (assignment.tags.length <= 3) {
      const tempMaxNameWidth = this.hasProfileTag ? Constants.Width - 110 - assignment.tags.length * 13 : Constants.Width - 90 - assignment.tags.length * 13;
      return this.setState({ maxNameWidth: tempMaxNameWidth });
    }
    const tempMaxNameWidth = this.hasProfileTag ? Constants.Width - 110 - 7 - 40 : Constants.Width - 90 - 7 - 40;
    return this.setState({ maxNameWidth: tempMaxNameWidth });
  }

  

  render() {
    const { lastIndex, feature, assignment } = this.props;
    const { maxNameWidth } = this.state;
    const maxTextWidth = Constants.Width - 36 - 36 - 10 - 20 - 10;
    const isRenderReplyStatus = feature && feature.filter && feature.filter.status === '1' ? true : false;
    this.hasProfileTag = assignment.specific_profile && assignment.specific_profile.originCustomer
      && assignment.specific_profile.originCustomer.profile_tags && assignment.specific_profile.originCustomer.profile_tags.length ? true : false;

    const isUnread = (assignment.unread_number !== 0 && (!feature?.itemSelected || assignment.id !== feature?.itemSelected?.id)) ? true : false ;
    this.calcMaxNameWidth();
    return (
      <ButtonRipple
        color={Color.text}
        opacity={0.1}
        radius={1}
        onPress={this.onClickAssignmentHandler}>
        <View style={styles.itemContainer}>
          { this.renderSupporterInfo()}
          <View style={[Styles.RowOnly]}>
            {this.renderAvatar()}
            <View style={[Styles.FlexGrow, { paddingBottom: 12 }, !lastIndex ? { borderBottomColor: Color.border, borderBottomWidth: 0.5 } : {}]}>
              <View style={[Styles.RowCenter, Styles.JustifyBetween, { marginBottom: 5 }]}>
                <View style={[Styles.RowCenter, { flex: 1 }]}>
                  <WrapText styles={{ maxWidth: maxNameWidth }}
                    st={[isUnread ? Styles.Text_S_B : Styles.Text_S_M]}>
                    {assignment.specific_username}</WrapText>
                  {this.hasProfileTag &&
                    <View style={[{ marginLeft: 6, backgroundColor: '#29c7cc', padding: 4, borderRadius: 9 }]}>
                      <CustomIcon name={'tag_profile'} size={10} color={Color.background} /></View>
                  }
                </View>
                {this.renderTags()}
              </View>
              {this.renderMessage(maxTextWidth)}
              <View style={[Styles.RowCenter]}>
                <WrapText st={[isUnread? Styles.Text_T_SB : Styles.Text_T_R]}>{moment(assignment.updated_time).format('DD/MM/y HH:mm')}</WrapText>
                {assignment.type === Constants.SOCIAL.FEATURE_CODE.COMMENT &&
                  <View style={[Styles.RowCenter, { marginLeft: 32 }]}>
                    <CustomIcon name={SocialUtils.setClassifyStatus(assignment.classify).iconName} size={10} color={SocialUtils.setClassifyStatus(assignment.classify).color} />
                    <WrapText st={[isUnread ? Styles.Text_T_SB : Styles.Text_T_R, { marginLeft: 5 }]} c={SocialUtils.setClassifyStatus(assignment.classify).color}>{SocialUtils.setClassifyStatus(assignment.classify).text}</WrapText>
                  </View>
                }
              </View>
              <View style={[Styles.RowCenter, Styles.JustifyBetween, { marginBottom: 0, marginTop: 0 }]}>
                {this.renderReplyStatus(isUnread)}
                {isRenderReplyStatus && this.renderButtons()}
              </View>
              {
                !!assignment.specific_page_container &&
                <View style={[Styles.RowCenter, Styles.JustifyBetween, { marginTop: 0 }]}>
                  <View style={[Styles.RowCenter, { marginTop: 0 }]}>
                    <AsyncImage source={{ uri: assignment?.specific_page_container.icon }} width={15} height={15} radius={8} style={{ marginRight: 8 }} />
                    <WrapText st={[isUnread ? Styles.Text_T_SB : Styles.Text_T_R, {maxWidth: 270}]}>{assignment?.specific_page_container.name}</WrapText>
                  </View>
                  {!isRenderReplyStatus && feature?.tabOrigin?.social_type === Constants.SOCIAL.TYPE.WEB_LIVE_CHAT &&
                    <TouchableOpacity
                      onPress={this.onBrowserPressHandler}>
                      <CustomIcon name={'browsing_info'} size={16} color={Color.primary} style={{ marginRight: 8 }} />
                    </TouchableOpacity>
                  }
                </View>
              }
            </View>
          </View>
        </View>
      </ButtonRipple>
      
    );
  }
}


