import { IAssignmentItem, IComment } from 'api';
import { Color, Constants, CustomIcon, Device, Styles, toast } from 'mo-app-common';
import { AsyncImage, ButtonRipple, FormInput, WrapButton, WrapModal, WrapText, DismissKeyboard } from 'mo-app-comp';
import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import Languages from 'mo-app-common/src/Common/Languages';
import moment from 'moment';
import { IAttachment } from '../ChatMain/Detail/Input/PickerModal';
import { SocialUtils } from '../../common';

interface ISocialModalUpdateCommentProps {
  selectedAttachments: any[];
  comment: IComment;
  assignment: IAssignmentItem;
  onMediaFilePressHandler?: () => void;
  onClose?: () => void;
  onCallback?: () => void;
  onRestoreDefault?: () => void;
  onUpdateComment?: (comment: IComment, message: string, attachments: IAttachment[]) => void;
}

interface SocialModalUpdateCommentState {
  // selectedAttachments: IAttachment[];
  enableApplyButton: boolean;
  selectedAttachments: any[];
}

export class SocialModalUpdateComment extends React.PureComponent<ISocialModalUpdateCommentProps, SocialModalUpdateCommentState> {
  private modalRef: WrapModal;
  private commentMessageRef: FormInput;

  constructor(props: ISocialModalUpdateCommentProps) {
    super(props);
    this.state = {
      enableApplyButton: true,
      selectedAttachments: props.selectedAttachments || []
      // classify: props.comment.specific_classify
    };
  }

  private onClosePressHandler = () => {
    const { onClose } = this.props;
    onClose && onClose();
    this.modalRef.close();
  }

  private onRemoveImagePressHandler = (index: number) => {
    const { selectedAttachments } = this.state;
    if (!selectedAttachments || selectedAttachments.length - 1 < index) {
      return;
    }
    this.setState({
      selectedAttachments: [],
    },
      () => {
        this.forceUpdate();
      });
  }



  private renderSelectedAttachments = () => {
    const { onMediaFilePressHandler } = this.props;
    const { selectedAttachments } = this.state;
    const newAttachments = [...selectedAttachments, ...[{ type: 'add_new' }]];
    return (
      <ScrollView
        showsHorizontalScrollIndicator={false}
        horizontal={true}
        style={{}}
        contentContainerStyle={{ paddingTop: 10 }}>
        {
          newAttachments.map((attachment: any, index: number) => {
            const durationTime = attachment.duration ? moment.utc(attachment.duration * 1000).format('HH:mm:ss') : '';
            if (!attachment.type) {
              return null;
            }
            return (
              <View key={`key_${index}`}>
                { !!attachment.type.includes('image') &&
                  <View style={{ marginRight: 15 }}>
                    <AsyncImage source={{ uri: attachment.uri }} width={60} height={60} style={{ overflow: 'hidden', borderRadius: 4 }} />
                    <WrapText styles={{ textAlign: 'center' }} s={10} ml={10}>{attachment.name}</WrapText>
                  </View>
                }
                { !!attachment.type.includes('video') &&
                  <View style={{ display: 'flex', marginRight: 15 }} >
                    <AsyncImage source={{ uri: attachment.uri }} width={60} height={60} style={{ overflow: 'hidden', borderRadius: 4 }} />
                    <WrapText styles={{ textAlign: 'center' }} s={10} ml={10}>{attachment.name}</WrapText>
                    <View style={[Styles.CenterItem, { position: 'absolute', top: 20, width: '100%' }]} >
                      <CustomIcon name={'video_preview'} size={20} color={Color.background} />
                    </View>
                    <WrapText styles={{ position: 'absolute', bottom: 15, width: '100%', textAlign: 'center' }} s={7} c={Color.background}>{durationTime}</WrapText>
                  </View>
                }
                {	!attachment.type.includes('image') && !attachment.type.includes('video') && attachment.type !== 'add_new' && // file
                  <View style={{ marginRight: 15 }}>
                    <TouchableOpacity
                      style={{ padding: 17, backgroundColor: 'rgb(216, 216, 216)', overflow: 'hidden', borderRadius: 4 }}
                      onPress={() => { onMediaFilePressHandler && onMediaFilePressHandler(); }}>
                      <View>
                        <CustomIcon name={'single_file'} size={26} color={Color.textSecondary} />
                      </View>
                    </TouchableOpacity>
                    <WrapText styles={{ textAlign: 'center' }} s={10} ml={10}>{attachment.name}</WrapText>
                    {
                      attachment.type !== 'add_new' &&
                      <TouchableOpacity
                        style={{ position: 'absolute', top: -7, right: attachment.type.includes('image') ? 7 : -7, width: 14, height: 14, borderRadius: 7, backgroundColor: 'rgb(230, 232, 237)', alignItems: 'center', justifyContent: 'center' }}
                        onPress={() => { this.onRemoveImagePressHandler(index); }}>
                        <View>
                          <CustomIcon name={'close'} size={6} color={Color.text} />
                        </View>
                      </TouchableOpacity>
                    }
                  </View>
                }
                {	attachment.type === 'add_new' &&
                  <View style={[]}>
                    <TouchableOpacity
                      style={[Styles.Row, Styles.CenterItem, { width: 60, height: 60, borderStyle: 'dashed', borderColor: Color.primary, borderWidth: 1, borderRadius: 4 }]}
                      onPress={() => { onMediaFilePressHandler && onMediaFilePressHandler(); }}>
                      <View style={[Styles.CenterItem]}>
                        <CustomIcon name={'upload_photo'} size={16} color={Color.primary} />
                      </View>
                    </TouchableOpacity>
                    <WrapText styles={{ textAlign: 'center' }} s={10}>{'Tải file'}</WrapText>
                  </View>
                }
                {
                  (attachment.type.includes('image') || attachment.type.includes('video')) &&
                  <TouchableOpacity
                    style={{ position: 'absolute', top: -7, right: (attachment.type.includes('image') || attachment.type.includes('video')) ? 7 : -7, width: 14, height: 14, borderRadius: 7, backgroundColor: 'rgb(230, 232, 237)', alignItems: 'center', justifyContent: 'center' }}
                    onPress={() => { this.onRemoveImagePressHandler(index); }}>
                    <View>
                      <CustomIcon name={'close'} size={6} color={Color.text} />
                    </View>
                  </TouchableOpacity>
                }
              </View>
            );
          })
        }
      </ScrollView>
    );
  }

