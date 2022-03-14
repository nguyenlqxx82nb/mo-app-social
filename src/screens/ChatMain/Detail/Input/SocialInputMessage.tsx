import React from 'react';
import { View, TouchableOpacity, ScrollView, Keyboard } from 'react-native';
import { Color, Styles, Constants, CustomIcon, pushModal, toast, CommonLanguage } from 'mo-app-common';
import { AsyncImage, ButtonRipple, Tooltip, WrapText } from 'mo-app-comp';
import { AutoGrowingTextInput } from 'react-native-autogrow-textinput';
import PickerFileModal, { IAttachment } from './PickerModal';
import QuicklyReplyModal from '../../../QuicklyReply';
import styles from './styles';
import { IAssignmentItem } from 'api';
import moment from 'moment';
export interface ISocialMessageInputProps {
	avatarForPage: string;
	attachmentIcon?: string;
	hasMessageTag: boolean; // Ẩn/hiện message_tag
	assignment: IAssignmentItem;
	isDisplayMessageTag?: boolean; // Chỉ facebook mới có message_tag
	fileSize?: number; // đơn vị đo MB
	typeUploads?: string[]; // image, video, file
	selectSingleItem?: boolean;
	disabled?: boolean;
	onSend: (value?: string, images?: IAttachment[]) => void;
	onMessageTagPress: () => void;
}

export interface ISocialMessageInputState {
	value: string;
	textWidth: number;
	selectedAttachments: IAttachment[];
	showSendButton: boolean;
	hasMessageTag: boolean;
}

const originTextWidth = Constants.Width - 16 * 2 - 28 - 10 - 30 * 2 - 4 - 8;
const focusTextWidth = Constants.Width - 16 * 2 - 28 - 10 - 35 - 4 - 8;

class SocialMessageInput extends React.PureComponent<ISocialMessageInputProps, ISocialMessageInputState> {
	private isDisplayQuickReply: boolean = false;

	static defaultProps = {
		attachmentIcon: 'add_media',
		typeUploads: ['image', 'file', 'video'],
		selectSingleItem: false,
		disabled: false,
	}

	constructor(props: ISocialMessageInputProps) {
		super(props);
		this.state = {
			textWidth: originTextWidth,
			value: '',
			selectedAttachments: [],
			showSendButton: false,
			hasMessageTag: props.hasMessageTag
		};
	}

	UNSAFE_componentWillReceiveProps(nextProps: ISocialMessageInputProps) {
		const { hasMessageTag } = this.state;
		if (hasMessageTag !== nextProps.hasMessageTag) {
			this.setState({ hasMessageTag: nextProps.hasMessageTag });
		}
	}

	onImageSelectedHandler = (attachments: IAttachment[]) => {
		const { fileSize } = this.props;
		const { value, selectedAttachments } = this.state;
		if (fileSize) {
			const tempAttachments = [];
			let warningToast = '';
			for (const attachment of attachments) {
				if (!attachment || !attachment.type) {
					warningToast = 'Định dạng File không được hỗ trợ';
					continue;
				}
				if (fileSize * 1024 * 1024 < attachment.fileSize) {
					warningToast = `Kích thước tối đa của File không vượt quá ${fileSize}MB`;
					continue;
				}
				tempAttachments.push(attachment);
			}
			if (warningToast) {
				toast(warningToast, 'warning');
				attachments = tempAttachments;
			}
		}
		this.setState({
			selectedAttachments: [...selectedAttachments, ...attachments],
			showSendButton: attachments.length > 0 ? true : value ? true : false
		});
	}

	onMediaFilePressHandler = () => {
		Keyboard.dismiss();
		const { typeUploads, selectSingleItem } = this.props;
		const modal = {
			content: <PickerFileModal typeUploads={typeUploads} onImageSelected={this.onImageSelectedHandler} selectSingleItem={selectSingleItem} />
		};
		pushModal(modal);
	}

