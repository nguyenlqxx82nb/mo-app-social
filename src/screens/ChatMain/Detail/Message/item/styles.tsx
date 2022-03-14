import { StyleSheet } from 'react-native';
import { Constants, Color } from 'mo-app-common';

const styles = StyleSheet.create({
	messageContainer: {
		borderRadius: 4,
	},
	container: {
		// flexDirection: 'row',
		width: Constants.Width,
		paddingBottom: 12,
		transform: [{ scaleY: -1 }]
	},
	statusIcon: {
        position: 'absolute',
        bottom: 10,
        right: -16
    },
    resolveContainer: {
        width: Constants.Width - 40,
        marginLeft: 20,
        borderBottomColor: Color.secondary,
        borderBottomWidth: 0.5,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 4,
        marginTop: 16,
        transform: [{ scaleY: -1 }]
    },
    messageDetail: {
        flex: 1,
        flexDirection: 'row'
    }
});

export default styles;
