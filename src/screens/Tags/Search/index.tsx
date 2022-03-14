import React from 'react';
import { View, Keyboard, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { FormInput, ListView, WrapText, Checkbox, AsyncImage } from 'mo-app-comp';
import { Constants, Styles, CustomIcon, HOST_SOCIAL, BaseServiceParam, HOST_PROFILING } from 'mo-app-common';

export interface ITagItem {
	id: string;
	name: string;
	avatar?: string;
	active?: boolean;
	color?: string;
	bgColor?: string;
}

interface ITagSearchListState {
	serviceParam: BaseServiceParam;
	keyBoardHeight: number;
}

interface ITagSearchListProps {
	type: 'assign' | 'profile' | 'social';
	ignoreKeys: string[];
	selectedItems?: ITagItem[];
	items?: ITagItem[];
	searchListContainer?: {};
	onItemSelect: (item: ITagItem, active: boolean) => void;
	// onItemSelectAll: (items: ITagItem[]) => void;
	onLayout?: (e: any) => void;
}

export default class TagSearchList extends React.PureComponent<ITagSearchListProps, ITagSearchListState> {
	static defaultProps = {
		items: []
	}
	lvRef: ListView;
	searchInputRef: FormInput;
	private subKeyboardWillShow: any;
	private subKeyboardWillHideListener: any;

	constructor(props: ITagSearchListProps) {
		super(props);
		this.state = {
			serviceParam: undefined,
			keyBoardHeight: 0
		};
	}

	createServiceParam = async () => {
		const { type } = this.props;
		let serviceParam: BaseServiceParam;
		let hostApiPath;
		if (type === 'assign') {
			hostApiPath = await HOST_SOCIAL();
			serviceParam =
			{
				hostApiPath: hostApiPath,
				path: 'social-tag',
				paging: {
					page: 'page',
					per_page: 'per_page',
					search: 'search'
				},
				successCode: '001',
				response: {
					dataKey: 'tag',
					item: {
						id: 'id',
						name: 'value',
						color: (item: any) => {
							return item.properties ? item.properties.foreground_color : '';
						},
						bgColor: (item: any) => {
							return item.properties ? item.properties.background_color : '';
						}
					}
				}
			};
		}

		if (type === 'profile') {
			hostApiPath = await HOST_PROFILING();
			serviceParam =
			{
				hostApiPath: hostApiPath,
				path: `merchants/${Constants.MerchantId}/tags`,
				query: {
					roles: 'assign'
				},
				paging: {
					page: 'page',
					per_page: 'per_page',
					search: 'search_text'
				},
				response: {
					dataKey: 'datas',
					item: {
						id: 'tag_id',
						name: 'tag_name',
					}
				}
			};
		}

		this.setState({ serviceParam: serviceParam });
	}

	componentDidMount() {
		this.subKeyboardWillShow = Keyboard.addListener('keyboardWillShow', this.handleKeyboardWillShow);
		this.subKeyboardWillHideListener = Keyboard.addListener('keyboardWillHide', this.handleKeyboardWillHide);
		this.createServiceParam();
	}

	componentWillUnmount() {
		this.subKeyboardWillShow.remove();
		this.subKeyboardWillHideListener.remove();
	}

	handleKeyboardWillShow = (e) => {
		this.setState({ keyBoardHeight: e.endCoordinates.height });
	}

	handleKeyboardWillHide = () => {
		this.setState({ keyBoardHeight: 0 });
	}

	onSearchHandler = (val: string) => {
		const { items } = this.props;
		const localSearch = !items || !items.length ? false : true;
		this.lvRef && this.lvRef.performSearch(val, localSearch);
		Keyboard.dismiss();
		this.lvRef && this.lvRef.setState({ isCheckAll: false });
	}

	onTagItemSelectHandler = (active: boolean, item: ITagItem) => {
		const { onItemSelect } = this.props;
		item.active = active;
		onItemSelect && onItemSelect(item, active);
		if (!this.lvRef || !this.lvRef.Items) {
			return;
		}
		if (!active) {
			if (this.lvRef.state.isCheckAll) {
				this.lvRef && this.lvRef.setState({ isCheckAll: false });
			}
			return;
		}
		const activedItems = this.lvRef && this.lvRef.Items.filter(tag => { return tag.active; });
		if (activedItems.length !== this.lvRef.Items.length) {
			return;
		}
		this.lvRef && this.lvRef.setState({ isCheckAll: true });
	}

	// onTagSelectAllHandler = (items: ITagItem[]) => {
	// 	const { onItemSelectAll } = this.props;
	// 	onItemSelectAll(items);
	// }

	renderRowItem = (_type: any, item: ITagItem, _index: number) => {
		const { type } = this.props;
		const { selectedItems, } = this.props;
		let checkboxRef: Checkbox;

		item.active = false;
		if (selectedItems && selectedItems.length && selectedItems.find(selectedTag => { return selectedTag.id === item.id; })) {
			item.active = true;
		}

		return (
			<Checkbox
				ref={(comp) => { checkboxRef = comp; }}
				containerStyle={Styles.CbItem}
				active={item.active}
				value={item.id}
				onActiveChange={(_active: boolean, _value: any) => { this.onTagItemSelectHandler(_active, item); }} 
				renderLeft={() => {
					return (
						<View style={[Styles.Row]}>
							{
								(type === 'assign') &&
								<CustomIcon name={'call_status'} size={8} color={item.bgColor} style={{ marginRight: 8 }} />
							}
							{
								(type === 'social') &&
								<AsyncImage source={{ uri: item.avatar }} width={20} height={20} radius={10} style={{ marginRight: 8 }} />
							}
							<WrapText st={Styles.CbLabelItem}>{item.name}</WrapText>
						</View>
					)
				}}/>
		);
	}

	updateViewItem = (item) => {
		if (!this.lvRef) {
			return;
		}
		this.lvRef.updateItem(item);
	}

	handleRestoreDefault = () => {
		this.searchInputRef && this.searchInputRef.onClearInputTextHandler();
	}

	render() {
		const { serviceParam } = this.state;
		const { ignoreKeys, items, searchListContainer, onLayout, onItemSelect } = this.props;
		const hasService = serviceParam ? true : false;
		return (
			<View style={[styles.container, searchListContainer]} onLayout={onLayout}>
				<View style={{ marginHorizontal: 16 }}>
					<FormInput
						ref={(comp) => { this.searchInputRef = comp; }}
						icon={'search'}
						placeholder={'Tìm kiếm'}
						autoValidate={false}
						validRequire={false}
						hasClear={true}
						onSubmit={this.onSearchHandler}
						onClearValue={() => { console.log('clearvalue'); this.onSearchHandler(''); }}
						containerStyle={{ marginBottom: 0, }}
						enable={true}
					/>
				</View>

				<View style={{ flex: 1, flexGrow: 1 }}>
					{
						(hasService || items.length > 0) &&
						<ListView
							ref={(comp: any) => { this.lvRef = comp; }}
							hasCheckAll={true}
							onRenderRow={this.renderRowItem}
							hasExtendedState={true}
							wr={Constants.Width}
							hr={40}
							top={0}
							pageSize={25}
							autoLoad={hasService ? true : false}
							serviceParams={serviceParam}
							icon={'work_done'}
							containerStyle={{ marginHorizontal: 0, paddingHorizontal: 0 }}
							onItemSelect={onItemSelect}
							// onCheckAllItems={this.onTagSelectAllHandler}
							ignoreItemKeys={ignoreKeys}
							items={items}
						/>
					}
				</View>
			</View>
		);
	}
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		// paddingTop: 8,
		backgroundColor: '#fff'
	}
});
