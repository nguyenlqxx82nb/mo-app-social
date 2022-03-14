import React from 'react';
import { View, TouchableOpacity, Keyboard, DeviceEventEmitter, Animated, BackHandler, Platform, StatusBar } from 'react-native';
import { WrapText, ButtonRipple, FormInput, ListView, ViewMoreHTML, WrapTextLink } from 'mo-app-comp';
import { Styles, Color, Constants, BaseServiceParam, HOST_SOCIAL, Utils, SocialService } from 'mo-app-common';
import styles from './styles';
const _ = require('lodash');
const cloneDeep = require('clone-deep');

interface IReplyItem {
	content: string;
	display_status: number;
	keywords: string;
	merchant_id: string;
	own_type: 'GENERAL' | 'PRIVATE';
	page_social_id: string;
	personalize: any[];
	priority: number;
	social_type: number;
	staff_id?: string;
	template_reply_groups: {
		background_color: string;
		template_reply_group_id: string;
		template_reply_group_name: string;
	}[];
	template_reply_id: string;
}

interface IQuicklyReplyModalState {
	serviceParam: BaseServiceParam,
	animY: Animated.Value,
	overlayOpacityAnim: Animated.Value,
}

interface IQuicklyReplyModalProps {
	pageSourceId: string;
	onReply: (reply: IReplyItem) => void;
	onClose?: () => void;
}

class QuicklyReplyModal extends React.PureComponent<IQuicklyReplyModalProps, IQuicklyReplyModalState> {

	templates: any[] = [];
	searchValues: any[] = [];
	lvRef: ListView;
	content: ViewMoreHTML;

	constructor(props: IQuicklyReplyModalProps) {
		super(props);
		this.state = {
			serviceParam: undefined,
			animY: new Animated.Value(Constants.Height),
			overlayOpacityAnim: new Animated.Value(0),
		};
	}

	componentDidMount() {
		this.show();
		this.createServiceParam();
		if (Platform.OS === 'android') {
			BackHandler.addEventListener('hardwareBackPress', this.onBackAndroidHandler);
		}
	}

	onBackAndroidHandler = () => {
		setTimeout(() => {
			this.close();
		}, 0);
		return false;
	}

	createServiceParam = async () => {
		const { pageSourceId } = this.props;
		let serviceParam: BaseServiceParam;
		const hostApiPath = await HOST_SOCIAL();
		serviceParam =
		{
			hostApiPath: hostApiPath,
			path: '/template-reply/list-for-page',
			paging: {
				page: 'page',
				per_page: 'per_page',
				search: 'search'
			},
			query: {
				page_social_ids: pageSourceId, // '105263841245993'
			},
			successCode: '001',
			response: {
				dataKey: 'data',
			}
		};
		this.setState({
			serviceParam: serviceParam
		});
	}

	onItemPressHandler = (_item: IReplyItem) => {
		const { onReply } = this.props;
		this.close();
		onReply && onReply(_item);
	}

	renderRowItem = (_type: any, item: IReplyItem, index: number) => {
		this.content && this.content.setState({textMore: true, shouldShowMore: false});
		const hasKeywords = item.keywords ? true : false;
		const keywords = '/' + `${item.keywords}`;
		return (
			<TouchableOpacity onPress={() => { this.onItemPressHandler(item); }}>
				<View style={[{ marginHorizontal: 16, marginBottom: 25, width: Constants.Width - 32 }]}>
					<View style={{marginLeft: 20}}>
						{
							item.template_reply_groups.length > 0 &&
							<View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
								{
									item.template_reply_groups.map(({ background_color, template_reply_group_id, template_reply_group_name }, _index: number) => {
										return (
											<View style={{ backgroundColor: background_color, paddingVertical: 5, paddingHorizontal: 12, marginRight: 5, borderRadius: 12, marginBottom: 5 }}>
												<WrapText st={[Styles.Text_S_R]} c={'#fff'}>{template_reply_group_name}</WrapText>
											</View>
										);
									})
								}
							</View>
						}
						{
							hasKeywords &&
							<WrapTextLink
								searchWords={this.searchValues}
								highlightStyle={{ color: '#009cdb' }}
								styles={[Styles.Text_S_R, { color: Color.textSecondary, marginTop: 0, marginBottom: 0 }]}>{keywords}
							</WrapTextLink>
						}
					</View>
					<View style={[Styles.RowOnly]}>
						<WrapText st={[Styles.Text_S_R, {width: 20}]}>{`${index + 1}.`}</WrapText>
						<View style={{ flex: 1 }}>
							<ViewMoreHTML
								ref={(comp: any) => {this.content = comp;}}
								searchWords={this.searchValues}
								highlightStyle={{ color: Color.background, backgroundColor: Color.text }}
								text={item.content}
								textStyle={[Styles.Text_S_R]}
								textMoreStyle={[Styles.Text_M_R, {color: Color.primary, marginBottom: 10, marginTop: 5}]}
								minHeight={47}
								minNumberLines={3} />
						</View>
					</View>

				</View>
			</TouchableOpacity>
		);
	}

	onClosePressHandler = () => {
		this.close();
	}

	close = () => {
		const { onClose } = this.props;
		const { animY, overlayOpacityAnim } = this.state;
		Keyboard.dismiss();
		onClose && onClose();
		Animated.timing(overlayOpacityAnim, {
			toValue: 0,
			duration: 250,
			useNativeDriver: true,
		}).start(_finish => { });

		Animated.timing(animY, {
			toValue: Constants.Height,
			duration: 150,
			useNativeDriver: true,
		}).start(_finish => {
			setTimeout(() => {
				Constants.ModalShowing = false;
				DeviceEventEmitter.emit(Constants.EmitCode.PopModal);
			}, 50);
		});
	}

