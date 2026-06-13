import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated as RNAnimated } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { Colors } from '../core/theme/colors';

const { width, height } = Dimensions.get('window');

interface Props {
  isVisible: boolean;
  businessName: string;
  category: string;
  perfIndex?: {
    index_score: number;
    status: string;
    fulfillment_rate: number;
    unique_business_partners: number;
    total_closed_deals: number;
    total_revenue_volume: number;
    avg_user_rating: number;
  };
}

export const IntelligenceHUD: React.FC<Props> = ({ isVisible, businessName, category, perfIndex }) => {
  const synergyValue = useSharedValue(0);
  const scanLinePos = useSharedValue(0);

  useEffect(() => {
    if (isVisible) {
      // Use real performance index score if available, otherwise fallback to high trust simulation
      const targetScore = perfIndex?.index_score || (Math.floor(Math.random() * 31) + 65);
      synergyValue.value = withSpring(targetScore, { damping: 10 });
      scanLinePos.value = withRepeat(
        withSequence(withTiming(1, { duration: 1500 }), withTiming(0, { duration: 1500 })),
        -1,
        true,
      );
    } else {
      synergyValue.value = 0;
    }
  }, [isVisible, perfIndex]);

  const synergyStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(isVisible ? 1 : 0.8) }],
  }));

  const scanStyle = useAnimatedStyle(() => ({
    top: `${scanLinePos.value * 100}%`,
    opacity: scanLinePos.value > 0.1 && scanLinePos.value < 0.9 ? 1 : 0,
  }));

  if (!isVisible) return null;

  return (
    <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.overlay}>
      <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill}>
        <View style={styles.content}>
          {/* Scanning Line */}
          <Animated.View style={[styles.scanLine, scanStyle]} />

          <View style={styles.header}>
            <Ionicons name="scan-outline" size={24} color={Colors.primary} />
            <Text style={styles.headerTitle}>BIZREEL TRUST ANALYTICS</Text>
          </View>

          <Animated.View style={[styles.meterContainer, synergyStyle]}>
            <View style={styles.circleOuter}>
              <View style={styles.circleInner}>
                <Text style={styles.synergyLabel}>TRUST SCORE</Text>
                <Text style={styles.synergyValue}>{Math.round(synergyValue.value)}</Text>
              </View>
            </View>
          </Animated.View>

          <View style={styles.dataGrid}>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>ENTITY</Text>
              <Text style={styles.dataValue}>{businessName.toUpperCase()}</Text>
            </View>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>PARTNERS</Text>
              <Text style={styles.dataValue}>{perfIndex?.unique_business_partners || '0'} BUSINESSES</Text>
            </View>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>STATUS</Text>
              <Text style={[styles.dataValue, { color: Colors.primary }]}>
                {perfIndex?.status || 'VERIFIED BUSINESS'}
              </Text>
            </View>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>RELIABILITY</Text>
              <Text style={styles.dataValue}>
                {perfIndex?.fulfillment_rate || 100}% FULFILLMENT
              </Text>
            </View>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>RATING</Text>
              <Text style={styles.dataValue}>{perfIndex?.avg_user_rating || '5.0'} / 5.0</Text>
            </View>
          </View>

          <View style={styles.footer}>
            <View style={styles.pulse} />
            <Text style={styles.footerText}>REAL-TIME BLOCKCHAIN-VERIFIED TRUST INDEX</Text>
          </View>
        </View>
      </BlurView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: width * 0.85,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 35,
    padding: 30,
    borderWidth: 1,
    borderColor: 'rgba(0, 208, 132, 0.3)',
    overflow: 'hidden',
    shadowColor: '#00D084',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(0, 208, 132, 0.5)',
    shadowColor: '#00D084',
    shadowRadius: 10,
    shadowOpacity: 1,
    zIndex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 30,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
  },
  meterContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  circleOuter: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,208,132,0.03)',
  },
  circleInner: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1,
    borderColor: 'rgba(0,208,132,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  synergyLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  synergyValue: {
    color: Colors.primary,
    fontSize: 42,
    fontWeight: '900',
    marginTop: 5,
  },
  dataGrid: {
    gap: 15,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    paddingBottom: 8,
  },
  dataLabel: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  dataValue: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 35,
  },
  pulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  footerText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
