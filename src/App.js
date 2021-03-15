import React from 'react';
import {PermissionsAndroid, Platform} from 'react-native';

import Bluetooth from './Bluetooth';

const App = () => {
  if (Platform.OS === 'android' && Platform.Version >= 23) {
    PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    ).then((result) => {
      if (result) {
        console.log('Permission is OK');
      } else {
        PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ).then((result2) => {
          if (result2) {
            console.log('User accept');
          } else {
            console.log('User refuse');
          }
        });
      }
    });
  }

  return <Bluetooth />;
};

export default App;
