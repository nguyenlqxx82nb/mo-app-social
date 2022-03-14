import React from 'react';
import { View, DeviceEventEmitter, EmitterSubscription } from 'react-native';
import { ListView, Router, WrapText, ScreenType, ButtonRipple, pushModal, IModal } from 'mo-app-comp';
import { Color, Constants, JwtHelper, SocialService, Styles, CustomIcon, BaseServiceParam, changeToastBottomHeight, Storage, StorageKeys } from 'mo-app-common';
import { IAssignmentItem } from 'Api/AssignmentItem';
import { SocialAssignmentItem } from './item';
import SocialFilterModal from '../../Filter';
import moment from 'moment';
import { SocialConstants, SocialUtils } from '../../../common';
import { IFeatureAssign } from 'api';
import SocialSearch from '../../Search';
import styles from './styles';

const cloneDeep = require('clone-deep');

export interface ISocialChatListMainProps {
	containerStyle?: any;
	key?: string;
	feature: IFeatureAssign;
}

interface ISocialChatListMainState {
	enableAction?: boolean;
	hasProfileSearch?: boolean;
	displayProfileSearch?: boolean;
	serviceParamsProfile?: BaseServiceParam;
	displaySearchResult: boolean;
	conversationLengthText?: string;
}

export default class SocialChatListMainScreen extends React.PureComponent<ISocialChatListMainProps, ISocialChatListMainState> {
	private staffId: string;
	private listViewComponentRef: ListView;
	private socketSubscription: EmitterSubscription;
	private backToListSubscription: EmitterSubscription;
	private dataSocketContainer: Map<string, any>;
	private timeOutNextProcess: any;
	private acceptHandlerSocket: boolean;
	private timerIntervalRevoke: any;
	private queryProfileSearch: any;

	constructor(props: ISocialChatListMainProps) {
		super(props);
		this.state = {
			enableAction: false,
			hasProfileSearch: false,
			displayProfileSearch: false,
			serviceParamsProfile: undefined,
			displaySearchResult: false,
			conversationLengthText: ''
		};
		this.staffId = JwtHelper.decodeToken().id;
		this.acceptHandlerSocket = false;
		this.dataSocketContainer = new Map();
		const { feature } = this.props;
		feature.specific_sort_assignments = this.sortAssignments;
		feature.specific_on_filter = this.handerFilter;

		this.queryProfileSearch = {
			search: '',
			page_social_id: '',
			social_type: 0,
			object_type: feature.specific_object_type,
			per_page: 10,
		};
		if (feature && feature.tabOrigin && feature.tabOrigin.pages) {
			this.queryProfileSearch.page_social_id = feature.tabOrigin.pages.map(item => item.page_social_id).join(',');
			this.queryProfileSearch.social_type = feature.tabOrigin.social_type;
		}
	}

	componentDidMount() {
		changeToastBottomHeight(50);
		this.socketSubscription && this.socketSubscription.remove();
		this.socketSubscription = DeviceEventEmitter.addListener(Constants.EmitCode.SOCIAL_NOTIFICATION, this.handlerSocket);
		this.backToListSubscription = DeviceEventEmitter.addListener(Constants.EmitCode.UPDATE_SOCIAL_CHAT_MAIN_LIST, this.handleBackToList);
		this.autoRevoke();
		this.timerIntervalRevoke = setInterval(this.autoRevoke, 5000);
	}

	componentWillUnmount() {
		changeToastBottomHeight(Constants.DEFAULT_TOAST_MARGIN_BOTTOM);
		this.socketSubscription && this.socketSubscription.remove();
		this.backToListSubscription && this.backToListSubscription.remove();
		clearTimeout(this.timeOutNextProcess);
		clearInterval(this.timerIntervalRevoke);
	}

