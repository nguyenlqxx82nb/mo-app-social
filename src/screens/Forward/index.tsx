import React from 'react';
import { View } from 'react-native';
import { Styles, Color, Constants, SocialService, toast, CustomIcon } from 'mo-app-common';
import { WrapText, ButtonRipple, Router, WrapButton, Dropdown } from 'mo-app-comp';
import SocialTagsContainer from '../Tags/container';
import { IAssignmentItem, IFeatureAssign, IPageAssign, IStaff } from 'api';
import { ITagItem } from 'screens/Tags/Search';
import Languages from 'mo-app-common/src/Common/Languages';

interface SocialForwardChatScreenProps {
	assignment: IAssignmentItem;
	feature: IFeatureAssign;
	onForward?: (assignType: string, teamId: string) => void;
}
interface SocialForwardChatScreenState {
	isDisableReception: boolean;
	isEnableApply: boolean;
}
export default class SocialForwardChatScreen extends React.PureComponent<SocialForwardChatScreenProps, SocialForwardChatScreenState> {

	private selectedPage: IPageAssign;
	private selectedTags: Array<ITagItem> = [];
	private teams: Array<any> = [];
	private teamsSelected: string = '';
	private currentTeam: string;
	private members: Array<any> = [];
	private membersSelected: string = '';
	private ignoreKeysTeam: Array<string> = [];
	private allStaffs: Array<any> = [];
	// private isCheckValidateReception: boolean = false;

	receptionGroupRef: Dropdown;
	receptionRef: Dropdown;
	tagsAssignRef: SocialTagsContainer;

	constructor(props: any) {
		super(props);
		this.state = {
			isDisableReception: false,
			isEnableApply: true,
		};
	}

	componentDidMount() {
		this.initData();
	}

	componentWillUnmount() {
	}

	private initData = async () => {
		const { assignment } = this.props;
		this.allStaffs = await SocialService.getAllStaffs();
		if (!assignment) {
			return;
		}
		this.initMemeber(assignment);
		this.initAssignTags(assignment);
		this.receptionGroupRef && this.receptionGroupRef.setData(this.teams, this.teamsSelected);
		this.receptionRef && this.receptionRef.setData(this.members);
	}

	private initAssignTags = (assignment: IAssignmentItem) => {
		if (!assignment.tags) {
			this.selectedTags = [];
			return this.tagsAssignRef && this.tagsAssignRef.setSelectedTag(this.selectedTags);
		}
		this.selectedTags = SocialService.convertTags(assignment.tags);
		return this.tagsAssignRef && this.tagsAssignRef.setSelectedTag(this.selectedTags);
	}

	private initMemeber = (assignment: IAssignmentItem) => {
		if (!assignment || !assignment.specific_page_container) {
			return;
		}
		this.selectedPage = assignment.specific_page_container;
		if (!this.selectedPage || !this.selectedPage.specific_config || !this.selectedPage.specific_config.team || !this.selectedPage.specific_config.team.length) {
			return;
		}
		this.teams = this.selectedPage.specific_config.team;
		if (!this.teams || !this.teams.length) {
			return;
		}
		if (!this.selectedPage.specific_config.user_team) {
			const findTeam = this.findTeamForAdmin(this.selectedPage.specific_config.user_id, this.teams);
			if (!findTeam) {
				this.teamsSelected = this.teams[0].id;
				this.currentTeam = this.teams[0].id;
				return;
			}
			this.currentTeam = findTeam.id;
			this.findMember(findTeam);
			return;
		}
		const team = this.teams.find(item => item.id === this.selectedPage.specific_config.user_team);
		this.currentTeam = team ? team.id : '';
		this.findMember(team);
	}

	private findMember(team: any) {
		if (!team || !team.member) {
			return;
		}
		this.teamsSelected = team.id;
		this.members = [];
		team.member.forEach(member => {
			const staffOfMemberId = this.allStaffs.find(staff => staff.id === member.id && member.id !== this.selectedPage.specific_config.user_id);
			if (staffOfMemberId) {
				this.members.push(staffOfMemberId);
			}
		});
	}

	private findTeamForAdmin(user_id: string, teams: Array<any>) {
		for (const team of teams) {
			if (!team || !team.member || !team.member.length) {
				continue;
			}
			if (team.member.find(item => item.id === user_id)) {
				return team;
			}
		}
	}

	onBackHandler = () => {
		Router.pop();
	}

