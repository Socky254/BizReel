import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { COLORS, REELS } from '../data';

const BAR_DATA = [42, 67, 55, 88, 100, 72, 48];
const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

export default function AnalyticsScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Business Analytics</Text>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={{ padding: 14, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View style={styles.metricsGrid}>
          {[['2.1M','Total Views','+12.4%'],['18.4K','Followers','+8.1%'],['7.3%','Engagement','+2.0%'],['342','Leads','+31%']].map(([n,l,g]) => (
            <View key={l} style={styles.metricCard}>
              <Text style={styles.metricLabel}>{l}</Text>
              <Text style={styles.metricNum}>{n}</Text>
              <Text style={styles.metricGrowth}>{g}</Text>
            </View>
          ))}
        </View>

        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Views this week</Text>
          <View style={styles.chart}>
            {BAR_DATA.map((h, i) => (
              <View key={i} style={styles.barCol}>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { height: h + '%', backgroundColor: i === 4 ? COLORS.accent2 : COLORS.accent }]} />
                </View>
                <Text style={styles.barLabel}>{DAYS[i]}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Top performing reels</Text>
          {REELS.slice(0,4).map(r => (
            <View key={r.id} style={styles.topReel}>
              <View style={[styles.topThumb, { backgroundColor: r.bg }]}>
                <Text style={{ fontSize: 18 }}>{r.emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.topTitle} numberOfLines={1}>{r.title}</Text>
                <Text style={styles.topViews}>{r.views} views</Text>
              </View>
              <Text style={styles.topGrowth}>↑ {Math.round(Math.random()*25+5)}%</Text>
            </View>
          ))}
        </View>

        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Audience breakdown</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
            {[['Nairobi','48%'],['Mombasa','18%'],['Kisumu','14%'],['Other','20%']].map(([city,pct]) => (
              <View key={city} style={styles.audItem}>
                <Text style={styles.audCity}>{city}</Text>
                <Text style={styles.audPct}>{pct}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border, backgroundColor: COLORS.surface },
  headerTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  scroll: { flex: 1 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  metricCard: { flex: 1, minWidth: '45%', backgroundColor: COLORS.card, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: COLORS.border },
  metricLabel: { fontSize: 10, color: COLORS.muted, marginBottom: 4 },
  metricNum: { fontSize: 20, fontWeight: '800', color: COLORS.text, marginBottom: 2 },
  metricGrowth: { fontSize: 11, color: COLORS.green, fontWeight: '600' },
  chartCard: { backgroundColor: COLORS.card, borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  chartTitle: { fontSize: 13, fontWeight: '700', color: COLORS.text, marginBottom: 14 },
  chart: { flexDirection: 'row', alignItems: 'flex-end', height: 90, gap: 6 },
  barCol: { flex: 1, alignItems: 'center', gap: 4 },
  barTrack: { flex: 1, width: '100%', backgroundColor: 'rgba(0,229,195,0.15)', borderRadius: 4, justifyContent: 'flex-end' },
  barFill: { width: '100%', borderRadius: 4 },
  barLabel: { fontSize: 9, color: COLORS.muted },
  topReel: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  topThumb: { width: 34, height: 44, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  topTitle: { fontSize: 11, fontWeight: '600', color: COLORS.text, marginBottom: 2 },
  topViews: { fontSize: 10, color: COLORS.muted },
  topGrowth: { fontSize: 11, color: COLORS.green, fontWeight: '700' },
  audItem: { flex: 1, backgroundColor: COLORS.surface, borderRadius: 8, padding: 10, alignItems: 'center' },
  audCity: { fontSize: 11, color: COLORS.muted, marginBottom: 4 },
  audPct: { fontSize: 16, fontWeight: '800', color: COLORS.accent },
});
