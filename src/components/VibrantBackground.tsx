import React, { memo } from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import { SafeLinearGradient } from './SafeLinearGradient';

const { width, height } = Dimensions.get('window');

interface Props {
  children: React.ReactNode;
}

// Optimization: Memoize the background and simplify for low-end devices
export const VibrantBackground: React.FC<Props> = memo(({ children }) => {
  const isAndroid = Platform.OS === 'android';

  return (
    <View style={styles.container}>
      {/* Base Deep Background */}
      <View style={[styles.absolute, { backgroundColor: '#050508' }]} />

      {/* Primary Brand Glow - Top Left (Simplified for performance) */}
      <SafeLinearGradient
        colors={['rgba(0, 200, 83, 0.06)', 'transparent']}
        style={[
          styles.glow,
          { top: -height * 0.1, left: -width * 0.2, width: width, height: width },
        ]}
      />

      {/* Tertiary Accent Glow - Center Right (Low intensity for better render speed) */}
      {!isAndroid && (
        <SafeLinearGradient
          colors={['rgba(0, 208, 132, 0.03)', 'transparent']}
          style={[
            styles.glow,
            { top: height * 0.2, right: -width * 0.4, width: width * 0.8, height: width * 0.8 },
          ]}
        />
      )}

      {children}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050508',
  },
  absolute: {
    ...StyleSheet.absoluteFillObject,
  },
  glow: {
    position: 'absolute',
    borderRadius: 999,
  },
});
