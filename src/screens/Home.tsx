import React from 'react';
import { View, EmitterSubscription, DeviceEventEmitter, AppState, ActivityIndicator } from 'react-native';
import { WrapText, Tab, Router, ScreenType } from 'mo-app-comp';
import { Color, Styles, Constants, SocialService, Storage, StorageKeys } from 'mo-app-common';
import { ITabSocial } from 'api/TabSocial';
import { TAB_SOCIAL_DEFAULT } from '../define/DataDefine';
import SocialConstants from '../common/SocialConstants';
import { SocketManager } from 'mo-app-layout';

interface ISocialScreenState {
  tabs: Array<ITabSocial>;
  isLoadingTabData: boolean;
}
export default class SocialScreen extends React.PureComponent<any, ISocialScreenState> {
  private timeIntervalCall: any;
  private bodyCheckunreply: any;
  private stateCallCheckSummarySocialIsCall: boolean;
  private stateCallCheckSummarySocialIsReCall: boolean;
  private keyCheckSummary: string;
  private defaultCurrentIndex: number = 0;
  // private allStaffs: Array<IStaff>;

  tab: Tab;
  socketSubscription: EmitterSubscription;
  constructor(props: any) {
    super(props);
    this.state = {
      tabs: [],
      isLoadingTabData: true,
    };
    this.stateCallCheckSummarySocialIsCall = false;
    this.stateCallCheckSummarySocialIsReCall = false;
    this.keyCheckSummary = SocialConstants.SUMMARY_KEY_CHECK;
  }

  async componentDidMount() {
    AppState.addEventListener('change', this.handleAppStateChange);
    const getAllStaff: any = SocialService.getAllStaffs();
    const getSummarySocial: any = this.getSettingSummarySocial();
    await getAllStaff;
    await getSummarySocial;
    const tabs = await this.initTabInfo() || [];
    tabs && tabs.length && (tabs[0].isSelected = true);
    this.setState({ tabs: tabs, isLoadingTabData: false });
    this.socketSubscription = DeviceEventEmitter.addListener(Constants.EmitCode.SOCIAL_NOTIFICATION, this.onSocketNotificationHandler);
    this.checkSummarySocial();
    this.timeIntervalCall = setInterval(() => {
      if (!this.stateCallCheckSummarySocialIsCall && this.stateCallCheckSummarySocialIsReCall) {
        this.stateCallCheckSummarySocialIsReCall = false;
        this.checkSummarySocial();
      }
    }, 2000);
  }

  componentWillUnmount() {
    AppState.removeEventListener('change', this.handleAppStateChange);
    this.socketSubscription && this.socketSubscription.remove();
    clearInterval(this.timeIntervalCall);
  }

  handleAppStateChange = (nextAppState) => {
    const { tabs } = this.state;
    if (nextAppState !== 'active' || !tabs || !tabs.length || (SocketManager.getSocket() && SocketManager.getSocket().id)) {
      return;
    }
    this.stateCallCheckSummarySocialIsReCall = true;
    const isCurrentScreenSocialDetail = Router.getCurrentScreen() && Router.getCurrentScreen().screenType === ScreenType.SOCIAL_DETAIL ? true : false;
    tabs.forEach(tab => {
      if (tab.isSelected && tab.features && tab.features.length && !isCurrentScreenSocialDetail) {
        tab.features.forEach(feature => {
          feature && feature.specific_on_filter && feature.specific_on_filter(true);
        });
        return;
      }
      tab.isNeedReloadData = true;
      return;
    });
  }

  onSocketNotificationHandler = (event: any) => {
    if (!event || !event.body) {
      return;
    }
    const body = event.body;
    const socketType = body.socket_type;
    if (!Constants.SOCIAL.SOCKET_RECALL_TAB_COUNT.find(socket => socket === socketType)) {
      return;
    }
    this.stateCallCheckSummarySocialIsReCall = true;

  }

  handleRecallTabCount = () => {
    this.stateCallCheckSummarySocialIsReCall = true;
  }

  initTabInfo = async () => {
    // console.log('initTabInfo ')
    const result: any = await SocialService.getAllSocialPage();
    // console.log('initTabInfo getAllSocialPage=', result);
    if (!result || !result.data) {
      return TAB_SOCIAL_DEFAULT([], this.keyCheckSummary, this.handleRecallTabCount);
    }
    const pages = result.data;
    for (const page of pages) {
      await SocialService.getAvatarPage(page, false);
    }
    // console.log('initTabInfo getAvatarPage=', pages);
    await SocialService.getAllConfigPages(pages);
    // console.log('initTabInfo getAllConfigPages=', pages);
    return TAB_SOCIAL_DEFAULT(pages, this.keyCheckSummary, this.handleRecallTabCount);
  }

