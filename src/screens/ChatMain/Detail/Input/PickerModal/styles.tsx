import { StyleSheet } from 'react-native';
import { Device } from 'mo-app-common';

const styles = StyleSheet.create({
    container:{
        backgroundColor: '#fff',
        width: '100%',
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
        flexDirection: 'column',
        paddingTop: 20,
        paddingBottom: Device.isIphoneX ? 20 + 30 : 20,
        paddingHorizontal: 16,
    }
});
export default styles;
