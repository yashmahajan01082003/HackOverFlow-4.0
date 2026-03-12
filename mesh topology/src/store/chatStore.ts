/**
 * chatStore.ts
 * Zustand store for BitChat global state:
 *  - devices discovered by BLE scan
 *  - per-device messages
 *  - connection status per device
 *  - local user identity (myId, nickname)
 */
import {create} from 'zustand';

// ─── Types ────────────────────────────────────────────────────────────────────
export type ConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'error';

export interface BLEDevice {
  id: string;
  name: string | null;
  rssi: number | null;
  lastSeen: number;
  /** nickname announced by the remote peer */
  peerNickname?: string;
}

export interface Message {
  id: string;
  senderId: string;
  senderNickname?: string;
  content: string;
  timestamp: number;
  isMine: boolean;
}

export interface ChatState {
  // Identity
  myId: string;
  nickname: string;

  // Scan results
  devices: BLEDevice[];

  // Connection state per device
  connections: Record<string, ConnectionStatus>;

  // Messages per device
  messages: Record<string, Message[]>;

  // Actions
  setNickname: (nick: string) => void;
  upsertDevice: (device: BLEDevice) => void;
  clearDevices: () => void;
  setConnectionStatus: (deviceId: string, status: ConnectionStatus) => void;
  addMessage: (deviceId: string, message: Message) => void;
  setPeerNickname: (deviceId: string, nickname: string) => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────
export const useChatStore = create<ChatState>((set, get) => ({
  myId: generateId(),
  nickname: 'Anonymous',

  devices: [],
  connections: {},
  messages: {},

  setNickname: (nick: string) => set({nickname: nick}),

  upsertDevice: (device: BLEDevice) =>
    set(state => {
      const existing = state.devices.findIndex(d => d.id === device.id);
      if (existing >= 0) {
        const updated = [...state.devices];
        updated[existing] = {...updated[existing], ...device};
        return {devices: updated};
      }
      return {devices: [...state.devices, device]};
    }),

  clearDevices: () => set({devices: [], connections: {}}),

  setConnectionStatus: (deviceId: string, status: ConnectionStatus) =>
    set(state => ({
      connections: {...state.connections, [deviceId]: status},
    })),

  addMessage: (deviceId: string, message: Message) =>
    set(state => {
      const existing = state.messages[deviceId] ?? [];
      return {
        messages: {
          ...state.messages,
          [deviceId]: [...existing, message],
        },
      };
    }),

  setPeerNickname: (deviceId: string, nickname: string) =>
    set(state => {
      const updated = state.devices.map(d =>
        d.id === deviceId ? {...d, peerNickname: nickname} : d,
      );
      return {devices: updated};
    }),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────
function generateId(): string {
  return (
    'usr_' +
    Math.random().toString(36).substring(2, 10) +
    Date.now().toString(36)
  );
}
