/**
 * ConnectionBadge.tsx
 * A small pill showing the current connection status with color coding.
 */
import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {ConnectionStatus} from '../store/chatStore';

interface Props {
  status: ConnectionStatus;
}

const CONFIG: Record<ConnectionStatus, {label: string; color: string; bg: string}> = {
  connected: {label: '● Connected', color: '#1B5E20', bg: '#A5D6A7'},
  connecting: {label: '◌ Connecting…', color: '#E65100', bg: '#FFE0B2'},
  disconnected: {label: '○ Disconnected', color: '#4A4A5A', bg: '#2A2A3E'},
  error: {label: '✕ Error', color: '#B71C1C', bg: '#FFCDD2'},
};

export const ConnectionBadge: React.FC<Props> = ({status}) => {
  const {label, color, bg} = CONFIG[status];
  return (
    <View style={[styles.badge, {backgroundColor: bg}]}>
      <Text style={[styles.text, {color}]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'center',
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
  },
});
