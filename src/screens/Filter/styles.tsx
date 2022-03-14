import { StyleSheet } from 'react-native';
import { Color, Constants, Device, Styles } from 'mo-app-common';

const styles = StyleSheet.create({

  container: {
    width: Constants.Width,
    height: Constants.Height - Constants.BarHeight - 50,
    borderTopRightRadius: 20,
    borderTopLeftRadius: 20,
    backgroundColor: '#fff'
  },

  modalBottom: {
    width: Constants.Width,
    paddingBottom: Device.ToolbarHeight + 20,
    paddingTop: 20,
    paddingHorizontal: 16,
    flexDirection: 'row',
    backgroundColor: '#fff'
  },

  modalHeader: {
    width: Constants.Width,
    height: 60,
    borderBottomColor: Color.border,
    borderBottomWidth: 1,
    flexDirection:'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 16,
    paddingRight: 5
  },

  modalItemContainer: {
    paddingTop:16,
    paddingBottom: 16,
    width: Constants.Width,
    borderBottomWidth: 1,
    borderBottomColor: Color.border
  },

  modalItemTitle: {
    paddingBottom: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },

  chbItem: {
    ...Styles.AlignCenter, 
    ...Styles.JustifyBetween, 
    width: Constants.Width
  },

  cbLabelItem: {
    ...Styles.Text_S_R,
    maxWidth: 280
  },

  moreView: {
    marginLeft: 6,
  },

  moreText: {
    ...Styles.Text_M_M,
    color: Color.primary,
    width: 120,
    paddingHorizontal: 10,
    paddingVertical: 5
  }

});

export default styles;
