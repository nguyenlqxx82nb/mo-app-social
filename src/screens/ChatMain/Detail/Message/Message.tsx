import React, { PureComponent } from 'react';
import { BackHandler, Platform, TouchableOpacity, View } from 'react-native';
import { Styles, Color, Constants, SocialService, CustomIcon, changeHeaderHeight, changeToastBottomHeight } from 'mo-app-common';
import { WrapText, Router, ListView, FormInput, ScreenType } from 'mo-app-comp';
import { IAssignmentItem, IAssignmentItemConversationItem, IFeatureAssign } from '../../../../api';
import moment from 'moment';
import { SocialConstants, SocialUtils } from '../../../../common';
import { uid } from 'uid';
import { SocialShareHeaderScreen, SocialShareKeyboardScreen } from '../../../Share';
import SocialMessageInput from '../Input/SocialInputMessage';
import SocialChatRowItem from './item/ChatRowItem';
import { IAttachment } from '../Input/PickerModal';
import SocialMessageTagScreen from '../../../MessageTag';

interface IChatSocialDetailProps {
	assignment: IAssignmentItem;
	feature: IFeatureAssign;
	screenType: ScreenType;
	commentSocialId?: string;
	notificationData?: any;
	ignoreRevoke?: boolean;
	detectChanges?: (assignment: IAssignmentItem) => void;
}

interface IChatSocialDetailState {
	hasBadge: boolean;
	hasMessageTag: boolean;
	hasSearch: boolean;
	visitorStatus: string;
	specific_total_search?: number;
	specific_index_search?: number;
	specific_loading_content?: boolean;
	headerHeight?: number;
	avatarDefault?: string;
	userAvatar?: string;
	userName?: string;
	avatarForPage?: string;
	disableResolveButton?: boolean;
	isDisplayMessageTag: boolean;
}

export class ChatSocialDetailScreen extends PureComponent<IChatSocialDetailProps, IChatSocialDetailState> {
	private currentOffsetY: number;
	private listViewComponentRef: ListView;
	private socialInputMessage: SocialMessageInput;
	private notificationData: any;
	private isLoadMoreBefore: boolean = false;
	private header: SocialShareHeaderScreen;
	private commentSocialId: string = '';

	constructor(props: any) {
		super(props);
		this.state = {
			hasBadge: false,
			hasMessageTag: false,
			hasSearch: false,
			visitorStatus: props.assignment && props.assignment.specific_status_online || SocialConstants.KEY_CHECK_WEB_LIVE_CHAT_USER_OFFLINE,
			specific_index_search: 0,
			specific_total_search: 0,
			headerHeight: 79,
			avatarDefault: '',
			userAvatar: props.assignment && props.assignment.specific_avatar || '',
			userName: props.assignment && props.assignment.specific_username || '',
			avatarForPage: props.assignment && props.assignment.specific_page_container && props.assignment?.specific_page_container?.icon || '',
			disableResolveButton: false,
			isDisplayMessageTag: false,
		};
		this.currentOffsetY = 0;
		this.notificationData = props.notificationData;
		props.commentSocialId && (this.commentSocialId = props.commentSocialId);
	}

	componentDidMount() {
		const { notificationData, ignoreRevoke } = this.props;
		notificationData && this.header && this.header.updateData(notificationData);
		ignoreRevoke && this.header && this.header.setIgnoreRevoke(ignoreRevoke);
		changeToastBottomHeight(100);
		changeHeaderHeight(79);
		this.initDisplayMessageTag();
		if (Platform.OS === 'android') {
			BackHandler.addEventListener('hardwareBackPress', this.androidBack);
		}
	}

	componentWillUnmount() {
		changeToastBottomHeight(50);
		if (Platform.OS === 'android') {
			BackHandler.removeEventListener('hardwareBackPress', this.androidBack);
		}
	}

	UNSAFE_componentWillReceiveProps(nextProps) {
		if (this.commentSocialId !== nextProps.commentSocialId) {
			this.commentSocialId = nextProps.commentSocialId;
		}
		if (this.notificationData !== nextProps.notificationData) {
			this.notificationData = nextProps.notificationData;
			this.setState({ hasSearch: false });
			this.header && this.header.setIgnoreRevoke(nextProps.ignoreRevoke || false);
			this.header && this.header.updateData(nextProps.notificationData);
		}
	}

