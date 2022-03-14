import { StyleSheet } from 'react-native';
import { Color, Device } from 'mo-app-common';

const styles = StyleSheet.create({
	container: {
		marginBottom: !Device.isIphoneX ? 15 : 15 + 30,
		backgroundColor: '#fff',
		borderTopColor: Color.border,
		borderTopWidth: 0.5,
		paddingHorizontal: 16
	},
  buttonIcon: {
		width: 30,
		height: 30
	},
	inputWrap : {
		width:'100%',
		borderRadius: 5,
		borderColor: Color.border,
		borderWidth: 1,
		paddingLeft:12,
		paddingRight: 6,
		alignItems:'center',
		justifyContent: 'space-between',
		paddingVertical:0,
		flexDirection:'row',
},
});

export default styles;
