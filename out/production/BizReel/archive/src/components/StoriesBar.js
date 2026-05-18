import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, STORIES } from '../data';

export default function StoriesBar({ onPress }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.bar}
      contentContainerStyle={styles.content}
    >
      {/* Add Story */}
      <TouchableOpacity style={styles.storyWrap}>
        <View style={[styles.ring, { borderColor: COLORS.brd }]}>
          <View style={[styles.inner, { backgroundColor: COLORS.card }]}>
            <Text style={styles.addIcon}>+</Text>
          </View>
        </View>
        <Text style={styles.label}>Add Story</Text>
      </TouchableOpacity>

      {STORIES.map((s) => (
        <TouchableOpacity key={s.id} style={styles.storyWrap} onPress={() => onPress(s)}>
          <View style={[styles.ring, { borderColor: s.seen ? COLORS.brd : COLORS.acc }]}>
            <View style={[styles.inner, { backgroundColor: s.bg }]}>
              <Text style={styles.emoji}>{s.emoji}</Text>
            </View>
          </View>
          <Text style={styles.label} numberOfLines={1}>{s.biz}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  bar: { backgroundColor: COLORS.surf, borderBottomWidth: 1, borderBottomColor: COLORS.brd, maxHeight: 90 },
  content: { paddingHorizontal: 12, paddingVertical: 10, gap: 10, flexDirection: 'row' },
  storyWrap: { alignItems: 'center', gap: 5, width: 58 },
  ring: { width: 54, height: 54, borderRadius: 27, borderWidth: 2, padding: 2 },
  inner: { flex: 1, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 22 },
  addIcon: { fontSize: 24, color: COLORS.acc, fontWeight: '700' },
  label: { fontSize: 10, color: COLORS.mut, textAlign: 'center', width: 56 },
});
