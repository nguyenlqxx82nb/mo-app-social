import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { Styles, Color, SocialService, Constants } from 'mo-app-common';
import { ButtonRipple, WrapText, Router } from 'mo-app-comp';
import { IAssignmentItem } from 'api';
import { ITagItem } from 'screens/Tags/Search';
import moment from 'moment';
import { SocialUtils } from '../../common';
import { ScrollView } from 'react-native-gesture-handler';

interface ISocialAssignmentInformationProps {
	assignment: IAssignmentItem
}
interface ISocialAssignmentInformationState {
	assignBy: string;
	profileTags: ITagItem[];
}

export default class SocialAssignmentInformation extends React.PureComponent<ISocialAssignmentInformationProps, ISocialAssignmentInformationState> {

	constructor(props: ISocialAssignmentInformationProps) {
		super(props);
		this.state = {
			assignBy: '',
			profileTags: []
		};
	}

	componentDidMount() {
		this.getProfileTags();
	}

	onBackHandler = () => {
		Router.pop();
	}

	getProfileTags = async () => {
		const { assignment } = this.props;
		if (!assignment || !assignment.social || !assignment.last_message || !assignment.last_message.from) {
			return;
		}
		const socialId = assignment.last_message.from.id;
		const profile = await SocialService.profilesBySocialIds.get(socialId);
		if (!profile || !profile.profile_tags) {
			this.setState({ profileTags: [] });
			return;
		}
		this.setState({ profileTags: [...SocialService.convertTags(profile.profile_tags)] });
	}


	getAssignBy = (assignment: IAssignmentItem, callback) => {
		if (assignment.status === Constants.SOCIAL.STATUS.COMPLETED) {
			return SocialUtils.getNameStaffById(undefined, undefined, assignment.resolved_user).then(staffName => {
				callback(staffName);
			});
		}
		SocialUtils.getNameStaffById(assignment.assignees, assignment.status).then(staffName => {
			callback(staffName);
		});
	}

	render() {
		const { assignment } = this.props;
		const { assignBy, profileTags } = this.state;
		const title = assignment.type === Constants.SOCIAL.FEATURE_CODE.MESSAGE ? `Cuộc hội thoại với ${assignment.specific_username}` : `Bình luận của ${assignment.specific_username}`;
		const asignTags = assignment && assignment.tags ? SocialService.convertTags(assignment.tags) : [];
		const assignTime = assignment.status === Constants.SOCIAL.STATUS.COMPLETED ? moment(assignment.resolved_time).format('DD/MM/y HH:mm') : (assignment.assignees && assignment.assignees.length && moment(assignment.assignees[0].created_time).format('DD/MM/y HH:mm') || '');
		const maxHeaderWidth = Dimensions.get('window').width - 60;
		this.getAssignBy(assignment, staffName => {
			this.setState({ assignBy: staffName });
		});
		return (
			<View style={[Styles.container]}>
				<View style={[Styles.Header, { paddingLeft: 5, paddingRight: 0 }]}>
					<View style={[Styles.Row, { flex: 1 }]}>
						<ButtonRipple name={'nav_back'} size={16} color={Color.text} onPress={this.onBackHandler} />
						<WrapText st={Styles.Text_L_B} onPress={this.onBackHandler} styles={[{ maxWidth: maxHeaderWidth }]}>{title}</WrapText>
					</View>
				</View>
				<ScrollView>
					<View style={[{ padding: 20 }]}>
						<WrapText st={Styles.Text_L_M}>{'Thông tin chung'}</WrapText>
						<View style={[Styles.AlignStart, Styles.Row, { marginTop: 8 }]}>
							<WrapText st={Styles.Text_M_R} c={Color.textSecondary}>{assignment.status !== Constants.SOCIAL.STATUS.COMPLETED ? 'Giao bởi: ' : 'Đã hoàn tất bởi '}</WrapText>
							<WrapText st={Styles.Text_M_R}>{assignBy}</WrapText>
						</View>
						<View style={[Styles.AlignStart, Styles.Row, { marginTop: 10 }]}>
							<WrapText st={Styles.Text_M_R} c={Color.textSecondary}>{'Thời gian: '}</WrapText>
							<WrapText st={Styles.Text_M_R}>{assignTime}</WrapText>
						</View>
					</View>
					<View style={[{ padding: 20, borderTopWidth: 6, borderTopColor: Color.border }]}>
						<WrapText st={Styles.Text_L_M}>{'Tag được gắn'}</WrapText>
						<View style={[{ marginTop: 10 }]}>
							<View style={[Styles.RowCenter, Styles.JustifyBetween, { paddingBottom: 10 }]}>
								<WrapText st={[Styles.Text_M_R]}>{'Tag phân loại công việc'}</WrapText>
							</View>
							{
								asignTags.length > 0 &&
								<View style={[styles.scrollView]}>
									{
										asignTags.map((item: ITagItem, index: number) => {
											const bgColor = item.bgColor || Color.secondary;
											const color = item.color || '#fff';
											return (
												<View key={`key_${index}`} style={[Styles.RowCenter, { paddingLeft: 12, paddingRight: 12, paddingVertical: 5, backgroundColor: bgColor, borderRadius: 20, marginBottom: 8, marginRight: 5 }]}>
													<WrapText st={[Styles.Text_M_R, { marginRight: 5, maxWidth: 120 }]} c={color} nl={1}>{item.name}</WrapText>
												</View>
											);
										})
									}
								</View>
							}
						</View>
						<View style={[{ marginTop: 20 }]}>
							<View style={[Styles.RowCenter, Styles.JustifyBetween, { paddingBottom: 10 }]}>
								<WrapText st={[Styles.Text_M_R]}>{'Tag hành vi'}</WrapText>
							</View>
							{
								profileTags.length > 0 &&
								<View style={[styles.scrollView]}>
									{
										profileTags.map((item: ITagItem, index: number) => {
											const bgColor = item.bgColor || Color.secondary;
											const color = item.color || '#fff';
											return (
												<View key={`key_${index}`} style={[Styles.RowCenter, { paddingLeft: 12, paddingRight: 12, paddingVertical: 5, backgroundColor: bgColor, borderRadius: 20, marginBottom: 8, marginRight: 5 }]}>
													<WrapText st={[Styles.Text_M_R, { marginRight: 5, maxWidth: 120 }]} c={color} nl={1}>{item.name}</WrapText>
												</View>
											);
										})
									}
								</View>
							}
						</View>
					</View>
				</ScrollView>
			</View>
		);
	}
}

const styles = StyleSheet.create({

	scrollView: {
		flexDirection: 'row',
		flexWrap: 'wrap',
	}
});
