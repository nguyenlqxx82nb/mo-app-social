import { StyleSheet } from 'react-native';
import { Color, Constants } from 'mo-app-common';

const styles = StyleSheet.create({

  container: {
		position: 'absolute',
		top: 0,
		left: 0,
		bottom: 0,
		right: 0
	},

  header: {
    height: 43,
    width: Constants.Width,
    paddingHorizontal:6,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff'
  },

  textButton: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center'
  },

  divider: {
    marginHorizontal:16,
    borderTopWidth: 0.5,
    borderTopColor: Color.border
  },

});

export default styles;
