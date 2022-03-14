import React, { PureComponent } from 'react';
import { View, ScrollView, TouchableOpacity, Platform, BackHandler } from 'react-native';
import { Styles, Color, CustomIcon, Constants, Device, SocialService, toast, Storage, StorageKeys, AdminService } from 'mo-app-common';
import { ButtonRipple, WrapText, Router, Dropdown, ListView, AsyncImage, Checkbox, Radio, WrapButton, ScreenType, WrapModal, IModal, pushModal } from 'mo-app-comp';
import { IPageAssign, IStaff } from 'api/PageAssign';
import { IAssignmentItemTag, IFeatureAssign, IFilterFeatureAssign } from 'api';
import SocialTagsModal from '../Tags/index';
import Languages from 'mo-app-common/src/Common/Languages';
import styles from './styles';
const cloneDeep = require('clone-deep');

export interface IFilterSocialPage {
  id: string;
  name: string;
  avatar: string;
}

export interface ISocialFilterProps {
  feature: IFeatureAssign
}

interface ISocialFilterState {
  supporterSelected: string;
  socialPageSelected: string[],
  tagWorkSelected: IAssignmentItemTag[],
  isMoreSocialSelectedPage?: boolean;
  isMoreAssignTagSelectedPage?: boolean;
  sortType: string; // 'asc' | 'desc' | 'default';
  status: string;
  replyStatus: number[];
  classify: number[];
}

const defaultClassifyStatus = [
  {
    text: 'Tích cực',
    value: Constants.SOCIAL.CLASSIFY.POSITIVE
  },
  {
    text: 'Trung lập',
    value: Constants.SOCIAL.CLASSIFY.NEUTRAL
  },
  {
    text: 'Tiêu cực',
    value: Constants.SOCIAL.CLASSIFY.NEGATIVE
  },
];

class SocialFilterModal extends PureComponent<ISocialFilterProps, ISocialFilterState> {

  private settingsAccount: any;
  private settingFilterAssignment: any;
  private allSettingLocal: any;

  static defaultProps = {
    supporterSelected: '',
    sortSelected: Constants.SORT.ASC,
    statusSelected: '1',
    answerStatus: [],
    tagWorkSelected: [],
    socialPages: [],
    socialPageSelected: []
  }

  filterRoot: IFilterFeatureAssign;
  dropdownSupporterRef: Dropdown;
  socialLwRef: ListView;
  tagWorkLwRef: ListView;
  answerCbRef: Checkbox;
  notAnswerCbRef: Checkbox;
  sortTypeRdRef: Radio;
  statusRdRef: Radio;

  modalRef: WrapModal;

  constructor(props: ISocialFilterProps) {
    super(props);
    // const page
    this.state = {
      tagWorkSelected: props.feature.filter && props.feature.filter.tags,
      supporterSelected: props.feature.filter && props.feature.filter.assignee,
      socialPageSelected: cloneDeep(props.feature.filter && props.feature.filter.page_social_ids || []),
      isMoreSocialSelectedPage: false,
      isMoreAssignTagSelectedPage: false,
      sortType: props.feature?.filter?.sort_type || 'asc',
      status: props.feature?.filter?.status,
      replyStatus: props.feature?.filter?.reply_status || [],
      classify: props.feature?.filter?.classify || [],
    };
    props.feature && (props.feature.ignoreRevoke = true);
    if (props.feature && props.feature.filter) {
      this.defaultData(props.feature.filter);
    }
  }


  componentDidMount() {
    this.initData();
    if (Platform.OS === 'android') {
      BackHandler.addEventListener('hardwareBackPress', this.androidBack);
    }
  }

  componentWillUnmount() {
    if (Platform.OS === 'android') {
      BackHandler.removeEventListener('hardwareBackPress', this.androidBack);
    }
  }

  private androidBack = () => {
    if (!Router.getCurrentScreen() || Router.getCurrentScreen().screenType !== ScreenType.SOCIAL_FILTER) {
      return false;
    }
    this.onBackPress(true);
    return false;
  }

