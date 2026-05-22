import React from 'react';
import { View, ViewProps } from 'react-native';

/**
 * SURGICAL FIX: SafeLinearGradient
 * This wrapper catches "Reference error: Property LinearGradient doesn't exist"
 * by checking the import at runtime and falling back to a standard View.
 */

let LinearGradient: any;
try {
  LinearGradient = require('expo-linear-gradient').LinearGradient;
} catch (e) {
  console.error('CRITICAL: expo-linear-gradient native module missing.', e);
}

interface SafeLinearGradientProps extends ViewProps {
  colors: string[];
  locations?: number[];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  children?: React.ReactNode;
}

export const SafeLinearGradient: React.FC<SafeLinearGradientProps> = (props) => {
  if (!LinearGradient) {
    // Fallback to a standard View so the app doesn't crash
    const { colors, locations, start, end, ...viewProps } = props;
    return <View {...viewProps}>{props.children}</View>;
  }

  return <LinearGradient {...props} />;
};
