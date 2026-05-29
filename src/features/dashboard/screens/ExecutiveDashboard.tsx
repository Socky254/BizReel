import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../core/theme/colors';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../../store/useAuthStore';
import { SafeLinearGradient } from '../../../components/SafeLinearGradient';
import Animated, { FadeInUp, FadeInRight } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export const ExecutiveDashboard = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);
  const [wallet, setWallet] = useState<any>(null);

  const fetchData = async () => {
    if (!user) return;
    try {
      const [analyticsRes, walletRes] = await Promise.all([
        supabase.rpc('get_advanced_business_analytics', { target_user_id: user.id }),
        supabase.from('wallets').select('*').eq('user_id', user.id).single(),
      ]);

      if (analyticsRes.data) setAnalytics(analyticsRes.data);
      if (walletRes.data) setWallet(walletRes.data);
    } catch (e) {
      console.error('Dashboard data fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} size="large" />
        <Text style={styles.loadingText}>Synthesizing Enterprise Data...</Text>
      </View>
    );

  const stats = analytics?.stats || {};
  const hasData = analytics || wallet;

  if (!hasData && !loading) {
    return (
      <View style={styles.center}>
        <Ionicons name="cloud-offline-outline" size={50} color="rgba(255,255,255,0.1)" />
        <Text style={styles.errorText}>Market Intelligence Offline</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={onRefresh}>
          <Text style={styles.retryBtnText}>Reconnect to Ledger</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
      }
    >
      <Animated.View entering={FadeInUp.duration(600)} style={styles.header}>
        <Text style={styles.greeting}>Executive Overview</Text>
        <Text style={styles.subGreeting}>Real-time market performance for your enterprise.</Text>
      </Animated.View>

      {/* Revenue Card */}
      <Animated.View entering={FadeInUp.delay(200).duration(600)}>
        <SafeLinearGradient colors={['#111', '#050505']} style={styles.revenueCard}>
          <View>
            <Text style={styles.cardLabel}>Portfolio Value</Text>
            <Text style={styles.revenueValue}>
              {wallet?.currency || 'KES'} {wallet?.balance?.toLocaleString() || '0.00'}
            </Text>
            <View style={styles.growthBadge}>
              <Ionicons name="trending-up" size={14} color={Colors.primary} />
              <Text style={styles.growthText}>+12.5% this month</Text>
            </View>
          </View>
          <View style={styles.walletIconBox}>
            <Ionicons name="wallet" size={32} color={Colors.primary} />
          </View>
        </SafeLinearGradient>
      </Animated.View>

      {/* Metrics Grid */}
      <View style={styles.grid}>
        <MetricBox label="Reach" value={stats.total_views || 0} icon="eye-outline" delay={400} />
        <MetricBox
          label="Engagement"
          value={`${stats.engagement_rate || 0}%`}
          icon="flash-outline"
          delay={500}
          color="#FFD700"
        />
        <MetricBox
          label="Allies"
          value={stats.total_reposts || 0}
          icon="people-outline"
          delay={600}
        />
        <MetricBox
          label="Conversion"
          value={`${stats.conversion_rate || 0}%`}
          icon="cart-outline"
          delay={700}
          color="#00D1FF"
        />
      </View>

      {/* Insights Section */}
      <Text style={styles.sectionTitle}>Strategic Intelligence</Text>
      {analytics?.recommendations?.map((rec: any, idx: number) => (
        <Animated.View
          key={idx}
          entering={FadeInRight.delay(800 + idx * 100)}
          style={styles.insightCard}
        >
          <View style={styles.insightHeader}>
            <Ionicons name="bulb" size={20} color={Colors.primary} />
            <Text style={styles.insightTitle}>{rec.title}</Text>
          </View>
          <Text style={styles.insightText}>{rec.insight}</Text>
        </Animated.View>
      ))}
    </ScrollView>
  );
};

const MetricBox = ({ label, value, icon, delay, color = Colors.primary }: any) => (
  <Animated.View entering={FadeInUp.delay(delay).duration(600)} style={styles.metricBox}>
    <View style={[styles.metricIconBox, { backgroundColor: `${color}15` }]}>
      <Ionicons name={icon} size={20} color={color} />
    </View>
    <Text style={styles.metricValue}>{value}</Text>
    <Text style={styles.metricLabel}>{label}</Text>
  </Animated.View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050508' },
  content: { padding: 20, paddingBottom: 100 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#050508' },
  loadingText: {
    color: Colors.textTertiary,
    marginTop: 20,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
  },
  header: { marginTop: 60, marginBottom: 30 },
  greeting: { color: '#fff', fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
  subGreeting: { color: 'rgba(255,255,255,0.4)', fontSize: 14, marginTop: 4 },
  revenueCard: {
    padding: 25,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
    backgroundColor: '#0E0E14',
  },
  cardLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  revenueValue: { color: '#fff', fontSize: 32, fontWeight: '900', marginVertical: 8 },
  growthBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  growthText: { color: '#00D084', fontSize: 12, fontWeight: '700' },
  walletIconBox: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.03)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 30 },
  metricBox: {
    width: (width - 52) / 2,
    backgroundColor: '#0E0E14',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  metricIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  metricValue: { color: '#fff', fontSize: 18, fontWeight: '900' },
  metricLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: '600', marginTop: 4 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '800', marginBottom: 20 },
  insightCard: {
    backgroundColor: '#0E0E14',
    padding: 20,
    borderRadius: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  insightHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  insightTitle: { color: '#fff', fontSize: 15, fontWeight: '700' },
  insightText: { color: 'rgba(255,255,255,0.5)', fontSize: 13, lineHeight: 20 },
  errorText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 30,
    fontWeight: '500',
    lineHeight: 24,
  },
  retryBtn: {
    paddingHorizontal: 25,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignSelf: 'center',
  },
  retryBtnText: {
    color: '#fff',
    fontWeight: '800',
    textTransform: 'uppercase',
    fontSize: 11,
    letterSpacing: 1,
  },
});
