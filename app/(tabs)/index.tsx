import React from 'react';
import { FeedFeatureScreen } from '../../src/features/home/screens/FeedFeatureScreen';
import { useNavigation } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';

/**
 * ENTRY POINT: Home/Feed Tab
 * Redirects to the modular Home Feature Screen
 */
export default function FeedTab() {
  const isFocused = useIsFocused();

  if (!isFocused) return null; // Unmount feed logic when not in tab to save memory and stop video

  return <FeedFeatureScreen />;
}
