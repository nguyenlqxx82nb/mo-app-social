import React from 'react';
import { View } from 'react-native';
import { Styles, Color, CustomIcon, SocialService } from 'mo-app-common';
import { ButtonRipple, WrapText, Router, Dropdown, FormInput, KeyboardScrollView, WrapButton, IValidPattern } from 'mo-app-comp';

interface IMessageTag {
	id?: string;
	name?: string;
	tag_desc?: string;
	ignore_words?: string[];
	ignore_content?: string[];
	value?: string;
}

interface IMessageTagScreenProps {
	onSendMessageTag?: (message: IMessageTag) => void;
}
interface IMessageTagScreenState {
	tag_name: string;
	tag_desc: string;
	ignore_words: string[];
	ignore_content: string[];
	isEnableSendButton?: boolean;
}

export default class SocialMessageTagScreen extends React.PureComponent<IMessageTagScreenProps, IMessageTagScreenState> {

	dTagRef: Dropdown;
	noteRef: FormInput;
	tagData: IMessageTag[];
	patternConvert: IValidPattern;

	constructor(props: any) {
		super(props);
		this.state = {
			tag_name: '',
			tag_desc: '',
			ignore_words: [],
			ignore_content: [],
			isEnableSendButton: true
		};
	}

	componentDidMount() {
		this.initDemo();
	}

	initDemo = () => {
		this.tagData = [
			{
				id: '1',
				name: 'HUMAN_AGENT',
				tag_desc: 'Cho phép trả lời khách hàng nhắn tin đến Fanpage trong vòng 7 ngày sau tin nhắn cuối cùng của khách hàng.',
				ignore_words: [],
				ignore_content: ['Tin nhắn trả lời tự động', 'Nội dung trả lời không liên quan đến câu hỏi của khách hàng']
			},
			// {
			// 	id: '2',
			// 	name: 'POST_PURCHASE_UPDATE',
			// 	tag_desc: 'Sử dụng cho mục đích thông báo về giao dịch, tình trạng đơn hàng, lịch giao hàng hoặc những thay đổi khác liên quan đến đơn hàng.',
			// 	ignore_words: ['ưu đãi','mã ưu đãi','giảm giá', 'mã giảm giá', 'voucher', 'mã voucher', 'coupon', 'mã coupon', 'sale', 'sale off', 'discount', 'promotion', 'promotional...'],
			// 	ignore_content: ['Nội dung quảng cáo, bao gồm nhưng không giới hạn: ưu đãi, giảm giá, coupon, voucher... ', 'Nội dung crosssell, upsell sản phẩm, dịch vụ.', 'Yêu cầu thực hiện khảo sát, đánh giá, nhận xét không liên quan tới các tương tác trước đó trong tin nhắn Messenger.']
			// },
			// {
			// 	id: '3',
			// 	name: 'ACCOUNT_UPDATE',
			// 	tag_desc: 'Sử dụng cho mục đích thông báo về những thay đổi liên quan đến thông tin cá nhân (ví dụ: thẻ tín dụng), cảnh báo về các giao dịch giả mạo...',
			// 	ignore_words: ['ưu đãi','mã ưu đãi','giảm giá', 'mã giảm giá', 'voucher', 'mã voucher', 'coupon', 'mã coupon', 'sale', 'sale off', 'discount', 'promotion', 'promotional...'],
			// 	ignore_content: ['Nội dung quảng cáo , bao gồm nhưng không giới hạn: ưu đãi, giảm giá, coupon, voucher... ', 'Nội dung định kì (ví dụ: thông báo hóa đơn đến hạn thanh toán, việc làm mới...)', 'Yêu cầu thực hiện khảo sát, đánh giá, nhận xét không liên quan tới các tương tác trước đó trong tin nhắn Messenger.']
			// }
		];

		this.dTagRef.setData(this.tagData, '1');
	}

	changePattern = (item: IMessageTag) => {
		const pattern = this.patternMessageTag(item.ignore_words);
        if (!pattern) {
            return;
		}
		this.patternConvert = {
            message: 'Nội dung tin nhắn không được chứa các từ khóa bị chặn.',
            pattern: new RegExp(pattern, '\i')
        };
	}

	onBackHandler = () => {
		Router.pop();
	}

	private patternMessageTag(listWords: Array<string>) {
        let pattern = '';
        if (!listWords || !listWords.length) {
            return pattern;
        }
        listWords.forEach((word, index) => {
            if (index === 0) {
                pattern = word;
                return;
            }
            pattern = `${pattern}|${word}`;
        });
        return `(${pattern})`;
	}

	onTagSelectHandler = (item: IMessageTag) => {
		this.setState({
			tag_desc: item.tag_desc,
			tag_name: item.name,
			ignore_content: item.ignore_content,
			ignore_words: item.ignore_words
		});
		this.changePattern(item);
	}

	onSendHandler = () => {
		this.setState({ isEnableSendButton: false });
		const { onSendMessageTag } = this.props;
		const { tag_name } = this.state;
		if (!this.noteRef || !tag_name || !onSendMessageTag) {
			this.setState({ isEnableSendButton: true });
			return;
		}
		if (!this.noteRef.validate()) {
			this.setState({ isEnableSendButton: true });
			return;
		}
		const messagetag: IMessageTag = {
			name: tag_name,
			value: this.noteRef.getValue()
		};
		onSendMessageTag(messagetag);
		Router.pop();
	}