  defaultData = (filter: IFilterFeatureAssign) => {
    this.filterRoot = cloneDeep(filter);
  }

  private async updateSetting() {
    const bodySetting = {
      key: StorageKeys.KEY_CACHE_SETTING,
      value: this.settingsAccount.values,
      is_public: 0
    };
    try {
      const resultUpdateSettings: any = await AdminService.updateSetting(bodySetting);
      if (!resultUpdateSettings || resultUpdateSettings.code !== 200) {
        return;
      }
      this.updateAllSetting();
      return;
    } catch (error) {
      return;
    }
  }

  private updateAllSetting() {
    if (!this.allSettingLocal || !this.allSettingLocal.data || !this.allSettingLocal.data.length) {
      return;
    }
    Storage.setItem(StorageKeys.KEY_CACHE_SETTING_ALL, this.allSettingLocal);
  }

  initData = () => {
    const { feature } = this.props;
    //console.log('initData staffs=', feature.tabOrigin.pages[0].staffs);
    
    if (feature.tabOrigin.pages.length > 5) {
      this.setState({ isMoreSocialSelectedPage: true });
    }
    // set social pages list
    // this.socialLwRef && (this.socialLwRef.Items = feature.tabOrigin.pages);

    Storage.getItem(StorageKeys.KEY_CACHE_SETTING_ALL).then(allSetting => {
      if (!allSetting || !allSetting.data || !allSetting.data.length) {
        return;
      }
      this.allSettingLocal = allSetting;
      const data = allSetting.data;
      this.settingsAccount = data.find(item => item.key === StorageKeys.KEY_CACHE_SETTING);
      if (!this.settingsAccount || !this.settingsAccount.values || !this.settingsAccount.values.basic) {
        return;
      }
      const settingBasic = this.settingsAccount.values.basic;
      const settingSocial = settingBasic.find(item => item.key === 'SETTING_ONLINE');
      if (!settingSocial || !settingSocial.content || !settingSocial.content.length) {
        return;
      }
      this.settingFilterAssignment = settingSocial.content.find(item => item.key === `setting_default_filter_${feature.code.valueOf()}`);
      if (!this.settingFilterAssignment || !this.settingFilterAssignment.content || !this.settingFilterAssignment.content.length) {
        this.settingFilterAssignment = {
          title: 'i18n_title_setting_default_filter',
          key: `setting_default_filter_${feature.code.valueOf()}`,
          enable: false,
          content: [
            { key: 'status', label: 'status', value: '1', active: true },
            { key: 'reply_status', label: 'reply_status', value: [], active: true },
            { key: 'sort_type', label: 'sort_type', value: feature.filter.sort_type, active: true },
            { key: 'assignee', label: 'assignee', value: feature.filter.assignee, active: true },
            { key: 'page_social_ids', label: 'page_social_ids', value: [], active: true },
            { key: 'tags', label: 'tags', value: [], active: true }
          ]
        };
        settingSocial.content.push(this.settingFilterAssignment);
      }
      const settingSortType = this.settingFilterAssignment.content.find(item => item.key === 'sort_type');
      if (!settingSortType || !settingSortType.value) {
        return;
      }
      if (!feature.specific_filter_loaded_cache) {
        feature.filter.sort_type = settingSortType.value;
        this.sortTypeRdRef && this.sortTypeRdRef.setSelectedKey(feature.filter.sort_type);
      }
    });
  }

  onBackPress = (ignoreRouterPop: boolean = false) => {
    // const { feature } = this.props;
    // feature && (feature.ignoreRevoke = false);
    // if (feature && this.filterRoot) {
    //   feature.filter = this.filterRoot;
    // }
    // !ignoreRouterPop && Router.pop();
    this.modalRef.close();
  }

  buildLabelStaff(staff: IStaff) {
    if (!staff.fullname || staff.fullname === 'Tất cả') {
      return (staff.username);
    }
    return `${staff.fullname} (${staff.username})`;
  }

