import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../data';

export default function ReelCard({ reel, onPress }) {
  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(reel)} activeOpacity={0.85}>
      <View style={[styles.thumb, { backgroundColor: reel.bg }]}>
        <Text style={styles.emoji}>{reel.emoji}</Text>
        <View style={styles.overlay} />
        <View style={styles.playBtn}><Text style={styles.playIcon}>▶</Text></View>
        <View style={styles.durationBadge}><Text style={styles.durationText}>{reel.duration}</Text></View>
        <View style={[styles.catBadge, { backgroundColor: reel.color }]}><Text style={styles.catText}>{reel.badge}</Text></View>
      </View>
      <View style={styles.info}>
        <View style={styles.bizRow}>
          <View style={[styles.bizAvatar, { backgroundColor: reel.bg }]}><Text style={{ fontSize: 13 }}>{reel.emoji}</Text></View>
          <Text style={styles.bizName} numberOfLines={1}>{reel.biz}</Text>
          <Text style={[styles.verify, { color: reel.color }]}>✓</Text>
        </View>
        <Text style={styles.title} numberOfLines={2}>{reel.title}</Text>
        <View style={styles.statsRow}>
          <Text style={styles.stat}>👁 {reel.views}</Text>
          <Text style={styles.stat}>♥ {reel.likes}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: COLORS.card, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden', flex: 1, margin: 4 },
  thumb: { height: 148, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  emoji: { fontSize: 46 },
  overlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 65, backgroundColor: 'rgba(0,0,0,0.5)' },
  playBtn: { position: 'absolute', width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center' },
  playIcon: { fontSize: 14, color: '#000', marginLeft: 2 },
  durationBadge: { position: 'absolute', bottom: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4 },
  durationText: { color: '#fff', fontSize: 9, fontWeight: '600' },
  catBadge: { position: 'absolute', top: 8, left: 8, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5 },
  catText: { color: '#fff', fontSize: 9, fontWeight: '700', textTransform: 'uppercase' },
  info: { padding: 9 },
  bizRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 5 },
  bizAvatar: { width: 24, height: 24, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  bizName: { fontSize: 11, fontWeight: '600', color: COLORS.text, flex: 1 },
  verify: { fontSize: 11, fontWeight: '700' },
  title: { fontSize: 11, color: COLORS.muted, lineHeight: 16, marginBottom: 6 },
  statsRow: { flexDirection: 'row', gap: 10 },
  stat: { fontSize: 10, color: COLORS.muted },
});