	private getFilterCache = (feature) => {
		return new Promise(resolve => {
			if (!feature) {
				return resolve(true);
			}
			Storage.getItem(StorageKeys.KEY_CACHE_SETTING_ALL).then(allSetting => {
				if (!allSetting || !allSetting.data || !allSetting.data.length) {
					return resolve(true);
				}
				const data = allSetting.data;
				const settingsAccount = data.find(item => item.key === StorageKeys.KEY_CACHE_SETTING);
				if (!settingsAccount || !settingsAccount.values || !settingsAccount.values.basic) {
					return resolve(true);
				}
				const settingBasic = settingsAccount.values.basic;
				const settingSocial = settingBasic.find(item => item.key === 'SETTING_ONLINE');
				if (!settingSocial || !settingSocial.content || !settingSocial.content.length) {
					return resolve(true);
				}
				const settingFilterAssignment = settingSocial.content.find(item => item.key === `setting_default_filter_${feature.code.valueOf()}`);
				const settingSortType = settingFilterAssignment && settingFilterAssignment.content.find(item => item.key === 'sort_type');
				if (!settingSortType || !settingSortType.value) {
					return resolve(true);
				}
				if (!feature.specific_filter_loaded_cache) {
					feature.filter && (feature.filter.sort_type = settingSortType.value);
					feature.specific_filter_loaded_cache = true;
				}
				return resolve(true);
			});
		});
	}

	private handerFilter = (isBackgroundLoad: boolean = false) => {
		const { feature } = this.props;
		feature.specific_is_filter_all_staff = feature.filter?.assignee?.length > this.staffId?.length;
		feature.itemSelected = undefined;
		this.acceptHandlerSocket = false;
		this.dataSocketContainer.clear();
		clearTimeout(this.timeOutNextProcess);
		feature.isReCallTabCount = true;
		if (!isBackgroundLoad) {
			return this.listViewComponentRef.refreshData();
		}
		return this.listViewComponentRef.backgroundFetchData();
	};

	private onLoadDataHandler = (page: number, per_page: number, onLoadDataCompleted: any) => {
		this.loadData(page, per_page, onLoadDataCompleted);
	}

	private onLoadMoreDataHandler = async (page: number, per_page: number, onLoadMoreDataCompleted: any, _lastCursor: any) => {
		this.loadData(page, per_page, onLoadMoreDataCompleted);
	}

	buildConversationLengthText = () => {
		const { displaySearchResult } = this.state;
		if (!displaySearchResult) {
			return;
		}
		this.setState({ conversationLengthText: `${this.listViewComponentRef ? this.listViewComponentRef.Items.length : 0} cuộc hội thoại` });
	}

	private loadData = async (page: number, per_page: number, handlerLoadDataCompleted: Function) => {
		const { feature } = this.props;
		await this.getFilterCache(feature);
		this.setState({ enableAction: false, conversationLengthText: '0 cuộc hội thoại' });
		feature.specific_load_data_status = SocialConstants.NO_LOAD_DATA;
		const responseAssignments: any = await SocialService.getAssignments(feature.tabOrigin.social_type, SocialUtils.getQueryFilter(feature.filter, page, per_page));
		if (!responseAssignments || !responseAssignments.data) {
			feature.specific_load_data_status = SocialConstants.LOAD_DATA_ERROR;
			handlerLoadDataCompleted([], null, false, true);
			this.acceptHandlerSocket = true;
			this.setState({ enableAction: true, conversationLengthText: `${this.listViewComponentRef ? this.listViewComponentRef.Items.length : 0} cuộc hội thoại` });
			return;
		}
		feature.specific_load_data_status = SocialConstants.LOAD_DATA_SUCESS;
		if (!responseAssignments.data.length) {
			handlerLoadDataCompleted([], null, false);
			this.acceptHandlerSocket = true;
			this.setState({ enableAction: true, conversationLengthText: `${this.listViewComponentRef ? this.listViewComponentRef.Items.length : 0} cuộc hội thoại` });
			return;
		}
		const data: Array<IAssignmentItem> = responseAssignments.data;

		const paging = responseAssignments.paging;
		let allLoaded = false;
		if (paging && paging.page >= paging.total_pages || per_page > data.length) {
			allLoaded = true;
		}
		if (feature.filter.message) {
			data.forEach(userAssign => {
				userAssign.specific_is_assignment_correct_content_search = true;
			});
		}
		handlerLoadDataCompleted([], null, allLoaded);
		this.pushAssignments(data);
		this.acceptHandlerSocket = true;
		this.setState({ enableAction: true, conversationLengthText: `${this.listViewComponentRef ? this.listViewComponentRef.Items.length : 0} cuộc hội thoại` });
	}