  onLoadDataHandler = async (page: number, per_page: number, onLoadDataCompleted: any, _lastCursor: any) => {
    const result: any = await SocialService.getSocialTag({ page: page, per_page: per_page, search: '' });
    const assignTags = (result.code === '001' && result.tag) ? result.tag : [];
    if (assignTags.length > 5) {
      this.setState({ isMoreAssignTagSelectedPage: true });
    }
    onLoadDataCompleted(cloneDeep(assignTags.slice(0, Math.min(5, assignTags.length))));
  }

  onLoadMoreDataHandler = async (page: number, per_page: number, onLoadMoreDataCompleted: any, _lastCursor: any) => {
    // const result: any = await SocialService.getSocialTag({ page: page, per_page: per_page, search: '' });
    // const data = (result.code === '001' && result.tag) ? result.tag : [];
    onLoadMoreDataCompleted([]);
  }

  renderDropdownSupportBase = (item: any) => {
    return (
      <View style={[Styles.Border, Styles.Row, Styles.JustifyBetween, Styles.AlignCenter, { height: 30, paddingHorizontal: 10 }]}>
        <WrapText st={[Styles.Text_S_R]}>{item ? item.label : 'Chọn người hỗ trợ'}</WrapText>
        <CustomIcon size={10} name={'drop_down'} color={Color.text} />
      </View>
    );
  }
  renderDropdownSupportItem = (item: IStaff, selectedKey: any) => {
    return (
      <View style={[Styles.Row, Styles.JustifyBetween, Styles.AlignCenter, { height: 28 }]}>
        <WrapText st={[Styles.Text_S_R, { marginLeft: 5, marginRight: 5 }]} c={Color.text}>{this.buildLabelStaff(item)}</WrapText>
        { selectedKey === item.id && <CustomIcon name={'mark_selected'} size={10} color={Color.text} />}
      </View>
    );
  }

  renderSocialPageLwItem = (_type: any, page: IPageAssign, _index: number) => {
    const { socialPageSelected } = this.state;
    const active = socialPageSelected.find((item) => {
      return page.page_social_id === item;
    }) ? true : false;

    return (
      <Checkbox
        containerStyle={styles.chbItem}
        active={active}
        value={page.page_social_id}
        renderLeft={() => {
          return (
            <View style={Styles.Row}>
              <AsyncImage source={{ uri: page.icon }} width={22} height={22} radius={11} style={{ marginRight: 8 }} />
              <WrapText st={styles.cbLabelItem}>{page.name}</WrapText>
            </View>
          )
        }}
        onActiveChange={(_active: boolean, _value: any) => { this.onSocialPageItemSelect(_active, page); }} />
    );
  }

  renderTagWorkLwItem = (_type: any, item: IAssignmentItemTag, _index: number) => {
    let checkboxRef: Checkbox;
    const { tagWorkSelected } = this.state;
    const active = tagWorkSelected.find((_item: IAssignmentItemTag) => {
      return _item.id === item.id;
    }) ? true : false;
    return (
      <Checkbox
        ref={(comp) => { checkboxRef = comp; }}
        containerStyle={styles.chbItem}
        active={active}
        value={item.id}
        renderLeft={()=>{
          return (
            <View style={[Styles.Row]}>
              <CustomIcon name={'call_status'} size={8} color={item?.properties?.background_color} style={{ marginRight: 8 }} />
              <WrapText st={Styles.Text_S_R}>{item.value}</WrapText>
            </View>
          );
        }}
        onActiveChange={(_active: boolean, _value: any) => { this.onTagWorkItemSelect(_active, item); }} />
    );
  }

  onSocialPageItemSelect = (active: boolean, page: any) => {
    const { socialPageSelected } = this.state;
    let _selected = socialPageSelected.filter(item => {
      return page.page_social_id !== item;
    });

    if (active) {
      _selected.push(page.page_social_id);
    }

    this.setState({ socialPageSelected: _selected });
    // const { feature } = this.props;
    // if (feature.filter) {
    //   feature.filter.page_social_ids = _selected;
    // }
  }

