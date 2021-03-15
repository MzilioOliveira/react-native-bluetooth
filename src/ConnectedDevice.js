/* eslint-disable react-native/no-inline-styles */
import React, {memo, useState} from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableHighlight,
  Button,
  TextInput,
} from 'react-native';
import BleManager from 'react-native-ble-manager';

import {stringToBytes} from 'convert-string';

const Buffer = require('buffer/').Buffer;

const ConnectedDevice = ({item}) => {
  const [isConnected, setIsConnected] = useState(item.connected);
  const [value, setValue] = useState(null);
  const [data, setData] = useState(null);

  const getPeripheralName = (peripheral) => {
    if (peripheral.advertising) {
      if (peripheral.advertising.localName) {
        return peripheral.advertising.localName;
      }
    }
    return peripheral.name;
  };

  const disconnectPeripheral = (peripheral) => {
    if (!peripheral) {
      return;
    }

    if (peripheral.connected) {
      BleManager.disconnect(peripheral.id);
      setIsConnected(false);
      return;
    }
  };

  const retrieveServices = (peripheralId) => {
    BleManager.retrieveServices(peripheralId)
      .then((peripheralInfo) => {
        console.log('Retrieved peripheral services', peripheralInfo);
      })
      .catch((error) => {
        console.log('Connection error', error);
      });
  };

  const readCharacteristicValue = (
    peripheralId,
    serviceUUID,
    charasteristicUUID,
  ) => {
    BleManager.read(peripheralId, serviceUUID, charasteristicUUID)
      .then((res) => {
        console.log('read response', res);
        if (res) {
          const buffer = Buffer.from(res);
          const data2 = buffer.toString();
          console.log('data', data2);
          setData(data2);
        }
      })
      .catch((error) => {
        console.log('read err', error);
        console.log(error);
      });
  };

  const writeCharacteristicValue = (
    peripheralId,
    serviceUUID,
    charasteristicUUID,
  ) => {
    const payloadBytes = stringToBytes(value);

    BleManager.write(
      peripheralId,
      serviceUUID,
      charasteristicUUID,
      payloadBytes,
    )
      .then((res) => {
        console.log('write response', res);
      })
      .catch((error) => {
        console.log('write err', error);
      });
  };

  return (
    <>
      <TouchableHighlight onPress={() => disconnectPeripheral(item)}>
        <View style={{backgroundColor: isConnected ? 'green' : '#fff'}}>
          <Text style={styles.peripheralName}>{getPeripheralName(item)}</Text>
          <Text style={styles.peripheralRssi}>RSSI: {item.rssi}</Text>
          <Text style={styles.peripheralId}>{item.id}</Text>
          <View style={styles.button}>
            <Button
              title="Retrieve Services"
              onPress={() => retrieveServices(item.id)}
            />
          </View>
          <View style={styles.button}>
            <Button
              title="Read Characteristic"
              onPress={() =>
                readCharacteristicValue(
                  item.id,
                  '4fafc201-1fb5-459e-8fcc-c5c9c331914b',
                  'beb5483e-36e1-4688-b7f5-ea07361b26a8',
                )
              }
            />
          </View>
          <View style={styles.button}>
            <Button
              title="WRITE Characteristic"
              onPress={() =>
                writeCharacteristicValue(
                  item.id,
                  '4fafc201-1fb5-459e-8fcc-c5c9c331914b',
                  'beb5483e-36e1-4688-b7f5-ea07361b26a8',
                )
              }
            />
          </View>
        </View>
      </TouchableHighlight>
      <View style={styles.button}>
        <TextInput
          onChangeText={setValue}
          value={value}
          placeholder="write something here"
        />
      </View>
      {data && (
        <View>
          <Text style={styles.peripheralId}>{data}</Text>
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  button: {
    margin: 10,
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
    fontSize: 18,
    textAlign: 'center',
    color: '#333333',
    padding: 2,
    paddingBottom: 20,
  },
});

export default memo(ConnectedDevice);