	private pushAssignments = (assignments: Array<IAssignmentItem>) => {
		if (!assignments || !assignments.length || !this.listViewComponentRef) {
			return;
		}
		const { feature } = this.props;
		const assignmentsOfFeature = this.listViewComponentRef.Items;
		const filter = feature.filter;
		const pages = feature.tabOrigin.pages;
		const assignsNew: Array<IAssignmentItem> = [];
		for (const assignment of assignments) {
			const pageContainer = pages.find(page => page.page_social_id === assignment.page_social_id);
			if (!pageContainer) {
				continue;
			}
			assignment.specific_page_container = pageContainer;
			const existAssignment = assignmentsOfFeature.find(item => item.id === assignment.id);
			if (existAssignment) {
				SocialService.mergeAssignment(assignment, existAssignment, feature.itemSelected);
				this.handlerUpdateListViewItem(existAssignment);
				continue;
			}
			if (!SocialService.validAssignmentWithFilter(assignment, filter)) {
				continue;
			}
			if (!assignment.specific_send_time) {
				assignment.specific_send_time = moment(assignment.message_time).unix();
			}
			if (assignment.updated_time && !assignment.is_reply) {
				assignment.lastest_user_interacted_time = assignment.updated_time;
			}
			if (filter.message) {
				assignment.specific_is_assignment_correct_content_search = true;
			}
			assignsNew.push(assignment);
		}
		if (!assignsNew || !assignsNew.length) {
			this.sortAssignments();
			this.listViewComponentRef.Items = assignmentsOfFeature;
			return;
		}
		assignmentsOfFeature.push(...assignsNew);
		this.listViewComponentRef.Items = assignmentsOfFeature;
		this.buildConversationLengthText();
		assignsNew.forEach(assignNew => {
			SocialService.buildInfo(assignNew, feature.tabOrigin.social_type, feature.code, this.updateInfor);
		});
		this.sortAssignments();
	}

	updateInfor = (assignment) => {
		if (!this.listViewComponentRef) {
			return;
		}
		const item = this.listViewComponentRef.getItemById(assignment.id);
		if (!item) {
			return;
		}
		item.specific_avatar = assignment.specific_avatar;
		item.specific_username = assignment.specific_username;
		item.specific_update_avatar_name && item.specific_update_avatar_name();
		this.handlerUpdateListViewItem(assignment);
	}

	private autoRevoke = () => {
		try {
			const { feature } = this.props;
			const assignments = this.listViewComponentRef && this.listViewComponentRef.Items;
			if (!feature || !assignments || !feature.filter || feature.ignoreRevoke) {
				return;
			}
			for (const assignment of assignments) {
				if (SocialService.validAssignmentWithFilter(assignment, feature.filter)) {
					continue;
				}
				this.removeAssignment(assignment.id);
			}
		} catch (err) {
			console.log('autoRevoke err', err);
		}
	}

	private removeAssignment = (idRemove: string, checkIdTeamAssign?: string): boolean => {
		if (!idRemove || !this.listViewComponentRef) {
			return false;
		}
		const assignment = this.listViewComponentRef.getItemById(idRemove);
		if (!assignment) {
			return false;
		}
		if (checkIdTeamAssign && assignment.specific_page_container && assignment.specific_page_container.specific_config
			&& assignment.specific_page_container.specific_config.team) { // xu ly khi socket assignteam cham hon socket new message khi chuyen team => xoa mat message!
			const teamFind = assignment.specific_page_container.specific_config.team.find(team => team.id === checkIdTeamAssign);
			if (teamFind && teamFind.member && teamFind.member.length && teamFind.member.find(member => { return member.id === this.staffId; })) {
				return false;
			}
		}
		assignment && assignment.specific_remove_detail_screen && assignment.specific_remove_detail_screen();
		this.listViewComponentRef.removeItemsByIds([idRemove]);
		this.buildConversationLengthText();
		if (this.listViewComponentRef.Items && this.listViewComponentRef.Items.length <= 5) {
			this.listViewComponentRef.loadMoreDataNotEndReach();
		}
		const { feature } = this.props;
		feature.isReCallTabCount = true;
		return true;
	}

