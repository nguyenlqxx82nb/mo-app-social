import React from 'react';
import { View, StyleSheet, TouchableOpacity, Keyboard } from 'react-native';
import { ListView, Dropdown, WrapText, FormInput, AsyncImage, WrapModal, ButtonRipple, WrapButton } from 'mo-app-comp';
import { Color, Constants, Styles, CustomIcon, BaseServiceParam, BaseServiceMethod, Device, toast, SocialService, HOST_SOCIAL, } from 'mo-app-common';
import { IFeatureAssign } from 'api';
import Languages from 'mo-app-common/src/Common/Languages';
import { getStatusBarHeight } from 'react-native-status-bar-height';

export interface ISocialSearchProps {
	feature: IFeatureAssign;
	onClose: () => void;
}

interface ISocialSearchState {
	serviceParamsProfile: BaseServiceParam;
	isSearchProfile: boolean;
	avatarDefault: string;
	keyBoardHeight: number;
}

interface ISearchType {
	id: string;
	label: string;
	field: string;
}

export default class SocialSearch extends React.PureComponent<ISocialSearchProps, ISocialSearchState> {

	modalRef: WrapModal;
	private queryProfileSearch: any;
	private listViewUsersProfileRef: ListView;
	private searchInputRef: FormInput;
	private currentSearchType: ISearchType;
	private subKeyboardWillShow: any;
	private subKeyboardWillHideListener: any;

	constructor(props: any) {
		super(props);
		this.state = {
			serviceParamsProfile: undefined,
			isSearchProfile: true,
			avatarDefault: '',
			keyBoardHeight: 0
		};
		this.queryProfileSearch = {
			after_token: '',
			page_social_id: '',
			social_type: 0,
			object_type: props.feature.specific_object_type,
			search_text: props.feature && props.feature.specific_filter_search_value || '',
			staff_id: props.feature && props.feature.filter && props.feature.filter.assignee || '',
		};
		if (props.feature && props.feature.tabOrigin && props.feature.tabOrigin.pages) {
			this.queryProfileSearch.page_social_id = props.feature.tabOrigin.pages.map(item => item.page_social_id).join(',');
			this.queryProfileSearch.social_type = props.feature.tabOrigin.social_type;
		}
		this.initParamsProfile();
		this.initAvatarDefault();
	}

	componentDidMount() {
		this.subKeyboardWillShow = Keyboard.addListener('keyboardDidShow', this.handleKeyboardDidShow);
		this.subKeyboardWillHideListener = Keyboard.addListener('keyboardDidHide', this.handleKeyboardDidlHide);
	}

	componentWillUnmount() {
		this.subKeyboardWillShow.remove();
		this.subKeyboardWillHideListener.remove();
	}

	initAvatarDefault = async () => {
		this.setState({ avatarDefault: await SocialService.getDefaultAvatar() });
	}

	private handleKeyboardDidShow = (e) => {
		this.setState({ keyBoardHeight: e.endCoordinates.height - (Device.isIphoneX ? 20 + 30 : 20) });
	}

	private handleKeyboardDidlHide = () => {
		this.setState({ keyBoardHeight: 0 });
	}

	closeModal = () => {
		const { onClose } = this.props;
		this.modalRef && this.modalRef.close();
		onClose && onClose();
	}

	defaultSearch = () => {
		return [
			{
				id: 'profile',
				label: 'Tên Profile',
				field: 'message'
			},
			{
				id: 'content',
				label: 'Nội dung',
				field: 'user_social_ids'
			}
		];
	}

	initParamsProfile = async () => {
		const { feature } = this.props;
		this.currentSearchType = this.defaultSearch()[0];
		if (feature && feature.specific_filter_search_type === 'content') {
			this.currentSearchType = this.defaultSearch()[1];
			this.setState({ isSearchProfile: false });
		}
		this.setState({
			serviceParamsProfile: {
				hostApiPath: await HOST_SOCIAL(),
				path: `socials/${feature.tabOrigin && feature.tabOrigin.social_type || ''}/profile/search`,
				paging: {
					page: 'page',
					per_page: 'per_page',
					search: 'search_text',
					afterToken: 'after_token'
				},
				method: BaseServiceMethod.GET,
				query: this.queryProfileSearch,
				successCode: '001',
				response: {
					dataKey: 'data',
				}
			},
		});
	}

