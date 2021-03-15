import React, {useState, useEffect, useMemo, useCallback} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  StatusBar,
  NativeModules,
  NativeEventEmitter,
  Button,
  FlatList,
  TouchableHighlight,
} from 'react-native';
import {Colors} from 'react-native/Libraries/NewAppScreen';
import BleManager from 'react-native-ble-manager';

import ConnectedDevice from './ConnectedDevice';

const BleManagerModule = NativeModules.BleManager;
const bleEmitter = new NativeEventEmitter(BleManagerModule);

const Bluetooth = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [list, setList] = useState([]);
  const [connectedDevice, setConnectedDevice] = useState(false);
  const peripherals = useMemo(() => new Map(), []);

  const startScan = () => {
    setConnectedDevice(false);

    if (isScanning) {
      return;
    }

    peripherals.clear();
    setList(Array.from(peripherals.values()));

    BleManager.scan([], 1, true, {})
      .then(() => {
        console.log('Scanning...');
        setIsScanning(true);
      })
      .catch((err) => {
        console.error(err);
      });
  };

  const handleDiscoverPeripheral = useCallback(
    (peripheral) => {
      console.log('Got ble peripheral', peripheral);

      if (!peripheral.name) {
        peripheral.name = 'NO NAME';
      }

      peripherals.set(peripheral.id, peripheral);
      setList(Array.from(peripherals.values()));
    },
    [peripherals],
  );

  const handleStopScan = () => {
    console.log('Scan is stopped');
    setIsScanning(false);
  };

  const handleDisconnectedPeripheral = useCallback(
    (data) => {
      console.log('Disconnected from ' + data.peripheral);

      let peripheral = peripherals.get(data.peripheral);
      if (peripheral) {
        peripheral.connected = false;
        peripherals.set(peripheral.id, peripheral);
        setList(Array.from(peripherals.values()));
      }
    },
    [peripherals],
  );

  const retrieveConnectedPeripheral = () => {
    BleManager.getConnectedPeripherals([]).then((results) => {
      peripherals.clear();
      setList(Array.from(peripherals.values()));

      if (results.length === 0) {
        setConnectedDevice(false);
        console.log('No connected peripherals');
      }

      setConnectedDevice(true);

      for (let i = 0; i < results.length; i++) {
        let peripheral = results[i];
        peripheral.connected = true;
        peripherals.set(peripheral.id, peripheral);
        setList(Array.from(peripherals.values()));
      }
    });
  };

  const getPeripheralName = (item) => {
    if (item.advertising) {
      if (item.advertising.localName) {
        return item.advertising.localName;
      }
    }
    return item.name;
  };

  const updatePeripheral = (peripheral, callback) => {
    let updatedPeripheral = peripherals.get(peripheral.id);
    if (!updatedPeripheral) {
      return;
    }

    updatedPeripheral = callback(updatedPeripheral);
    peripherals.set(peripheral.id, updatedPeripheral);
    setList(Array.from(peripherals.values()));
  };

  const connectToPeripheral = (peripheral) => {
    if (!peripheral) {
      return;
    }

    if (peripheral.connected) {
      BleManager.disconnect(peripheral.id);
      return;
    }

    BleManager.connect(peripheral.id)
      .then(() => {
        console.log('Connected to ' + peripheral.id, peripheral);
        updatePeripheral(peripheral, (p) => {
          p.connected = true;
          return p;
        });
      })
      .catch((error) => {
        console.log('Connection error', error);
      });
  };

  useEffect(() => {
    BleManager.start({showAlert: false});

    bleEmitter.addListener(
      'BleManagerDiscoverPeripheral',
      handleDiscoverPeripheral,
    );
    bleEmitter.addListener('BleManagerStopScan', handleStopScan);
    bleEmitter.addListener(
      'BleManagerDisconnectPeripheral',
      handleDisconnectedPeripheral,
    );

    return () => {
      bleEmitter.removeListener(
        'BleManagerDiscoverPeripheral',
        handleDiscoverPeripheral,
      );
      bleEmitter.removeListener('BleManagerStopScan', handleStopScan);
      bleEmitter.removeListener(
        'BleManagerDisconnectPeripheral',
        handleDisconnectedPeripheral,
      );
    };
  }, [handleDisconnectedPeripheral, handleDiscoverPeripheral]);

  const renderItem = (item) => {
    const color = item.connected ? 'green' : '#fff';
    return (
      <TouchableHighlight onPress={() => connectToPeripheral(item)}>
        <View style={{backgroundColor: color}}>
          <Text style={styles.peripheralName}>{getPeripheralName(item)}</Text>
          <Text style={styles.peripheralRssi}>RSSI: {item.rssi}</Text>
          <Text style={styles.peripheralId}>{item.id}</Text>
        </View>
      </TouchableHighlight>
    );
  };

  return (
    <>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.safeAreaView}>
        <View style={styles.body}>
          <View style={styles.scanButton}>
            <Button
              title={isScanning ? 'Scanning...' : 'Scan BLE Devices'}
              onPress={() => startScan()}
              disabled={isScanning}
            />
          </View>

          <View style={styles.scanButton}>
            <Button
              title="Retrieve connected peripherals"
              onPress={() => retrieveConnectedPeripheral()}
            />
          </View>

          {list.length === 0 && (
            <View style={styles.noPeripherals}>
              <Text style={styles.noPeripheralsText}>No peripherals</Text>
            </View>
          )}
        </View>

        <FlatList
          data={list}
          renderItem={({item}) =>
            connectedDevice ? <ConnectedDevice item={item} /> : renderItem(item)
          }
          keyExtractor={(item) => item.id}
        />
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  safeAreaView: {
    flex: 1,
    padding: 10,
  },
  body: {
    backgroundColor: Colors.white,
  },
  scanButton: {
    margin: 10,
  },
  noPeripherals: {
    flex: 1,
    margin: 20,
  },
  noPeripheralsText: {
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 30,
  },
  footerButton: {
    alignSelf: 'stretch',
    padding: 10,
    backgroundColor: 'grey',
  },
  peripheralName: {
    fontSize: 12,
    textAlign: 'center',
    color: '#333333',
    padding: 10,
  },
  peripheralRssi: {
    fontSize: 10,
    textAlign: 'center',
    color: '#333333',
    padding: 2,
  },
  peripheralId: {
    fontSize: 8,
    textAlign: 'center',
    color: '#333333',
    padding: 2,
    paddingBottom: 20,
  },
});

export default Bluetooth;