	private sortAssignments = (scrollToItem?: IAssignmentItem) => {
		const { feature } = this.props;
		const fieldSort: string = feature.filter.sort_field;
		if (!fieldSort) {
			return;
		}
		const typeSort: string = feature.filter.sort_type;
		const assignments: Array<IAssignmentItem> = this.listViewComponentRef.Items;
		const itemSelected = feature.itemSelected;
		if (itemSelected && itemSelected.specific_focus) {
			itemSelected.pin_order = itemSelected.pin_order || SocialConstants.PIN_ORDER_OF_USER_ASSIGN_FOCUS;
		}
		assignments.sort((assignA, assignB) => {
			if ((!itemSelected || (itemSelected && itemSelected.id !== assignA.id)) && assignA.assignees && assignA.assignees.length && assignA.assignees[0].assignee_id !== this.staffId) {
				assignA.pin_order = undefined;

			}
			if ((!itemSelected || (itemSelected && itemSelected.id !== assignB.id)) && assignB.assignees && assignB.assignees.length && assignB.assignees[0].assignee_id !== this.staffId) {
				assignB.pin_order = undefined;
			}
			const orderA = assignA.pin_order || SocialConstants.MAX_PIN_ORDER;
			const orderB = assignB.pin_order || SocialConstants.MAX_PIN_ORDER;
			return orderA - orderB;
		});

		assignments.sort((assignA, assignB) => {
			if (assignA.pin_order || assignB.pin_order) {
				return 0;
			}
			const timeSortA = assignA[fieldSort];
			const timeSortB = assignB[fieldSort];
			let timeA = moment(timeSortA).unix();
			let timeB = moment(timeSortB).unix();
			if (assignA.is_reply) {
				timeA = typeSort === Constants.SORT.ASC ? moment().unix() : moment('1975-01-01').unix();
			}
			if (assignB.is_reply) {
				timeB = typeSort === Constants.SORT.ASC ? moment().unix() : moment('1975-01-01').unix();
			}
			if (typeSort === Constants.SORT.ASC) {
				return timeA - timeB;
			}
			if (typeSort === Constants.SORT.DESC) {
				return timeB - timeA;
			}
		});
		if (itemSelected && scrollToItem) {
			this.listViewComponentRef.scrollToItemOrIndex(scrollToItem);
		}
		this.listViewComponentRef.Items = assignments;
	}

