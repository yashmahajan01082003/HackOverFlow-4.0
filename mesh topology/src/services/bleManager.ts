/**
 * bleManager.ts
 * Singleton wrapper around react-native-ble-plx BleManager.
 * Handles scanning, Bluetooth state checks and shared UUIDs.
 */
import {BleManager, State, LogLevel} from 'react-native-ble-plx';

// ─── Shared BLE service / characteristic UUIDs ───────────────────────────────
// Both devices must advertise with SERVICE_UUID so they can discover each other.
export const SERVICE_UUID = '6E400001-B5A3-F393-E0A9-E50E24DCCA9E';
/** Notify characteristic – remote device writes here, we read */
export const CHAR_TX_UUID = '6E400003-B5A3-F393-E0A9-E50E24DCCA9E';
/** Write characteristic – we write here, remote device reads */
export const CHAR_RX_UUID = '6E400002-B5A3-F393-E0A9-E50E24DCCA9E';

// ─── Singleton ────────────────────────────────────────────────────────────────
let _manager: BleManager | null = null;

export function getBleManager(): BleManager {
  if (!_manager) {
    _manager = new BleManager();
    if (__DEV__) {
      _manager.setLogLevel(LogLevel.Verbose);
    }
  }
  return _manager;
}

export function destroyBleManager(): void {
  if (_manager) {
    _manager.destroy();
    _manager = null;
  }
}

// ─── Bluetooth state helpers ──────────────────────────────────────────────────
export async function waitForBluetooth(): Promise<void> {
  const manager = getBleManager();
  const state = await manager.state();
  if (state === State.PoweredOn) {
    return;
  }
  return new Promise(resolve => {
    const sub = manager.onStateChange(s => {
      if (s === State.PoweredOn) {
        sub.remove();
        resolve();
      }
    }, true);
  });
}

export function observeBluetoothState(
  onChange: (state: State) => void,
): () => void {
  const manager = getBleManager();
  const sub = manager.onStateChange(onChange, true);
  return () => sub.remove();
}

// ─── Scanning ─────────────────────────────────────────────────────────────────
export interface ScannedDevice {
  id: string;
  name: string | null;
  rssi: number | null;
  serviceUUIDs: string[] | null;
}

let scanActive = false;

export function startScan(onDeviceFound: (device: ScannedDevice) => void): void {
  if (scanActive) {
    return;
  }
  const manager = getBleManager();
  scanActive = true;
  manager.startDeviceScan(
    null, // scan for all service UUIDs initially, filter in callback
    {allowDuplicates: false},
    (error, device) => {
      if (error) {
        console.warn('[BLE] Scan error:', error.message);
        scanActive = false;
        return;
      }
      if (device) {
        onDeviceFound({
          id: device.id,
          name: device.name ?? device.localName ?? null,
          rssi: device.rssi,
          serviceUUIDs: device.serviceUUIDs ?? null,
        });
      }
    },
  );
}

export function stopScan(): void {
  if (!scanActive) {
    return;
  }
  getBleManager().stopDeviceScan();
  scanActive = false;
}
