import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../../../core/theme/colors';
import { Ionicons } from '@expo/vector-icons';

export const SyndicateOverlay = ({ current, target, discountPrice, onJoin }: any) => {
  const progress = Math.min((current / target) * 100, 100);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="people" size={16} color={Colors.primary} />
        <Text style={styles.title}>ACTIVE SYNDICATE</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>WHOLESALE</Text>
        </View>
      </View>

      <Text style={styles.price}>
        KES {discountPrice} <Text style={styles.unit}>/unit</Text>
      </Text>

      <View style={styles.progressBg}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>

      <View style={styles.footer}>
        <Text style={styles.stats}>
          {current} / {target} units booked
        </Text>
        <TouchableOpacity style={styles.joinBtn} onPress={onJoin}>
          <Text style={styles.joinText}>JOIN DEAL</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 80,
    backgroundColor: 'rgba(0,0,0,0.85)',
    padding: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,200,83,0.3)',
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  title: { color: Colors.primary, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  badge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: { color: '#000', fontSize: 8, fontWeight: '900' },
  price: { color: '#fff', fontSize: 20, fontWeight: '900' },
  unit: { fontSize: 12, color: Colors.textSecondary, fontWeight: '400' },
  progressBg: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    marginVertical: 12,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: Colors.primary },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stats: { color: Colors.textSecondary, fontSize: 11, fontWeight: '700' },
  joinBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 10,
  },
  joinText: { color: '#000', fontSize: 11, fontWeight: '900' },
});