	private androidBack = () => {
		if (this.socialInputMessage && this.socialInputMessage.getDisplayQuickReplyStatus()) {
			return false;
		}
		this.header && this.header.handleBack(true);
		return false;
	}


	private onLoadDataHandler = (page: number, per_page: number, onLoadDataCompleted: any) => {
		const { assignment } = this.props;
		const { hasSearch } = this.state;

		if (!hasSearch && assignment.specific_conversations && assignment.specific_conversations.length) {
			return onLoadDataCompleted(assignment.specific_conversations, null, false);
		}
		if (!hasSearch) {
			return this.loadData(onLoadDataCompleted);
		}
		this.searchMessageOfConversation(onLoadDataCompleted);
	}

	private deletePropertySpecificQuery() {
		const { assignment } = this.props;
		if (!assignment) {
			return;
		}
		delete assignment.specific_query.search;
		delete assignment.specific_query.search_index;
		delete assignment.specific_query.after_token;
		delete assignment.specific_query.before_token;
	}

	private onLoadMoreDataHandler = async (page: number, per_page: number, onLoadMoreDataCompleted: any, _lastCursor: any) => {
		const { assignment } = this.props;
		const { hasSearch } = this.state;
		if (!assignment) {
			return this.isLoadMoreBefore = false;
		}
		if (hasSearch && this.isLoadMoreBefore) {
			this.isLoadMoreBefore = false;
			return this.searchMessageOfConversation(onLoadMoreDataCompleted);
		}
		if (hasSearch) {
			this.deletePropertySpecificQuery();
			assignment.specific_query.after_token = assignment.specific_after_token_search;
			this.isLoadMoreBefore = false;
			return this.searchMessageOfConversation(onLoadMoreDataCompleted);
		}
		this.isLoadMoreBefore = false;
		this.loadData(onLoadMoreDataCompleted);

	}

	private searchMessageOfConversation = (handlerLoadDataCompleted: Function) => {
		const { assignment } = this.props;
		if (!assignment) {
			return this.listViewComponentRef && this.listViewComponentRef.setState({ loading: false });
		}
		if (!assignment.specific_query) {
			assignment.specific_query = { per_page: 25, after_token: undefined, before_token: undefined };
		}
		if (assignment.specific_query.after_token === 'None' || assignment.specific_query.before_token === 'None' || assignment.specific_loading_content) {
			return this.listViewComponentRef && this.listViewComponentRef.setState({ loading: false });
		}
		assignment.specific_loading_content = true;
		const socialPage = assignment.specific_page_container;
		SocialService.searchMessageOfConversations(socialPage.social_type, socialPage.id, assignment.social.id, assignment.specific_query).then(result => {
			this.listViewComponentRef && this.listViewComponentRef.setState({ loading: false });
			assignment.specific_loading_content = false;
			if (!result || !result.data) {
				return handlerLoadDataCompleted([], null, true, true);
			}
			const resultValue: any = result;
			const afterToken = assignment.specific_query.after_token;
			const beforeToken = assignment.specific_query.before_token;
			if (afterToken === undefined && beforeToken === undefined) {
				assignment.specific_before_token_search = resultValue.paging.before;
				assignment.specific_after_token_search = resultValue.paging.after;
				this.setState({ specific_total_search: resultValue.total_result, specific_index_search: resultValue.search_index });
				assignment.specific_conversations = resultValue.data;
				SocialService.processMessageConversation(undefined, assignment.specific_conversations, socialPage);
				handlerLoadDataCompleted([], null, false);
				this.listViewComponentRef && (this.listViewComponentRef.Items = assignment.specific_conversations);
				for (let index = 0; index < assignment.specific_conversations.length; index++) {
					if (assignment.specific_conversations[index].is_match !== 0) {
						setTimeout(() => {
							this.listViewComponentRef && this.listViewComponentRef.scrollToItemOrIndex(undefined, index);
						}, 250);
						return;
					}
				}
				return;
			}
			const newConversation = resultValue.data;
			let indexPush = 0;
			if (afterToken) { // trường hợp đang cuộn xuống để load trang
				indexPush = assignment.specific_conversations.length;
				assignment.specific_after_token_search = resultValue.paging.after;
				SocialService.processMessageConversation(assignment.specific_conversations, newConversation, socialPage);
				assignment.specific_conversations.splice(indexPush, 0, ...newConversation);
				handlerLoadDataCompleted([], null, false);
				return this.listViewComponentRef && (this.listViewComponentRef.Items = assignment.specific_conversations);
			} // trường hợp đang cuộn lên để load trang
			assignment.specific_before_token_search = resultValue.paging.before;
			assignment.specific_conversations.splice(indexPush, 0, ...newConversation);
			SocialService.processMessageConversation([], assignment.specific_conversations, socialPage);
			handlerLoadDataCompleted([], null, false);
			this.listViewComponentRef && (this.listViewComponentRef.Items = assignment.specific_conversations);
			this.listViewComponentRef && this.listViewComponentRef.scrollToItemOrIndex(undefined, newConversation.length);
		}, () => {
			handlerLoadDataCompleted([], null, true, false);
			this.listViewComponentRef && this.listViewComponentRef.setState({ loading: false });
			assignment.specific_loading_content = false;
		});
	}

