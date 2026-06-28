import '@/global.css';

import { PortalHost } from '@rn-primitives/portal';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from '@/contexts/auth-context';
import { ChatsProvider } from '@/contexts/chats-context';
import { useAppFonts } from '@/hooks/use-fonts';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const { colorScheme } = useColorScheme();
  const [fontsLoaded] = useAppFonts();

  React.useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <ChatsProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="chat-details" options={{ presentation: 'modal' }} />
              <Stack.Screen name="profile" options={{ presentation: 'modal' }} />
              <Stack.Screen name="profile-edit" options={{ presentation: 'modal' }} />
            </Stack>
            <PortalHost />
            <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
          </ChatsProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
