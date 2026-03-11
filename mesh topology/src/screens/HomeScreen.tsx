/**
 * HomeScreen.tsx
 * Main screen: shows nickname, scan button, and discovered device list.
 */
import React, {useEffect} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ListRenderItem,
  SafeAreaView,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {useBLE} from '../hooks/useBLE';
import {useChatStore, BLEDevice} from '../store/chatStore';
import {DeviceItem} from '../components/DeviceItem';
import {RootStackParamList} from '../navigation/AppNavigator';

type NavProp = StackNavigationProp<RootStackParamList, 'Home'>;

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const {scanning, scan, stopScanning, connect, disconnect} = useBLE();

  const {devices, connections, nickname} = useChatStore(s => ({
    devices: s.devices,
    connections: s.connections,
    nickname: s.nickname,
  }));

  useEffect(() => {
    scan(15000);
    return () => {
      stopScanning();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConnect = async (deviceId: string) => {
    const ok = await connect(deviceId);
    if (ok) {
      navigation.navigate('Chat', {deviceId});
    }
  };

  const renderDevice: ListRenderItem<BLEDevice> = ({item}) => (
    <DeviceItem
      id={item.id}
      name={item.name}
      rssi={item.rssi}
      status={connections[item.id] ?? 'disconnected'}
      peerNickname={item.peerNickname}
      onConnect={() => handleConnect(item.id)}
      onDisconnect={() => disconnect(item.id)}
      onChat={() => navigation.navigate('Chat', {deviceId: item.id})}
    />
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0D1A" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>BitChat</Text>
          <Text style={styles.subtitle}>📡 P2P Bluetooth Messenger</Text>
        </View>
        <TouchableOpacity
          style={styles.settingsBtn}
          onPress={() => navigation.navigate('Settings')}>
          <Text style={styles.settingsBtnText}>⚙  {nickname}</Text>
        </TouchableOpacity>
      </View>

      {/* Scan button */}
      <TouchableOpacity
        style={[styles.scanBtn, scanning && styles.scanBtnActive]}
        onPress={scanning ? stopScanning : () => scan(15000)}>
        <Text style={styles.scanBtnText}>
          {scanning ? '⏹  Stop Scan' : '🔍  Scan for Devices'}
        </Text>
        {scanning && <Text style={styles.scanSubText}>Scanning…</Text>}
      </TouchableOpacity>

      {/* Device list */}
      <FlatList
        data={devices}
        keyExtractor={d => d.id}
        renderItem={renderDevice}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📻</Text>
            <Text style={styles.emptyText}>
              {scanning
                ? 'Scanning for nearby devices…'
                : 'No devices found.\nTap Scan to search.'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0D0D1A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E1E3A',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  subtitle: {
    color: '#6C63FF',
    fontSize: 12,
    marginTop: 2,
  },
  settingsBtn: {
    backgroundColor: '#1E1E3A',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  settingsBtnText: {
    color: '#A0A0C0',
    fontSize: 13,
  },
  scanBtn: {
    backgroundColor: '#6C63FF',
    margin: 16,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#6C63FF',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  scanBtnActive: {
    backgroundColor: '#3A3475',
  },
  scanBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  scanSubText: {
    color: '#C0B8FF',
    fontSize: 12,
    marginTop: 4,
  },
  list: {
    paddingBottom: 20,
  },
  empty: {
    marginTop: 60,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    color: '#5A5A7A',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
});
