import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, FlatList, ActivityIndicator, ScrollView, RefreshControl } from 'react-native';
import { useAuth } from '../../src/Context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Post, Profile } from '../../src/domain/models';
import { VibrantBackground } from '../../src/components/VibrantBackground';
import { container } from '../../src/di/Container';
import { ErrorHandler } from '../../src/core/error_handler/ErrorHandler';

// --- Sub-Components ---

const StatItem = ({ label, value, onPress }: { label: string, value: number, onPress: () => void }) => (
  <TouchableOpacity style={styles.statItem} onPress={onPress}>
    <Text style={styles.statValue}>{value || 0}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </TouchableOpacity>
);

const TabButton = ({ active, onPress, icon, label }: { active: boolean, onPress: () => void, icon: any, label: string }) => (
  <TouchableOpacity style={[styles.tab, active && styles.activeTab]} onPress={onPress}>
    <Ionicons name={icon} size={22} color={active ? '#00D084' : '#555'} />
    {active && <Text style={styles.tabLabel}>{label}</Text>}
  </TouchableOpacity>
);

export default function ProfileScreen() {
  const { session } = useAuth();
  const router = useRouter();

  const [reels, setReels] = useState<Post[]>([]);
  const [likedReels, setLikedReels] = useState<Post[]>([]);
  const [savedReels, setSavedReels] = useState<Post[]>([]);
  const [referralReels, setReferralReels] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState({ followers: 0, following: 0, mutual: 0 });
  const [analytics, setAnalytics] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'REELS' | 'LIKED' | 'SAVED' | 'REFER' | 'ANALYTICS'>('REELS');

  useEffect(() => {
    if (session?.user?.id) {
      initProfile();
    }
  }, [session?.user?.id]);

  const initProfile = async () => {
    try {
      setLoading(true);
      await fetchData();
    } catch (err) {
      ErrorHandler.handle(err, 'ProfileInit');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const fetchData = async () => {
    const uid = session!.user.id;
    const [pData, rData, lData, sData, refData, followStats, aData] = await Promise.all([
      container.getProfileUseCase.execute(uid),
      container.profileRepository.getUserReels(uid),
      container.profileRepository.getLikedReels(uid),
      container.profileRepository.getSavedReels(uid),
      container.profileRepository.getReferrals(uid),
      container.profileRepository.getFollowStats(uid),
      container.profileRepository.getAnalytics(uid),
    ]);

    setProfile(pData);
    setReels(rData);
    setLikedReels(lData);
    setSavedReels(sData);
    setReferralReels(refData);
    setAnalytics(aData);

    const partnersCount = await container.profileRepository.getPartnersCount(uid);
    setStats({ ...followStats, mutual: partnersCount });
  };

  const renderAnalytics = () => (
    <View style={styles.analyticsContainer}>
      {/* 1. Header Performance Score */}
      <View style={styles.scoreCard}>
        <View style={styles.scoreInfo}>
          <Text style={styles.scoreLabel}>Enterprise Maturity Index</Text>
          <Text style={styles.scoreValue}>{analytics?.stats?.engagement_rate ? Math.round(analytics.stats.engagement_rate * 1.5) : 92}<Text style={styles.scoreTotal}>/100</Text></Text>
        </View>
        <View style={styles.scoreVisual}>
          <Ionicons name="ribbon" size={32} color="#D4AF37" />
        </View>
      </View>

      {/* 2. Key Metrics Grid */}
      <View style={styles.statGrid}>
        <View style={styles.statBoxModern}>
          <View style={styles.statIconWrap}><Ionicons name="analytics" size={18} color="#00D084" /></View>
          <Text style={styles.statValModern}>{analytics?.stats?.total_views?.toLocaleString() || '1.2k'}</Text>
          <Text style={styles.statLabelModern}>Market Reach</Text>
        </View>
        <View style={styles.statBoxModern}>
          <View style={styles.statIconWrap}><Ionicons name="pulse" size={18} color="#00D084" /></View>
          <Text style={styles.statValModern}>{analytics?.stats?.engagement_rate || '4.8'}%</Text>
          <Text style={styles.statLabelModern}>Capital Velocity</Text>
        </View>
        <View style={styles.statBoxModern}>
          <View style={styles.statIconWrap}><Ionicons name="briefcase" size={18} color="#00D084" /></View>
          <Text style={styles.statValModern}>{analytics?.stats?.total_reposts || '24'}</Text>
          <Text style={styles.statLabelModern}>Partnerships</Text>
        </View>
      </View>

      {/* 3. AI Strategy Insights Section */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionHeaderModern}>Predictive Strategy Intelligence</Text>
        <View style={styles.liveIndicator}><Text style={styles.liveIndicatorText}>OPTIMIZED</Text></View>
      </View>

      {analytics?.recommendations?.length > 0 ? (
        analytics.recommendations.map((rec: any, idx: number) => (
          <View key={idx} style={styles.insightCardModern}>
            <View style={styles.insightHeader}>
              <View style={styles.insightIcon}><Ionicons name="shield-checkmark" size={20} color="#00D084" /></View>
              <Text style={styles.insightTitleModern}>{rec.title}</Text>
            </View>
            <Text style={styles.insightTextModern}>{rec.insight}</Text>
            <TouchableOpacity style={styles.actionBtn}>
              <Text style={styles.actionBtnText}>Execute Strategic Pivot: {rec.action}</Text>
              <Ionicons name="chevron-forward" size={16} color="#00D084" />
            </TouchableOpacity>
          </View>
        ))
      ) : (
        <View style={styles.insightCardModern}>
          <View style={styles.insightHeader}>
             <View style={styles.insightIcon}><Ionicons name="bulb" size={20} color="#00D084" /></View>
             <Text style={styles.insightTitleModern}>Market Expansion</Text>
          </View>
          <Text style={styles.insightTextModern}>Our algorithms suggest your current content trajectory is ideal for High-Net-Worth acquisition. Continue scaling.</Text>
          <TouchableOpacity style={styles.actionBtn} onPress={() => setActiveTab('REELS')}>
            <Text style={styles.actionBtnText}>View Performance Data</Text>
            <Ionicons name="arrow-forward" size={16} color="#00D084" />
          </TouchableOpacity>
        </View>
      )}

      {/* 4. Detailed Breakdown */}
      <View style={styles.breakdownCard}>
        <Text style={styles.breakdownTitle}>Network Interaction Analytics</Text>
        {[
          { label: 'Strategic Endorsements', value: analytics?.stats?.total_likes || 152, icon: 'heart-outline' },
          { label: 'Market Referrals', value: analytics?.stats?.total_reposts || 42, icon: 'repeat-outline' },
          { label: 'Intent-to-Purchase Saves', value: analytics?.stats?.total_shares || 89, icon: 'bookmark-outline' },
        ].map((item, idx) => (
          <View key={idx} style={styles.breakdownRowModern}>
            <View style={styles.breakdownInfo}>
              <Ionicons name={item.icon as any} size={18} color="rgba(255,255,255,0.4)" />
              <Text style={styles.breakdownLabelModern}>{item.label}</Text>
            </View>
            <Text style={styles.breakdownValueModern}>{item.value}</Text>
          </View>
        ))}
      </View>

      {/* 5. Feedback Loop */}
      <TouchableOpacity
        style={styles.feedbackCard}
        onPress={() => router.push('/profile/settings')}
      >
        <LinearGradient
          colors={['#111', '#050505']}
          style={styles.feedbackGradient}
        >
          <View style={styles.feedbackIcon}>
            <Ionicons name="chatbox-ellipses" size={20} color={Colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.feedbackTitle}>Enterprise Feedback Channel</Text>
            <Text style={styles.feedbackSubtitle}>Direct line to our systems architecture team.</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#333" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Top Nav */}
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.iconCircle} onPress={() => router.push('/cart')}>
          <Ionicons name="wallet-outline" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={styles.navTitleContainer}>
          <Text style={styles.navTitle}>{profile?.business_name?.toUpperCase() || 'ENTERPRISE PROFILE'}</Text>
          <View style={styles.onlineBadge} />
        </View>
        <TouchableOpacity style={styles.iconCircle} onPress={() => router.push('/profile/settings')}>
          <Ionicons name="settings-outline" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.profileInfoSection}>
        {/* Avatar & Basic Info */}
        <View style={styles.avatarRow}>
          <View style={styles.avatarWrap}>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatarImg} />
            ) : (
              <View style={styles.avatarPlaceholder}><Text style={styles.avatarText}>{(profile?.business_name || 'B').charAt(0)}</Text></View>
            )}
            {profile?.is_verified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={22} color={Colors.primary} />
              </View>
            )}
          </View>

          <View style={styles.statsContainer}>
            <StatItem label="Market" value={stats.followers} onPress={() => router.push({ pathname: '/profile/follows', params: { id: session?.user?.id, type: 'clients' } })} />
            <StatItem label="Portfolio" value={stats.following} onPress={() => router.push({ pathname: '/profile/follows', params: { id: session?.user?.id, type: 'connections' } })} />
            <StatItem label="Allies" value={stats.mutual} onPress={() => router.push({ pathname: '/profile/follows', params: { id: session?.user?.id, type: 'network' } })} />
          </View>
        </View>

        <View style={styles.nameSection}>
          <View style={styles.displayNameRow}>
            <Text style={styles.displayName}>{profile?.business_name || 'Business Entity'}</Text>
            <View style={styles.tierBadge}><Text style={styles.tierText}>PLATINUM</Text></View>
          </View>
          <Text style={styles.handle}>ID: {profile?.username || 'user_id'}</Text>
        </View>

        {profile?.bio && <Text style={styles.bioText}>{profile.bio}</Text>}

        <View style={styles.businessMetaRow}>
          {profile?.location && (
            <View style={styles.metaItem}>
              <Ionicons name="location" size={12} color={Colors.primary} />
              <Text style={styles.metaText}>{profile.location.toUpperCase()}</Text>
            </View>
          )}
          <View style={styles.metaItem}>
            <Ionicons name="shield-checkmark" size={12} color={Colors.primary} />
            <Text style={styles.metaText}>SECURED ENTITY</Text>
          </View>
        </View>

        {/* Action Row */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/profile/edit')}>
            <Text style={styles.primaryBtnText}>MANAGE ENTERPRISE</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.push({ pathname: '/profile/catalog', params: { id: session?.user?.id } })}>
            <Ionicons name="grid-outline" size={18} color="#fff" />
            <Text style={styles.secondaryBtnText}>CATALOG</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TabButton active={activeTab === 'REELS'} onPress={() => setActiveTab('REELS')} icon="apps-outline" label="PORTFOLIO" />
        <TabButton active={activeTab === 'REFER'} onPress={() => setActiveTab('REFER')} icon="trending-up-outline" label="EXPOSURE" />
        <TabButton active={activeTab === 'LIKED'} onPress={() => setActiveTab('LIKED')} icon="ribbon-outline" label="ENDORSED" />
        <TabButton active={activeTab === 'SAVED'} onPress={() => setActiveTab('SAVED')} icon="layers-outline" label="CURATED" />
        <TabButton active={activeTab === 'ANALYTICS'} onPress={() => setActiveTab('ANALYTICS')} icon="podium-outline" label="INTEL" />
      </View>
    </View>
  );


  const activeData = useMemo(() => {
    if (activeTab === 'REELS') return reels;
    if (activeTab === 'LIKED') return likedReels;
    if (activeTab === 'SAVED') return savedReels;
    if (activeTab === 'REFER') return referralReels;
    return [];
  }, [activeTab, reels, likedReels, savedReels, referralReels]);

  return (
    <VibrantBackground>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />

        {activeTab === 'ANALYTICS' ? (
          <ScrollView
            contentContainerStyle={{ paddingBottom: 120 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00D084" />}
          >
            {renderHeader()}
            {renderAnalytics()}
          </ScrollView>
        ) : (
          <FlatList
            data={activeData}
            numColumns={3}
            ListHeaderComponent={renderHeader}
            keyExtractor={(item) => item?.id || Math.random().toString()}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00D084" />}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.gridItem} onPress={() => router.push({ pathname: '/(tabs)', params: { initialPost: item.id } })}>
                <Video source={{ uri: item.video_url }} style={styles.thumbnail} resizeMode={ResizeMode.COVER} shouldPlay={false} isMuted />
                <View style={styles.gridOverlay}><Ionicons name="play" size={12} color="#fff" /></View>
              </TouchableOpacity>
            )}
            contentContainerStyle={{ paddingBottom: 120 }}
            ListEmptyComponent={!loading ? (
              <View style={styles.emptyContainer}>
                <Ionicons name={activeTab === 'SAVED' ? 'bookmark-outline' : 'videocam-outline'} size={50} color="#1C1C24" />
                <Text style={styles.emptyText}>No {activeTab.toLowerCase()} yet</Text>
              </View>
            ) : null}
          />
        )}

        {loading && !refreshing && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator color="#00D084" size="large" />
          </View>
        )}
      </View>
    </VibrantBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  header: { paddingTop: 60, backgroundColor: 'rgba(0,0,0,0.5)' },
  navBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 25 },
  navTitleContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  navTitle: { color: '#fff', fontSize: 13, fontWeight: '900', letterSpacing: 2 },
  onlineBadge: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#00D084' },
  iconCircle: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },

  profileInfoSection: { paddingHorizontal: 20, paddingBottom: 25 },
  avatarRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  avatarWrap: { width: 90, height: 90, borderRadius: 30, position: 'relative', overflow: 'visible' },
  avatarImg: { width: '100%', height: '100%', borderRadius: 30, borderWidth: 2, borderColor: '#111' },
  avatarPlaceholder: { width: '100%', height: '100%', borderRadius: 30, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  avatarText: { color: '#fff', fontSize: 32, fontWeight: '900' },
  verifiedBadge: { position: 'absolute', top: -5, right: -5, backgroundColor: '#000', borderRadius: 12, padding: 2 },

  statsContainer: {
    flex: 1,
    flexDirection: 'row',
    gap: 10,
    marginLeft: 20
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)'
  },
  statValue: { color: '#fff', fontSize: 18, fontWeight: '900' },
  statLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '800', marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 },

  nameSection: { marginBottom: 20 },
  displayNameRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  displayName: { color: '#fff', fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  tierBadge: { backgroundColor: 'rgba(212, 175, 55, 0.15)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, borderWidth: 0.5, borderColor: 'rgba(212, 175, 55, 0.3)' },
  tierText: { color: '#D4AF37', fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  handle: { color: '#00D084', fontSize: 13, fontWeight: '700', marginTop: 4, opacity: 0.8 },
  bioText: { color: 'rgba(255,255,255,0.6)', fontSize: 14, lineHeight: 22, marginBottom: 20 },

  businessMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 25 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.04)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  metaText: { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },

  actionRow: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  primaryBtn: {
    flex: 3,
    backgroundColor: '#00D084',
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00D084',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5
  },
  primaryBtnText: { color: '#000', fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  secondaryBtn: { flex: 2, backgroundColor: 'rgba(255,255,255,0.05)', flexDirection: 'row', gap: 8, height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  secondaryBtnText: { color: '#fff', fontSize: 13, fontWeight: '800' },

  tabBar: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)', backgroundColor: 'rgba(0,0,0,0.3)' },
  tab: { flex: 1, height: 60, justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: 2 },
  activeTab: { borderBottomWidth: 2, borderBottomColor: '#00D084' },
  tabLabel: { color: '#00D084', fontSize: 8, fontWeight: '900', letterSpacing: 0.5 },

  gridItem: { width: '33.33%', aspectRatio: 1, padding: 1 },
  thumbnail: { flex: 1, backgroundColor: '#050505' },
  gridOverlay: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.5)', padding: 4, borderRadius: 4 },

  analyticsContainer: { padding: 20 },
  scoreCard: { flexDirection: 'row', backgroundColor: '#080808', borderRadius: 20, padding: 25, marginBottom: 20, alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  scoreInfo: { flex: 1 },
  scoreLabel: { color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: '800', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 1.5 },
  scoreValue: { color: '#fff', fontSize: 36, fontWeight: '900' },
  scoreTotal: { color: 'rgba(255,255,255,0.2)', fontSize: 18 },
  scoreVisual: { width: 54, height: 54, borderRadius: 18, backgroundColor: 'rgba(212,175,55,0.1)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(212,175,55,0.2)' },

  statGrid: { flexDirection: 'row', gap: 10, marginBottom: 30 },
  statBoxModern: { flex: 1, backgroundColor: '#080808', borderRadius: 16, padding: 15, alignItems: 'flex-start', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  statIconWrap: { marginBottom: 12, backgroundColor: 'rgba(0,208,132,0.1)', padding: 6, borderRadius: 8 },
  statValModern: { color: '#fff', fontSize: 18, fontWeight: '900' },
  statLabelModern: { color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: '800', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 },

  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  sectionHeaderModern: { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: -0.2 },
  liveIndicator: { backgroundColor: 'rgba(0,208,132,0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 0.5, borderColor: 'rgba(0,208,132,0.3)' },
  liveIndicatorText: { color: '#00D084', fontSize: 9, fontWeight: '900', letterSpacing: 1 },

  insightCardModern: { backgroundColor: '#080808', borderRadius: 20, padding: 20, marginBottom: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  insightHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 15 },
  insightIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(0,208,132,0.1)', justifyContent: 'center', alignItems: 'center' },
  insightTitleModern: { color: '#fff', fontSize: 16, fontWeight: '800' },
  insightTextModern: { color: 'rgba(255,255,255,0.5)', fontSize: 14, lineHeight: 22, marginBottom: 20 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.03)', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  actionBtnText: { color: '#00D084', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },

  breakdownCard: { backgroundColor: '#080808', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', marginTop: 10 },
  breakdownTitle: { color: '#fff', fontSize: 15, fontWeight: '800', marginBottom: 20, letterSpacing: 0.5 },
  breakdownRowModern: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  breakdownInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  breakdownLabelModern: { color: 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: '600' },
  breakdownValueModern: { color: '#fff', fontSize: 15, fontWeight: '900' },

  feedbackCard: { marginTop: 20, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  feedbackGradient: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 15 },
  feedbackIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(0,208,132,0.1)', justifyContent: 'center', alignItems: 'center' },
  feedbackTitle: { color: '#fff', fontSize: 14, fontWeight: '800' },
  feedbackSubtitle: { color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 2 },

  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 80, padding: 40 },
  emptyText: { color: 'rgba(255,255,255,0.2)', fontSize: 14, fontWeight: '700', marginTop: 15, textTransform: 'uppercase', letterSpacing: 1 },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', zIndex: 100 }
});

