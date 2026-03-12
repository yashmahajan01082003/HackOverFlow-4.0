/**
 * App.tsx
 * Root component — initialises navigation and requests BT/location permissions.
 */
import React, {useEffect} from 'react';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {StyleSheet} from 'react-native';
import {AppNavigator} from './src/navigation/AppNavigator';
import {useBLE} from './src/hooks/useBLE';
import {waitForBluetooth} from './src/services/bleManager';

// Buffer polyfill required by messageProtocol.ts
import {Buffer} from 'buffer';
(global as any).Buffer = Buffer;

const Bootstrap: React.FC = () => {
  const {requestPermissions} = useBLE();

  useEffect(() => {
    const init = async () => {
      await requestPermissions();
      try {
        await waitForBluetooth();
      } catch {
        // Bluetooth not enabled – user will see a message on scan
      }
    };
    init();
  }, [requestPermissions]);

  return <AppNavigator />;
};

const App: React.FC = () => (
  <GestureHandlerRootView style={styles.root}>
    <Bootstrap />
  </GestureHandlerRootView>
);

const styles = StyleSheet.create({
  root: {flex: 1},
});

export default App;
