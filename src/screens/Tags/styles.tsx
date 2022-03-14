import { StyleSheet } from 'react-native';
import { Styles, Constants, Device } from 'mo-app-common';
const styles = StyleSheet.create({

  bottomContainer: {
    ...Styles.RowCenter, 
    ...Styles.CenterItem,
    ...Styles.Shadow,
		width: Constants.Width, 
    backgroundColor: '#fff', 
    paddingBottom: Device.isIphoneX ? 55 : 20,
    paddingTop: 20,
    alignItems: 'center'
  }

});

export default styles;