	clearSearchFilter = (feature: IFeatureAssign) => {
		const searchTypes = this.defaultSearch();
		searchTypes.forEach(type => {
			feature.filter[type.field] && delete feature.filter[type.field];
		});
	}

	renderDropdownSearchBase = (item: any) => {
		return (
			<View style={[Styles.Row, Styles.Border, Styles.JustifyCenter, Styles.AlignCenter, { height: 34, paddingHorizontal: 10 }]}>
				<WrapText st={[Styles.Text_S_M, { marginRight: 10 }]}>{item ? item.label : ''}</WrapText>
				<CustomIcon size={10} name={'drop_down'} color={Color.text} />
			</View>
		);
	}

	renderDropdownSearchItem = (item: any, selectedKey: any) => {
		return (
			<View style={[Styles.Row, Styles.JustifyBetween, Styles.AlignCenter, { height: 28 }]} key={`key_${item.id}`}>
				<WrapText st={[Styles.Text_S_R, { marginLeft: 5, marginRight: 5 }]} c={Color.text}>{item.label}</WrapText>
				{ selectedKey === item.id && <CustomIcon name={'mark_selected'} size={10} color={Color.text} />}
			</View>
		);
	}

	onSearchTypePressHandler = (item: ISearchType) => {
		const { feature } = this.props;
		if (!feature || !feature.filter) {
			return;
		}
		this.currentSearchType = item;
		this.searchInputRef && this.searchInputRef.setValue('');
		this.setState({ isSearchProfile: item.id === 'content' ? false : true });
	}

	handleSearchChangeText = (searchValue: string) => {
		if (this.currentSearchType && this.currentSearchType.id === 'profile') {
			this.queryProfileSearch.search_text = searchValue.trim();
			this.listViewUsersProfileRef && this.listViewUsersProfileRef.setState({ loading: false, refreshing: false, reload: false }, () => {
				this.listViewUsersProfileRef.performSearch(this.queryProfileSearch.search_text, false);
			});
			return;
		}
	}

	onClosePressHandler = () => {
		this.closeModal();
	}

	handleSearchContentPress = () => {
		if (this.currentSearchType && this.currentSearchType.id === 'profile') {
			return toast(Languages.ManipulationUnSuccess, Constants.TOAST_TYPE.ERROR);
		}
		if (!this.searchInputRef || !this.searchInputRef.getValue()) {
			return toast('Vui lòng nhập nội dung tìm kiếm', Constants.TOAST_TYPE.ERROR);
		}
		const searchValue = this.searchInputRef.getValue();
		const { feature } = this.props;
		feature.specific_filter_search_type = 'content';
		feature.specific_filter_search_value = searchValue.trim();
		this.clearSearchFilter(feature);
		feature.filter && (feature.filter.message = feature.specific_filter_search_value);
		feature.specific_on_filter && feature.specific_on_filter();
		this.closeModal();
	}

	handleSearchProfilePress = (profile: any) => {
		const { feature } = this.props;
		this.searchInputRef && this.searchInputRef.setValue(profile.name);
		if (!feature || !feature.filter) {
			return;
		}
		feature.specific_filter_search_type = 'profile';
		feature.specific_filter_search_value = profile.social_name;
		this.clearSearchFilter(feature);
		this.closeModal();
		feature.filter.user_social_ids = profile.user_social_id;
		feature.specific_on_filter && feature.specific_on_filter();
	}

	renderProfile = (type: any, item: any, index: number, lastIndex: boolean) => {
		const { feature } = this.props;
		const { avatarDefault } = this.state;
		if (!feature.tabOrigin) {
			return null;
		}
		const handleProfileError = () => {
			item.avatar = avatarDefault;
		};
		const pages = feature.tabOrigin.pages;
		const currentPage = pages.find(page => { return page.page_social_id === item.page_social_id; });

		return (
			<ButtonRipple
				radius={1}
				color={Color.text}
				onPress={() => { this.handleSearchProfilePress(item); }}>
				<View style={[ { marginTop: index !== 0 ? 6 : 0, width: Constants.Width }]}>
					<View style={[Styles.RowOnly, Styles.AlignCenter]}>
						<AsyncImage source={{ uri: item.avatar || avatarDefault }} onError={handleProfileError} iconDefault={avatarDefault} width={22} height={22} radius={11} />
						<WrapText styles={[Styles.Text_S_R, { marginLeft: 6, maxWidth: 280 }]}>{item.social_name}</WrapText>
					</View>
					<View style={[!lastIndex ? Styles.Divider : {}, Styles.RowOnly, Styles.AlignCenter, { marginTop: 6, marginLeft: 30, paddingBottom: !lastIndex ? 10 : 0 }]}>
						<AsyncImage source={{ uri: currentPage && currentPage.icon || avatarDefault }} width={22} height={22} radius={11} />
						<WrapText styles={[Styles.Text_T_R, { marginLeft: 6, maxWidth: 280 }]}>{currentPage && currentPage.name || '-'}</WrapText>
					</View>
				</View>
			</ButtonRipple>
		);
	}

