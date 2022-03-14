import React from 'react';
import { StyleSheet, View, Linking, DeviceEventEmitter, Keyboard } from 'react-native';
import { Color, Device, Styles, Utils, Constants, EmitKeys } from 'mo-app-common';
import { ButtonRipple, ViewMoreHTML, WrapModal, WrapButton } from 'mo-app-comp';
import Clipboard from '@react-native-clipboard/clipboard';

interface ISocialModalCopyClipboardProps {
  content: string;
  title: string;
}

interface ISocialModalCopyClipboardState {

}

export class SocialModalCopyClipboard extends React.PureComponent<ISocialModalCopyClipboardProps, ISocialModalCopyClipboardState> {
  private modalRef: WrapModal;

  static defaultProps = {
		content: ''

	}

  constructor(props) {
    super(props);
  }

  componentDidMount() {
    Keyboard.dismiss();
  }

  private onClosePressHandler = () => {
    this.modalRef.close();
  }

  private copyClipboard = (content: string) => {
    Clipboard.setString(content);
    this.modalRef && this.modalRef.close();
  }

  callToPhone = async (phoneNumber: string) => {
    this.modalRef && this.modalRef.close();
    if (!Constants.IsCallCenter) {
      Linking.openURL(`tel:${phoneNumber}`);
      return;
    }
    DeviceEventEmitter.emit(EmitKeys.CALL_CENTER_MAKE_CALL, phoneNumber, undefined, true);
  }

  render() {
    const { content } = this.props;
    const isPhone = Utils.validatePhone(content);
    return (
      <WrapModal
        ref={(comp: any) => { this.modalRef = comp; }}
        autoOpen={true}
        overlayOpacity={0.65}
        position={'bottom'}>
        <View style={[styles.container]}>
          <View style={[Styles.RowCenter, Styles.JustifyEnd]}>
            <ButtonRipple name={'close'} size={14} color={Color.text}
                onPress={this.onClosePressHandler} />
          </View>
          <View>
            <ViewMoreHTML
              text={content || '-'}
              textStyle={[Styles.Text_M_R, {color: Color.text}]}
              ignoreShowMore={true}
              minNumberLines={2}
              minHeight={165}/>

            <WrapButton
              size={'m'}
              text={'Sao chép'}
              iconLeft={'media_file'}
              type={'solid'}
              containerStyle={{ marginTop: 30 }}
              onPress={() => { this.copyClipboard(content); }}
            />

            {
              isPhone &&
              <WrapButton
                size={'m'}
                text={'Gọi điện'}
                iconLeft={'Calling'}
                type={'border'}
                containerStyle={{ marginTop: 25 }}
                textColor={Color.primary}
                active={true}
                onPress={() => { this.callToPhone(content); }}
              />
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
  }
});

