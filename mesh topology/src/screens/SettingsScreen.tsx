/**
 * SettingsScreen.tsx
 * Set the user's nickname, view their device ID, and adjust preferences.
 */
import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ScrollView,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useChatStore} from '../store/chatStore';

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const {nickname, myId, setNickname} = useChatStore(s => ({
    nickname: s.nickname,
    myId: s.myId,
    setNickname: s.setNickname,
  }));

  const [nick, setNick] = useState(nickname);

  const handleSave = () => {
    const trimmed = nick.trim();
    if (!trimmed) {
      Alert.alert('Invalid', 'Nickname cannot be empty.');
      return;
    }
    if (trimmed.length > 24) {
      Alert.alert('Invalid', 'Nickname must be 24 characters or fewer.');
      return;
    }
    setNickname(trimmed);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>

        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Settings</Text>
          <View style={{width: 60}} />
        </View>

        {/* Avatar / Identity */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(nick || 'A')[0].toUpperCase()}</Text>
          </View>
          <Text style={styles.myIdText}>Your ID: {myId.slice(-12)}</Text>
        </View>

        {/* Nickname section */}
        <View style={styles.section}>
          <Text style={styles.label}>Nickname</Text>
          <TextInput
            style={styles.input}
            value={nick}
            onChangeText={setNick}
            placeholder="Enter your nickname"
            placeholderTextColor="#555580"
            maxLength={24}
            returnKeyType="done"
          />
          <Text style={styles.hint}>{nick.length}/24 characters</Text>
        </View>

        {/* Info section */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>ℹ  About BitChat</Text>
          <Text style={styles.infoText}>
            BitChat is a peer-to-peer Bluetooth Low Energy messenger. No internet required.
            Messages are end-to-end encrypted over BLE and never leave your local area.
          </Text>
          <Text style={styles.infoText}>
            Service UUID: 6E400001-…CA9E{'\n'}
            Protocol: Custom fragmented BLE packets (≤20 bytes each)
          </Text>
        </View>

        {/* Save button */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>Save Changes</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0D0D1A',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backText: {
    color: '#6C63FF',
    fontSize: 16,
    fontWeight: '600',
    width: 60,
  },
  title: {
    color: '#E0E0FF',
    fontSize: 18,
    fontWeight: '800',
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#6C63FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  avatarText: {
    color: '#FFF',
    fontSize: 34,
    fontWeight: '700',
  },
  myIdText: {
    color: '#5A5A7A',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  section: {
    marginBottom: 28,
  },
  label: {
    color: '#A0A0C0',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1E1E3A',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#E0E0FF',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#2E2E5A',
  },
  hint: {
    color: '#444460',
    fontSize: 11,
    marginTop: 6,
    textAlign: 'right',
  },
  infoSection: {
    backgroundColor: '#131320',
    borderRadius: 14,
    padding: 16,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: '#1E1E3A',
  },
  infoTitle: {
    color: '#8880FF',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
  },
  infoText: {
    color: '#666688',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 8,
  },
  saveBtn: {
    backgroundColor: '#6C63FF',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#6C63FF',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
