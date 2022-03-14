import React from 'react';
import { View, Linking, TouchableWithoutFeedback } from 'react-native';
import { Color, Constants, CustomIcon, Styles, pushModal, SocialService, DOMAIN_GET_SOURCES_STATIC } from 'mo-app-common';
import { AsyncImage, WrapText, ListView, BallIndicator, ZoomImageViewer, ButtonRipple, ViewMoreHTML, VideoPlayer } from 'mo-app-comp';
import { IAssignmentItem, IAssignmentItemConversationItem } from '../../../../../api';
import moment from 'moment';
import { SocialUtils } from '../../../../../common';
import styles from './styles';
import { SocialModalCopyClipboard } from '../../../../Modals/CopyClipboard';

export interface ISocialChatRowItemProps {
	assignment: IAssignmentItem,
	conversation: IAssignmentItemConversationItem;
	listViewRef: ListView;
	resendMessage?: (message: IAssignmentItemConversationItem) => void;
	keySearch?: string;
	hasSearch: boolean;
}
export interface ISocialChatRowItemState {
	keySearch: string;
	avatarDefault: string;
	domainGetSourcesStatic: string;
	specific_avatar: string;
}

class SocialChatRowItem extends React.PureComponent<ISocialChatRowItemProps, ISocialChatRowItemState> {

	constructor(props: ISocialChatRowItemProps) {
		super(props);
		this.state = {
			keySearch: '',
			avatarDefault: '',
			domainGetSourcesStatic: '',
			specific_avatar: props.assignment ? props.assignment.specific_avatar : ''
		};
	}

	componentDidMount() {
		this.initAvatarDefault();
	}

	UNSAFE_componentWillReceiveProps(nextProps: ISocialChatRowItemProps) {
		if (nextProps.keySearch !== this.state.keySearch) {
			this.setState({ keySearch: nextProps.keySearch });
		}
		// if (nextProps.assignment && nextProps.assignment.specific_avatar !== this.state.specific_avatar) {
		// 	console.log('nextprops assignment', nextProps.assignment.specific_avatar, nextProps.conversation);
		// 	this.setState({ specific_avatar: nextProps.assignment.specific_avatar });
		// }
	}

	initAvatarDefault = async () => {
		this.setState({ avatarDefault: await SocialService.getDefaultAvatar(), domainGetSourcesStatic: await DOMAIN_GET_SOURCES_STATIC() });
	}

	private setLabelSupporter = () => {
		const { conversation } = this.props;
		if (conversation.created_user === 'hệ thống' || conversation.created_user === 'line' || conversation.created_user === 'zalo' || conversation.created_user === 'facebook') {
			conversation.specific_name_staff_support = 'Trả lời từ hệ thống';
			this.forceUpdate();
			// this.setState({ item: item });
			return;
		}
		this.getUsernameById(conversation.created_user, (nameStaff: string) => {
			conversation.specific_name_staff_support = `Trả lời bởi ${nameStaff}`;
			if (conversation.specific_name_staff_support) {
				this.forceUpdate();
			}
		});
	}

	getUsernameById = (id: string, callback: (name: string) => void) => {
		SocialUtils.getNameStaffById(undefined, undefined, id).then(nameStaff => {
			callback(nameStaff);
		});
	}

	renderAttachments = (attachments: any[], isVisitor: boolean = false, isMessageQuote: boolean = false, maxTextWidth?: number) => {
		if (!attachments || !attachments.length) {
			return;
		}
		return (
			attachments.map((item: any, index: number) => {
				if (item.type?.toLowerCase() === 'video' || item.type?.toLowerCase() === 'sound') {
					return this.renderVideo(item);
				}
				if (item.type?.toLowerCase() === 'image' || item?.type?.toLowerCase() === 'gif' || item?.type?.toLowerCase() === 'sticker') {
					return this.renderImage(item, index, isMessageQuote);
				}
				if (item.type?.toLowerCase() === 'file' || item.type?.toLowerCase() === 'link') {
					return this.renderFile(item, isVisitor, isMessageQuote, maxTextWidth);
				}
			})
		);
	}

	renderVideo = (item: any) => {
		return (
			<VideoPlayer
				video={{ uri: item?.source || item?.href }}
				disableControlsAutoHide
			/>
		);
	}

	renderImage = (attachment: any, index: number, isMessageQuote: boolean = false) => {
		const linkImg = attachment.href || attachment.thumbnail;
		return (
			<TouchableWithoutFeedback
				onPress={() => { this.openZoomImageModal(linkImg); }}>
				<View style={{ padding: 5 }}>
					<AsyncImage source={{ uri: linkImg }} width={!isMessageQuote ? 200 : 140} height={!isMessageQuote ? 200 : 140} />
				</View>
			</TouchableWithoutFeedback>
		);
	}

