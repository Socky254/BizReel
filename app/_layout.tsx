import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { supabase } from '../src/lib/supabase';
import { useAuthStore } from '../src/store/useAuthStore';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../src/lib/queryClient';
import * as SplashScreen from 'expo-splash-screen';
import ErrorBoundary from 'react-native-error-boundary';
import { VibrantBackground } from '../src/components/VibrantBackground';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync().catch(() => {});

const CustomFallback = (props: { error: Error, resetError: () => void }) => (
  <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
    <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 10 }}>Oops! Something went wrong.</Text>
    <Text style={{ color: '#aaa', textAlign: 'center', marginBottom: 20 }}>{props.error.toString()}</Text>
    <TouchableOpacity
      onPress={props.resetError}
      style={{ backgroundColor: '#00D084', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 }}
    >
      <Text style={{ color: '#000', fontWeight: 'bold' }}>Try Again</Text>
    </TouchableOpacity>
  </View>
);

export default function RootLayout() {
  const { session, setSession } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    // 1. Initial Session Check
    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted) {
          setSession(session);
        }
      } catch (e) {
        console.error("Auth Session Error:", e);
      } finally {
        if (mounted) {
          setIsReady(true);
          await SplashScreen.hideAsync().catch(() => {});
        }
      }
    };

    init();

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
      router.replace('/(auth)');
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [session, segments, isReady]);

  if (!isReady) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#00C853" size="large" />
      </View>
    );
  }

  return (
    <ErrorBoundary FallbackComponent={CustomFallback}>
      <VibrantBackground>
        <View style={{ flex: 1, backgroundColor: 'transparent' }}>
          <QueryClientProvider client={queryClient}>
            <Stack screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: 'transparent' },
              animation: 'fade'
            }}>
              <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
              <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
              <Stack.Screen name="profile/follows" options={{ presentation: 'modal' }} />
            </Stack>
          </QueryClientProvider>
        </View>
      </VibrantBackground>
    </ErrorBoundary>
  );
}