	renderDropDownTagBase = (item: IMessageTag) => {
		return (
      <View style={[Styles.Border, Styles.Row, Styles.JustifyBetween, Styles.AlignCenter, { height: 28, paddingHorizontal: 10 }]}>
        <WrapText st={[Styles.Text_S_R]}>{item ? item.name : 'Chọn kiểu tag'}</WrapText>
        <CustomIcon size={10} name={'drop_down'} color={Color.text} />
      </View>
    );
	}

	renderDropDownTagItem = (item: IMessageTag, selectedKey: string) => {
		return (
      <View style={[Styles.Row, Styles.JustifyBetween, Styles.AlignCenter, { height: 28 }]}>
        <WrapText st={[Styles.Text_S_R, { marginLeft: 5, marginRight: 5 }]} c={Color.text}>{item.name}</WrapText>
        { selectedKey === item.id && <CustomIcon name={'mark_selected'} size={10} color={Color.text} />}
      </View>
    );
	}

	render() {
		const { ignore_content, ignore_words, tag_desc, tag_name, isEnableSendButton } = this.state;
		const hasNote = tag_name ? true : false;
		return (
			<View style={[Styles.container]}>
				<View style={[Styles.Header, { paddingLeft: 5, paddingRight: 0}]}>
					<View style={[Styles.Row]}>
						<ButtonRipple name={'nav_back'} size={16} color={Color.text} onPress={this.onBackHandler} />
						<WrapText st={Styles.Text_L_B} onPress={this.onBackHandler}>{'Gửi tin nhắn với Message Tags'}</WrapText>
					</View>
				</View>
				<KeyboardScrollView contentContainerStyle={{padding: 20}}>
					<View>
						<WrapText st={[Styles.Text_S_M, {marginBottom: 8}]}>{'Loại Message Tags'}</WrapText>
						<Dropdown
							ref={ref => { this.dTagRef = ref; }}
							align={'left'}
							autoSelect={true}
							itemVisibleNumber={5}
							height={28}
							renderBase={this.renderDropDownTagBase}
							renderItem={this.renderDropDownTagItem}
							pickerStyleOverrides={{}}
							dropdownOffset={{ top: 35, left: 0 }}
							onItemSelected={this.onTagSelectHandler}
						/>
					</View>

					<View style={{marginTop: 20,marginBottom: 10}}>
						<FormInput
							label={'Nội dung tin nhắn'}
							// validPattern={[this.patternConvert]}
							ref={ref=>{this.noteRef = ref;}}
							multiLine={true}
							text={''}
							autoValidate={false}
							inputWrapStyle={{height: 150, paddingBottom: 0}}
							placeholder={'Nhập nội dung ...'}
							emptyErrorMessage={'Vui lòng nhập nội dung.'} />
					</View>

					<View style={[Styles.CenterItem]}>
						<WrapButton
							enable={isEnableSendButton}
							text={'Gửi'}
							width={80}
							size={'m'}
							onPress={this.onSendHandler}
						/>
					</View>

					{
						hasNote && (
							<View>
								<WrapText up={true} st={[Styles.Text_M_M, {textAlign: 'center', marginTop: 20, marginBottom: 10, color: Color.red}]}>{'Lưu ý đặc biệt'}</WrapText>
								<View style={{backgroundColor: Color.gray, paddingHorizontal: 8, paddingTop: 12, paddingBottom: 50, borderRadius: 5}}>
									<View>
										<WrapText st={[Styles.Text_M_M]}>{`Tag ${tag_name} :`}</WrapText>
										<WrapText st={[Styles.Text_S_R, {marginTop: 5}]} nl={10}>{tag_desc}</WrapText>
									</View>

									{
										ignore_words.length > 0 &&
										<View style={{marginTop: 20}}>
											<WrapText st={[Styles.Text_M_M]}>{'Từ khóa không được phép xuất hiện:'}</WrapText>
											<View style={{marginTop: 5, flexWrap: 'wrap', flexDirection: 'row'}}>
												{
													ignore_words.map( (name : string, index: number) => {
														const _content = index <= ignore_words.length - 1 ? `${name}, ` : `${name}`;
														return (
															<WrapText st={[Styles.Text_S_R, {color: Color.red}]}>{`${_content}`}</WrapText>
														);
													})
												}
											</View>
										</View>
									}

									{ ignore_content.length > 0 &&
										<View style={{marginTop: 20}}>
											<WrapText st={[Styles.Text_M_M]}>{'Trường hợp không được phép sử dụng:'}</WrapText>
											<View style={{marginTop: 5}}>
												{
													ignore_content.map((content: string) => {
														return (
															<View style={[Styles.RowCenter, {paddingVertical: 8}]}>
																<View style={[Styles.CenterItem, {width: 40}]}>
																	<CustomIcon name={'call_status'} size={5} color={Color.text} />
																</View>
																<View style={{overflow: 'hidden' ,flex: 1}}>
																	<WrapText st={[Styles.Text_S_R, {overflow: 'hidden'}]} nl={5}>{content}</WrapText>
																</View>
															</View>
														);
													})
												}
											</View>
										</View>
									}
								</View>
							</View>
						)
					}
				</KeyboardScrollView>
			</View>
		);
	}
}