	handleReply = (event: any) => {
		if (!event || !event.content || !event.content.trim()) {
			return;
		}
		let text = event.content.trim();
		if (event.personalize && event.personalize.length) {
			const { assignment } = this.props;
			event.personalize.forEach(element => {
				text = text.split(element.key).join(assignment.specific_username || '');
			});
		}
		this.onTextChangeHandler(text);
	}

	getDisplayQuickReplyStatus = () => {
		return this.isDisplayQuickReply;
	}

	handleQuickReplyClose = () => {
		this.isDisplayQuickReply = false;
	}

	onQuickResponseHandler = () => {
		Keyboard.dismiss();
		const { assignment } = this.props;
		if (!assignment || !assignment.specific_page_container) {
			return;
		}
		const modal = {
			content: <QuicklyReplyModal onClose={this.handleQuickReplyClose} onReply={this.handleReply} pageSourceId={assignment.specific_page_container.page_social_id} />
		};
		pushModal(modal);
		this.isDisplayQuickReply = true;
	}

	onTextChangeHandler = (_value: string) => {
		const { selectedAttachments } = this.state;
		this.setState({
			value: _value,
			textWidth: (_value && _value.trim()) ? focusTextWidth : originTextWidth,
			showSendButton: selectedAttachments.length > 0 ? true : _value ? true : false
		});
	}

	clearText = () => {
		console.log('clearText');
		this.setState({
			value: '',
			textWidth: originTextWidth,
			selectedAttachments: [],
			showSendButton: false
		});
	}

	onSendButtonPressHandler = () => {
		this.sendMessage();
	}

	onSubmitHandler = () => {
		this.sendMessage();
	}

	sendMessage = () => {
		const { value, selectedAttachments } = this.state;
		const { onSend } = this.props;
		if ((!value || !value.trim()) && (!selectedAttachments || !selectedAttachments.length)) {
			return;
		}
		this.setState({
			value: '',
			selectedAttachments: [],
			textWidth: originTextWidth,
			showSendButton: false
		});
		if (selectedAttachments.length > 0) {
			onSend && onSend(value && value.trim(), selectedAttachments);
			return;
		}
		if (onSend) {
			onSend(value && value.trim());
		}
	}

	onRemoveImagePressHandler = (index: number) => {
		const { selectedAttachments, value } = this.state;
		if (!selectedAttachments || selectedAttachments.length - 1 < index) {
			return;
		}
		selectedAttachments.splice(index, 1);
		this.setState({
			selectedAttachments: selectedAttachments,
			showSendButton: selectedAttachments.length > 0 ? true : value ? true : false
		},
			() => {
				this.forceUpdate();
			});
	}

