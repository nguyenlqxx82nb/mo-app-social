import { SocialUtils } from '../../common';
import { IAssignmentItem, IComment } from 'api';
import { Color, Constants, CustomIcon, Device, SocialService, Styles, toast } from 'mo-app-common';
import { ButtonRipple, WrapModal, WrapText } from 'mo-app-comp';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Languages from 'mo-app-common/src/Common/Languages';

interface ISocialModalClassifyProps {
  comment: IComment;
  assignment: IAssignmentItem;
  onCallback?: () => void;
}

interface ISocialModalClassifyState {
  classify: number;
}

export class SocialModalClassify extends React.PureComponent<ISocialModalClassifyProps, ISocialModalClassifyState> {
  private modalRef: WrapModal;
  classifies: any[];

  constructor(props: ISocialModalClassifyProps) {
    super(props);
    this.state = {
      classify: props.comment && props.comment.specific_classify || -1
    };
    this.classifies = SocialUtils.initDefaultClassify() || [];
  }

  private onClosePressHandler = () => {
    this.modalRef.close();
  }

  private changeClassify = async (classify: number) => {
    const { comment, assignment, onCallback } = this.props;
    if (!comment || !assignment.specific_page_container) {
      return toast(Languages.ManipulationUnSuccess, 'error');
    }
    const page = assignment.specific_page_container;
    const resultChange: any = await SocialService.changeClassifyCommentTopic(page.social_type, page.id, assignment.mobio_topic_id, comment.specific_mobio_comment_id, classify, {});
    if (!resultChange || !resultChange.data || resultChange.data.code !== '001') {
      return toast(Languages.ManipulationUnSuccess, 'error');
    }
    comment.specific_classify = classify;
    onCallback && onCallback();
    this.onClosePressHandler();
    return; // toast(Languages.ManipulationSuccess, 'success');
  }

  render() {
    const { classify } = this.state;

    return (
      <WrapModal
        ref={(comp: any) => { this.modalRef = comp; }}
        autoOpen={true}
        overlayOpacity={0.65}
        zIndexContent={0}
        position={'bottom'}>
        <View style={[styles.container]}>
          <View style={[Styles.RowCenter, Styles.JustifyBetween]}>
            <WrapText st={[Styles.Text_L_M]}>{'Đổi trạng thái cảm xúc'}</WrapText>
            <ButtonRipple name={'close'} size={14} color={Color.text}
                onPress={this.onClosePressHandler} />
          </View>
          <View style={{ paddingTop: 10 }}>
            {
              !!this.classifies && !!this.classifies.length && this.classifies.map((item, index) => {
                return (
                  <ButtonRipple 
                    key={`key_${index}`} 
                    radius={1}
                    color={Color.text}
                    onPress={() => { this.changeClassify(item.value); }}>
                    <View style={[Styles.Row, Styles.JustifyBetween, { height: 40 }]}>
                      <View style={[Styles.Row, { height: 20 }]}>
                        <CustomIcon name={item.iconName} size={18} color={item.color} />
                        <WrapText st={[Styles.Text_S_R, { marginLeft: 6 }]} c={item.color}>{item.text}</WrapText>
                      </View>
                      {item.value === classify &&
                        <CustomIcon name={'mark_selected'} size={14} />
                      }
                    </View>
                  </ButtonRipple> 
                )
              ;
              })
            }
          </View>
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
    flexDirection: 'column',
    paddingTop: 10,
    paddingBottom: Device.isIphoneX ? 20 + 30 : 20,
    paddingHorizontal: 16,
    height: 250
  }
});
