import React from 'react';
import { View, Keyboard } from 'react-native';
import { ITagItem } from '../Search';
import { Styles, Color, pushModal } from 'mo-app-common';
import { WrapText, ButtonRipple } from 'mo-app-comp';
import SocialModalListSelectTag from './Modal';

interface ISocialListSelectTagState {
	selectedItems: ITagItem[];
	watchMoreTagText: string;
}

interface ISocialListSelectTagProps {
	title: string;
	canRemove: boolean;
	isTagCollapse: boolean;
	selectedItems: ITagItem[];
	note?: string;
	type: 'assign' | 'profile' | 'social'
	onRemoveItem?: (item: ITagItem) => void;
	wrapperStyles?: any;
	scrollViewStyles?: any;
	maxHeight?: number;
	ignoreNote?: boolean;
}

export default class SocialListSelectTag extends React.PureComponent<ISocialListSelectTagProps, ISocialListSelectTagState> {

	static defaultProps = {
		selectedItems: [],
		maxHeight: 80,
		note: 'Vui lòng nhập Tag nội dung chính xác, Tag đã gắn thành công sẽ không gỡ được.'
	}

	constructor(props: ISocialListSelectTagProps) {
		super(props);
		const { selectedItems } = props;
		this.state = {
			selectedItems: selectedItems || [],
			watchMoreTagText: props.selectedItems ? this.renderWatchMoreTag(props.selectedItems.length) : '',
		};
	}

	UNSAFE_componentWillReceiveProps(nextProps: ISocialListSelectTagProps) {
		if (nextProps.selectedItems !== this.state.selectedItems) {
			this.setState({
				selectedItems: nextProps.selectedItems,
				watchMoreTagText: nextProps.selectedItems ? this.renderWatchMoreTag(nextProps.selectedItems.length) : '',
			});
		}
	}

	renderWatchMoreTag = (tagLength: number) => {
		const { canRemove } = this.props;
		return canRemove ? `Xem ${tagLength} tag đã chọn` : `Xem ${tagLength} tag`;
	}

	setSelectedItems = (items: any) => {
		this.setState({ selectedItems: items });
	}

	onRemoveTagHandler = (item: ITagItem) => {
		const { onRemoveItem } = this.props;
		const { selectedItems } = this.state;
		this.setState({ selectedItems: selectedItems.filter(tag => { return tag.id !== item.id; }) });
		onRemoveItem(item);
	}

	handleWatchMoreTag = () => {
		const { canRemove, type } = this.props;
		const { selectedItems } = this.state;
		Keyboard.dismiss();
		const modal = {
			content: <SocialModalListSelectTag selectedItems={selectedItems} canRemove={canRemove} type={type} onRemoveItem={this.onRemoveTagHandler} />
		};
		pushModal(modal);
	}

	render() {
		const { watchMoreTagText } = this.state;
		const { title, canRemove, note, type, wrapperStyles, ignoreNote } = this.props;
		const isProfileTag = type === 'profile' ? true : false;
		const wrapper = wrapperStyles ? wrapperStyles : { marginRight: 11, marginLeft: 16, marginTop: 8 };

		return (
			<View>
				<View style={[Styles.RowCenter, Styles.JustifyBetween, wrapper]}>
					{!!title && <WrapText st={[Styles.Text_M_M]}>{title}</WrapText>}
					{!!watchMoreTagText && 
						<ButtonRipple
							radius={1}
							onPress={this.handleWatchMoreTag}>
							<WrapText st={[Styles.Text_S_R, {paddingHorizontal: 5, paddingVertical: 8}]} c={Color.primary} nl={1}>{watchMoreTagText}</WrapText>
						</ButtonRipple>
					}
				</View>
				{
					!ignoreNote && isProfileTag && canRemove && <WrapText st={[Styles.Text_S_R, { marginHorizontal: 20, paddingBottom: 8 }]} c={Color.red} nl={2}>{note}</WrapText>
				}
			</View>
		);
	}
}
