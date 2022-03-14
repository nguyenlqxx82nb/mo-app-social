import React from 'react';
import { IAssignmentItem } from 'mo-app-common/src/Services/Social/SocialService';
import { StyleSheet, View } from 'react-native';
import { ButtonRipple, Router, WrapModal, WrapText, WrapTextLink, Tooltip } from 'mo-app-comp';
import { Color, Constants, Device, Styles } from 'mo-app-common';
import { SocialUtils } from '../../common';
import { ScrollView } from 'react-native-gesture-handler';

interface ISocialBrowserInformationProps {
    assignment: IAssignmentItem;
    isModal?: boolean
}

interface ISocialBrowserInformationState {

}

export default class SocialBrowserInformation extends React.PureComponent<ISocialBrowserInformationProps, ISocialBrowserInformationState> {
    modalRef: WrapModal;

    static defaultProps = {
        isModal: false
    }

    constructor(props: ISocialBrowserInformationProps) {
        super(props);
    }

    componentDidMount() {
    }

    onBackHandler = () => {
        Router.pop();
    }

    onClosePressHandler = () => {
        this.modalRef.close();
    }

    render() {
        const { assignment, isModal } = this.props;
        if (isModal) {
            return (
                <WrapModal
                    ref={(comp: any) => { this.modalRef = comp; }}
                    autoOpen={true}
                    overlayOpacity={0.65}
                    zIndexContent={0}
                    position={'bottom'}>
                    <View style={[styles.container]}>
                        <View style={[Styles.RowCenter, Styles.JustifyBetween]}>
                            <WrapText st={[Styles.Text_L_M]}>{'Thông tin duyệt web cơ bản'}</WrapText>
                            <View style={[Styles.ButtonIcon]}>
                                <ButtonRipple name={'close'} size={14} color={Color.text}
                                    onPress={this.onClosePressHandler} />
                            </View>
                        </View>
                        <View>
                            <View style={[Styles.AlignStart, { marginTop: 8 }]}>
                                <Tooltip text={'Lượt truy cập'} tooltipTitle={'Lượt truy cập'}
                                    tooltipContent={'Được tính kể từ thời điểm khách hàng vào website lần đầu tiên.'} />
                                <WrapText st={Styles.Text_M_R} styles={{ marginTop: 8 }}>{assignment?.specific_browsing_information?.general_information?.visit_page_number ? `${assignment?.specific_browsing_information?.general_information?.visit_page_number} lượt` : '-'}</WrapText>
                            </View>
                            <View style={[Styles.AlignStart, { marginTop: 20 }]}>
                                <WrapText st={Styles.Text_M_R} c={Color.textSecondary}>{'Trang truy cập hiện tại'}</WrapText>
                                <WrapText st={Styles.Text_M_R} styles={{ marginTop: 8 }}>{'Màn hình máy tính'}</WrapText>
                                <WrapTextLink st={Styles.Text_M_R} c={Color.primary} nl={3} styles={{ marginTop: 8 }}>{assignment?.specific_browsing_information?.web_browsing_info?.current_page || '-'}</WrapTextLink>
                            </View>
                            <View style={[Styles.AlignStart, { marginTop: 20 }]}>
                                <WrapText st={Styles.Text_M_R} c={Color.textSecondary}>{'Thời lượng lượt truy cập trên trang hiện tại'}</WrapText>
                                <WrapText st={Styles.Text_M_R} styles={{ marginTop: 8 }}>{assignment?.specific_browsing_information?.web_browsing_info?.time_on_current_page ? SocialUtils.convertMilisecondToTime(assignment?.specific_browsing_information?.web_browsing_info?.time_on_current_page) : '-'}</WrapText>
                            </View>
                        </View>
                    </View>
                </WrapModal>
            );
        }

        return (
            <View style={[Styles.container]}>
                <View style={[Styles.Header, { paddingLeft: 5, paddingRight: 0 }]}>
                    <View style={[Styles.Row]}>
                        <ButtonRipple name={'nav_back'} size={16} color={Color.text} onPress={this.onBackHandler} />
                        <WrapText st={Styles.Text_L_B} onPress={this.onBackHandler}>{'Thông tin duyệt web'}</WrapText>
                    </View>
                </View>
                <ScrollView>
                    <View style={[{ padding: 20 }]}>
                        <WrapText st={Styles.Text_L_M}>{'Thông tin chung'}</WrapText>
                        <View style={[Styles.AlignStart, { marginTop: 8 }]}>
                            <Tooltip text={'Lượt truy cập'} tooltipTitle={'Lượt truy cập'}
                                tooltipContent={'Được tính kể từ thời điểm khách hàng vào website lần đầu tiên.'} />
                            <WrapText st={Styles.Text_M_R} styles={{ marginTop: 8 }}>{assignment?.specific_browsing_information?.general_information?.visit_page_number ? `${assignment?.specific_browsing_information?.general_information?.visit_page_number} lượt` : '-'}</WrapText>
                        </View>
                        <View style={[Styles.AlignStart, { marginTop: 20 }]}>
                            <Tooltip text={'Lượt chat'} tooltipTitle={'Lượt chat'}
                                tooltipContent={'Được tính kể từ thời điểm khách hàng vào website lần đầu tiên.'} />
                            <WrapText st={Styles.Text_M_R} styles={{ marginTop: 8 }}>{assignment?.specific_browsing_information?.general_information?.total_message ? `${assignment?.specific_browsing_information?.general_information?.total_message} lượt` : '-'}</WrapText>
                        </View>
                        <View style={[Styles.AlignStart, { marginTop: 20 }]}>
                            <Tooltip text={'Tổng thời lượng trên website'} tooltipTitle={'Tổng thời lượng trên website'}
                                tooltipContent={'Được tính kể từ thời điểm khách hàng vào website lần đầu tiên.'} />
                            <WrapText st={Styles.Text_M_R} styles={{ marginTop: 8 }}>{assignment?.specific_browsing_information?.general_information?.time_on_web ? SocialUtils.convertMilisecondToTime(assignment?.specific_browsing_information?.general_information?.time_on_web) : '-'}</WrapText>
                        </View>
                        <View style={[Styles.AlignStart, { marginTop: 20 }]}>
                            <WrapText st={Styles.Text_M_R} c={Color.textSecondary}>{'Thời gian truy cập website gần nhất'}</WrapText>
                            <WrapText st={Styles.Text_M_R} styles={{ marginTop: 8 }}>{assignment?.specific_browsing_information?.general_information?.start_time_access || '-'}</WrapText>
                        </View>
                        <View style={[Styles.AlignStart, { marginTop: 20 }]}>
                            <WrapText st={Styles.Text_M_R} c={Color.textSecondary}>{'Vị trí'}</WrapText>
                            <WrapText st={Styles.Text_M_R} styles={{ marginTop: 8 }}>{assignment?.specific_browsing_information?.general_information?.location || '-'}</WrapText>
                        </View>
                    </View>
                    <View style={[{ padding: 20, borderTopWidth: 6, borderTopColor: Color.border }]}>
                        <WrapText st={Styles.Text_L_M}>{'Thông tin lượt truy cập hiện tại'}</WrapText>
                        <View style={[Styles.AlignStart, { marginTop: 8 }]}>
                            <WrapText st={Styles.Text_M_R} c={Color.textSecondary}>{'Trang truy cập hiện tại'}</WrapText>
                            <WrapText st={Styles.Text_M_R} nl={3} styles={{ marginTop: 8 }}>{assignment?.specific_browsing_information?.web_browsing_info?.current_page_title || '-'}</WrapText>
                            <WrapTextLink st={Styles.Text_M_R} nl={3} c={Color.primary} styles={{ marginTop: 8 }}>{assignment?.specific_browsing_information?.web_browsing_info?.current_page || '-'}</WrapTextLink>
                        </View>
                        <View style={[Styles.AlignStart, { marginTop: 20 }]}>
                            <WrapText st={Styles.Text_M_R} c={Color.textSecondary}>{'Thời lượng lượt truy cập trên trang hiện tại'}</WrapText>
                            <WrapText st={Styles.Text_M_R} styles={{ marginTop: 8 }}>{assignment?.specific_browsing_information?.web_browsing_info?.time_on_current_page ? SocialUtils.convertMilisecondToTime(assignment?.specific_browsing_information?.web_browsing_info?.time_on_current_page) : '-'}</WrapText>
                        </View>
                        <View style={[Styles.AlignStart, { marginTop: 20 }]}>
                            <WrapText st={Styles.Text_M_R} c={Color.textSecondary}>{'Thời lượng lượt truy cập trên website'}</WrapText>
                            <WrapText st={Styles.Text_M_R} styles={{ marginTop: 8 }}>{assignment?.specific_browsing_information?.web_browsing_info?.time_on_current_web ? SocialUtils.convertMilisecondToTime(assignment?.specific_browsing_information?.web_browsing_info?.time_on_current_web) : '-'}</WrapText>
                        </View>
                    </View>
                    <View style={[{ padding: 20, borderTopWidth: 6, borderTopColor: Color.border }]}>
                        <View style={[Styles.AlignStart, { marginTop: 8 }]}>
                            <WrapText st={Styles.Text_L_M}>{'Thông tin thiết bị'}</WrapText>
                            <WrapText st={Styles.Text_M_R} c={Color.textSecondary}>{'Địa chỉ IP'}</WrapText>
                            <WrapText st={Styles.Text_M_R} styles={{ marginTop: 8 }}>{assignment?.specific_browsing_information?.device_detail?.ip_address || '-'}</WrapText>
                        </View>
                        <View style={[Styles.AlignStart, { marginTop: 20 }]}>
                            <WrapText st={Styles.Text_M_R} c={Color.textSecondary}>{'Thiết bị'}</WrapText>
                            <WrapText st={Styles.Text_M_R} styles={{ marginTop: 8 }}>{assignment?.specific_browsing_information?.device_detail?.name_device || '-'}</WrapText>
                        </View>
                        <View style={[Styles.AlignStart, { marginTop: 20 }]}>
                            <WrapText st={Styles.Text_M_R} c={Color.textSecondary}>{'Hệ điều hành'}</WrapText>
                            <WrapText st={Styles.Text_M_R} styles={{ marginTop: 8 }}>{assignment?.specific_browsing_information?.device_detail?.os || '-'}</WrapText>
                        </View>
                        <View style={[Styles.AlignStart, { marginTop: 20 }]}>
                            <WrapText st={Styles.Text_M_R} c={Color.textSecondary}>{'Trình duyệt đang dùng'}</WrapText>
                            <WrapText st={Styles.Text_M_R} styles={{ marginTop: 8 }}>{assignment?.specific_browsing_information?.device_detail?.name_device || '-'}</WrapText>
                        </View>
                    </View>
                </ScrollView>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        width: '100%',
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
        flexDirection: 'column',
        paddingTop: 20,
        paddingBottom: Device.isIphoneX ? 20 + 30 : 20,
        paddingHorizontal: 16,
        height: Constants.Height * 3 / 5
    }
});
