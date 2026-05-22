import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet, Text, Animated } from 'react-native';
import { SafeLinearGradient } from '../../src/components/SafeLinearGradient';
import React, { useState, useEffect, useRef } from 'react';

export default function TabLayout() {
  const [isOffline, setIsOffline] = useState(false);
  const slideAnim = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    // In a real app, use @react-native-community/netinfo
    // Simulating a check or listener
    if (isOffline) {
        Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }).start();
    } else {
        Animated.timing(slideAnim, { toValue: -100, duration: 500, useNativeDriver: true }).start();
    }
  }, [isOffline]);

  return (
    <View style={{ flex: 1 }}>
      <Animated.View style={[styles.offlineBanner, { transform: [{ translateY: slideAnim }] }]}>
        <Ionicons name="cloud-offline" size={16} color="#000" />
        <Text style={styles.offlineText}>NETWORK SYNCHRONIZATION PAUSED</Text>
      </Animated.View>

      <Tabs screenOptions={{
      headerShown: false,
      tabBarStyle: {
        backgroundColor: 'rgba(0,0,0,0.85)',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.08)',
        height: 90,
        paddingBottom: 35,
        paddingTop: 12,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        elevation: 0,
      },
      tabBarActiveTintColor: '#00C853',
      tabBarInactiveTintColor: 'rgba(255,255,255,0.3)',
      tabBarLabelStyle: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 },
      sceneContainerStyle: { backgroundColor: 'transparent' },
    }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Insights',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "stats-chart" : "stats-chart-outline"} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="market"
        options={{
          title: 'Exchange',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "swap-horizontal" : "swap-horizontal-outline"} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="upload"
        options={{
          title: '',
          tabBarIcon: ({ color }) => (
            <View style={styles.uploadBtn}>
               <View style={[styles.uploadGradient, { backgroundColor: '#00C853' }]}>
                 <Ionicons name="add" size={28} color="#000" />
               </View>
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="inbox"
        options={{
          title: 'Signals',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "chatbubbles" : "chatbubbles-outline"} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'HQ',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "business" : "business-outline"} size={22} color={color} />
          ),
        }}
      />
    </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  offlineBanner: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    height: 40,
    backgroundColor: '#00C853',
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
    gap: 10,
    shadowColor: '#00C853',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  offlineText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  uploadBtn: {
    width: 44,
    height: 32,
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: 8,
    shadowColor: '#00C853',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  uploadGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  }
});

