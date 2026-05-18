import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { COLORS } from '../data';

export default function ReelModal({ reel, visible, onClose }) {
  const [liked, setLiked] = useState(false);
  if (!reel) return null;
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={[styles.video, { backgroundColor: reel.bg }]}>
          <Text style={styles.videoEmoji}>{reel.emoji}</Text>
          <TouchableOpacity style={styles.playBtn}>
            <Text style={styles.playIcon}>▶</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
          <View style={styles.bizHeader}>
            <View style={[styles.bizAv, { backgroundColor: reel.bg }]}>
              <Text style={{ fontSize: 22 }}>{reel.emoji}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.bizName}>{reel.biz}</Text>
              <Text style={styles.bizCat}>{reel.category}</Text>
            </View>
            <TouchableOpacity style={styles.followBtn}>
              <Text style={styles.followText}>+ Follow</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.title}>{reel.title}</Text>
          <Text style={styles.desc}>{reel.desc}</Text>
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionBtn, liked && styles.actionBtnLiked]}
              onPress={() => setLiked(!liked)}
            >
              <Text style={{ color: liked ? COLORS.red : COLORS.muted, fontSize: 12 }}>
                {liked ? '♥' : '♡'} {reel.likes}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn}>
              <Text style={styles.actionText}>💬 Comment</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn}>
              <Text style={styles.actionText}>↗ Share</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn}>
              <Text style={styles.actionText}>🔖 Save</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.tags}>
            {reel.tags.map(t => (
              <View key={t} style={styles.tag}>
                <Text style={styles.tagText}>{t}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  video: { height: 240, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  videoEmoji: { fontSize: 90 },
  playBtn: {
    position: 'absolute', width: 60, height: 60, borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center',
  },
  playIcon: { fontSize: 22, color: '#000', marginLeft: 4 },
  closeBtn: {
    position: 'absolute', top: 14, right: 14, width: 32, height: 32,
    borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },
  closeText: { color: '#fff', fontSize: 14 },
  body: { flex: 1, padding: 16 },
  bizHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  bizAv: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  bizName: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  bizCat: { fontSize: 11, color: COLORS.muted },
  followBtn: {
    backgroundColor: COLORS.accent, borderRadius: 18,
    paddingHorizontal: 16, paddingVertical: 7,
  },
  followText: { fontSize: 12, fontWeight: '700', color: '#0A0A0F' },
  title: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  desc: { fontSize: 13, color: COLORS.muted, lineHeight: 20, marginBottom: 14 },
  actions: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  actionBtn: {
    flex: 1, padding: 9, borderRadius: 8, borderWidth: 1,
    borderColor: COLORS.border, backgroundColor: COLORS.card,
    alignItems: 'center', justifyContent: 'center',
  },
  actionBtnLiked: { borderColor: COLORS.red },
  actionText: { fontSize: 11, color: COLORS.muted },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: {
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4,
  },
  tagText: { fontSize: 11, color: COLORS.muted },
});