	private openZoomImageModal = (link: any) => {
		const modal = {
			content: <ZoomImageViewer
				// ref={comp => (this.slideshowModal = comp)}
				autoOpen={true}
				images={[link]}
				index={0}
			/>
		};
		pushModal(modal);
	}

	renderFile = (attachment: any, isVisitor: boolean = false, isMessageQuote: boolean, maxTextWidth?: number) => {
		const { conversation } = this.props;
		const content = attachment.name || attachment.title || attachment.href || '-';
		const messageQuoteStyles = { fontSize: isMessageQuote ? 10 : 12, opacity: isMessageQuote ? 0.7 : 1 };
		return (
			<TouchableWithoutFeedback onPress={() => { Linking.openURL(attachment.href); }}>
				<View style={[Styles.Row, { flex: 1 }]}>
					<View style={{ width: 15 }}>
						<CustomIcon name={'add_media'} size={isMessageQuote ? 10 : 12} color={isVisitor ? Color.text : Color.background} style={{ marginRight: isMessageQuote ? 2 : 4 }} />
					</View>
					<WrapText st={[Styles.Text_S_M, messageQuoteStyles, { textDecorationLine: 'underline', maxWidth: maxTextWidth - 15 || undefined }]} c={!conversation.specific_message_for_page ? Color.text : '#fff'}  >{content}</WrapText>
				</View>
			</TouchableWithoutFeedback>
		);
	}

	disPlayResendMessage = (messageStatus: number) => {
		if (messageStatus === Constants.SOCIAL.STATE_SEND_DATA_TO_SERVER.MESSAGE_SENDING || messageStatus === Constants.SOCIAL.STATE_SEND_DATA_TO_SERVER.MESSAGE_SENT ||
			messageStatus === Constants.SOCIAL.STATE_SEND_DATA_TO_SERVER.MESSAGE_DELIVERED || messageStatus === Constants.SOCIAL.STATE_SEND_DATA_TO_SERVER.MESSAGE_READ) {
			return false;
		}
		return true;
	}

	renderMessageStatus = (messageStatus: number) => {
		switch (messageStatus) {
			case Constants.SOCIAL.STATE_SEND_DATA_TO_SERVER.MESSAGE_SENDING:
				return <BallIndicator color={Color.text} size={10} style={styles.statusIcon} />;
			case Constants.SOCIAL.STATE_SEND_DATA_TO_SERVER.MESSAGE_SENT:
				return <CustomIcon name={'mark_selected'} size={12} color={Color.textSecondary} style={styles.statusIcon} />;
			case Constants.SOCIAL.STATE_SEND_DATA_TO_SERVER.MESSAGE_DELIVERED:
				return <CustomIcon name={'received'} size={12} color={Color.textSecondary} style={styles.statusIcon} />;
			case Constants.SOCIAL.STATE_SEND_DATA_TO_SERVER.MESSAGE_READ:
				return <CustomIcon name={'received'} size={12} color={Color.secondary} style={styles.statusIcon} />;
			case Constants.SOCIAL.STATE_SEND_DATA_TO_SERVER.MESSAGE_FAIL:
			case Constants.SOCIAL.STATE_SEND_DATA_TO_SERVER.MESSAGE_SEND_MOBIO_FAIL:
			case Constants.SOCIAL.STATE_SEND_DATA_TO_SERVER.COMMENT_SEND_FACEBOOK_FAIL:
			case Constants.SOCIAL.STATE_SEND_DATA_TO_SERVER.MESSAGE_SEND_FACEBOOK_FAIL:
			case Constants.SOCIAL.STATE_SEND_DATA_TO_SERVER.MESSAGE_SEND_ZALO_FAIL:
				return <CustomIcon name={'error_connection'} size={12} color={Color.red} style={styles.statusIcon} />;
			case Constants.SOCIAL.STATE_SEND_DATA_TO_SERVER.MESSAGE_USER_DISALLOW_APP:
				return <CustomIcon name={'error_user_block'} size={12} color={Color.red} style={styles.statusIcon} />;
		}
	}