  onTagWorkItemSelect = (active: boolean, item: any) => {
    const { tagWorkSelected } = this.state;
    let _selected = tagWorkSelected.filter((_item: IAssignmentItemTag) => {
      return _item.id !== item.id;
    });

    if (active) {
      _selected.push(item);
    }

    this.setState({ tagWorkSelected: _selected });
    // this.changeFilterValue('tags', _selected);
  }

  onSupporterItemSelect = (item: any) => {
    // this.changeFilterValue('assignee', item.id);
    this.setState({
      supporterSelected: item.id
    })
  }

  onHandleChangeStatus = (item: any) => {
    this.setState({
      status: item.id
    })
    // this.changeFilterValue('status', item.id);
  }

  onHandleSortType = (item: any) => {
    // this.changeFilterValue('sort_type', item.id);
    this.setState({sortType: item.id});
  }

  onHandleDefaultData = () => {
    const { feature } = this.props;
    if (!feature || !feature.filter) {
      return;
    }
    // feature.filter.assignee = feature.tabOrigin && feature.tabOrigin.pages && feature.tabOrigin.pages.length && feature.tabOrigin.pages[0].currentStaff.id;
    // feature.filter.page_social_ids = [];
    // feature.filter.status = '1';
    // feature.filter.reply_status = [];
    // feature.filter.classify = [];
    // feature.filter.tags = [];
    // feature.filter.sort_type = Constants.SORT.ASC;
    // this.sortTypeRdRef && this.sortTypeRdRef.setSelectedKey(feature.filter.sort_type);
    // this.statusRdRef && this.statusRdRef.setSelectedKey(feature.filter.status);
    this.setState({ 
      tagWorkSelected: [], 
      socialPageSelected: [], 
      supporterSelected: feature.tabOrigin && feature.tabOrigin.pages && feature.tabOrigin.pages.length && feature.tabOrigin.pages[0].currentStaff.id,
      status: '1',
      replyStatus: [],
      classify: [],
      sortType: Constants.SORT.ASC
    });
    
    this.dropdownSupporterRef.setData(feature.tabOrigin.pages[0].staffs, feature.filter.assignee);
    this.socialLwRef.Items = cloneDeep(this.socialLwRef.Items);
    this.tagWorkLwRef.Items = cloneDeep(this.tagWorkLwRef.Items);
  }

  onHandleReplyStatusChange = (active: boolean, value: any) => {
    let { replyStatus } = this.state;
    const { feature } = this.props;
    if (!feature || !feature.filter) {
      return;
    }
    replyStatus = replyStatus.filter(status => status !== value);
    if (active) {
      replyStatus.push(value);
    }
    this.setState({
      replyStatus: replyStatus
    })
  }

  onHandleClassifyStatusChange = (active: boolean, value: any) => {
    let { classify } = this.state;
    
    classify = classify.filter(status => status !== value);
    if (active) {
      classify.push(value);
    }
    this.setState({
      classify: classify
    });
  }

  onHandleFilter = () => {
    const { feature } = this.props;
    if (!feature) {
      return this.close();
    }

    this.applyValue();

    feature.ignoreRevoke = false;
    feature.specific_on_filter && feature.specific_on_filter();
    if (!this.settingFilterAssignment || !this.settingFilterAssignment.content || !this.settingFilterAssignment.content.length) {
      return this.close();
    }
    const settingSortType = this.settingFilterAssignment.content.find(item => item.key === 'sort_type');
    if (!settingSortType || !settingSortType.value) {
      return this.close();
    }
    settingSortType.value = feature.filter && feature.filter.sort_type;
    !feature.specific_filter_loaded_cache && (feature.specific_filter_loaded_cache = true);
    this.updateSetting();
    return this.close();
  }