	show = () => {
		const { animY, overlayOpacityAnim } = this.state;
		Animated.timing(overlayOpacityAnim, {
			toValue: 1,
			duration: 250,
			useNativeDriver: true,
		}).start(_finish => { });

		Animated.timing(animY, {
			toValue: 0,
			duration: 250,
			useNativeDriver: true,
		}).start(_finish => { });
	}

	private checkExistValue(value: string, keySearch: string) {
		if (Utils.convertCitationVietnameseUnsigned(value).toLocaleLowerCase().includes(Utils.convertCitationVietnameseUnsigned(keySearch).toLocaleLowerCase())) {
			return true;
		}
		return false;
	}

	private searchKey = (items: Array<any>, keySearch: string, keyField: string) => {
		let resultSearch = [];
		if (!items) {
			return resultSearch;
		}
		if (!keyField || !keySearch) {
			resultSearch = items;
		} else {
			resultSearch = items.filter(item => {
				const value: string = item[keyField];
				if (value && this.checkExistValue(value, keySearch)) {
					return item;
				}
			});
		}
		return resultSearch;
	}

	handleLoadData = async (page: number, per_page: number, onLoadDataCompleted: any) => {
		const { pageSourceId } = this.props;
		const resultTemplates = await SocialService.getTemplatesInPage('', pageSourceId);
		if (!resultTemplates || resultTemplates.code !== '001' || !resultTemplates.data || !resultTemplates.data.length) {
			return onLoadDataCompleted([], null, false);
		}
		const listTemplate = resultTemplates.data.filter(temp => temp.display_status === 1);
		const privateTemplates = listTemplate.filter(item => item.own_type === 'PRIVATE');
		const generalTemplates = listTemplate.filter(item => item.own_type === 'GENERAL');
		this.templates = [...privateTemplates, ...generalTemplates];
		if (resultTemplates.general_template_reply_status !== 1) {
			this.templates = resultTemplates.data.filter(temp => temp.own_type !== 'GENERAL');
		}
		return onLoadDataCompleted(this.templates, null, false);
	}

	onSearchHandler = (searchValue: string) => {
		Keyboard.dismiss();
		this.lvRef.Items = [];
		if (!this.templates || !this.templates.length) {
			return;
		}
		this.searchValues = [searchValue];
		const cloneTemplates = cloneDeep(this.templates);
		const searchKeys = this.searchKey(cloneTemplates, searchValue, 'keywords');
		const searchGroups = cloneTemplates.filter(temp => temp.template_reply_groups.length && temp.template_reply_groups.find(group => Utils.convertCitationVietnameseUnsigned(group.template_reply_group_name).toLocaleLowerCase().includes(Utils.convertCitationVietnameseUnsigned(searchValue).toLocaleLowerCase())));
		const searchContents = this.searchKey(cloneTemplates, searchValue, 'content');
		const dataSearchs = _.uniqBy([...searchKeys, ...searchGroups, ...searchContents], (e) => {
			return e.template_reply_id;
		});
		this.lvRef.Items = dataSearchs;
	}

	render() {
		const { serviceParam, animY, overlayOpacityAnim } = this.state;
		const hasService = serviceParam ? true : false;
		const transformContentStyle = {
			transform: [{
				translateY: animY,
			}]
		};
		return (
			<View style={[styles.container]}>
				<Animated.View style={[styles.overlay, { opacity: overlayOpacityAnim }]} />
				<Animated.View style={[styles.contentContainer, transformContentStyle]}>
					<View style={[Styles.RowCenter, Styles.JustifyBetween, { paddingLeft: 16, marginTop: 12, paddingRight: 10 }]}>
						<WrapText st={[Styles.Text_L_M]}>{'Câu trả lời nhanh'}</WrapText>
						<ButtonRipple name={'close'} size={14} color={Color.text}
								onPress={this.onClosePressHandler} />
					</View>
					<View style={{ flexGrow: 1 }}>
						<View style={{ marginHorizontal: 16, marginTop: 10, marginBottom: 10 }}>
							<FormInput
								icon={'search'}
								placeholder={'Tìm theo từ khoá, tên nhóm, nội dung câu…'}
								autoValidate={false}
								validRequire={false}
								hasClear={true}
								onSubmit={this.onSearchHandler}
								onClearValue={() => { this.onSearchHandler(''); }}
								containerStyle={{ marginBottom: 0, }}
								enable={true}
							/>
						</View>

						<View style={{ flex: 1, flexGrow: 1 }}>
							{
								hasService &&
								// <FlatList
								// 	ref={(comp: any) => { this.lvRef = comp; }}
								// 	renderItem={({item}) => this.renderRowItem}
								// 	/>

								<ListView
									ref={(comp: any) => { this.lvRef = comp; }}
									onLoad={this.handleLoadData}
									onRenderRow={this.renderRowItem}
									hasExtendedState={true}
									wr={Constants.Width}
									autoH={true}
									hr={120}
									top={0}
									pageSize={25}
									autoLoad={true}
									icon={'work_done'}
									containerStyle={{ marginHorizontal: 0, paddingHorizontal: 0 }}
								/>
							}
						</View>
					</View>
				</Animated.View>
				<StatusBar
          backgroundColor="transparent"
          barStyle={'light-content'}
          />
			</View>
		);
	}
}

export default QuicklyReplyModal;
