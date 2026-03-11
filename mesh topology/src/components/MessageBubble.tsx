/**
 * MessageBubble.tsx
 * A single chat message bubble — sent (right, purple) vs received (left, dark).
 */
import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {Message} from '../store/chatStore';

interface Props {
  message: Message;
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
}

export const MessageBubble: React.FC<Props> = ({message}) => {
  const isMine = message.isMine;

  return (
    <View style={[styles.wrapper, isMine ? styles.wrapperRight : styles.wrapperLeft]}>
      {/* Sender name (only for received messages) */}
      {!isMine && (
        <Text style={styles.senderName}>
          {message.senderNickname ?? message.senderId.slice(-6)}
        </Text>
      )}

      <View style={[styles.bubble, isMine ? styles.bubbleSent : styles.bubbleReceived]}>
        <Text style={[styles.text, isMine ? styles.textSent : styles.textReceived]}>
          {message.content}
        </Text>
        <Text style={[styles.time, isMine ? styles.timeSent : styles.timeReceived]}>
          {formatTime(message.timestamp)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: 3,
    marginHorizontal: 12,
    maxWidth: '80%',
  },
  wrapperRight: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  wrapperLeft: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  senderName: {
    color: '#9B8FFF',
    fontSize: 11,
    marginBottom: 2,
    fontWeight: '600',
  },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  bubbleSent: {
    backgroundColor: '#6C63FF',
    borderBottomRightRadius: 4,
  },
  bubbleReceived: {
    backgroundColor: '#2A2A3E',
    borderBottomLeftRadius: 4,
  },
  text: {
    fontSize: 15,
    lineHeight: 20,
  },
  textSent: {
    color: '#FFFFFF',
  },
  textReceived: {
    color: '#E0E0FF',
  },
  time: {
    fontSize: 10,
    marginTop: 4,
  },
  timeSent: {
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'right',
  },
  timeReceived: {
    color: '#666688',
  },
});