	private loadData = (handlerLoadDataCompleted: Function) => {
		return new Promise<void>(resolve => {
			const { assignment } = this.props;
			if (!assignment || !assignment.specific_page_container) {
				handlerLoadDataCompleted([], null, true, false);
				this.listViewComponentRef && (this.listViewComponentRef.Items = assignment.specific_conversations);
				return resolve();
			}
			if (!assignment.specific_query) {
				assignment.specific_query = { per_page: 25 };
			}

			const pageSocial = assignment.specific_page_container;
			if (assignment.specific_query.before_token === 'None' || assignment.specific_loading_content) {
				SocialService.processMessageConversation(undefined, assignment.specific_conversations, pageSocial);
				handlerLoadDataCompleted([], null, false, true);
				this.listViewComponentRef && (this.listViewComponentRef.Items = assignment.specific_conversations);
				// console.log('loadData 2');
				return resolve();
			}
			assignment.specific_loading_content = true;
			SocialService.getMessageOfConversations(pageSocial.social_type, pageSocial.page_social_id, assignment.social.id, assignment.specific_query).then(result => {
				// console.log('getMessageOfConversations', result);
				assignment.specific_loading_content = false;
				if (!result || !result.data) {
					handlerLoadDataCompleted([], null, false, true);
					this.listViewComponentRef && (this.listViewComponentRef.Items = assignment.specific_conversations);
					return resolve();
				}
				const tokenLoading = assignment.specific_query.before_token;
				if (result.paging) {
					assignment.specific_query.before_token = result.paging.before_token;
				}
				if (tokenLoading === undefined) {
					assignment.specific_conversations = result.data.reverse();
					SocialService.processMessageConversation(undefined, assignment.specific_conversations, pageSocial);
					handlerLoadDataCompleted([], null, false);
					this.listViewComponentRef && (this.listViewComponentRef.Items = assignment.specific_conversations);
					return resolve();
				}
				const newConversation = result.data.reverse();
				SocialService.processMessageConversation(assignment.specific_conversations, newConversation, pageSocial);
				assignment.specific_conversations.push(...newConversation);
				handlerLoadDataCompleted([], null, false);
				this.listViewComponentRef && (this.listViewComponentRef.Items = assignment.specific_conversations);
				return resolve();
			}, () => {
				assignment.specific_loading_content = false;
				handlerLoadDataCompleted([], null, true, true);
				this.listViewComponentRef && (this.listViewComponentRef.Items = assignment.specific_conversations);
				return resolve();
			});
		});
	}



	private renderRowItem = (_type: any, item: IAssignmentItemConversationItem, _index: number) => {
		const { assignment } = this.props;
		const { hasSearch } = this.state;
		return (
			<SocialChatRowItem
				key={`key_${item.id}`}
				conversation={item}
				assignment={assignment}
				keySearch={assignment.specific_key_search}
				listViewRef={this.listViewComponentRef}
				resendMessage={this.handleResendMessage}
				hasSearch={hasSearch}
			/>
		);
	}

	private onSendMessageHandler = (message?: string, attachments?: IAttachment[]) => {
		const { assignment, feature } = this.props;
		if (!this.listViewComponentRef || !assignment || !assignment.specific_page_container) {
			return;
		}
		message && SocialUtils.sendMessage(feature, assignment, message, this.commentSocialId);
		SocialUtils.sendAttachment(feature, assignment, attachments, this.commentSocialId);
		this.commentSocialId = '';
	}

