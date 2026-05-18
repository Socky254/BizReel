import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../data';

export default function StoryBar({ stories, onPress }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bar} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.story}>
        <View style={[styles.ring, { borderColor: COLORS.border }]}>
          <View style={[styles.inner, { backgroundColor: COLORS.card }]}>
            <Text style={{ fontSize: 22, color: COLORS.accent }}>+</Text>
          </View>
        </View>
        <Text style={styles.label}>Your Story</Text>
      </TouchableOpacity>
      {stories.map((s, i) => (
        <TouchableOpacity key={s.id} style={styles.story} onPress={() => onPress(s)}>
          <View style={[styles.ring, { borderColor: s.seen ? COLORS.border : COLORS.accent }]}>
            <View style={[styles.inner, { backgroundColor: s.bg }]}>
              <Text style={{ fontSize: 20 }}>{s.emoji}</Text>
            </View>
          </View>
          <Text style={styles.label} numberOfLines={1}>{s.biz.split(' ')[0]}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  bar: { borderBottomWidth: 1, borderBottomColor: COLORS.border, backgroundColor: COLORS.surface },
  content: { paddingHorizontal: 12, paddingVertical: 10, gap: 10 },
  story: { alignItems: 'center', gap: 4, marginRight: 10 },
  ring: {
    width: 54, height: 54, borderRadius: 27, borderWidth: 2,
    padding: 2, alignItems: 'center', justifyContent: 'center',
  },
  inner: {
    width: 46, height: 46, borderRadius: 23,
    alignItems: 'center', justifyContent: 'center',
  },
  label: { fontSize: 10, color: COLORS.muted, maxWidth: 56 },
});
