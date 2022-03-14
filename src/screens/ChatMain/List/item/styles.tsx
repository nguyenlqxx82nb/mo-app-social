import { StyleSheet } from 'react-native';
import { Color, Constants } from 'mo-app-common';

const styles = StyleSheet.create({
  statusIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    width: 10,
    height: 10,
    borderRadius: 10,
    position: 'absolute',
    top: 0,
    right: 2,
    paddingLeft: 1,
    paddingTop: 1
  },

  itemContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    width: Constants.Width
  }
});

export default styles;