  applyValue() {
    const { feature } = this.props;
    const { socialPageSelected, supporterSelected, sortType, replyStatus, classify, tagWorkSelected, status } = this.state;
    if (!feature.filter) {
      return;
    }
    // set asingee 
    feature.filter['assignee'] = supporterSelected;

    // set page Social
    if (feature.filter) {
      feature.filter.page_social_ids = cloneDeep(socialPageSelected);
    }

    // sort type
    feature.filter['sort_type'] = sortType;
    // sort type
    feature.filter['status'] = status;

    // reply statys
    feature.filter.reply_status = replyStatus;

    // classify
    feature.filter.classify = classify;

    // tags
    feature.filter['tags'] = tagWorkSelected;
  }

  handleRestoreFilterField = (type: string) => {
    const { feature } = this.props;
    if (!feature || !feature.filter) {
      return;
    }
    if (type === 'social') {
      // feature.filter.page_social_ids = [];
      this.setState({ socialPageSelected: [] });
      this.socialLwRef.Items = cloneDeep(this.socialLwRef.Items);
      return;
    }
    this.setState({ tagWorkSelected: [] });
    // feature.filter.tags = [];
    this.tagWorkLwRef.Items = cloneDeep(this.tagWorkLwRef.Items);
  }

  onOpenSocialTagsHandler = () => {
    const { feature } = this.props;
    const { socialPageSelected } = this.state;
    if (!feature || !feature.filter || !feature.tabOrigin || !feature.tabOrigin.pages) {
      return;
    }
    const selectedPages = feature.tabOrigin.pages.filter(page => {
      return socialPageSelected.find(item => item === page.page_social_id);
    });

    const items = feature.tabOrigin.pages.map((_item: any) => {
      return {
        id: _item.id,
        page_social_id: _item.page_social_id,
        name: _item.name,
        avatar: _item.icon
      };
    });

    const modal: IModal = {
      content: <SocialTagsModal
          fixTags={[]}
          type={'social'}
          selectedTags={selectedPages}
          title={'Trang mạng xã hội'}
          ignoreSelectedTag={true}
          items={items}
          hasRestoreDefault={true}
          searchListContainer={{ marginTop: 20 }}
          onApplyHandler={this.onSocialTagsApplyHandler}
          onRestoreDefault={() => { this.handleRestoreFilterField('social'); }}
        />
    };
    // push modal
    pushModal(modal);
  }

  onSocialTagsApplyHandler = (items: any[]) => {
    const { feature } = this.props;
    if (!items || !feature || !feature.filter) {
      return toast(Languages.ManipulationUnSuccess, 'error');
    }
    const selectedPages = items.map(item => {
      return item.page_social_id;
    });
    //  feature.filter.page_social_ids 
    this.setState({ socialPageSelected: selectedPages});
    this.socialLwRef.Items = cloneDeep(this.socialLwRef.Items);
  }

  onOpenAssignTagsHandler = () => {
    const { tagWorkSelected } = this.state;
    const asignTags = SocialService.convertTags(tagWorkSelected) || [];
    const modal: IModal = {
      content: <SocialTagsModal
                fixTags={[]}
                selectedTags={asignTags}
                type={'assign'}
                title={'Tag phân loại công việc'}
                hasRestoreDefault={true}
                onApplyHandler={this.onAssignTagsApplyHandler}
                onRestoreDefault={() => { this.handleRestoreFilterField('tag'); }}
              />
    }
    pushModal(modal);
  }

  onAssignTagsApplyHandler = (items: any[]) => {
    // const { feature } = this.props;
    // if (!items || !feature || !feature.filter) {
    //   return toast(Languages.ManipulationUnSuccess, 'error');
    // }
    const tags = items.map(tag => {
      return {
        id: tag.id,
        value: tag.name,
        properties: {
          background_color: tag.bgColor,
          foreground_color: tag.color
        }
      };
    });
    this.setState({ tagWorkSelected: tags });
    this.tagWorkLwRef.Items = cloneDeep(this.tagWorkLwRef.Items);
  }

  close = () => {
    this.modalRef.close();
  }