	renderMessageWarning = (messageStatus: number) => {
		let warning = '';
		switch (messageStatus) {
			case Constants.SOCIAL.STATE_SEND_DATA_TO_SERVER.MESSAGE_FAIL:
				warning = 'Vui lòng kiểm tra kết nối mạng và gửi lại tin nhắn';
				break;
			case Constants.SOCIAL.STATE_SEND_DATA_TO_SERVER.MESSAGE_SEND_MOBIO_FAIL:
				warning = 'Vui lòng kiểm tra kết nối mạng và gửi lại tin nhắn';
				break;
			case Constants.SOCIAL.STATE_SEND_DATA_TO_SERVER.MESSAGE_SEND_ZALO_FAIL:
				warning = 'Không gửi được tin nhắn đến máy chủ Zalo';
				break;
			case Constants.SOCIAL.STATE_SEND_DATA_TO_SERVER.COMMENT_SEND_FACEBOOK_FAIL:
			case Constants.SOCIAL.STATE_SEND_DATA_TO_SERVER.MESSAGE_SEND_FACEBOOK_FAIL:
				warning = 'Không gửi được tin nhắn đến máy chủ Facebook';
				break;
			case Constants.SOCIAL.STATE_SEND_DATA_TO_SERVER.MESSAGE_USER_DISALLOW_APP:
				warning = 'Profile đã chặn ứng dụng, website của bên thứ 3';
				break;
		}
		return warning;
	}

	private resendButton = () => {
		const { conversation, resendMessage } = this.props;
		if (!resendMessage || !conversation) {
			return;
		}
		resendMessage(conversation);
	}

	private showCopyModal = (content: string, title?: string) => {
		const modal = {
			content: <SocialModalCopyClipboard content={content} title={title} />
		};
		pushModal(modal);
	}

	renderMessage = (tempSearchWord: string[], message: string, textStyle: any, textMoreStyleColor?: string) => {
		return <ViewMoreHTML
			onCopy={(link) => { this.showCopyModal(link); }}
			searchWords={tempSearchWord}
			highlightStyle={{ backgroundColor: Color.text, color: Color.background }}
			text={message || ' '}
			textStyle={textStyle}
			minNumberLines={10}
			minHeight={202}
			textMoreStyle={[Styles.Text_S_R, { color: textMoreStyleColor || Color.text, marginVertical: 8 }]} />;
	}

	renderMessageVisitor = (_nextItem: IAssignmentItemConversationItem, prevItem: IAssignmentItemConversationItem) => {
		const { conversation, hasSearch } = this.props;
		const { keySearch, avatarDefault, specific_avatar } = this.state;
		const tempSearchWord = hasSearch && keySearch && conversation.is_match ? [keySearch] : undefined;
		const isPrevVisitor = prevItem && !prevItem.specific_message_for_page && prevItem.message_type !== 3 ? true : false;
		return (
			<View style={[styles.container, Styles.JustifyStart, Styles.RowOnly, { paddingLeft: 16, paddingRight: 40 }]}>
				{
					!isPrevVisitor && <AsyncImage source={{ uri: specific_avatar }} iconDefault={avatarDefault} width={36} height={36} radius={18} style={{ marginRight: 8 }} />
				}
				{/* <TouchableWithoutFeedback onLongPress={() => { this.showCopyModal(conversation.message); }} >
				</TouchableWithoutFeedback> */}
				<View style={[styles.messageContainer, { backgroundColor: Color.gray }, isPrevVisitor ? { marginLeft: 44 } : {}]}>
					{!!conversation.message_quote &&
						<View style={{ paddingTop: 8, paddingLeft: 8, paddingRight: 8, paddingBottom: 6, borderBottomWidth: 0.5, borderBottomColor: 'rgba(78, 78, 78, 0.15)' }}>
							{
								!!conversation.message_quote.attachments && this.renderAttachments(conversation.message_quote.attachments, true, true, Constants.Width - 16 - 40 - 36 - 8 - 19)
							}
							{
								conversation.message_quote.message_type !== 2 && this.renderMessage(tempSearchWord, conversation.message_quote.message, [Styles.Text_S_R, { fontSize: 12, opacity: 0.7, maxWidth: Constants.Width - 16 - 40 - 36 - 8 - 19 }])
							}
						</View>
					}
					<View style={{ paddingBottom: 8, paddingLeft: 8, paddingRight: 8, paddingTop: conversation.message_quote ? 2 : 8 }}>
						{
							!!conversation.attachments && this.renderAttachments(conversation.attachments, true, false, Constants.Width - 16 - 40 - 36 - 8 - 19)
						}
						{
							conversation.message_type !== 2 && this.renderMessage(tempSearchWord, conversation.message, [Styles.Text_S_R, { maxWidth: Constants.Width - 16 - 40 - 36 - 8 - 19 }])
						}
						<WrapText st={[Styles.Text_T_R, { marginTop: 4, color: Color.textSecondary }]}>{moment.unix(conversation?.send_time || conversation?.created_time).format('DD/MM/y HH:mm')}</WrapText>
					</View>
				</View>
			</View>
		);
	}