  private handleRestoreDefault = () => {
    const { comment, onRestoreDefault } = this.props;
    this.commentMessageRef && this.commentMessageRef.setValue(comment.message);
    onRestoreDefault && onRestoreDefault();
    this.setState({
      selectedAttachments: comment.attachments && comment.attachments.data && SocialUtils.convertAttachmentsToDisplayUpdateComment(comment.attachments.data) || []
    });
  }

  private handleSave = () => {
    const { assignment, comment, onUpdateComment } = this.props;
    const { selectedAttachments } = this.state;
    const message = this.commentMessageRef && this.commentMessageRef.getValue() || '';
    if (!onUpdateComment || !assignment || !assignment.specific_page_container || !message && !selectedAttachments.length) {
      return toast(Languages.ManipulationUnSuccess, 'error');
    }
    this.setState({ enableApplyButton: false });
    const page = assignment.specific_page_container;
    switch (page.social_type) {
      case Constants.SOCIAL.TYPE.YOUTUBE:
        // this.updateComment(comment, page, {}, event);
        break;
      default:
        onUpdateComment(comment, message, selectedAttachments);
        this.onClosePressHandler();
    }

  }

  render() {
    const { comment } = this.props;
    const { enableApplyButton } = this.state;
    return (
      <WrapModal
        ref={(comp: any) => { this.modalRef = comp; }}
        autoOpen={true}
        overlayOpacity={0.65}
        zIndexContent={0}
        position={'bottom'}>
        
        <View style={[styles.container]}>
          <DismissKeyboard style={{flex: 1}}>
          <View style={{flex: 1}}>
          <View style={[Styles.RowCenter, Styles.JustifyBetween]}>
            <WrapText st={[Styles.Text_L_M]}>{'Sửa nội dung bình luận'}</WrapText>
            <ButtonRipple name={'close'} size={14} color={Color.text}
                onPress={this.onClosePressHandler} />
          </View>
          <View style={{ marginTop: 25 }}>
            {
              this.renderSelectedAttachments()
            }
          </View>
          <View style={{ marginTop: 20, marginBottom: 10 }}>
            <FormInput
              ref={ref => { this.commentMessageRef = ref; }}
              multiLine={true}
              text={comment.message}
              autoValidate={false}
              inputWrapStyle={{ height: 100, paddingBottom: 0 }}
              validRequire={false}
              placeholder={'Nhập nội dung ...'}/>
          </View>
          <View style={[Styles.RowCenter, Styles.CenterItem,
          { height: 50, width: Constants.Width - 32, backgroundColor: Color.background, bottom: 0, left: 0, position: 'absolute' }]}>
            <WrapButton
              text={'Khôi phục'}
              width={(Constants.Width - 16 - 32) / 2}
              size={'m'}
              containerStyle={{ marginRight: 16 }}
              type={'border'}
              active={true}
              onPress={this.handleRestoreDefault}
            />
            <WrapButton
              enable={enableApplyButton}
              text={'Áp dụng'}
              width={(Constants.Width - 16 - 32) / 2}
              size={'m'}
              onPress={this.handleSave}
            />
          </View>
        </View>
        </DismissKeyboard>
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
    height: Constants.Height * 3 / 5
  }
});
