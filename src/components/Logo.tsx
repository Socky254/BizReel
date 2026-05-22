import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeLinearGradient } from './SafeLinearGradient';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  size?: number;
}

export const Logo: React.FC<Props> = ({ size = 100 }) => {
  const iconSize = size * 0.5;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Outer Glow Shadow */}
      <View style={[styles.glow, { width: size, height: size, borderRadius: size * 0.3 }]} />

      <SafeLinearGradient
        colors={['#00C853', '#1B5E20']}
        style={[styles.box, { borderRadius: size * 0.3 }]}
      >
        <View style={[styles.innerBox, { borderRadius: size * 0.25 }]}>
            <Ionicons name="stats-chart" size={iconSize * 0.8} color="#00C853" />
            <View style={styles.textOverlay}>
                <Text style={[styles.letter, { fontSize: size * 0.2 }]}>B</Text>
            </View>
        </View>
      </SafeLinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  glow: {
    position: 'absolute',
    backgroundColor: '#00C853',
    opacity: 0.15,
    transform: [{ scale: 1.15 }],
  },
  box: {
    width: '100%',
    height: '100%',
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerBox: {
    flex: 1,
    width: '100%',
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  textOverlay: {
    position: 'absolute',
    bottom: '10%',
    right: '10%',
    backgroundColor: '#00C853',
    width: '40%',
    height: '40%',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000000',
  },
  letter: {
    color: '#000',
    fontWeight: '900',
  }
});
