/**
 * bleConnection.ts
 * Manages active BLE connections: connect, disconnect,
 * subscribe to TX (notify) characteristic, send data on RX (write).
 */
import {Device, Subscription} from 'react-native-ble-plx';
import {getBleManager, SERVICE_UUID, CHAR_TX_UUID, CHAR_RX_UUID} from './bleManager';

// ─── Connection registry ──────────────────────────────────────────────────────
interface ActiveConnection {
  device: Device;
  subscription: Subscription | null;
  reconnectTimer: ReturnType<typeof setTimeout> | null;
}

const connections = new Map<string, ActiveConnection>();

// ─── Connect ──────────────────────────────────────────────────────────────────
export async function connectToDevice(
  deviceId: string,
  onData: (deviceId: string, base64: string) => void,
  onDisconnect?: (deviceId: string) => void,
): Promise<Device> {
  const manager = getBleManager();

  // Disconnect any stale connection
  if (connections.has(deviceId)) {
    await disconnectFromDevice(deviceId);
  }

  const device = await manager.connectToDevice(deviceId, {
    autoConnect: false,
    requestMTU: 23, // 20 bytes payload + 3 ATT overhead
  });

  await device.discoverAllServicesAndCharacteristics();

  // Subscribe to notifications on TX characteristic
  const subscription = device.monitorCharacteristicForService(
    SERVICE_UUID,
    CHAR_TX_UUID,
    (error, characteristic) => {
      if (error) {
        console.warn('[BLE] Monitor error on', deviceId, error.message);
        return;
      }
      if (characteristic?.value) {
        onData(deviceId, characteristic.value);
      }
    },
  );

  const conn: ActiveConnection = {device, subscription, reconnectTimer: null};
  connections.set(deviceId, conn);

  // Handle unexpected disconnection
  device.onDisconnected((error, disconnectedDevice) => {
    console.log('[BLE] Disconnected from', disconnectedDevice?.id, error?.message);
    const c = connections.get(deviceId);
    if (c) {
      c.subscription?.remove();
      connections.delete(deviceId);
    }
    onDisconnect?.(deviceId);
  });

  return device;
}

// ─── Disconnect ───────────────────────────────────────────────────────────────
export async function disconnectFromDevice(deviceId: string): Promise<void> {
  const conn = connections.get(deviceId);
  if (!conn) {
    return;
  }
  if (conn.reconnectTimer) {
    clearTimeout(conn.reconnectTimer);
  }
  conn.subscription?.remove();
  connections.delete(deviceId);
  try {
    await conn.device.cancelConnection();
  } catch {
    // Already disconnected – ignore
  }
}

// ─── Send data ────────────────────────────────────────────────────────────────
/**
 * Write a single Base64-encoded BLE frame (≤20 bytes) to the RX characteristic.
 * Call this once per fragment produced by encodePacket().
 */
export async function sendFrame(
  deviceId: string,
  base64Frame: string,
): Promise<void> {
  const conn = connections.get(deviceId);
  if (!conn) {
    throw new Error(`Not connected to device ${deviceId}`);
  }
  await conn.device.writeCharacteristicWithResponseForService(
    SERVICE_UUID,
    CHAR_RX_UUID,
    base64Frame,
  );
}

/**
 * Send all frames for a fragmented packet sequentially, with a small delay
 * between writes so the remote device has time to reassemble.
 */
export async function sendFrames(
  deviceId: string,
  frames: string[],
): Promise<void> {
  for (const frame of frames) {
    await sendFrame(deviceId, frame);
    // Tiny delay to avoid overwhelming the BLE stack
    await new Promise(r => setTimeout(r, 30));
  }
}

// ─── Status helpers ───────────────────────────────────────────────────────────
export function isConnected(deviceId: string): boolean {
  return connections.has(deviceId);
}

export function getConnectedDeviceIds(): string[] {
  return Array.from(connections.keys());
}
