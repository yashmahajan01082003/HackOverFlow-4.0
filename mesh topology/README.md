# BitChat

A decentralized, peer-to-peer Bluetooth Low Energy (BLE) chat application built with React Native.

## Features

- **No Internet Required**: 100% offline, peer-to-peer messaging using Bluetooth Low Energy.
- **Cross-Platform**: Built with React Native (tested on Android).
- **Auto-Discovery**: Continuously scans for nearby devices running BitChat.
- **Message Fragmentation**: Automatically splits messages > 20 bytes into smaller BLE packets and reassembles them on the receiving end.
- **WhatsApp-Style UI**: Clean, responsive chat interface with sent/received status and timestamps.
- **Nicknames**: Set a custom nickname to identify yourself to peers.

## Architecture

- **UI Framework**: React Native (CLI)
- **State Management**: Zustand
- **Navigation**: React Navigation
- **Bluetooth Engine**: `react-native-ble-plx`
- **Protocol**: Custom BLE packet protocol ensuring data integrity over standard 20-byte MTUs.

## Requirements

- Node.js >= 18
- JDK 17+
- Android Studio / Android SDK
- A physical Android device running Android 12+ (BLE peripheral mode testing requires physical hardware).

## Installation

```bash
# Install dependencies
npm install

# Build and run on Android
npm run android
```

## How It Works

1. Launch the app and grant Bluetooth & Location permissions.
2. Tap **Scan for Devices** on the Home screen.
3. Select a nearby device to connect.
4. Once connected, tap **Chat** to open the chat interface.
5. Send text messages back and forth in real time!

## Note on Two-Way BLE Chat

Because `react-native-ble-plx` is a Central-only library, true two-way peripheral-to-peripheral communication natively on identical phones requires each device to act as a Central connecting to the other. To test locally: run the app on two real Android devices simultaneously.
