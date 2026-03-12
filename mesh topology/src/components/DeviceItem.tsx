/**
 * DeviceItem.tsx
 * A single row in the device list showing name, ID, RSSI and connect/disconnect button.
 */
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {ConnectionStatus} from '../store/chatStore';

interface Props {
  id: string;
  name: string | null;
  rssi: number | null;
  status: ConnectionStatus;
  peerNickname?: string;
  onConnect: () => void;
  onDisconnect: () => void;
  onChat: () => void;
}

function rssiLabel(rssi: number | null): string {
  if (rssi === null) {
    return '';
  }
  if (rssi > -60) {
    return '📶 Strong';
  }
  if (rssi > -75) {
    return '📶 Good';
  }
  return '📶 Weak';
}

function statusColor(status: ConnectionStatus): string {
  switch (status) {
    case 'connected':
      return '#4CAF50';
    case 'connecting':
      return '#FF9800';
    case 'error':
      return '#F44336';
    default:
      return '#9E9E9E';
  }
}

export const DeviceItem: React.FC<Props> = ({
  id,
  name,
  rssi,
  status,
  peerNickname,
  onConnect,
  onDisconnect,
  onChat,
}) => {
  const displayName = peerNickname ?? name ?? 'Unknown Device';
  const shortId = id.slice(-8).toUpperCase();

  return (
    <View style={styles.container}>
      {/* Status indicator */}
      <View style={[styles.dot, {backgroundColor: statusColor(status)}]} />

      {/* Device info */}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {displayName}
        </Text>
        <Text style={styles.sub}>
          {shortId}
          {rssi ? `  ${rssiLabel(rssi)} (${rssi} dBm)` : ''}
        </Text>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        {status === 'connecting' ? (
          <ActivityIndicator color="#6C63FF" />
        ) : status === 'connected' ? (
          <>
            <TouchableOpacity style={styles.chatBtn} onPress={onChat}>
              <Text style={styles.chatBtnText}>Chat</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.disconnectBtn} onPress={onDisconnect}>
              <Text style={styles.disconnectBtnText}>✕</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity style={styles.connectBtn} onPress={onConnect}>
            <Text style={styles.connectBtnText}>Connect</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E2E',
    borderRadius: 14,
    padding: 14,
    marginVertical: 6,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  info: {
    flex: 1,
    marginRight: 8,
  },
  name: {
    color: '#E0E0FF',
    fontSize: 15,
    fontWeight: '600',
  },
  sub: {
    color: '#8888AA',
    fontSize: 12,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  connectBtn: {
    backgroundColor: '#6C63FF',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  connectBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },
  chatBtn: {
    backgroundColor: '#23D18B',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chatBtnText: {
    color: '#121212',
    fontSize: 13,
    fontWeight: '700',
  },
  disconnectBtn: {
    backgroundColor: '#FF5252',
    borderRadius: 8,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disconnectBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