	onGroupItemSelectHandler = (item: any) => {
		this.teamsSelected = item.id;
		this.members = [];
		this.membersSelected = '';
		this.receptionRef && this.receptionRef.setData(this.members, this.membersSelected);
		if (!this.selectedPage || !this.selectedPage.specific_config || !this.selectedPage.specific_config.team || !this.selectedPage.specific_config.team.length) {
			return;
		}
		if (!this.selectedPage.specific_config.user_team) {
			const findTeam = this.findTeamForAdmin(this.selectedPage.specific_config.user_id, this.teams);
			if (!findTeam || this.teamsSelected !== findTeam.id) {
				return;
			}
			this.findMember(findTeam);
			this.receptionRef && this.receptionRef.setData(this.members);
			return;
		}
		if (this.selectedPage.specific_config.user_team !== this.teamsSelected) {
			return;
		}
		const currentTeam = this.selectedPage.specific_config.team.find(team => team.id === this.teamsSelected);
		this.findMember(currentTeam);
		this.receptionRef && this.receptionRef.setData(this.members);
	}

	onReceptionItemSelectHandler = (item: any) => {
		this.membersSelected = item.id;
	}

	convertTag(data, code) {
		if (!data) {
			return [];
		}
		let newTags = [];
		switch (code) {
			case Constants.SOCIAL.FEATURE_CODE.MESSAGE:
				newTags = data.conversation && data.conversation.tags ? data.conversation.tags : [];
				break;
			case Constants.SOCIAL.FEATURE_CODE.COMMENT:
				newTags = data.comment && data.comment.tags ? data.comment.tags : [];
				break;
			case Constants.SOCIAL.FEATURE_CODE.RATE:
				newTags = data.rating && data.rating.tags ? data.rating.tags : [];
				break;
		}
		return newTags;
	}

	onApplyHandler = () => {
		this.setState({ isEnableApply: false });
		const { assignment, feature, onForward } = this.props;
		if (!assignment || !assignment.specific_page_container || !this.tagsAssignRef) {
			this.setState({ isEnableApply: true });
			return toast(Languages.ManipulationUnSuccess, Constants.TOAST_TYPE.ERROR);
		}
		const tags = this.tagsAssignRef.getSelectedItems();
		if (!this.selectedPage.specific_config.user_team) {
			const findTeam = this.findTeamForAdmin(this.selectedPage.specific_config.user_id, this.teams);
			if (findTeam && findTeam.id === this.teamsSelected && this.receptionRef && !this.receptionRef.validate()) {
				this.setState({ isEnableApply: true });
				return toast(Languages.ManipulationUnSuccess, Constants.TOAST_TYPE.ERROR);
			}
		}
		if (this.selectedPage.specific_config.user_team === this.teamsSelected && this.receptionRef && !this.receptionRef.validate()) {
			this.setState({ isEnableApply: true });
			return toast(Languages.ManipulationUnSuccess, Constants.TOAST_TYPE.ERROR);
		}
		let tagIds = [];
		if (tags && tags.length) {
			tagIds = tags.map(tag => {
				return tag.id;
			});
		}
		const body = {
			type: assignment.type,
			note: '',
			id: assignment.id,
			assignee_type: this.membersSelected && this.membersSelected.length ? 'STAFF' : 'TEAM',
			assignee: this.membersSelected && this.membersSelected.length ? this.membersSelected : this.teamsSelected,
			tags: tagIds
		};
		this.onBackHandler();
		SocialService.assign(assignment.specific_page_container.social_type, assignment.specific_page_container.id, body).then(data => {
			if (!data || !data.code || data.code !== '001') {
				this.setState({ isEnableApply: true });
				return toast(Languages.ManipulationUnSuccess, Constants.TOAST_TYPE.ERROR);
			}
			assignment.assignees.length = 0;
			assignment.tags.length = 0;
			const newTags = this.convertTag(data, assignment.type);
			assignment.tags.push(...newTags);
			if (body.assignee_type !== 'TEAM') {
				switch (assignment.type) {
					case Constants.SOCIAL.FEATURE_CODE.MESSAGE:
						assignment.assignees.push(...data.conversation_assign);
						break;
					case Constants.SOCIAL.FEATURE_CODE.COMMENT:
						assignment.assignees.push(...data.comment_assign);
						break;
					case Constants.SOCIAL.FEATURE_CODE.RATE:
						assignment.assignees.push(...data.rating_assign);
						break;
				}
			}
			toast(Languages.ManipulationSuccess, Constants.TOAST_TYPE.SUCCESS);
			feature && feature.tabOrigin && feature.tabOrigin.onRecallTabCount && feature.tabOrigin.onRecallTabCount();
			onForward && onForward(body.assignee_type, this.teamsSelected);
		}, err => {
			this.setState({ isEnableApply: true });
			console.log(err);
			toast(Languages.ManipulationUnSuccess, Constants.TOAST_TYPE.ERROR);
		});
	}

