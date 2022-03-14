import { StyleSheet } from 'react-native';
import { Constants } from 'mo-app-common';

const styles = StyleSheet.create({
	container: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
	},
	overlay: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: '#000',
		opacity: 0.75
	},
	contentContainer: {
		position: 'absolute',
		top: Constants.BarHeight + 20,
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: '#fff',
		zIndex: 1,
		borderTopEndRadius: 20,
		borderTopLeftRadius: 20
	}
});
export default styles;
