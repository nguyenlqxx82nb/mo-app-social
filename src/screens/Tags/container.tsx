import React from 'react';
import { View } from 'react-native';
import TagSearchList, { ITagItem } from './Search';
import SocialListSelectTag from './List';
const cloneDeep = require('clone-deep');

interface ITagsState {
	selectedItems: ITagItem[];
	isTagCollapse: boolean;
}

interface ITagsProps {
	selectedTagTitle?: string;
	ignoreSelectedTag?: boolean;
	fixTags?: ITagItem[];
	selectedTags?: ITagItem[];
	type: 'assign' | 'profile' | 'social';
	items?: ITagItem[];
	searchListContainer?: {};
}

export default class SocialTagsContainer extends React.PureComponent<ITagsProps, ITagsState> {
	tagSearchList: TagSearchList;
	static defaultProps = {
		fixTags: [],
		selectedTags: []
	}

	lwTagsRef: SocialListSelectTag;
	constructor(props: ITagsProps) {
		super(props);
		this.state = {
			selectedItems: props.selectedTags || [],
			isTagCollapse: true,
		};
	}

	setSelectedTag = (selectedTags: ITagItem[]) => {
		this.setState({ selectedItems: cloneDeep(selectedTags) });
		selectedTags.forEach(tag => {
			this.tagSearchList && this.tagSearchList.updateViewItem(cloneDeep(tag));
		});
	}

	getSelectedItems = () => {
		const { selectedItems } = this.state;
		const { fixTags } = this.props;
		const tags = [...(fixTags || []), ...selectedItems];
		return tags;
	}

	onItemSelectHandler = (item: ITagItem, active: boolean) => {
		const { selectedItems } = this.state;
		const index = selectedItems.findIndex((_item: ITagItem) => {
			return _item.id === item.id;
		});
		if (index >= 0 && !active) {
			selectedItems.splice(index, 1);
		}
		if (index < 0 && active) {
			selectedItems.push(item);
		}
		this.setState({ selectedItems: cloneDeep(selectedItems) });
		if (selectedItems.length === 0) {
			this.setState({ isTagCollapse: true });
		}
	}

	onRemoveItemHandler = (item: ITagItem) => {
		const { selectedItems } = this.state;
		const index = selectedItems.findIndex((_item: ITagItem) => {
			return _item.id === item.id;
		});
		selectedItems.splice(index, 1);
		this.setState({ selectedItems: cloneDeep(selectedItems) });
		this.tagSearchList && this.tagSearchList.updateViewItem(item);
		if (selectedItems.length === 0) {
			this.setState({ isTagCollapse: true });
		}
	}

	handleRestoreDefault = () => {
		this.tagSearchList && this.tagSearchList.handleRestoreDefault();
	}

	render() {
		const { selectedItems, isTagCollapse } = this.state;
		const { fixTags, selectedTagTitle, type, items, ignoreSelectedTag, searchListContainer } = this.props;
		const hasFixTag = fixTags && fixTags.length ? true : false;
		let ignoreKeys = fixTags.map((item: any) => {
			return item.id;
		});
		// const selectedKeys = selectedItems.map((item: any) => {
		// 	return item.id;
		// });
		// ignoreKeys = [...ignoreKeys, ...selectedKeys];
		ignoreKeys = [...ignoreKeys];
		return (
			<View style={{ flexGrow: 1 }} >
				{
					hasFixTag &&
					<SocialListSelectTag
						type={type}
						title={'Tag đã gắn'}
						canRemove={false}
						isTagCollapse={true}
						selectedItems={fixTags}
					/>
				}
				{	!ignoreSelectedTag &&
					<SocialListSelectTag
						type={type}
						title={!hasFixTag ? '' : selectedTagTitle}
						canRemove={true}
						isTagCollapse={isTagCollapse}
						selectedItems={selectedItems}
						ignoreNote={hasFixTag ? false : true}
						onRemoveItem={this.onRemoveItemHandler}
					/>
				}
				<TagSearchList
					searchListContainer={searchListContainer}
					ref={comp => { this.tagSearchList = comp; }}
					type={type}
					items={items}
					selectedItems={selectedItems}
					ignoreKeys={ignoreKeys}
					onItemSelect={this.onItemSelectHandler}
				/>
			</View>
		);
	}
}