	buildLabelStaff(staff: IStaff) {
		if (!staff.fullname || staff.fullname === 'Tất cả') {
			return (staff.username);
		}
		return `${staff.fullname} (${staff.username})`;
	}

	checkDisableReception = () => {
		if (this.currentTeam && this.teamsSelected && this.currentTeam !== this.teamsSelected && !this.members.length) {
			return this.setState({ isDisableReception: true });
		}
		this.setState({ isDisableReception: false });
	}

	renderDropdownSupportBase = (item: any) => {
		this.checkDisableReception();
		const { isDisableReception } = this.state;
		const borderColor = this.receptionRef && this.receptionRef.getErrorState() && !this.receptionRef.checkValidate() ? { borderColor: Color.red } : { borderColor: Color.border };
		const backgroundBase = isDisableReception ? { backgroundColor: 'rgba(78, 78, 78, 0.15)' } : {};
		return (
			<View style={[borderColor, backgroundBase, Styles.Row, Styles.JustifyBetween, Styles.AlignCenter, { height: 30, paddingHorizontal: 10, borderWidth: 1, borderRadius: 4 }]}>
				<WrapText st={[Styles.Text_S_R]}>{item ? item.label : 'Chọn người tiếp nhận'}</WrapText>
				<CustomIcon size={10} name={'drop_down'} color={Color.text} />
			</View>
		);
	}
	renderDropdownSupportItem = (item: IStaff, selectedKey: any) => {
		return (
			<View style={[Styles.Row, Styles.JustifyBetween, Styles.AlignCenter, { height: 28 }]}>
				<WrapText st={[Styles.Text_S_R, { marginLeft: 5, marginRight: 5 }]} c={Color.text}>{this.buildLabelStaff(item)}</WrapText>
				{ selectedKey === item.id && <CustomIcon name={'mark_selected'} size={10} color={Color.text} />}
			</View>
		);
	}

	render() {
		const { isDisableReception, isEnableApply } = this.state;
		return (
			<View style={[Styles.container]}>
				<View style={[Styles.Header, { paddingLeft: 5, paddingRight: 0 }]}>
					<View style={[Styles.Row]}>
						<ButtonRipple name={'nav_back'} size={16} color={Color.text} onPress={this.onBackHandler} />
						<WrapText st={Styles.Text_L_B} onPress={this.onBackHandler}>{'Chuyển tiếp'}</WrapText>
					</View>
				</View>
				<View style={[Styles.Inner, { paddingVertical: 10 }]}>
					<WrapText st={[Styles.Text_M_M, { paddingBottom: 8 }]}>{'Nhóm tiếp nhận'}</WrapText>
					<Dropdown
						ref={ref => { this.receptionGroupRef = ref; }}
						align={'left'}
						itemVisibleNumber={5}
						height={30}
						selectedKey={this.teamsSelected}
						dropdownOffset={{ top: 33, left: 0 }}
						data={this.teams}
						onItemSelected={this.onGroupItemSelectHandler}
					/>
				</View>

				<View style={[Styles.Inner, { paddingVertical: 10 }]}>
					<WrapText st={[Styles.Text_M_M, { paddingBottom: 8 }]}>{'Người tiếp nhận'}</WrapText>
					<Dropdown
						ref={ref => { this.receptionRef = ref; }}
						align={'left'}
						itemVisibleNumber={5}
						height={30}
						selectedKey={this.membersSelected}
						renderBase={this.renderDropdownSupportBase}
						renderItem={this.renderDropdownSupportItem}
						dropdownOffset={{ top: 33, left: 0 }}
						data={this.members}
						enable={!isDisableReception}
						emptyErrorMessage={'Vui lòng chọn người tiếp nhận.'}
						onItemSelected={this.onReceptionItemSelectHandler}
					/>
				</View>
				<View style={[{ flex: 1}]}>
					<SocialTagsContainer
						ref={ref => { this.tagsAssignRef = ref; }}
						type={'assign'}
						selectedTagTitle={'Tag phân loại công việc'}
						selectedTags={this.selectedTags}
					/>
				</View>

				<View style={[Styles.RowCenter, Styles.CenterItem, { height: 70, width: Constants.Width, bottom: 0, position: 'absolute', backgroundColor: '#fff' }]}>
					<WrapButton
						enable={isEnableApply}
						text={'Áp dụng'}
						width={'70%'}
						size={'m'}
						onPress={this.onApplyHandler}
					/>
				</View>
			</View>
		);
	}
}