  private async getSettingSummarySocial() {
    const allSetting = await Storage.getItem(StorageKeys.KEY_CACHE_SETTING_ALL);
    if (!allSetting || !allSetting.data || !allSetting.data.length) {
      return;
    }
    const data = allSetting.data;
    const settingsAccount = data.find(item => item.key === 'setting-account');
    if (!settingsAccount || !settingsAccount.values || !settingsAccount.values.basic) {
      return;
    }
    const settingBasic = settingsAccount.values.basic;
    const settingSocial = settingBasic.find(item => item.key === 'SETTING_ONLINE');
    if (!settingSocial || !settingSocial.content || !settingSocial.content.length) {
      return;
    }
    const settingCountAssignment = settingSocial.content.find(item => item.key === 'setting_count_social');
    if (!settingCountAssignment || !settingCountAssignment.content || !settingCountAssignment.content.length) {
      return;
    }

    const itemActive = settingCountAssignment.content.find(item => item.active);
    if (!itemActive) {
      return;
    }
    this.keyCheckSummary = itemActive.key;
  }

  onTabPressHandler = (index: number) => {
    const { tabs } = this.state;
    tabs.forEach((tab, tabIndex) => {
      if (index !== tabIndex) {
        return tab.isSelected = false;
      }
      if (!tab.isNeedReloadData || !tab.features || !tab.features.length) {
        return tab.isSelected = true;
      }
      tab.isNeedReloadData = false;
      tab.features.forEach(feature => {
        feature.specific_on_filter && feature.specific_on_filter(true);
      });
      return tab.isSelected = true;
    });
  }

  private checkSummarySocial() {
    if (!SocialService.getTimeReAssignBySocials()) {
      this.stateCallCheckSummarySocialIsReCall = true;
      return;
    }
    if (this.stateCallCheckSummarySocialIsCall) {
      return;
    }
    this.stateCallCheckSummarySocialIsCall = true;
    const tabs = this.state.tabs;
    if (!this.bodyCheckunreply) {
      const socialKey = [];
      if (!tabs || !tabs.length) {
        return;
      }
      tabs.forEach(tab => {
        socialKey.push({ social_type: tab.social_type });
      });
      const timeReAssignBySocials = SocialService.getTimeReAssignBySocials();
      socialKey.forEach(social => {
        const reAssignTime = timeReAssignBySocials && timeReAssignBySocials.get(social.social_type);
        if (reAssignTime) {
          social.reassign_time = reAssignTime;
          social.before_revoke_time = Constants.SOCIAL.RANGE_TIME_REVOKE_BEFORE;
        }
      });
      this.bodyCheckunreply = { social_type_info: socialKey };
    }

    SocialService.checkSummaryAllSocial(this.keyCheckSummary, this.bodyCheckunreply).then(result => {
      this.stateCallCheckSummarySocialIsCall = false;
      if (!result || !result.data || !result.data.length) {
        return;
      }

      result.data.forEach(social => {
        const currentTab = tabs.find(tab => tab.social_type === social.social_type);
        if (!currentTab) {
          return;
        }
        if (!social.is_unreply) {
          return currentTab.hasBadge = false;
        }
        currentTab.hasBadge = true;
      });
      this.setState({ tabs: tabs });
      this.tab && this.tab.forceUpdateHeader();
    }, _ => {
      this.stateCallCheckSummarySocialIsCall = false;
    });
  }

  render() {
    const { tabs, isLoadingTabData } = this.state;
    if (isLoadingTabData) {
      return (
        <View style={{ flex: 1, backgroundColor: Color.background }}>
          <View style={[Styles.Header, { borderBottomWidth: 0 }]}>
            <WrapText f={'b'} s={18} >{'Mạng xã hội'}</WrapText>
          </View>
          <View style={{flexGrow:1, justifyContent:'center', alignItems:'center'}}>
            <ActivityIndicator
                  size={'large'}
                  color={Color.primary}
                  style={[
                    { borderRadius: 20 },
                  ]} />
          </View>
        </View>
      );
    }
    return (
      <View style={{ flex: 1, backgroundColor: Color.background }}>
        <View style={[Styles.Header, { borderBottomWidth: 0 }]}>
          <WrapText f={'b'} s={18} >{'Mạng xã hội'}</WrapText>
        </View>
        <Tab
          ref={(comp: any) => { this.tab = comp; }}
          tabInfo={tabs}
          onSelectedTabChanged={this.onTabPressHandler}
          currentIndex={this.defaultCurrentIndex}
          messageEmptyData={'Xin vui lòng kết nối Page trên phiên bản web để có thể sử dụng.'}
        />
      </View>
    );
  }
}
