/**
 * useMessages.ts
 * Selects the message list for a given deviceId from the store.
 */
import {useChatStore, Message} from '../store/chatStore';

export function useMessages(deviceId: string): Message[] {
  return useChatStore(s => s.messages[deviceId] ?? []);
}