	private handleResendMessage = (newMessage: IAssignmentItemConversationItem) => {
		const { assignment, feature } = this.props;
		if (!assignment || !newMessage || !assignment.specific_conversations) {
			return;
		}
		assignment.specific_conversations = assignment.specific_conversations.filter(item => item.specific_detect_message_id !== newMessage.specific_detect_message_id);
		const detectId = uid(32);
		newMessage.specific_detect_message_id = detectId;
		newMessage.specific_status_message = Constants.SOCIAL.STATE_SEND_DATA_TO_SERVER.MESSAGE_SENDING;
		assignment.specific_detect_message_id = detectId;
		SocialUtils.handleSendMessage(feature, assignment, newMessage, undefined, this.commentSocialId);
		this.commentSocialId = '';
	}

	private initDisplayMessageTag = () => {
		const { assignment, feature } = this.props;
		this.setState({ isDisplayMessageTag: false });
		if (!assignment || !feature || !feature.tabOrigin || feature.tabOrigin.social_type !== Constants.SOCIAL.TYPE.FACEBOOK) {
			return this.setState({ hasMessageTag: false });
		}
		if (feature.tabOrigin && feature.tabOrigin.social_type === Constants.SOCIAL.TYPE.FACEBOOK) {
			this.setState({ isDisplayMessageTag: true });
		}
		if (!assignment.lastest_user_interacted_time || moment().unix() - moment(assignment.lastest_user_interacted_time).unix() > 24 * 60 * 60) {
			return this.setState({ hasMessageTag: true });
		}
		return this.setState({ hasMessageTag: false });
	}

	private handleSendMessageTag = (messageTag: any) => {
		const { assignment, feature } = this.props;
		const newMessage = SocialUtils.buildMessage(assignment, messageTag.value, 'MESSAGE');
		newMessage.specific_message_tag = messageTag.name;
		console.log('commentSocialId', this.commentSocialId);
		SocialUtils.handleSendMessage(feature, assignment, newMessage, undefined, this.commentSocialId);
		this.commentSocialId = '';
	}

	private onScrollToBottom = () => {
		const { assignment } = this.props;
		const { hasSearch } = this.state;
		if (!hasSearch) {
			this.listViewComponentRef && this.listViewComponentRef.scrollTop(0);
			return;
		}
		this.setState({ hasSearch: false, specific_total_search: 0, specific_index_search: 0 });
		assignment.specific_query = undefined;
		assignment.specific_conversations = undefined;
		assignment.specific_key_search = '';
		this.listViewComponentRef && this.listViewComponentRef.setState({ loaded: false, showScrollBottom: false }, () => {
			setTimeout(() => {
				this.listViewComponentRef && this.listViewComponentRef.fetchData();
			}, 150);
		});
	}

	private onListBottomEndReached = () => {
		const { assignment } = this.props;
		const { hasSearch } = this.state;
		if (!hasSearch || !assignment) {
			return;
		}
		this.deletePropertySpecificQuery();
		assignment.specific_query.before_token = assignment.specific_before_token_search;
		this.isLoadMoreBefore = true;
		this.listViewComponentRef && this.listViewComponentRef.fetchMoreData();
	}

	private onMessageTagPressHandler = () => {
		Router.push(<SocialMessageTagScreen onSendMessageTag={this.handleSendMessageTag} />);
	}

	private refreshData = () => {
		const { assignment } = this.props;
		assignment.specific_query = undefined;
		assignment.specific_conversations = undefined;
		assignment.specific_loading_content = false;
		this.listViewComponentRef && this.listViewComponentRef.refreshData();
	}

	private closeSearch = () => {
		const { assignment } = this.props;
		assignment.specific_key_search = '';
		this.setState({ hasSearch: false, specific_total_search: 0, specific_index_search: 0 }, () => {
			this.refreshData();
		});
	}

	private resetSearch = (item: IAssignmentItem, resetCount: boolean, resetToken: boolean, resetSearch: boolean) => {
		if (!item) {
			return;
		}
		if (item.specific_key_search) {
			item.specific_conversations.length = 0;
			item.specific_query = undefined;
		}
		if (resetSearch) {
			item.specific_key_search = '';
		}
		if (resetToken) {
			item.specific_before_token_search = undefined;
			item.specific_after_token_search = undefined;
		}
		if (resetCount) {
			this.setState({ specific_total_search: 0, specific_index_search: 0 });
		}
	}

