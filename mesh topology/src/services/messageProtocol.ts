/**
 * messageProtocol.ts
 * Encodes / decodes BitChat packets with BLE 20-byte MTU fragmentation.
 *
 * Packet JSON shape:
 *   { type, senderId, timestamp, content, nickname?, msgId, fragIndex, fragTotal }
 *
 * Wire format per BLE write (≤20 bytes):
 *   [ fragIndex (1 byte) | fragTotal (1 byte) | payload bytes (≤18 bytes) ]
 *
 * The payload bytes are raw UTF-8 slices of the JSON string.
 * We use Base64 only for the BLE write API itself (react-native-ble-plx requires it).
 */

import {Buffer} from 'buffer'; // polyfill via buffer npm package

// ─── Public types ─────────────────────────────────────────────────────────────
export type PacketType = 'message' | 'ack' | 'nick' | 'ping';

export interface Packet {
  type: PacketType;
  senderId: string;
  timestamp: number;
  msgId: string;
  content: string;
  nickname?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const MAX_PAYLOAD_BYTES = 18; // 20 - 2 header bytes

// ─── Encoder ─────────────────────────────────────────────────────────────────
/**
 * Serialise a Packet and split into ≤20-byte BLE-ready Base64 chunks.
 * Each chunk can be written directly to a BLE characteristic.
 */
export function encodePacket(packet: Packet): string[] {
  const json = JSON.stringify(packet);
  const utf8 = Buffer.from(json, 'utf8');

  const chunks: string[] = [];
  const total = Math.ceil(utf8.length / MAX_PAYLOAD_BYTES);

  for (let i = 0; i < total; i++) {
    const slice = utf8.slice(i * MAX_PAYLOAD_BYTES, (i + 1) * MAX_PAYLOAD_BYTES);
    // header: [fragIndex (1 byte), fragTotal (1 byte)]
    const frame = Buffer.alloc(2 + slice.length);
    frame[0] = i;
    frame[1] = total;
    slice.copy(frame, 2);
    chunks.push(frame.toString('base64'));
  }

  return chunks;
}

// ─── Reassembly buffer ────────────────────────────────────────────────────────
interface FragmentBuffer {
  total: number;
  received: Map<number, Buffer>;
}

const reassemblyBuffers = new Map<string, FragmentBuffer>();

/**
 * Feed a raw Base64 BLE chunk (from a notify callback) from a specific device.
 * Returns a fully assembled Packet when all fragments arrive, otherwise null.
 */
export function decodeChunk(
  deviceId: string,
  base64Chunk: string,
): Packet | null {
  let frame: Buffer;
  try {
    frame = Buffer.from(base64Chunk, 'base64');
  } catch {
    console.warn('[Protocol] Failed to decode base64');
    return null;
  }

  if (frame.length < 2) {
    return null;
  }

  const fragIndex = frame[0];
  const fragTotal = frame[1];
  const payload = frame.slice(2);

  const bufKey = `${deviceId}`;

  let buf = reassemblyBuffers.get(bufKey);

  // If a new message starts (fragIndex === 0) reset any partial buffer
  if (fragIndex === 0 || !buf || buf.total !== fragTotal) {
    buf = {total: fragTotal, received: new Map()};
    reassemblyBuffers.set(bufKey, buf);
  }

  buf.received.set(fragIndex, payload);

  if (buf.received.size < fragTotal) {
    return null; // Still waiting for more fragments
  }

  // All fragments received – reassemble
  const pieces: Buffer[] = [];
  for (let i = 0; i < fragTotal; i++) {
    const piece = buf.received.get(i);
    if (!piece) {
      console.warn('[Protocol] Missing fragment', i);
      reassemblyBuffers.delete(bufKey);
      return null;
    }
    pieces.push(piece);
  }

  reassemblyBuffers.delete(bufKey);

  const json = Buffer.concat(pieces).toString('utf8');
  try {
    return JSON.parse(json) as Packet;
  } catch {
    console.warn('[Protocol] JSON parse error:', json.slice(0, 80));
    return null;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
export function makeMessagePacket(
  senderId: string,
  content: string,
  nickname?: string,
): Packet {
  return {
    type: 'message',
    senderId,
    timestamp: Date.now(),
    msgId: Math.random().toString(36).substring(2),
    content,
    nickname,
  };
}

export function makeNickPacket(senderId: string, nickname: string): Packet {
  return {
    type: 'nick',
    senderId,
    timestamp: Date.now(),
    msgId: Math.random().toString(36).substring(2),
    content: '',
    nickname,
  };
}

export function makePingPacket(senderId: string): Packet {
  return {
    type: 'ping',
    senderId,
    timestamp: Date.now(),
    msgId: Math.random().toString(36).substring(2),
    content: '',
  };
}
