import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { SafeLinearGradient } from './SafeLinearGradient';

const { width, height } = Dimensions.get('window');

interface Props {
  children: React.ReactNode;
}

export const VibrantBackground: React.FC<Props> = ({ children }) => {
  return (
    <View style={styles.container}>
      {/* Base Deep Background */}
      <View style={[styles.absolute, { backgroundColor: '#000000' }]} />

      {/* Primary Brand Glow - Top Left (Emerald Green) */}
      <SafeLinearGradient
        colors={['rgba(0, 200, 83, 0.12)', 'transparent']}
        style={[styles.glow, { top: -height * 0.2, left: -width * 0.4, width: width * 1.6, height: width * 1.6 }]}
      />

      {/* Secondary Accent Glow - Bottom Right (Deep Mint) */}
      <SafeLinearGradient
        colors={['rgba(0, 255, 140, 0.08)', 'transparent']}
        style={[styles.glow, { bottom: -height * 0.1, right: -width * 0.3, width: width * 1.4, height: width * 1.4 }]}
      />

      {/* Center Depth Glow - Strategy Gold hint for elite feel */}
      <SafeLinearGradient
        colors={['rgba(212, 175, 55, 0.02)', 'transparent']}
        style={[styles.glow, { top: height * 0.2, right: -width * 0.2, width: width, height: width }]}
      />

      {/* Tertiary Accent Glow - Center Right */}
      <SafeLinearGradient
        colors={['rgba(0, 208, 132, 0.05)', 'transparent']}
        style={[styles.glow, { top: height * 0.3, right: -width * 0.5, width: width, height: width }]}
      />

      {/* Center Depth Glow */}
      <SafeLinearGradient
        colors={['transparent', 'rgba(255, 255, 255, 0.02)', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.absolute}
      />

      {children}
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  absolute: {
    ...StyleSheet.absoluteFillObject,
  },
  glow: {
    position: 'absolute',
    borderRadius: 999,
  },
});
