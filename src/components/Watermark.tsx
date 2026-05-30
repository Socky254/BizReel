import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Colors } from '../core/theme/colors';

interface WatermarkProps {
  businessName?: string;
}

export const Watermark = ({ businessName }: WatermarkProps) => {
  return (
    <View style={styles.container}>
      <View style={styles.brandRow}>
        <Image
          source={require('../../assets/icon.png')}
          style={styles.logo}
        />
        <View>
            <Text style={styles.brandText}>BIZREEL</Text>
            {businessName && (
                <Text style={styles.businessText}>{businessName.toUpperCase()}</Text>
            )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logo: {
    width: 24,
    height: 24,
    borderRadius: 6,
  },
  brandText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
  },
  businessText: {
    color: Colors.primary,
    fontSize: 8,
    fontWeight: '800',
    marginTop: -2,
  }
});
