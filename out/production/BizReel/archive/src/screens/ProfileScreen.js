import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { COLORS, REELS } from '../data';
import ReelModal from '../components/ReelModal';

const PTABS = ['Reels', 'Saved', 'About'];

export default function ProfileScreen() {
  const [activeTab, setActiveTab] = useState('Reels');
  const [selectedReel, setSelectedReel] = useState(null);

  return (
    <View style={styles.container}>
      <View style={styles.cover}>
        <Text style={styles.coverEmoji}>💻</Text>
        <View style={styles.coverActions}>
          <TouchableOpacity style={styles.secBtn}><Text style={styles.secBtnText}>+ New Reel</Text></TouchableOpacity>
          <TouchableOpacity style={styles.primBtn}><Text style={styles.primBtnText}>Edit Profile</Text></TouchableOpacity>
        </View>
      </View>
      <View style={styles.avatarWrap}>
        <View style={styles.avatar}><Text style={{ fontSize: 28 }}>💻</Text></View>
      </View>
      <View style={styles.info}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={styles.name}>Kamau Mwangi</Text>
          <Text style={{ color: COLORS.accent, fontSize: 14 }}>✓</Text>
        </View>
        <Text style={styles.handle}>@kamauwangi · Tech & Software · Nairobi, KE</Text>
        <Text style={styles.bio}>Founder of TechNova KE. Building SaaS tools for African SMEs. Serial entrepreneur.</Text>
        <View style={styles.stats}>
          {[['24', 'Reels'], ['18.4K', 'Followers'], ['342', 'Following'], ['2.1M', 'Views']].map(([n, l]) => (
            <View key={l} style={styles.stat}>
              <Text style={styles.statNum}>{n}</Text>
              <Text style={styles.statLabel}>{l}</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={styles.ptabBar}>
        {PTABS.map(t => (
          <TouchableOpacity key={t} onPress={() => setActiveTab(t)} style={[styles.ptab, activeTab === t && styles.ptabActive]}>
            <Text style={[styles.ptabText, activeTab === t && styles.ptabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {activeTab === 'Reels' && (
        <FlatList
          data={REELS} numColumns={3} keyExtractor={i => String(i.id)}
          contentContainerStyle={{ padding: 8 }}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.gridItem} onPress={() => setSelectedReel(item)}>
              <View style={[styles.gridThumb, { backgroundColor: item.bg }]}>
                <Text style={{ fontSize: 26 }}>{item.emoji}</Text>
                <View style={styles.gridOverlay}>
                  <Text style={styles.gridViews}>{item.views}</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
      {activeTab === 'About' && (
        <ScrollView style={{ padding: 16 }}>
          {[
            ['Business', 'TechNova KE — SaaS & Automation'],
            ['Founded', '2021 · Nairobi, Kenya'],
            ['Website', 'technova.co.ke'],
            ['Category', 'Tech & Software'],
            ['Joined BizReel', 'January 2024'],
          ].map(([k, v]) => (
            <View key={k} style={styles.aboutRow}>
              <Text style={styles.aboutKey}>{k}</Text>
              <Text style={styles.aboutVal}>{v}</Text>
            </View>
          ))}
        </ScrollView>
      )}
      {activeTab === 'Saved' && (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 36 }}>🔖</Text>
          <Text style={{ color: COLORS.muted, marginTop: 10, fontSize: 13 }}>No saved reels yet</Text>
        </View>
      )}
      <ReelModal reel={selectedReel} visible={!!selectedReel} onClose={() => setSelectedReel(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  cover: { height: 110, backgroundColor: COLORS.card, alignItems: 'flex-end', justifyContent: 'flex-end', padding: 12, paddingBottom: 8 },
  coverEmoji: { position: 'absolute', fontSize: 60, opacity: 0.15, alignSelf: 'center', top: 20 },
  coverActions: { flexDirection: 'row', gap: 8 },
  secBtn: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 6 },
  secBtnText: { fontSize: 12, fontWeight: '600', color: COLORS.text },
  primBtn: { backgroundColor: COLORS.accent, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 6 },
  primBtnText: { fontSize: 12, fontWeight: '700', color: '#0A0A0F' },
  avatarWrap: { paddingHorizontal: 16, marginTop: -28 },
  avatar: { width: 64, height: 64, borderRadius: 16, backgroundColor: COLORS.accent2, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: COLORS.bg },
  info: { padding: 16, paddingTop: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  name: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  handle: { fontSize: 12, color: COLORS.muted, marginBottom: 6 },
  bio: { fontSize: 12, color: COLORS.muted, lineHeight: 18, marginBottom: 10 },
  stats: { flexDirection: 'row', gap: 20 },
  stat: { alignItems: 'center' },
  statNum: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  statLabel: { fontSize: 10, color: COLORS.muted },
  ptabBar: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: COLORS.border },
  ptab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  ptabActive: { borderBottomColor: COLORS.accent },
  ptabText: { fontSize: 12, fontWeight: '500', color: COLORS.muted },
  ptabTextActive: { color: COLORS.accent },
  gridItem: { flex: 1, margin: 3 },
  gridThumb: { aspectRatio: 9 / 13, borderRadius: 8, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  gridOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.55)', padding: 4 },
  gridViews: { fontSize: 10, color: '#fff', fontWeight: '500' },
  aboutRow: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  aboutKey: { fontSize: 11, color: COLORS.accent, fontWeight: '600', marginBottom: 2 },
  aboutVal: { fontSize: 13, color: COLORS.muted },
});