	private handlerChangeIndexSearch = (increment: boolean) => {
		const { assignment } = this.props;
		const { specific_index_search, specific_total_search } = this.state;
		if (assignment.specific_loading_content) {
			return;
		}
		if (increment && specific_index_search < specific_total_search - 1) {
			assignment.specific_conversations.length = 0;
			this.resetSearch(assignment, false, true, false);
			assignment.specific_query = { per_page: 25, search: assignment.specific_key_search, search_index: specific_index_search + 1 };
			this.setState({ specific_index_search: specific_index_search + 1 });
			this.listViewComponentRef && this.listViewComponentRef.refreshData();
			return;
		}
		if (specific_index_search > 0 && !increment) {
			assignment.specific_conversations.length = 0;
			this.resetSearch(assignment, false, true, false);
			assignment.specific_query = { per_page: 25, search: assignment.specific_key_search, search_index: specific_index_search - 1 };
			this.setState({ specific_index_search: specific_index_search - 1 });
			this.listViewComponentRef && this.listViewComponentRef.refreshData();
		}
	}

	private handleSearch = (keySearch) => {
		const { assignment } = this.props;
		if (!keySearch || !keySearch.trim()) {
			this.resetSearch(assignment, true, true, true);
			assignment.specific_query = undefined;
			this.listViewComponentRef && this.listViewComponentRef.setState({ loaded: false, showScrollBottom: false }, () => {
				this.listViewComponentRef && this.listViewComponentRef.fetchData();
			});
			return;
		}
		if (assignment.specific_loading_content || assignment.specific_key_search === keySearch.trim()) {
			return;
		}
		this.resetSearch(assignment, true, true, false);
		assignment.specific_key_search = keySearch.trim();
		assignment.specific_query = { per_page: 25, search: keySearch.trim(), search_index: 0 };
		assignment.specific_conversations = undefined;
		this.listViewComponentRef.Items && (this.listViewComponentRef.Items = []);
		this.listViewComponentRef && this.listViewComponentRef.refreshData();
	}

	// Tam chua xu ly phan header thua
	private handleScroll = (offsetX, offsetY) => {
		// if (!this.listViewComponentRef || !this.listViewComponentRef.Items || !this.listViewComponentRef.Items.length) {
		// 	return;
		// }
		// const offset = this.listViewComponentRef.getOffsetItemByIndex(1);
		// if (offsetY > this.currentOffsetY) { // kéo xuống
		// 	if (offsetY < offset.y) {
		// 		changeHeaderHeight(79);
		// 		this.setState({ headerHeight: Constants.HeaderHeight });
		// 		return this.currentOffsetY = offsetY;
		// 	}
		// 	changeHeaderHeight(49);
		// 	this.setState({ headerHeight: Constants.HeaderHeight });
		// 	return this.currentOffsetY = offsetY;
		// }
		// changeHeaderHeight(79);
		// this.setState({ headerHeight: Constants.HeaderHeight });
		// this.currentOffsetY = offsetY;
	}

	private handleUpdateConversations = () => {
		const { assignment } = this.props;
		if (!this.listViewComponentRef) {
			return;
		}

		this.listViewComponentRef.Items = assignment.specific_conversations;
		this.listViewComponentRef.Items.forEach(conversationItem => {
			this.listViewComponentRef.updateItem(conversationItem);
		});
		this.listViewComponentRef.setBadge(true);
	}

	private handleUpdateConversationItem = (conversationItem: IAssignmentItemConversationItem, fieldKey?: string) => {
		this.listViewComponentRef && this.listViewComponentRef.updateItem(conversationItem, fieldKey);
	}