	private handlerSocket = (event) => {
		const { feature } = this.props;
		if (!this.acceptHandlerSocket || !event || !event.body || (event.body.social_type && event.body.social_type.toString() !== `${feature.tabOrigin.social_type}`)) {
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

	private processingDataSocket = (dataContainer: Array<{ body: any, isProcessing: boolean }>) => {
		try {
			const { feature } = this.props;
			const data = dataContainer[0];
			if (!data || data.isProcessing) {
				return;
			}
			const assignments = this.listViewComponentRef.Items;
			data.isProcessing = true;
			const body = data.body;
			switch (body.socket_type) {
				case 'REPLY_MESSAGE_SOCKET':
					body.is_reply = 1;
					const replyMessage: any = SocialService.buildAssignmentFromSocket(body, feature.code);
					this.pushAssignments([replyMessage]);
					break;
				case 'NEW_MESSAGE_SOCKET':
					const newMessage: any = SocialService.buildAssignmentFromSocket(body, feature.code);
					const currentPage = feature.tabOrigin.pages.find(page => page.page_social_id === newMessage.page_social_id);
					SocialService.convertsocialAttachment(newMessage, currentPage, 'specific_attachments');
					this.pushAssignments([newMessage]);
					break;
				case 'SEEN_CONVERSATION_SOCKET':
					const assignSeen = assignments.find(item => item.id === body.conversation_id);
					if (assignSeen) {
						assignSeen.seen_time = body.seen_time;
						// console.log('SEEN_CONVERSATION_SOCKET', assignSeen.seen_time);
						this.handlerUpdateListViewItem(assignSeen);
						assignSeen.specific_update_view_detail_screen && assignSeen.specific_update_view_detail_screen(assignSeen);
					}
					break;
				case 'ASSIGN_CONVERSATION_SOCKET':
					this.assignSocket('conversation', body);
					break;
				case 'ASSIGN_TAG_CONVERSATION_SOCKET':
					this.updateUserAssignsSocket(body.social_type, body.data.assign[0].conversation_id);
					break;
				case 'RESOLVED_CONVERSATION_SOCKET':
					this.resolveSocket(body, feature);
					break;
				case 'REVOKE_CONVERSATION_ASSIGN_SOCKET':
					this.revokeSocket(body.data.conversation_id);
					break;
				case 'MARK_CONVERSATION_AS_READ':
					const conversationMark = assignments.find(item => item.id === (body.assignment && body.assignment.id));
					conversationMark && (conversationMark.unread_number = 0);
					break;
				case 'VISITOR_CHANGE_STATUS':
					this.onlineVisitor(body, feature);
					break;


				case 'NEW_COMMENT_SOCKET':
					const newComment: any = SocialService.buildAssignmentFromSocket(body, feature.code.valueOf());
					console.log('NEW_COMMENT_SOCKET', newComment);
					this.pushAssignments([newComment]);
					break;
				case 'REPLY_COMMENT_TOPIC_SOCKET':
					SocialUtils.replyCommentTopicSocket(body, assignments, feature, (assign) => {
						this.handlerUpdateListViewItem(assign);
					});
					break;
				case 'POST_SUB_COMMENT_SOCKET': // chỉ nhận socket khi sub_comment không phải của adminFanpage;
					// doi Hoa trả thêm thông tin để ko cần call api từ FB
					if (body.social_type === 1) {
						SocialUtils.getCommentFB(body, assignments, feature, false, (item) => { this.handlerUpdateListViewItem(item); });
					}
					break;
				case 'ASSIGN_COMMENT_SOCKET':
					this.assignSocket('comment', body);
					break;
				case 'CLASSIFY_COMMENT_SOCKET':
					SocialUtils.classifyComment(body, assignments, (item) => { this.handlerUpdateListViewItem(item); });
					break;
				// case 'DISLIKE_COMMENT_SOCKET':
				// 	const dataChangeDisLike = { user_likes: false };
				// 	this.updateComment(body, dataChangeDisLike); // đang lỗi do khi dislike webhook FB vẫn trả về like
				// 	break;
				// case 'LIKE_COMMENT_SOCKET':
				// 	const dataChangeLike = { user_likes: true };
				// 	this.updateComment(body, dataChangeLike);
				// 	break;
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
					SocialUtils.updateComment(assignments, (currentAssignment) => { this.handlerUpdateListViewItem(currentAssignment); }, body, dataEdit);
					break;
				case 'DELETE_COMMENT_TOPIC_SOCKET':
					SocialUtils.updateComment(assignments, (currentAssignment) => { this.handlerUpdateListViewItem(currentAssignment); }, body, {}, (currentComment) => { this.removeAssignment(currentComment.specific_mobio_comment_id); }, true);
					break;
				case 'UNHIDE_COMMENT_TOPIC_SOCKET':
					const dataChangeUnHide = { is_hidden: false };
					SocialUtils.updateComment(assignments, (currentAssignment) => { this.handlerUpdateListViewItem(currentAssignment); }, body, dataChangeUnHide);
					break;
				case 'HIDE_COMMENT_TOPIC_SOCKET':
					const dataChangeHide = { is_hidden: true };
					SocialUtils.updateComment(assignments, (currentAssignment) => { this.handlerUpdateListViewItem(currentAssignment); }, body, dataChangeHide);
					break;
				case 'ASSIGN_TAG_COMMENT_SOCKET':
					this.updateUserAssignsSocket(body.social_type, body.data.assign[0].comment_id);
					break;
				case 'RESOLVED_COMMENT_SOCKET':
					this.resolveSocket(body, feature);
					break;
				case 'REVOKE_COMMENT_ASSIGN_SOCKET':
					this.revokeSocket(body.data.comment_id);
					break;
				case 'MARK_COMMENT_AS_READ':
					const commentMark = assignments.find(item => item.id === (body.assignment && body.assignment.id));
					commentMark && (commentMark.unread_number = 0);
					break;


				case 'REPLY_COMMENT_RATING_SOCKET':
					this.replyRatingSocket(body);
					break;
				case 'NEW_RATING_SOCKET':
					const newRating: any = SocialService.buildAssignmentFromSocket(body, feature.code.valueOf());
					this.pushAssignments([newRating]);
					break;
				case 'CLASSIFY_RATING_SOCKET':
					const ratingAssign = assignments.find(item => item.id === body.data.rating_id);
					if (!ratingAssign) {
						this.updateUserAssignsSocket(body.social_type, body.data.assign[0].comment_id);
						break;
					}
					ratingAssign.classify = body.data.classify;
					ratingAssign.specific_ratings.specific_classify = body.data.classify;
					break;
				case 'ASSIGN_RATING_SOCKET':
					this.assignSocket('rating', body);
					break;
				case 'ASSIGN_TAG_RATING_SOCKET':
					this.updateUserAssignsSocket(body.social_type, body.data.assign[0].rating_id);
					break;
				case 'RESOLVED_RATING_SOCKET':
					this.resolveSocket(body, feature);
					break;
				case 'REVOKE_RATING_ASSIGN_SOCKET':
					this.revokeSocket(body.data.rating_id);
					break;

				case 'UPDATE_COMMENT_ASSIGN_TAG_ACTIVITY_STATUS_SOCKET':
				case 'UPDATE_CONVERSATION_ASSIGN_TAG_ACTIVITY_STATUS_SOCKET':
				case 'UPDATE_RATING_ASSIGN_TAG_ACTIVITY_STATUS_SOCKET':
					const assignmentUpdate = assignments.find(item => item.id === body.object_id);
					this.updateTagsActivitySatus(body, assignmentUpdate);
					break;
			}
		} catch (err) {
			console.log(err);
		}
		this.timeOutNextProcess = setTimeout(() => {
			this.nextProcess(dataContainer);
		}, 150);
	}

	private updateTagsActivitySatus(body, assignUpdate: IAssignmentItem) {
		if (!assignUpdate || !assignUpdate.assignees || !assignUpdate.assignees.length || assignUpdate.assignees[0].id !== body.object_assignee_id) {
			return;
		}
		const tempAssign = Object.assign({}, assignUpdate.assignees[0]);
		tempAssign.assign_tag_activity_status = body.assign_tag_activity_status;
		assignUpdate.assignees[0] = tempAssign;
		assignUpdate.specific_update_tag_activity_status && assignUpdate.specific_update_tag_activity_status();
	}





	private replyRatingSocket(body) {
		const assignmentsOfFeature = this.listViewComponentRef.Items;
		if (!assignmentsOfFeature || !assignmentsOfFeature.length) {
			return;
		}
		const userAssignRating = assignmentsOfFeature.find(item => item.specific_ratings.id === body.data.rating_social_id);
		if (!userAssignRating || !userAssignRating.specific_ratings || !userAssignRating.specific_ratings.comments || !userAssignRating.specific_ratings.comments.data) {
			return;
		}
		const commentDetect = userAssignRating.specific_ratings.comments.data.find(subComment => subComment.specific_detect_id === body.detect_comment_id);
		userAssignRating.is_display_hold = body.is_display_hold;
		userAssignRating.is_hold = body.is_hold;
		userAssignRating.pin_order = body.pin_order;
		userAssignRating.is_reply = body.send_status === 'DELIVERED' ? 1 : 0;
		if (commentDetect) {
			if (body.data.comment) {
				commentDetect.id = body.data.comment.comment_social_id;
				SocialService.updateSyncComment(commentDetect, body.data.comment);
			}
			commentDetect.specific_status_message = body.send_status === 'DELIVERED' ? Constants.SOCIAL.STATE_SEND_DATA_TO_SERVER.MESSAGE_DELIVERED : Constants.SOCIAL.STATE_SEND_DATA_TO_SERVER.MESSAGE_SEND_FACEBOOK_FAIL;
			return;
		}
	}

	private updateUserAssignsSocket = async (social_type: number, assign_id: string) => {
		const { feature } = this.props;
		const cloneFilter = cloneDeep(feature.filter);
		cloneFilter.object_id = assign_id;
		const result: any = await SocialService.getAssignments(social_type, SocialUtils.getQueryFilter(cloneFilter, 1, 10));
		if (!result.code || result.code !== '001' || !result.data || !result.data.length) {
			return this.removeAssignment(assign_id);
		}
		const userAssign = result.data[0];
		userAssign.specific_ignore_push_conversation = true;
		this.pushAssignments([userAssign]);
		if (!SocialService.validAssignmentWithFilter(userAssign, feature.filter)) {
			return;
		}
	}

	private assignSocket = (fieldAssign: string, body) => {
		const { feature } = this.props;
		const newAssignment = body && body.data && body.data[fieldAssign];
		newAssignment.page_social_id = body.page_social_id;
		const typeAssign = body && body.data && body.data.assignee_type;
		const pages = feature.tabOrigin ? feature.tabOrigin.pages : [];
		const pageContainer = pages.find(page => page.page_social_id === newAssignment.page_social_id);
		if (!pageContainer) {
			return;
		}
		newAssignment.specific_page_container = pageContainer;

		feature.isReCallTabCount = true;
		if (typeAssign === 'TEAM' || !SocialService.validAssignmentWithFilter(newAssignment, feature.filter)) {
			return this.removeAssignment(newAssignment.id, body.team_id);
		}
		this.pushAssignments([newAssignment]);
	}

	private resolveSocket = (body, feature) => {
		const assignmentsOfFeature = this.listViewComponentRef.Items;
		const assignResolve = assignmentsOfFeature.find(item => item.id === body.data.resolve_object_id);
		if (!assignResolve) {
			return;
		}
		assignResolve.is_reply = body.data.is_reply || 0;
		assignResolve.unread_number = 0;
		assignResolve.status = 2;
		assignResolve.resolved_time = body.resolved_time;
		assignResolve.resolved_user = body.resolved_user;
		if (!SocialService.validAssignmentWithFilter(assignResolve, feature.filter)) {
			return this.removeAssignment(assignResolve.id);
		}
		SocialService.pushMessageOfConversation(assignResolve, assignResolve);
		// assignResolve.specific_event.emit({ code: 'scroll-bottom', data: assignResolve });
		// this.detectChanges();
		return;
	}

	private revokeSocket = (id: string) => {
		this.removeAssignment(id);
	}

	private nextProcess = (dataContainer) => {
		if (dataContainer.length) {
			dataContainer.splice(0, 1);
		}
		this.processingDataSocket(dataContainer);
	}

	protected onlineVisitor = (body, feature) => {
		if (!feature || !this.listViewComponentRef || !this.listViewComponentRef.Items || !this.listViewComponentRef.Items.length) {
			return;
		}
		const assignments = this.listViewComponentRef.Items;
		const currentAssignment = assignments.find(item => item.last_message && item.last_message.from && item.last_message.from.id === body.visitor_id);
		if (!currentAssignment) {
			return;
		}
		currentAssignment.specific_status_online = body.status;
		SocialService.runTimeProcess(currentAssignment, feature.code, this.handlerUpdateListViewItem, true);
		currentAssignment.specific_update_status_online && currentAssignment.specific_update_status_online(body.status);
		return;
	}

	private handleBackToList = (data) => {
		if (!this.listViewComponentRef) {
			return;
		}
		const { feature } = this.props;
		if (!feature || !data || feature.code !== data.featureCode) {
			return;
		}
		feature && (feature.itemSelected = undefined);
		if (feature && feature.tabOrigin.isNeedReloadData && feature.tabOrigin.isSelected) {
			feature.isReCallTabCount = true;
			feature.specific_on_filter && feature.specific_on_filter(true);
			return feature.tabOrigin.isNeedReloadData = false;
		}
		this.sortAssignments();
		const assignments = this.listViewComponentRef.Items;
		assignments.forEach(assignment => {
			this.handlerUpdateListViewItem(assignment);
		});
	}

	handlerUpdateListViewItem = (item: IAssignmentItem) => {
		const { feature } = this.props;
		if (!feature || feature.itemSelected) {
			return;
		}
		this.listViewComponentRef && this.listViewComponentRef.updateItem(item);
	}


	renderRowItem = (_type: any, item: IAssignmentItem, index: number, lastIndex: boolean) => {
		const { feature } = this.props;
		return (
			<SocialAssignmentItem
				key={`key_${item.id}`}
				lastIndex={lastIndex}
				type={_type}
				assignment={item}
				feature={feature}
				detectChanges={this.handlerUpdateListViewItem}
			/>
		);
	}

	renderDropdownSearchBase = (item: any) => {
		return (
			<View style={[Styles.Row, Styles.JustifyBetween, Styles.AlignCenter, { height: 28, paddingHorizontal: 10 }]}>
				<WrapText st={[Styles.Text_S_M]}>{item ? item.label : ''}</WrapText>
				<CustomIcon size={10} name={'drop_down'} color={Color.text} />
			</View>
		);
	}

	renderDropdownSearchItem = (item: any, selectedKey: any) => {
		return (
			<View style={[Styles.Row, Styles.JustifyBetween, Styles.AlignCenter, { height: 28 }]}>
				<WrapText st={[Styles.Text_S_R, { marginLeft: 5, marginRight: 5 }]} c={Color.text}>{item.label}</WrapText>
				{ selectedKey === item.id && <CustomIcon name={'mark_selected'} size={10} color={Color.text} />}
			</View>
		);
	}

	closeModal = () => {
		const { feature } = this.props;
		if (feature.specific_filter_search_value) {
			this.setState({ displaySearchResult: true });
		}
	}

	clearSearchFilter = (feature: IFeatureAssign) => {
		feature.filter.user_social_ids = '';
		feature.filter.message = '';
		feature.filter.assignee = feature.tabOrigin && feature.tabOrigin.pages && feature.tabOrigin.pages.length && feature.tabOrigin.pages[0].currentStaff.id;
		feature.filter.page_social_ids = [];
		feature.filter.status = '1';
		feature.filter.reply_status = [];
		feature.filter.tags = [];
		feature.filter.sort_type = Constants.SORT.ASC;
	}

	handleResetFilter = () => {
		const { feature } = this.props;
		if (!feature || !feature.filter) {
			return;
		}
		feature.specific_filter_search_type = '';
		feature.specific_filter_search_value = '';
		this.clearSearchFilter(feature);
		feature.specific_on_filter && feature.specific_on_filter();
		this.setState({ displaySearchResult: false });
	}

	onOpenFilterModalHandler = () => {
		const { feature } = this.props;
		const modal: IModal = {
			content: <SocialFilterModal feature={feature} />
		}
		pushModal(modal);
	}

	render() {
		const { containerStyle, feature } = this.props;
		const { enableAction, conversationLengthText, displaySearchResult } = this.state;
		return (
			<View style={[styles.container, containerStyle || {}]} >
				<View style={styles.header}>
					<ButtonRipple
						isPreventDoubleClick={true}
						radius={1}
						onPress={this.onOpenFilterModalHandler}>
						<View style={styles.textButton}>
							<CustomIcon name={'filter'} size={14} color={Color.primary} />
							<WrapText st={[Styles.Text_S_M, {marginLeft: 6, color: Color.primary}]} >{'Bộ lọc'}</WrapText>
						</View>
					</ButtonRipple>
 
					<ButtonRipple
						isPreventDoubleClick={true}
						containerStyle={{marginLeft: 5}}
						radius={1}
						onPress={()=> {
							const modal = {
								content: <SocialSearch onClose={this.closeModal} feature={feature} />
							};
							pushModal(modal);
						}}>
						<View style={styles.textButton}>
							<CustomIcon name={'search'} size={14} color={Color.primary} />
							<WrapText st={[Styles.Text_S_M, {marginLeft: 6, color: Color.primary}]} >{'Tìm kiếm'}</WrapText>
						</View>
					</ButtonRipple>
					
				</View>

				<View style={styles.divider} />

				{	displaySearchResult &&
					<View style={[styles.header, Styles.JustifyBetween, {paddingLeft: 16}]} >
						<WrapText st={[Styles.Text_S_M]}>{conversationLengthText}</WrapText>

						<ButtonRipple
							radius={1}
							onPress={this.handleResetFilter}>
							<View style={styles.textButton}>
								<CustomIcon name={'reset'} size={14} color={Color.primary} />
								<WrapText st={[Styles.Text_S_M, {marginLeft: 6, color: Color.primary}]} >{'Quay về mặc định'}</WrapText>
							</View>
						</ButtonRipple>
					</View>
				}

				<View style={{ flexGrow: 1 }}>
					<ListView
						ref={(comp: any) => { this.listViewComponentRef = comp; }}
						onRenderRow={this.renderRowItem}
						wr={Constants.Width}
						hr={130}
						autoH={true}
						top={0}
						bottom={20}
						pageSize={25}
						autoLoad={true}
						hasExtendedState={true}
						onLoad={this.onLoadDataHandler}
						onLoadMore={this.onLoadMoreDataHandler}
						icon={displaySearchResult ? 'no_result' : 'work_done'}
						loadingIcon={true}
						containerStyle={{ marginHorizontal: 0, paddingHorizontal: 0 }}
						loadAllMessage={'Đã xem hết'}
						loadingIconImage={'load_data'}
						loadErrorIcon={'load_data_error'}
						loadErrorText={'Quá trình tải dữ liệu gặp sự cố.'}
						noneItemsMsg={displaySearchResult ? 'Không có kết quả nào. Bạn hãy thử thay đổi bộ lọc hoặc nội dung tìm kiếm nhé.' : 'Tạm thời chưa có công việc nào để bạn xử lý vào lúc này'}
					/>
				</View>
			</View>
		);
	}
}

