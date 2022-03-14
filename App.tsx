/**
 * Main Layout
 * Version 1.0
 * NguyenLQ
 *
 */

import React from 'react';

import { SocialScreen } from './src/';
import { Root, ProfileScreen } from 'mo-app-layout';
import { CustomIcon } from 'mo-app-common';

class App extends React.PureComponent<any, any> {
  constructor(props: any) {
    super(props);
  }

  async componentDidMount() {}

  initMainRoutes = () => {
    return [
      // {
      //   name: 'Marketing',
      //   key: 'Marketing',
      //   label: 'Marketing',
      //   tabBarIcon: (icon: any) => {
      //     return (<CustomIcon name={'Marketing'} size={16} style={{ color: icon.color }} />);
      //   },
      //   loaded: false,
      // },
      // {
      //   name: 'Sale',
      //   key: 'Sale',
      //   label: 'Sale',
      //   tabBarIcon: (icon: any) => {
      //     return (<CustomIcon name={'Sale'} size={16} style={{ color: icon.color }} />);
      //   },
      //   loaded: false,
      //   // notCache: true
      // },
      {
        name: 'Social',
        key: 'Social',
        label: 'Mạng xã hội',
        tabBarIcon: (icon: any) => {
          return (<CustomIcon name={'Social'} size={16} style={{ color: icon.color }} />);
        },
        loaded: false,
        screen: <SocialScreen />
      },
      {
        name: 'CallCenter',
        key: 'CallCenter',
        label: 'Gọi điện',
        tabBarIcon: (icon: any) => {
          return (<CustomIcon name={'Calling'} size={16} style={{ color: icon.color }} />);
        },
        loaded: false,
        screen: null
      },
      {
        name: 'Profile',
        key: 'Profile',
        label: 'Profile',
        tabBarIcon: (icon: any) => {
          return (<CustomIcon name={'Account'} size={16} style={{ color: icon.color }} />);
        },
        loaded: false,
        screen: <ProfileScreen />
      },
    ];
  }

  render() {
    const routes = this.initMainRoutes();
    return (
      <Root routes={routes} mainTabIndex={0} />
    );
  }
}

export default App;
