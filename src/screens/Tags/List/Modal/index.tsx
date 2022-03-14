import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Styles, Color, Device, Constants } from 'mo-app-common';
import { WrapText, ButtonRipple, AsyncImage, WrapModal } from 'mo-app-comp';
import { ITagItem } from '../../Search';

interface SocialModalListSelectTagState {
	selectedItems: ITagItem[];
}

interface SocialModalListSelectTagProps {
	selectedItems: ITagItem[];
	type: 'assign' | 'profile' | 'social'
	canRemove?: boolean;
	onRemoveItem?: (item: ITagItem) => void;
}

export default class SocialModalListSelectTag extends React.PureComponent<SocialModalListSelectTagProps, SocialModalListSelectTagState> {
	modalRef: WrapModal;

	static defaultProps: SocialModalListSelectTagProps = {
		selectedItems: [],
		type: 'assign',
	}

	constructor(props: SocialModalListSelectTagProps) {
		super(props);
		this.state = {
			selectedItems: props.selectedItems
		};
	}

	onRemoveTagHandler = (item: ITagItem) => {
		const { onRemoveItem } = this.props;
		const { selectedItems } = this.state;
		this.setState({ selectedItems: selectedItems.filter(tag => { return tag.id !== item.id; }) });
		onRemoveItem && onRemoveItem(item);
	}

	handleCloseModal = () => {
		this.modalRef && this.modalRef.close();
	}

	handleRemoveAllTag = () => {
		const { selectedItems } = this.state;
		const { onRemoveItem } = this.props;
		if (!selectedItems || !selectedItems.length) {
			return;
		}
		const cloneSelectedItems = [...selectedItems];
		cloneSelectedItems.forEach(item => {
			onRemoveItem && onRemoveItem(item);
		});
		this.setState({ selectedItems: [] });
	}

	render() {
		const { canRemove, type } = this.props;
		const { selectedItems } = this.state;
		return (
			<WrapModal
				ref={(comp: any) => { this.modalRef = comp; }}
				autoOpen={true}
				overlayOpacity={0.65}
				zIndexContent={0}
				position={'bottom'}>
				<View style={[styles.container]}>
					<View style={[Styles.RowCenter, Styles.JustifyBetween, { paddingBottom: 10 }]}>
						<View style={[Styles.RowCenter, Styles.JustifyBetween]}>
							<WrapText st={[Styles.Text_M_M]}>{'Các tag đã chọn'}</WrapText>
							{canRemove && !!selectedItems.length &&
							 <ButtonRipple
								containerStyle={{marginLeft: 10}}
							 	onPress={this.handleRemoveAllTag}>
								<WrapText st={[Styles.Text_S_R, { paddingHorizontal: 10, paddingVertical: 10}]} c={Color.primary} >{'Bỏ chọn tất cả'}</WrapText>
							 </ButtonRipple>	
							}
						</View>
						<ButtonRipple name={'close'} size={14} color={Color.text}
								onPress={this.handleCloseModal} />
					</View>

					{
						selectedItems.length > 0 &&
						<ScrollView>
							<View style={[styles.scrollView]}>
								{
									selectedItems.map((item: ITagItem, index: number) => {
										const bgColor = item.bgColor || Color.secondary;
										const color = item.color || '#fff';
										return (
											<View key={`key_${index}`} style={[Styles.RowCenter, { paddingLeft: 12, paddingRight: 12, paddingVertical: 5, backgroundColor: bgColor, borderRadius: 20, marginBottom: 8, marginRight: 5 }]}>
												{
													type === 'social' && <AsyncImage source={{ uri: item.avatar }} width={20} height={20} radius={10} style={{ marginRight: 8 }} />
												}
												<WrapText st={[Styles.Text_S_R, { marginRight: 5, maxWidth: 120 }]} c={color} nl={1}>{item.name}</WrapText>
												{
													canRemove &&
													<View style={{ width: 20, height: 20, borderColor: color, borderWidth: 1, borderRadius: 10 }}>
														<ButtonRipple name={'close'} width={20} height={20} size={8} color={color} onPress={() => this.onRemoveTagHandler(item)} />
													</View>
												}
											</View>
										);
									})
								}
							</View>
						</ScrollView>
					}
					{
						(!selectedItems || !selectedItems.length) &&
						<View style={[Styles.JustifyCenter, Styles.AlignCenter, { flexGrow : 1 }]}>
							<WrapText st={[Styles.Text_S_R]} c={Color.textSecondary} nl={1}>{'Các tag đã chọn sẽ xuất hiện'}</WrapText>
							<WrapText st={[Styles.Text_S_R]} c={Color.textSecondary} nl={1}>{'sau khi bạn chọn tag ở danh sách'}</WrapText>
						</View>
					}

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
		paddingTop: 10,
		paddingBottom: Device.isIphoneX ? 20 + 30 : 20,
		paddingHorizontal: 16,
		height: Constants.Height * 3 / 5
	},

	scrollView: {
		flexDirection: 'row',
		flexWrap: 'wrap',
	}
});