	renderSelectedAttachments = () => {
		const { selectSingleItem } = this.props;
		const { selectedAttachments } = this.state;
		if (!selectedAttachments || !selectedAttachments.length) {
			return null;
		}
		const newAttachments = selectSingleItem ? [...selectedAttachments] : [...selectedAttachments, ...[{ type: 'add_new' }]];
		// const newAttachments = [...selectedAttachments, ...[{ type: 'add_new' }]];

		return (
			<ScrollView
				showsHorizontalScrollIndicator={false}
				horizontal={true}
				style={{ borderTopColor: Color.gray, borderTopWidth: 1 }}
				contentContainerStyle={{ padding: 10, paddingTop: 17 }}>
				{
					newAttachments.map((attachment: IAttachment, index: number) => {
						const durationTime = attachment.duration ? moment.utc(attachment.duration * 1000).format('HH:mm:ss') : '';
						if (!attachment.type) {
							return null;
						}
						return (
							<View key={`key_${index}`}>
								{ 	attachment.type.includes('image') &&
									<View style={{ marginRight: 15 }}>
										<AsyncImage source={{ uri: attachment.uri }} width={60} height={60} style={{ overflow: 'hidden', borderRadius: 4 }} />
										<WrapText styles={{ textAlign: 'center' }} s={10} ml={10}>{attachment.name}</WrapText>
									</View>
								}
								{ 	attachment.type.includes('video') &&
									<View style={{ display: 'flex', marginRight: 15 }} >
										<AsyncImage source={{ uri: attachment.uri }} width={60} height={60} style={{ overflow: 'hidden', borderRadius: 4 }} />
										<WrapText styles={{ textAlign: 'center' }} s={10} ml={10}>{attachment.name}</WrapText>
										<View style={[Styles.CenterItem, { position: 'absolute', top: 20, width: '100%' }]} >
											<CustomIcon name={'video_preview'} size={20} color={Color.background} />
										</View>
										<WrapText styles={{ position: 'absolute', bottom: 15, width: '100%', textAlign: 'center' }} s={7} c={Color.background}>{durationTime}</WrapText>
									</View>
								}
								{	!attachment.type.includes('image') && !attachment.type.includes('video') && attachment.type !== 'add_new' && // file
									<View style={{ marginRight: 15 }}>
										<TouchableOpacity
											style={{ padding: 17, backgroundColor: 'rgb(216, 216, 216)', overflow: 'hidden', borderRadius: 4 }}
											onPress={() => { this.onMediaFilePressHandler(); }}>
											<View>
												<CustomIcon name={'single_file'} size={26} color={Color.textSecondary} />
											</View>
										</TouchableOpacity>
										<WrapText styles={{ textAlign: 'center' }} s={10} ml={10}>{attachment.name}</WrapText>
										{
											attachment.type !== 'add_new' &&
											<TouchableOpacity
												style={{ position: 'absolute', top: -7, right: attachment.type.includes('image') ? 7 : -7, width: 14, height: 14, borderRadius: 7, backgroundColor: 'rgb(230, 232, 237)', alignItems: 'center', justifyContent: 'center' }}
												onPress={() => { this.onRemoveImagePressHandler(index); }}>
												<View>
													<CustomIcon name={'close'} size={6} color={Color.text} />
												</View>
											</TouchableOpacity>
										}
									</View>
								}
								{	attachment.type === 'add_new' &&
									<View style={[]}>
										<TouchableOpacity
											style={[Styles.Row, Styles.CenterItem, { width: 60, height: 60, borderStyle: 'dashed', borderColor: Color.primary, borderWidth: 1, borderRadius: 4 }]}
											onPress={() => { this.onMediaFilePressHandler(); }}>
											<View style={[Styles.CenterItem]}>
												<CustomIcon name={'close'} size={16} color={Color.primary} style={{ transform: [{ rotate: '-45deg' }] }} />
											</View>
										</TouchableOpacity>
										<WrapText styles={{ textAlign: 'center' }} s={10}>{'Thêm file'}</WrapText>
									</View>
								}
								{
									(attachment.type.includes('image') || attachment.type.includes('video')) &&
									<TouchableOpacity
										style={{ position: 'absolute', top: -7, right: (attachment.type.includes('image') || attachment.type.includes('video')) ? 7 : -7, width: 14, height: 14, borderRadius: 7, backgroundColor: 'rgb(230, 232, 237)', alignItems: 'center', justifyContent: 'center' }}
										onPress={() => { this.onRemoveImagePressHandler(index); }}>
										<View>
											<CustomIcon name={'close'} size={6} color={Color.text} />
										</View>
									</TouchableOpacity>
								}
							</View>
						);
					})
				}
			</ScrollView>
		);
	}

