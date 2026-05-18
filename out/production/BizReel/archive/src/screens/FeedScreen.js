import React, { useState } from 'react';
import { View, FlatList, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { COLORS, REELS, STORIES, TRENDING, SUGGESTIONS } from '../data';
import ReelCard from '../components/ReelCard';
import StoryBar from '../components/StoryBar';
import ReelModal from '../components/ReelModal';

const TABS = ['For You', 'Following', 'Local', 'Trending'];

export default function FeedScreen() {
  const [activeTab, setActiveTab] = useState('For You');
  const [selectedReel, setSelectedReel] = useState(null);
  const [followed, setFollowed] = useState({});

  const renderRow = ({ item, index }) => {
    if (index % 2 !== 0) return null;
    const next = REELS[index + 1];
    return (
      <View style={styles.row}>
        <ReelCard reel={item} onPress={setSelectedReel} />
        {next ? <ReelCard reel={next} onPress={setSelectedReel} /> : <View style={{ flex: 1, margin: 4 }} />}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StoryBar stories={STORIES} onPress={() => {}} />
      <View style={styles.tabBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
          {TABS.map(t => (
            <TouchableOpacity key={t} onPress={() => setActiveTab(t)} style={[styles.tab, activeTab === t && styles.tabActive]}>
              <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      <View style={styles.body}>
        <FlatList
          data={REELS} keyExtractor={i => String(i.id)} renderItem={renderRow}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 8, paddingBottom: 20 }}
          style={{ flex: 1 }}
        />
        <View style={styles.rightPanel}>
          <Text style={styles.panelTitle}>TRENDING</Text>
          {TRENDING.map((t, i) => (
            <View key={t.name} style={styles.trendItem}>
              <Text style={styles.trendRank}>{i + 1}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.trendName} numberOfLines={1}>{t.name}</Text>
                <Text style={styles.trendCount}>{t.count} <Text style={{ color: COLORS.green }}>{t.trend}</Text></Text>
              </View>
            </View>
          ))}
          <Text style={[styles.panelTitle, { marginTop: 14 }]}>SUGGESTED</Text>
          {SUGGESTIONS.map(s => (
            <View key={s.name} style={styles.suggestItem}>
              <View style={[styles.suggestAv, { backgroundColor: s.bg }]}>
                <Text style={{ fontSize: 15 }}>{s.emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.suggestName} numberOfLines={1}>{s.name}</Text>
                <Text style={styles.suggestCat}>{s.category}</Text>
              </View>
              <TouchableOpacity
                style={[styles.followBtn, followed[s.name] && styles.followBtnOn]}
                onPress={() => setFollowed(f => ({ ...f, [s.name]: !f[s.name] }))}>
                <Text style={[styles.followText, followed[s.name] && { color: '#0A0A0F' }]}>
                  {followed[s.name] ? '✓' : 'Follow'}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>
      <ReelModal reel={selectedReel} visible={!!selectedReel} onClose={() => setSelectedReel(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  tabBar: { borderBottomWidth: 1, borderBottomColor: COLORS.border, backgroundColor: COLORS.surface },
  tabs: { paddingHorizontal: 10, paddingVertical: 8, gap: 4 },
  tab: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 18, borderWidth: 1, borderColor: 'transparent' },
  tabActive: { backgroundColor: 'rgba(0,229,195,0.1)', borderColor: COLORS.accent },
  tabText: { fontSize: 12, fontWeight: '500', color: COLORS.muted },
  tabTextActive: { color: COLORS.accent },
  body: { flex: 1, flexDirection: 'row' },
  rightPanel: { width: 160, borderLeftWidth: 1, borderLeftColor: COLORS.border, backgroundColor: COLORS.surface, padding: 10, paddingTop: 12 },
  panelTitle: { fontSize: 10, fontWeight: '700', color: COLORS.muted, letterSpacing: 1, marginBottom: 8 },
  trendItem: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  trendRank: { fontSize: 13, fontWeight: '800', color: COLORS.border, width: 14 },
  trendName: { fontSize: 11, fontWeight: '500', color: COLORS.text },
  trendCount: { fontSize: 10, color: COLORS.muted },
  suggestItem: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  suggestAv: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  suggestName: { fontSize: 11, fontWeight: '500', color: COLORS.text },
  suggestCat: { fontSize: 10, color: COLORS.muted },
  followBtn: { borderWidth: 1, borderColor: COLORS.accent, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  followBtnOn: { backgroundColor: COLORS.accent },
  followText: { fontSize: 10, fontWeight: '600', color: COLORS.accent },
  row: { flexDirection: 'row' },
});
