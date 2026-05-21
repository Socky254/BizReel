import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { supabase } from '../src/lib/supabase';
import { useAuthStore } from '../src/store/useAuthStore';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../src/lib/queryClient';
import * as SplashScreen from 'expo-splash-screen';
import { Colors } from '../src/core/theme/colors';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { session, setSession } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    // 1. Initial Session Check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        setSession(session);
        setIsReady(true);
        SplashScreen.hideAsync().catch(() => {});
      }
    });

    // 2. Auth State Change Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setSession(session);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!isReady) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      // Use setImmediate or setTimeout to ensure navigation happens after layout
      const timer = setTimeout(() => {
        router.replace('/(auth)');
      }, 1);
      return () => clearTimeout(timer);
    } else if (session && inAuthGroup) {
      const timer = setTimeout(() => {
        router.replace('/(tabs)');
      }, 1);
      return () => clearTimeout(timer);
    }
  }, [session, segments, isReady]);

  if (!isReady) return null;

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <QueryClientProvider client={queryClient}>
        <Stack screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#000' },
          animation: 'fade'
        }}>
          <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
          <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
          <Stack.Screen name="profile/follows" options={{ presentation: 'modal' }} />
        </Stack>
      </QueryClientProvider>
    </View>
  );
}
