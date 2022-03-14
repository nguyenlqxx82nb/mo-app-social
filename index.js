
import {AppRegistry, LogBox} from 'react-native';
import App from './App';
// import Test1 from './src/index';
import {name as appName} from './app.json';
LogBox.ignoreAllLogs();
AppRegistry.registerComponent(appName, () => App);