	renderMessageSupporter = (_nextItem: IAssignmentItemConversationItem, _prevItem: IAssignmentItemConversationItem) => {
		const { assignment, conversation, hasSearch } = this.props;
		const { keySearch } = this.state;
		const tempSearchWord = hasSearch && keySearch && conversation.is_match ? [keySearch] : undefined;

		if (!conversation.specific_name_staff_support && conversation.specific_show_staff_reply) {
			this.setLabelSupporter();
		}
		const stateSendDataToServer = conversation.specific_status_message;
		SocialUtils.getStatusSendDataToServerOfAssignmentItem(assignment, conversation);
		if (stateSendDataToServer !== conversation.specific_status_message) {
			this.forceUpdate();
		}
		return (
			<View style={[styles.container, Styles.JustifyEnd, Styles.AlignEnd, { paddingLeft: 64, paddingRight: 30 }]}>
				<View style={[styles.messageDetail, Styles.JustifyEnd, Styles.AlignEnd, Styles.Row]}>
					{
						this.disPlayResendMessage(conversation.specific_status_message) &&
						<View style={Styles.ButtonIcon}>
							<ButtonRipple name={'resend_mess'} size={20} color={Color.primary} onPress={this.resendButton} />
						</View>
					}
					{/* <TouchableWithoutFeedback onLongPress={() => { this.showCopyModal(conversation.message); }} >
					</TouchableWithoutFeedback> */}
					<View style={[styles.messageContainer, { padding: 8, backgroundColor: Color.primary, opacity: this.disPlayResendMessage(conversation.specific_status_message) ? 0.5 : 1 }]}>
						{
							!!conversation.attachments && this.renderAttachments(conversation.attachments, false, false, Constants.Width - 30 - 64 - 24)
						}
						{
							conversation.message_type !== 2 && !!conversation.message &&
							this.renderMessage(tempSearchWord, conversation.message, [Styles.Text_S_R, { maxWidth: Constants.Width - 30 - 64 - 24, color: '#fff' }], '#fff')
						}
						<WrapText st={[Styles.Text_T_R, { marginTop: 4, textAlign: 'right' }]} c={'#fff'}>{moment.unix(conversation?.send_time || conversation?.created_time).format('DD/MM/y HH:mm')}</WrapText>
					</View>
					{
						this.renderMessageStatus(conversation.specific_status_message)
					}
				</View>
				{
					this.disPlayResendMessage(conversation.specific_status_message) &&
					<WrapText st={[Styles.Text_T_R, { marginTop: 6, textAlign: 'right' }]} c={Color.red}>{this.renderMessageWarning(conversation?.specific_status_message)}</WrapText>
				}
				{
					conversation.specific_show_staff_reply && <WrapText st={[Styles.Text_T_R, { marginTop: 4, textAlign: 'right' }]} c={Color.textSecondary}>{conversation.specific_name_staff_support || conversation.created_user}</WrapText>
				}
			</View>
		);
	}

	renderResolveItem = () => {
		const { conversation: item } = this.props;
		if (!item.specific_name_staff_resolve) {
			this.getUsernameById(item.resolved_user, (nameStaff: string) => {
				item.specific_name_staff_resolve = `${nameStaff}`;
				if (item.specific_name_staff_resolve) {
					this.forceUpdate();
				}
			});
		}
		return (
			<View style={styles.resolveContainer}>
				<WrapText st={Styles.Text_T_R} nl={2} c={Color.secondary}>{`Hoàn tất bởi ${item.specific_name_staff_resolve} - ${moment.unix(item?.resolved_time).format('DD/MM/y HH:mm')}`}</WrapText>
			</View>
		);
	}


	render() {
		const { conversation, listViewRef } = this.props;
		const siblingItems: IAssignmentItemConversationItem[] = listViewRef.getItemSibling(conversation);
		const prevItem = siblingItems[1];
		const nextItem = siblingItems[0];

		if (conversation.message_type === 3) {
			return this.renderResolveItem();
		}

		if (!conversation.specific_message_for_page) {
			return this.renderMessageVisitor(nextItem, prevItem);
		}

		return this.renderMessageSupporter(nextItem, prevItem);

	}
}

export default SocialChatRowItem;

