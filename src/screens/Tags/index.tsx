import React from 'react';
import { View } from 'react-native';
import { Styles, Color, Constants } from 'mo-app-common';
import { ButtonRipple, WrapText, Router, WrapButton, WrapModal, DismissKeyboard } from 'mo-app-comp';
import { ITagItem } from './Search';
import SocialListSelectTag from './List';
import SocialTagsContainer from './container';
import styles from './styles';

interface ITagsProps {
	title: string;
	selectedTagTitle?: string;
	ignoreSelectedTag?: boolean;
	fixTags?: ITagItem[];
	selectedTags?: ITagItem[];
	items?: ITagItem[];
	type: 'assign' | 'profile' | 'social';
	hasRestoreDefault?: boolean;
	searchListContainer?: {};
	onApplyHandler: (items: ITagItem[], callback?: Function) => void;
	onRestoreDefault?: () => void;
}
interface ITagsState {
	selectedItems: ITagItem[];
	isTagCollapse: boolean;
	enableApplyButton: boolean;
	isRestoreEnable: boolean;
}

export default class SocialTagsModal extends React.PureComponent<ITagsProps, ITagsState> {
	
	static defaultProps = {
		fixTags: [],
		selectedTags: []
	}
	
	tagsRef: SocialTagsContainer;
	lwTagsRef: SocialListSelectTag;
	rawSelectedTags: ITagItem[];

	modalRef: WrapModal;

	constructor(props: ITagsProps) {
		super(props);
		this.state = {
			selectedItems: props.selectedTags || [],
			isTagCollapse: true,
			enableApplyButton: true,
			isRestoreEnable: props.hasRestoreDefault
		};
	}

	onBackHandler = () => {
		Router.pop();
	}

	private handleAssignTagsSuccess = () => {
		this.setState({enableApplyButton: true});
	}

	handleAssignTags = () => {
		this.setState({enableApplyButton: false});
		const { onApplyHandler } = this.props;
		const selectedItems = this.tagsRef.getSelectedItems();
		onApplyHandler(selectedItems, this.handleAssignTagsSuccess);
		this.close();
	}

	private handleRestoreDefault = () => {
		const { onRestoreDefault } = this.props;
		this.tagsRef && this.tagsRef.handleRestoreDefault();
		this.tagsRef && this.tagsRef.setSelectedTag([]);
		onRestoreDefault && onRestoreDefault();
		
		this.setState({
			isRestoreEnable: false
		});
	}

	handleOnClosePress = () => {
		this.close();
	}

	close = () => {
		this.modalRef.close();
	}

	render() {
		const { selectedItems, enableApplyButton, isRestoreEnable } = this.state;
		const { title, fixTags, selectedTagTitle, type, items, ignoreSelectedTag, hasRestoreDefault, searchListContainer } = this.props;
		return (
			<WrapModal
				ref={(ref) => {this.modalRef = ref;}}
				position={'bottom'}
				autoOpen={true}
				ignoreKeyboardScroll={true}
				overlayOpacity={0.65}>
				<View style={[Styles.ModalContainer, {height: Constants.Height - Constants.BarHeight - 50}]}>	
					<DismissKeyboard>
						<View style={[Styles.ModalHeader]}>
							<WrapText st={[Styles.Text_L_SB]}>{title}</WrapText>
							<ButtonRipple name={'close'} size={13} color={Color.text} onPress={this.handleOnClosePress} />
						</View>
					</DismissKeyboard>
					<View style={[{ flexGrow: 1}]}>
						<SocialTagsContainer
							ref={ref => { this.tagsRef = ref; }}
							items={items}
							selectedTagTitle={selectedTagTitle}
							ignoreSelectedTag={ignoreSelectedTag}
							fixTags={fixTags}
							selectedTags={selectedItems}
							searchListContainer={searchListContainer}
							type={type} />
					</View>

					<View style={styles.bottomContainer}>
						{hasRestoreDefault &&
							<WrapButton
								text={'Khôi phục'}
								// enable={isRestoreEnable}
								width={(Constants.Width - 16 * 3) / 2}
								size={'m'}
								containerStyle={{ marginRight: 16 }}
								type={'border'}
								active={true}
								onPress={this.handleRestoreDefault}
							/>
						}
						<WrapButton
							enable={enableApplyButton}
							text={'Áp dụng'}
							width={hasRestoreDefault ? (Constants.Width - 16 * 3) / 2 : '70%'}
							size={'m'}
							onPress={this.handleAssignTags}
						/>
					</View>

				</View>
			</WrapModal>
			
		);
	}
}
