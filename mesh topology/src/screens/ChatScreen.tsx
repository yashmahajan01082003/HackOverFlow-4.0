/**
 * ChatScreen.tsx
 * WhatsApp-style chat UI for a single BLE peer connection.
 */
import React, {useState, useRef, useCallback} from 'react';
import {
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Text,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import {RouteProp, useRoute, useNavigation} from '@react-navigation/native';
import {useBLE} from '../hooks/useBLE';
import {useMessages} from '../hooks/useMessages';
import {useChatStore} from '../store/chatStore';
import {MessageBubble} from '../components/MessageBubble';
import {ConnectionBadge} from '../components/ConnectionBadge';
import {RootStackParamList} from '../navigation/AppNavigator';
import {Message} from '../store/chatStore';

type ChatRouteProp = RouteProp<RootStackParamList, 'Chat'>;

export const ChatScreen: React.FC = () => {
  const {params} = useRoute<ChatRouteProp>();
  const navigation = useNavigation();
  const {deviceId} = params;

  const {sendMessage, connect, disconnect} = useBLE();
  const messages = useMessages(deviceId);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const flatRef = useRef<FlatList<Message>>(null);

  const {status, device} = useChatStore(s => ({
    status: s.connections[deviceId] ?? 'disconnected',
    device: s.devices.find(d => d.id === deviceId),
  }));

  const peerName = device?.peerNickname ?? device?.name ?? deviceId.slice(-8).toUpperCase();

  const handleSend = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) {
      return;
    }
    setSending(true);
    setText('');
    await sendMessage(deviceId, trimmed);
    setSending(false);
    // Scroll to bottom
    setTimeout(() => flatRef.current?.scrollToEnd({animated: true}), 100);
  }, [text, sending, sendMessage, deviceId]);

  const handleReconnect = useCallback(async () => {
    await connect(deviceId);
  }, [connect, deviceId]);

  const renderItem = useCallback(
    ({item}: {item: Message}) => <MessageBubble message={item} />,
    [],
  );

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.peerName} numberOfLines={1}>
            {peerName}
          </Text>
          <ConnectionBadge status={status} />
        </View>
        {status === 'disconnected' || status === 'error' ? (
          <TouchableOpacity style={styles.reconnectBtn} onPress={handleReconnect}>
            <Text style={styles.reconnectText}>Reconnect</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.endBtn}
            onPress={() => disconnect(deviceId)}>
            <Text style={styles.endText}>Disconnect</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Messages */}
      <FlatList
        ref={flatRef}
        data={messages}
        keyExtractor={m => m.id}
        renderItem={renderItem}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatRef.current?.scrollToEnd({animated: false})}
        ListEmptyComponent={
          <View style={styles.emptyChat}>
            <Text style={styles.emptyChatIcon}>💬</Text>
            <Text style={styles.emptyChatText}>
              No messages yet.{'\n'}Say hello!
            </Text>
          </View>
        }
      />

      {/* Input bar */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}>
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Type a message…"
            placeholderTextColor="#555570"
            multiline
            maxLength={2000}
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              (!text.trim() || sending) && styles.sendBtnDisabled,
            ]}
            onPress={handleSend}
            disabled={!text.trim() || sending}>
            <Text style={styles.sendBtnIcon}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    alignItems: 'center',
    backgroundColor: '#131320',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1E1E3A',
  },
  backBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  backText: {
    color: '#6C63FF',
    fontSize: 28,
    fontWeight: '300',
  },
  headerCenter: {
    flex: 1,
    marginHorizontal: 8,
  },
  peerName: {
    color: '#E0E0FF',
    fontSize: 16,
    fontWeight: '700',
  },
  reconnectBtn: {
    backgroundColor: '#6C63FF',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  reconnectText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  endBtn: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#FF5252',
  },
  endText: {
    color: '#FF5252',
    fontSize: 12,
    fontWeight: '600',
  },
  messagesList: {
    paddingVertical: 12,
    paddingBottom: 8,
  },
  emptyChat: {
    marginTop: 80,
    alignItems: 'center',
  },
  emptyChatIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyChatText: {
    color: '#5A5A7A',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#131320',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#1E1E3A',
  },
  input: {
    flex: 1,
    backgroundColor: '#1E1E3A',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    color: '#E0E0FF',
    fontSize: 15,
    maxHeight: 100,
    marginRight: 10,
  },
  sendBtn: {
    backgroundColor: '#6C63FF',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#6C63FF',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  sendBtnDisabled: {
    backgroundColor: '#2A2A4A',
  },
  sendBtnIcon: {
    color: '#FFF',
    fontSize: 18,
    marginLeft: 2,
  },
});
