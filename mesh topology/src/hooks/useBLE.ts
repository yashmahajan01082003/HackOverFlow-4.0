/**
 * useBLE.ts
 * Central hook that orchestrates BLE scanning, connecting,
 * sending messages, and wiring incoming data to the Zustand store.
 */
import {useCallback, useRef, useState} from 'react';
import {Platform, PermissionsAndroid, Alert} from 'react-native';
import {useChatStore, Message} from '../store/chatStore';
import {
  startScan,
  stopScan,
  waitForBluetooth,
  ScannedDevice,
} from '../services/bleManager';
import {
  connectToDevice as bleConnect,
  disconnectFromDevice,
  sendFrames,
  isConnected,
} from '../services/bleConnection';
import {
  decodeChunk,
  encodePacket,
  makeMessagePacket,
  makeNickPacket,
  Packet,
} from '../services/messageProtocol';

export function useBLE() {
  const [scanning, setScanning] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);

  const {
    myId,
    nickname,
    upsertDevice,
    setConnectionStatus,
    addMessage,
    setPeerNickname,
  } = useChatStore(s => ({
    myId: s.myId,
    nickname: s.nickname,
    upsertDevice: s.upsertDevice,
    setConnectionStatus: s.setConnectionStatus,
    addMessage: s.addMessage,
    setPeerNickname: s.setPeerNickname,
  }));

  // ─── Permissions ─────────────────────────────────────────────────────────
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    if (Platform.OS !== 'android') {
      setPermissionGranted(true);
      return true;
    }

    const apiLevel = Platform.Version;

    let granted = false;

    if (apiLevel >= 31) {
      const results = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]);
      granted = Object.values(results).every(
        r => r === PermissionsAndroid.RESULTS.GRANTED,
      );
    } else {
      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      );
      granted = result === PermissionsAndroid.RESULTS.GRANTED;
    }

    setPermissionGranted(granted);

    if (!granted) {
      Alert.alert(
        'Permission required',
        'Bluetooth and Location permissions are required to scan for nearby devices.',
      );
    }

    return granted;
  }, []);

  // ─── Scan ─────────────────────────────────────────────────────────────────
  const scan = useCallback(
    async (durationMs = 10000) => {
      const ok = await requestPermissions();
      if (!ok) {
        return;
      }

      try {
        await waitForBluetooth();
      } catch {
        Alert.alert('Bluetooth', 'Please enable Bluetooth to scan for devices.');
        return;
      }

      setScanning(true);

      startScan((scanned: ScannedDevice) => {
        upsertDevice({
          id: scanned.id,
          name: scanned.name,
          rssi: scanned.rssi,
          lastSeen: Date.now(),
        });
      });

      setTimeout(() => {
        stopScan();
        setScanning(false);
      }, durationMs);
    },
    [requestPermissions, upsertDevice],
  );

  const stopScanning = useCallback(() => {
    stopScan();
    setScanning(false);
  }, []);

  // ─── Incoming data handler ────────────────────────────────────────────────
  const handleIncomingData = useCallback(
    (deviceId: string, base64: string) => {
      const packet: Packet | null = decodeChunk(deviceId, base64);
      if (!packet) {
        return; // Waiting for more fragments
      }

      if (packet.type === 'nick' && packet.nickname) {
        setPeerNickname(deviceId, packet.nickname);
        return;
      }

      if (packet.type === 'message') {
        const msg: Message = {
          id: packet.msgId,
          senderId: packet.senderId,
          senderNickname: packet.nickname,
          content: packet.content,
          timestamp: packet.timestamp,
          isMine: packet.senderId === myId,
        };
        addMessage(deviceId, msg);
      }
    },
    [myId, addMessage, setPeerNickname],
  );

  // ─── Connect ──────────────────────────────────────────────────────────────
  const connect = useCallback(
    async (deviceId: string): Promise<boolean> => {
      setConnectionStatus(deviceId, 'connecting');
      try {
        await bleConnect(
          deviceId,
          handleIncomingData,
          () => setConnectionStatus(deviceId, 'disconnected'),
        );
        setConnectionStatus(deviceId, 'connected');

        // Announce nickname
        const nickPacket = makeNickPacket(myId, nickname);
        const frames = encodePacket(nickPacket);
        await sendFrames(deviceId, frames).catch(() => {});

        return true;
      } catch (e: any) {
        console.warn('[useBLE] connect error:', e.message);
        setConnectionStatus(deviceId, 'error');
        Alert.alert('Connection failed', e.message ?? 'Could not connect to device.');
        return false;
      }
    },
    [myId, nickname, setConnectionStatus, handleIncomingData],
  );

  // ─── Disconnect ───────────────────────────────────────────────────────────
  const disconnect = useCallback(
    async (deviceId: string) => {
      await disconnectFromDevice(deviceId);
      setConnectionStatus(deviceId, 'disconnected');
    },
    [setConnectionStatus],
  );

  // ─── Send message ─────────────────────────────────────────────────────────
  const sendMessage = useCallback(
    async (deviceId: string, content: string): Promise<boolean> => {
      if (!isConnected(deviceId)) {
        Alert.alert('Not connected', 'Please connect to the device first.');
        return false;
      }

      const packet = makeMessagePacket(myId, content, nickname);
      const frames = encodePacket(packet);

      try {
        await sendFrames(deviceId, frames);

        // Echo to local UI as sent message
        const msg: Message = {
          id: packet.msgId,
          senderId: myId,
          senderNickname: nickname,
          content,
          timestamp: packet.timestamp,
          isMine: true,
        };
        addMessage(deviceId, msg);

        return true;
      } catch (e: any) {
        console.warn('[useBLE] send error:', e.message);
        Alert.alert('Send failed', e.message ?? 'Failed to send message.');
        return false;
      }
    },
    [myId, nickname, addMessage],
  );

  return {
    scanning,
    permissionGranted,
    requestPermissions,
    scan,
    stopScanning,
    connect,
    disconnect,
    sendMessage,
  };
}