	render() {
		const { serviceParamsProfile, isSearchProfile, keyBoardHeight } = this.state;
		const { feature } = this.props;
		return (
			<WrapModal
				ref={(comp: any) => { this.modalRef = comp; }}
				autoOpen={true}
				overlayOpacity={0.65}
				zIndexContent={0}
				ignoreKeyboardScroll={true}
				position={'bottom'}>
				<View style={[styles.container, { flex: 1, height: Constants.Height - (getStatusBarHeight() + 20) }]}>
					<View style={{ flex: 1 }}>
						<View style={[Styles.RowCenter, Styles.JustifyBetween]}>
							<WrapText st={[Styles.Text_L_M]}>{'Tìm kiếm'}</WrapText>
							<ButtonRipple name={'close'} size={14} color={Color.text}
									onPress={this.onClosePressHandler} />
						</View>
						<View style={{ flex: 1 }}>
							<View style={[{ marginVertical: 20, alignItems: 'flex-start', height: 34 }]}>
								<View style={[Styles.RowOnly, { flex: 1 }]}>
									<View style={{ width: 120, marginRight: 6 }}>
										<Dropdown
											containerStyle={{ width: 120 }}
											align={'right'}
											width={120}
											height={30}
											renderBase={this.renderDropdownSearchBase}
											renderItem={this.renderDropdownSearchItem}
											selectedKey={feature.specific_filter_search_type || 'profile'}
											dropdownOffset={{ top: 40, left: 0 }}
											onItemSelected={this.onSearchTypePressHandler}
											data={this.defaultSearch()}
										/>
									</View>
									<View style={{ flex: 1 }}>
										<FormInput
											ref={(comp: any) => { this.searchInputRef = comp; }}
											icon={'search'}
											placeholder={'Tìm kiếm'}
											autoValidate={false}
											validRequire={false}
											text={feature.specific_filter_search_value || ''}
											onChangeText={this.handleSearchChangeText}
											onClearValue={() => { this.handleSearchChangeText(''); }} />
									</View>
								</View>
							</View>
							{
								serviceParamsProfile && isSearchProfile &&
								<View style={{ flex: 1, flexGrow: 1 }}>
									<ListView
										ref={(comp: any) => { this.listViewUsersProfileRef = comp; }}
										hasCheckAll={false}
										onRenderRow={this.renderProfile}
										hasExtendedState={true}
										wr={Constants.Width}
										hr={70}
										// autoH={true}
										top={0}
										bottom={20}
										pageSize={10}
										autoLoad={true}
										serviceParams={serviceParamsProfile}
										icon={'work_done'}
										containerStyle={{ marginHorizontal: 0, paddingHorizontal: 0 }}
										loadAllMessage={'Đã xem hết'}
										noneItemsMsg={'Không có kết quả phù hợp'}
										currSearch={this.queryProfileSearch && this.queryProfileSearch.search_text || ''}
									/>
									{
										!!keyBoardHeight && <View style={{ height: keyBoardHeight }} />
									}
								</View>
							}
							{
								!isSearchProfile &&
								<View style={[Styles.RowCenter, Styles.CenterItem,
								{ width: '100%', bottom: 34, position: 'absolute' }]}>
									<WrapButton
										text={'Tìm kiếm'}
										width={210}
										size={'m'}
										onPress={this.handleSearchContentPress}
									/>
								</View>
							}
						</View>
					</View>
				</View>
			</WrapModal>
		);
	}
}

const styles = StyleSheet.create({
	container: {
		backgroundColor: '#fff',
		width: '100%',
		borderTopLeftRadius: 20,
		borderTopRightRadius: 20,
		paddingTop: 20,
		paddingBottom: Device.isIphoneX ? 20 + 30 : 20,
		paddingHorizontal: 16,
	},
});

