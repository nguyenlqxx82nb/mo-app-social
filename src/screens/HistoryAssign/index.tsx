import React from 'react';
import { View } from 'react-native';
import { WrapModal, WrapText, ButtonRipple, ListView } from 'mo-app-comp';
import { Styles, CustomIcon, Color, Constants, SocialService,  } from 'mo-app-common';
import styles from './styles';
import { IAssignmentItem, IFeatureAssign } from 'api';
import moment from 'moment';
import { SocialUtils } from '../../common';

interface ISocialHistoryAssignModalProps {
  assignment: IAssignmentItem;
  feature: IFeatureAssign;
}
interface ISocialHistoryAssignModalState {

}

class SocialHistoryAssignModal extends React.PureComponent<ISocialHistoryAssignModalProps, ISocialHistoryAssignModalState> {

  modalRef: WrapModal;
  lvRef: ListView;
	constructor(props: any) {
    super(props);
    const { assignment } = this.props;
    assignment.specific_update_view_history_assign = this.updateHistory;
  }

  componentDidMount() {

  }

  updateHistory = async () => {
    const { assignment } = this.props;
    if (!assignment || !assignment.specific_history_assign || !assignment.specific_history_assign.history || !assignment.specific_history_assign.history.length) {
      return;
    }
    for (const history of assignment.specific_history_assign.history) {
      if (!history.from_staff_name) {
        history.from_staff_name = await SocialUtils.getNameStaffById(undefined, undefined, history.assignee_id);
      }
    }
    this.lvRef && (this.lvRef.Items = assignment.specific_history_assign.history);
  }

  loadData = async (onLoadDataCompleted: any) => {
    const { assignment, feature } = this.props;
    if (!assignment || !assignment.specific_page_container || !feature || !feature.tabOrigin) {
      return;
    }
    const socialType = feature.tabOrigin.social_type;
    const pageId = assignment.specific_page_container.id;
    const featureCode = assignment.type;
    const assignmentSocialId = SocialService.getAssignmentSocialId(assignment);
    const before_token = assignment.specific_history_assign && assignment.specific_history_assign.paging && assignment.specific_history_assign.paging.before_token || '';
    const historyAssign: any = await SocialService.getHistoryAssign(socialType, pageId, 10, featureCode, assignmentSocialId, before_token);
    if (!historyAssign || historyAssign.code !== '001' || !historyAssign.history) {
      assignment.specific_history_assign.paging = historyAssign.paging;
      assignment.specific_history_assign.history = [];
      return onLoadDataCompleted([]);
    }
    for (const history of historyAssign.history) {
      history.from_staff_name = await SocialUtils.getNameStaffById(undefined, undefined, history.assignee_id);
    }
    assignment.specific_history_assign.history.push(...historyAssign.history);
    assignment.specific_history_assign.paging = historyAssign.paging;
    if (historyAssign.paging.before_token === 'None') {
      return onLoadDataCompleted(historyAssign.history);
    }
    return onLoadDataCompleted(historyAssign.history, null, false);

  }

	onClosePressHandler = () => {
		this.modalRef.close();
  }

  onLoadDataHandler = async (page: number, per_page: number, onLoadDataCompleted: any, _lastCursor: any) => {
    const { assignment } = this.props;
    if (!assignment) {
      return;
    }
    if (!assignment.specific_history_assign) {
      assignment.specific_history_assign = {
        history: [],
        paging: {
          after_token: '',
          before_token: '',
        }
      };
    }
    if (assignment.specific_history_assign.history.length) {
      onLoadDataCompleted(assignment.specific_history_assign.history);
      return;
    }
    this.loadData(onLoadDataCompleted);
  }

  onLoadMoreDataHandler = async (page: number, per_page: number, onLoadMoreDataCompleted: any, _lastCursor: any) => {
    const { assignment } = this.props;
    if (!assignment || !assignment.specific_history_assign || !assignment.specific_history_assign.history
      || !assignment.specific_history_assign.history.length || !assignment.specific_history_assign.paging
      || !assignment.specific_history_assign.paging.before_token) {
      return;
    }
    this.loadData(onLoadMoreDataCompleted);
  }

  renderRowItem = (_type: any, item: any, _index: number) => {
    return (
      <View style={[Styles.RowCenter]}>
        <CustomIcon name={'assign_to'} size={16} color={Color.text} style={{marginRight: 8}} />
        <WrapText st={[Styles.Text_S_R]} c={Color.secondary}>{ moment.unix(item.assign_time).format(('DD/MM/y HH:mm')) }</WrapText>
        <WrapText st={[Styles.Text_S_R]}>{' - '}</WrapText>
        <WrapText st={[Styles.Text_S_R]}>{item.from_staff_name}</WrapText>
      </View>
    );
  }

	render() {
		return (
			<WrapModal
				ref={(comp: any) => { this.modalRef = comp; }}
				autoOpen={true}
				overlayOpacity={0.65}
				position={'bottom'}>
				<View style={[styles.container]}>
					<View style={[Styles.RowCenter, Styles.JustifyBetween]}>
						<WrapText st={[Styles.Text_L_M]}>{'Lịch sử phân công'}</WrapText>
						<ButtonRipple name={'close'} size={14} color={Color.text}
								onPress={this.onClosePressHandler} />
					</View>
					<View style={{flexGrow: 1, paddingTop: 20}}>
            <ListView
              ref={(comp: any) => { this.lvRef = comp; }}
              onRenderRow={this.renderRowItem}
              wr={Constants.Width - 32}
              hr={40}
              top={0}
              pageSize={25}
              autoLoad={true}
              icon={'work_done'}
              onLoad={this.onLoadDataHandler}
              onLoadMore={this.onLoadMoreDataHandler}
              containerStyle={{ marginHorizontal: 0, paddingHorizontal: 0 }}
            />
          </View>
				</View>
			</WrapModal>
		);
	}

}

export default SocialHistoryAssignModal;
