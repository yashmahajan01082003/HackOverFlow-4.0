/**
 * AppNavigator.tsx
 * React Navigation stack with Home → Chat → Settings routes.
 */
import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {HomeScreen} from '../screens/HomeScreen';
import {ChatScreen} from '../screens/ChatScreen';
import {SettingsScreen} from '../screens/SettingsScreen';

export type RootStackParamList = {
  Home: undefined;
  Chat: {deviceId: string};
  Settings: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerShown: false,
          cardStyle: {backgroundColor: '#0D0D1A'},
          gestureEnabled: true,
        }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Chat" component={ChatScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
