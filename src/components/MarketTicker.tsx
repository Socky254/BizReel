import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { Colors } from '../core/theme/colors';

const { width } = Dimensions.get('window');

const TICKER_ITEMS = [
  'GLOBAL SYNERGY INDEX: +2.4%',
  'TOP SECTOR: REAL ESTATE',
  'NETWORKING VELOCITY: HIGH',
  'ACTIVE PARTNERSHIPS: 12,482',
  'BIZREEL ECOSYSTEM: OPTIMIZED',
  'NEW OPPORTUNITIES DETECTED',
];

export const MarketTicker = () => {
  const translateX = useSharedValue(width);

  useEffect(() => {
    translateX.value = withRepeat(
      withTiming(-width * 3, {
        duration: 25000,
        easing: Easing.linear,
      }),
      -1,
      false,
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.tickerWrapper, animatedStyle]}>
        {TICKER_ITEMS.map((item, index) => (
          <View key={index} style={styles.itemWrapper}>
            <View style={styles.dot} />
            <Text style={styles.itemText}>{item}</Text>
          </View>
        ))}
        {/* Duplicate for seamless loop */}
        {TICKER_ITEMS.map((item, index) => (
          <View key={`dup-${index}`} style={styles.itemWrapper}>
            <View style={styles.dot} />
            <Text style={styles.itemText}>{item}</Text>
          </View>
        ))}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 24,
    backgroundColor: 'rgba(0, 208, 132, 0.05)',
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0, 208, 132, 0.1)',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  tickerWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 40,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.primary,
    marginRight: 8,
  },
  itemText: {
    color: Colors.primary,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    opacity: 0.8,
  },
});