	render() {
		const { avatarForPage, onMessageTagPress, isDisplayMessageTag, attachmentIcon, disabled, typeUploads } = this.props;
		const { value, textWidth, showSendButton, hasMessageTag } = this.state;
		if (disabled) {
			return (
				<View style={[styles.container, { opacity: 0.5 }]}>
					<View style={[Styles.RowCenter, { marginTop: 20 }]}>
						<AsyncImage source={{ uri: avatarForPage }} width={28} height={28} radius={14} style={{ marginRight: 10 }} />
						<View style={[Styles.RowCenter, Styles.FlexGrow, Styles.Border, Styles.JustifyBetween,
						{ paddingLeft: 8, paddingTop: 3, paddingBottom: 3, paddingRight: 4, borderRadius: 6, borderWidth: 0.5, maxHeight: 90 }]}>
							<View />
							{
								!showSendButton &&
								<View style={[Styles.RowCenter]}>
									<View style={[styles.buttonIcon, Styles.JustifyCenter]}>
										<CustomIcon name={attachmentIcon} size={14} color={Color.text} />
									</View>
									<View style={[styles.buttonIcon, Styles.JustifyCenter]}>
										<CustomIcon name={'quick_response'} size={14} color={Color.text} />
									</View>
								</View>
							}
						</View>
					</View>
				</View>
			);
		}
		return (
			<View style={styles.container}>
				{ this.renderSelectedAttachments()}
				<View style={[{ marginTop: 20 }]}>
					{
						hasMessageTag &&
						<WrapText st={[Styles.Text_S_R]} c={Color.text} nl={2}>
							{'Đã quá thời gian trả lời tin nhắn, bạn hãy dùng Message Tags để nhắn tin với người này'}</WrapText>
					}
					{
						!hasMessageTag &&
						<View style={[Styles.RowCenter]}>
							<AsyncImage source={{ uri: avatarForPage }} width={28} height={28} radius={14} style={{ marginRight: 10 }} />
							<View style={[Styles.RowCenter, Styles.FlexGrow, Styles.Border, Styles.JustifyBetween,
							{ paddingLeft: 8, paddingTop: 3, paddingBottom: 3, paddingRight: 4, borderRadius: 6, borderWidth: 0.5, maxHeight: 90 }]}>
								<View>
									<AutoGrowingTextInput
										style={[Styles.Text_M_R, { width: textWidth, margin: 0, padding: 0 }]}
										onChangeText={this.onTextChangeHandler}
										value={value}
										returnKeyType={'send'}
										keyboardType={'default'}
										placeholder={'Nhập nội dung'}
									/>
								</View>
								{
									!showSendButton &&
									<View style={[Styles.RowCenter]}>
										{/* <View style={[styles.buttonIcon]}>
											<ButtonRipple name={'emoticon'} size={14} color={Color.text} onPress={this.onEmojiPressHandler} />
										</View> */}
										{
											!!typeUploads && !!typeUploads.length &&
											<ButtonRipple width={30} height={30} name={attachmentIcon} size={14} color={Color.text} onPress={this.onMediaFilePressHandler} />
										}
										<ButtonRipple width={30} height={30} name={'quick_response'} size={14} color={Color.text} onPress={this.onQuickResponseHandler} />
									</View>
								}
								{
									showSendButton &&
									<TouchableOpacity
										onPress={this.onSendButtonPressHandler}>
										<View style={[Styles.RowCenter, { marginRight: 5, height: 30 }]}>
											<CustomIcon name={'send_message'} size={25} color={Color.primary} />
										</View>
									</TouchableOpacity>
								}
							</View>
						</View>
					}
				</View>
				{	isDisplayMessageTag &&
					<TouchableOpacity style={[Styles.RowCenter, { marginTop: 20 }]} onPress={onMessageTagPress} disabled={!hasMessageTag}>
						<WrapText st={[Styles.Text_S_R, { marginRight: 5, opacity: hasMessageTag ? 1 : 0.5 }]} c={Color.primary}>{'Dùng Message Tags để gửi tin nhắn'}</WrapText>
						<Tooltip
							tooltipTitle={'Dùng Message Tags để gửi tin nhắn'}
							tooltipContent={'Theo chính sách của Facebook: Message Tag cho phép gửi tin nhắn tới người dùng CHO MỘT SỐ MỤC ĐÍCH HẠN CHẾ ngoài khung thời gian tiêu chuẩn. Khung thời gian tiêu chuẩn được tính là 24 giờ kể từ lần cuối cùng khách hàng nhắn tin đến Fanpage.'}
							onTextTooltipPress={onMessageTagPress} />
					</TouchableOpacity>
				}

			</View>
		);
	}
}

export default SocialMessageInput;