  render() {
    const { feature } = this.props;
    const { socialPageSelected, 
      tagWorkSelected, 
      isMoreSocialSelectedPage, 
      isMoreAssignTagSelectedPage,
      supporterSelected,
      sortType,
      status,
      replyStatus,
      classify
     } = this.state;
    const noneAssignTags = <WrapText st={[Styles.Text_S_R]}>{'Chưa có tag phân loại công việc'}</WrapText>

    return (
      <WrapModal
        ref={(ref) => { this.modalRef = ref;}}
        ignoreKeyboardScroll={true}
        autoOpen={true}
        position={'bottom'}>
        <View style={[Styles.ModalContainer, {height: Constants.Height - Constants.BarHeight - 20}]}>
          <View style={[styles.modalHeader]}>
            <WrapText st={[Styles.Text_L_SB]}>{'Bộ lọc'}</WrapText>
            <ButtonRipple name={'close'} size={13} color={Color.text} onPress={this.onBackPress} />
          </View>
          <ScrollView 
            style={{flexGrow: 1}}
            showsVerticalScrollIndicator={false} 
            contentContainerStyle={{paddingBottom: 15}}>

            <View style={styles.modalItemContainer}>
              <WrapText st={styles.modalItemTitle}>{'Hỗ trợ bởi'}</WrapText>
              <Dropdown
                containerStyle={{marginHorizontal: 16}}
                ref={ref => { this.dropdownSupporterRef = ref; }}
                align={'left'}
                data={feature.tabOrigin.pages && feature.tabOrigin.pages.length && feature.tabOrigin.pages[0].staffs}
                itemVisibleNumber={5}
                height={30}
                width={Constants.Width-32}
                renderBase={this.renderDropdownSupportBase}
                renderItem={this.renderDropdownSupportItem} 
                selectedKey={supporterSelected}
                pickerStyleOverrides={{}}
                dropdownOffset={{ top: 35, left: 16 }}
                onItemSelected={this.onSupporterItemSelect}
              />
            </View>

            <View style={styles.modalItemContainer}>
              <View style={styles.modalItemTitle}>
                <WrapText st={Styles.Text_M_M}>{'Trang mạng xã hội'}</WrapText>
                {
                  socialPageSelected.length > 0 &&
                  <WrapText st={Styles.Text_S_R} c={Color.secondary}>{`Đã chọn ${socialPageSelected.length} trang`}</WrapText>
                }
              </View>
              <ListView
                ref={ref => { this.socialLwRef = ref; }}
                items={feature.tabOrigin.pages.slice(0, Math.min(5, feature.tabOrigin.pages.length))}
                onRenderRow={this.renderSocialPageLwItem}
                wr={Constants.Width}
                hr={40}
                itemVisibleNumber={5}
              />
              <View style={{width: 120}}>
              {
                isMoreSocialSelectedPage &&
                <ButtonRipple
                  isPreventDoubleClick={true}
                  containerStyle={styles.moreView}
                  radius={1}
                  onPress={() => { this.onOpenSocialTagsHandler(); }}>
                  <WrapText st={styles.moreText}>{'Xem thêm'}</WrapText>
                </ButtonRipple>
              }
              </View>
              
            </View>


            <View style={styles.modalItemContainer}>
              <WrapText st={styles.modalItemTitle}>{'Sắp xếp tin nhắn'}</WrapText>
              <Radio ref={ref => { this.sortTypeRdRef = ref; }}
                items={[
                  {
                    id: Constants.SORT.DESC,
                    labelRight: 'Mới nhất đến cũ nhất'
                  },
                  {
                    id: Constants.SORT.ASC,
                    labelRight: 'Cũ nhất đến mới nhất'
                  }
                ]}
                selectedKey={sortType}
                onSelectedChange={this.onHandleSortType}
              />
            </View>

            <View style={styles.modalItemContainer}>
              <WrapText st={styles.modalItemTitle}>{'Trạng thái xử lý'}</WrapText>
              <Radio ref={ref => { this.statusRdRef = ref; }}
                items={[
                  {
                    id: '2',
                    labelRight: 'Đã hoàn tất'
                  },
                  {
                    id: '1',
                    labelRight: 'Chưa hoàn tất'
                  }
                ]}
                selectedKey={status}
                onSelectedChange={this.onHandleChangeStatus}
              />
            </View>

            <View style={styles.modalItemContainer}>
              <WrapText st={styles.modalItemTitle}>{'Trạng thái trả lời'}</WrapText>
              <Checkbox
                ref={ref => { this.answerCbRef = ref; }}
                containerStyle={{ height: 32 }}
                labelRight={'Đã trả lời'}
                active={replyStatus.includes(1) ? true : false}
                value={1}
                onActiveChange={this.onHandleReplyStatusChange} />
              <Checkbox
                ref={ref => { this.notAnswerCbRef = ref; }}
                containerStyle={{ height: 32 }}
                labelRight={'Chưa trả lời'}
                active={replyStatus.includes(0) ? true : false}
                value={0}
                onActiveChange={this.onHandleReplyStatusChange} />
            </View>

            {
              feature.code && feature.code === Constants.SOCIAL.FEATURE_CODE.COMMENT &&
              <View style={styles.modalItemContainer}>
                <WrapText st={styles.modalItemTitle}>{'Trạng thái phản hồi'}</WrapText>
                {
                  defaultClassifyStatus.map(item => {
                    return (
                      <Checkbox
                        ref={ref => { this.answerCbRef = ref; }}
                        containerStyle={{ height: 32 }}
                        labelRight={item.text}
                        active={classify.includes(item.value) ? true : false}
                        value={item.value}
                        onActiveChange={this.onHandleClassifyStatusChange} />
                    );
                  })
                }
              </View>
            }

            <View style={[styles.modalItemContainer, {borderBottomWidth: 0}]}>
              <View style={styles.modalItemTitle}>
                <WrapText st={Styles.Text_M_M}>{'Tag phân loại công việc'}</WrapText>
                {
                  tagWorkSelected.length > 0 &&
                  <WrapText st={Styles.Text_S_R} c={Color.secondary}>{`Đã chọn ${tagWorkSelected.length} tag`}</WrapText>
                }
              </View>
              <ListView
                ref={ref => { this.tagWorkLwRef = ref; }}
                onRenderRow={this.renderTagWorkLwItem}
                wr={Constants.Width}
                hr={40}
                onLoad={this.onLoadDataHandler}
                onLoadMore={this.onLoadMoreDataHandler}
                itemVisibleNumber={5}
                noneItem={noneAssignTags}
              />
              <View style={{width: 120}}>
              {
                isMoreAssignTagSelectedPage &&
                <ButtonRipple
                  isPreventDoubleClick={true}
                  containerStyle={styles.moreView}
                  radius={1}
                  onPress={() => { this.onOpenAssignTagsHandler(); }}>
                  <WrapText st={styles.moreText}>{'Xem thêm'}</WrapText>
                </ButtonRipple>
              }
              </View>
              {/* {
                isMoreAssignTagSelectedPage &&
                <TouchableOpacity
                  onPress={() => { this.onOpenAssignTagsHandler(); }}>
                  <WrapText st={[Styles.Text_M_M, { marginTop: 4 }]} c={Color.primary}>{'Xem thêm'}</WrapText>
                </TouchableOpacity>
              } */}
            </View>
          </ScrollView>

          <View style={[styles.modalBottom, Styles.Shadow]}>
            <WrapButton
              text={'Khôi phục'}
              width={(Constants.Width - 16 * 3) / 2}
              type={'border'}
              active={true}
              containerStyle={{ marginRight: 16 }}
              onPress={this.onHandleDefaultData}
            />
            <WrapButton
              text={'Áp dụng'}
              width={(Constants.Width - 16 * 3) / 2}
              type={'solid'}
              active={true}
              onPress={this.onHandleFilter} />
          </View>
        </View>
      </WrapModal>
    );
  }
}

export default SocialFilterModal;

