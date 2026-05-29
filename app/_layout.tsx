import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { supabase } from '../src/lib/supabase';
import { useAuthStore } from '../src/store/useAuthStore';
import { useUserStore } from '../src/store/useUserStore';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../src/lib/queryClient';
import * as SplashScreen from 'expo-splash-screen';
import ErrorBoundary from 'react-native-error-boundary';
import { VibrantBackground } from '../src/components/VibrantBackground';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync().catch(() => {});

const BizReelTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#050508',
    card: '#050508',
    text: '#FFFFFF',
    border: 'rgba(255,255,255,0.08)',
  },
};

const CustomFallback = (props: { error: Error; resetError: () => void }) => (
  <View
    style={{
      flex: 1,
      backgroundColor: '#050508',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    }}
  >
    <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 10 }}>
      Oops! Something went wrong.
    </Text>
    <Text style={{ color: '#aaa', textAlign: 'center', marginBottom: 20 }}>
      {props.error.toString()}
    </Text>
    <TouchableOpacity
      onPress={props.resetError}
      style={{
        backgroundColor: '#00D084',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 10,
      }}
    >
      <Text style={{ color: '#000', fontWeight: 'bold' }}>Try Again</Text>
    </TouchableOpacity>
  </View>
);

export default function RootLayout() {
  const { session, setSession, setUser } = useAuthStore();
  const { setProfile } = useUserStore();
  const segments = useSegments();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    // 1. Initial Session Check
    const init = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (mounted) {
          setSession(session);
          if (session?.user) {
            setUser(session.user);
            // Pre-fetch profile into store
            const { data } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();
            if (data) setProfile(data);
          }
        }
      } catch (e) {
        console.error('Auth Session Error:', e);
      } finally {
        if (mounted) {
          setIsReady(true);
          await SplashScreen.hideAsync().catch(() => {});
        }
      }
    };

    init();

    // 2. Auth State Change Listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setSession(session);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [setProfile, setSession, setUser]);

  useEffect(() => {
    if (!isReady) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      router.replace('/(auth)');
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [session, segments, isReady, router]);

  if (!isReady) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#050508',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ActivityIndicator color="#00D084" size="large" />
      </View>
    );
  }

  return (
    // @ts-ignore
    <ErrorBoundary FallbackComponent={CustomFallback}>
      <ThemeProvider value={BizReelTheme}>
        <VibrantBackground>
          <View style={{ flex: 1, backgroundColor: 'transparent' }}>
            <QueryClientProvider client={queryClient}>
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: 'transparent' },
                  animation: 'fade',
                }}
              >
                <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
                <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
                <Stack.Screen name="profile/follows" options={{ presentation: 'modal' }} />
              </Stack>
            </QueryClientProvider>
          </View>
        </VibrantBackground>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