	render() {
		const { assignment, feature, screenType } = this.props;
		const { hasBadge, hasMessageTag, hasSearch, specific_total_search, specific_index_search,
			avatarForPage, isDisplayMessageTag } = this.state;
		const searchWidth = Constants.Width - 32 - 50;

		return (
			<View style={Styles.container}>
				<SocialShareHeaderScreen
					ref={(comp) => { this.header = comp; }}
					assignment={assignment}
					feature={feature}
					onDisplayMessageTag={this.initDisplayMessageTag}
					onClearText={() => { this.socialInputMessage && this.socialInputMessage.clearText(); }}
					onBackgroundFetchData={() => { this.listViewComponentRef && this.listViewComponentRef.backgroundFetchData(); }}
					onSetAvatarForPage={() => { this.setState({ avatarForPage: assignment.specific_page_container.icon || '' }); }}
					onRefreshData={() => { this.refreshData(); }}
					onSearchContent={() => { this.setState({ hasSearch: true }); }}
					onUpdateConversations={this.handleUpdateConversations}
					onUpdateConversationItem={this.handleUpdateConversationItem}
					screenType={screenType} />
				{hasSearch &&
					<View style={[Styles.Row, Styles.AlignCenter, { marginHorizontal: 16, paddingTop: 20, paddingBottom: 20 }]}>
						<View style={{ width: searchWidth }}>
							<FormInput
								placeholder={'Tìm kiếm'}
								icon={'search'}
								autoValidate={false}
								validRequire={false}
								containerStyle={{ marginBottom: 0 }}
								onSubmit={this.handleSearch}
								hasClear={true} />
						</View>
						<WrapText st={[Styles.Text_M_M]} c={Color.primary} styles={{ width: 50, textAlign: 'right' }} onPress={this.closeSearch}>{'Đóng'}</WrapText>
					</View>
				}
				{
					<View style={[Styles.FlexGrow]}>
						<ListView
							ref={(comp: any) => { this.listViewComponentRef = comp; }}
							onRenderRow={this.renderRowItem}
							wr={Constants.Width}
							hr={62}
							autoH={true}
							top={0}
							bottom={20}
							pageSize={25}
							inverted={true}
							hasExtendedState={true}
							onLoad={this.onLoadDataHandler}
							onLoadMore={this.onLoadMoreDataHandler}
							containerStyle={{ marginHorizontal: 0, paddingHorizontal: 0 }}
							loadAllMessage={'Đã xem hết tin nhắn'}
							keyField={'message_social_id'}
							onBottomEndReached={this.onListBottomEndReached}
							onScrollToBottom={this.onScrollToBottom}
							hasBadge={hasBadge}
							loadingIcon={true}
							loadingIconImage={'load_data'}
							loadErrorIcon={'load_data_error'}
							loadErrorText={'Quá trình tải dữ liệu gặp sự cố.'}
							icon={hasSearch ? 'no_result' : 'work_done'}
							noneItemsMsg={hasSearch ? 'Chưa có nội dung hiển thị' : 'Chưa có tin nhắn nào'}
							ignoreShowScroll={hasSearch ? true : false}
							onScroll={this.handleScroll}
						/>
					</View>
				}
				{
					!hasSearch &&
					<SocialMessageInput
						ref={(comp: any) => { this.socialInputMessage = comp; }}
						isDisplayMessageTag={isDisplayMessageTag}
						assignment={assignment}
						onSend={this.onSendMessageHandler}
						onMessageTagPress={this.onMessageTagPressHandler}
						avatarForPage={avatarForPage}
						fileSize={25}
						hasMessageTag={hasMessageTag} />
				}
				{
					hasSearch &&
					<View style={[Styles.RowOnly, Styles.JustifyBetween, { borderTopColor: Color.gray, borderTopWidth: 1, paddingHorizontal: 16, paddingTop: 17, paddingBottom: 18 }]}>
						<View style={[Styles.RowOnly]}>
							<WrapText styles={[Styles.Text_S_R, { marginRight: 4, color: Color.textSecondary }]}>{'Kết quả tìm kiếm: '}</WrapText>
							<WrapText styles={[Styles.Text_S_R]}>{specific_total_search ? specific_index_search + 1 : specific_index_search}/{specific_total_search}</WrapText>
						</View>
						<View style={[Styles.RowOnly]}>
							<TouchableOpacity disabled={specific_total_search === 0 || specific_index_search === specific_total_search - 1}
								style={{ opacity: (specific_total_search === 0 || specific_index_search === specific_total_search - 1) ? 0.5 : 1 }}
								onPress={() => { this.handlerChangeIndexSearch(true); }}>
								<CustomIcon name={'up'} size={20} color={Color.primary} />
							</TouchableOpacity>
							<TouchableOpacity disabled={specific_total_search === 0 || specific_index_search === 0}
								style={{ opacity: (specific_index_search === 0 || specific_total_search === 0) ? 0.5 : 1 }}
								onPress={() => { this.handlerChangeIndexSearch(false); }}>
								<CustomIcon style={{ marginLeft: 22 }} name={'down'} size={20} color={Color.primary} />
							</TouchableOpacity>
						</View>
					</View>
				}
				<SocialShareKeyboardScreen />
			</View>
		);
	}
}


