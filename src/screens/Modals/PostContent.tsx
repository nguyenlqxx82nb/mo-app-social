import { Color, Constants, Device, Styles } from 'mo-app-common';
import { ButtonRipple, ViewMoreHTML, WrapModal, WrapText } from 'mo-app-comp';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

interface ISocialModalPostContentProps {
  content: string;
}

interface ISocialModalPostContentState {

}

export class SocialModalPostContent extends React.PureComponent<ISocialModalPostContentProps, ISocialModalPostContentState> {
  private modalRef: WrapModal;

  constructor(props: ISocialModalPostContentProps) {
    super(props);
  }

  private onClosePressHandler = () => {
    this.modalRef.close();
  }

  render() {
    const { content } = this.props;

    return (
      <WrapModal
        ref={(comp: any) => { this.modalRef = comp; }}
        autoOpen={true}
        overlayOpacity={0.65}
        zIndexContent={0}
        position={'bottom'}>
        <View style={[styles.container]}>
          <View style={[Styles.RowCenter, Styles.JustifyBetween]}>
            <WrapText st={[Styles.Text_L_M]}>{'Nội dung bài viết'}</WrapText>
            <ButtonRipple name={'close'} size={14} color={Color.text}
                onPress={this.onClosePressHandler} />
          </View>
          {!content &&
            <View style={[Styles.CenterItem, { flex: 1 }]}>
              <WrapText st={[Styles.Text_M_R]} styles={{ opacity: 0.5 }}>{'Bài viết không có nội dung'}</WrapText>
            </View>
          }
          {!!content &&
            <ScrollView style={[{ marginTop: 10 }]}>
              <ViewMoreHTML
                text={content}
                textStyle={[Styles.Text_S_R]}
                minHeight={Constants.Height * 3 / 5}
                minNumberLines={1000} />
            </ScrollView>
          }

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
