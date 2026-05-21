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

const TabButton = ({ name, active, onPress, icon }: { name: string, active: boolean, onPress: () => void, icon: any }) => (
  <TouchableOpacity style={[styles.tab, active && styles.activeTab]} onPress={onPress}>
    <Ionicons name={icon} size={22} color={active ? '#00D084' : '#555'} />
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
          <Text style={styles.scoreLabel}>Business Growth Score</Text>
          <Text style={styles.scoreValue}>{analytics?.stats?.engagement_rate ? Math.round(analytics.stats.engagement_rate * 1.2) : 85}<Text style={styles.scoreTotal}>/100</Text></Text>
        </View>
        <View style={styles.scoreVisual}>
          <Ionicons name="trending-up" size={32} color="#00D084" />
        </View>
      </View>

      {/* 2. Key Metrics Grid */}
      <View style={styles.statGrid}>
        <View style={styles.statBoxModern}>
          <View style={styles.statIconWrap}><Ionicons name="eye-outline" size={18} color="#00D084" /></View>
          <Text style={styles.statValModern}>{analytics?.stats?.total_views?.toLocaleString() || 0}</Text>
          <Text style={styles.statLabelModern}>Profile Reach</Text>
        </View>
        <View style={styles.statBoxModern}>
          <View style={styles.statIconWrap}><Ionicons name="flash-outline" size={18} color="#FFCC00" /></View>
          <Text style={styles.statValModern}>{analytics?.stats?.engagement_rate || 0}%</Text>
          <Text style={styles.statLabelModern}>Engagement</Text>
        </View>
        <View style={styles.statBoxModern}>
          <View style={styles.statIconWrap}><Ionicons name="cart-outline" size={18} color="#00D084" /></View>
          <Text style={styles.statValModern}>{analytics?.stats?.total_reposts || 0}</Text>
          <Text style={styles.statLabelModern}>Conversions</Text>
        </View>
      </View>

      {/* 3. AI Mentor Insight Section */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionHeaderModern}>AI Strategy Insights</Text>
        <View style={styles.liveIndicator}><Text style={styles.liveIndicatorText}>LIVE</Text></View>
      </View>

      {analytics?.recommendations?.length > 0 ? (
        analytics.recommendations.map((rec: any, idx: number) => (
          <View key={idx} style={styles.insightCardModern}>
            <View style={styles.insightHeader}>
              <View style={styles.insightIcon}><Ionicons name="bulb" size={20} color="#00D084" /></View>
              <Text style={styles.insightTitleModern}>{rec.title}</Text>
            </View>
            <Text style={styles.insightTextModern}>{rec.insight}</Text>
            <TouchableOpacity style={styles.actionBtn}>
              <Text style={styles.actionBtnText}>Apply Strategy: {rec.action}</Text>
              <Ionicons name="arrow-forward" size={16} color="#00D084" />
            </TouchableOpacity>
          </View>
        ))
      ) : (
        <View style={styles.emptyInsight}>
          <Ionicons name="analytics-outline" size={32} color="#222" />
          <Text style={styles.emptyInsightText}>Post more reels to unlock deep-learning business intelligence.</Text>
        </View>
      )}

      {/* 4. Detailed Breakdown */}
      <View style={styles.breakdownCard}>
        <Text style={styles.breakdownTitle}>Interaction Intelligence</Text>
        {[
          { label: 'Network Shares', value: analytics?.stats?.total_shares, icon: 'share-social-outline' },
          { label: 'Partner Comments', value: analytics?.stats?.total_comments, icon: 'chatbubbles-outline' },
          { label: 'Intent Saves', value: analytics?.stats?.total_likes, icon: 'bookmark-outline' },
        ].map((item, idx) => (
          <View key={idx} style={styles.breakdownRowModern}>
            <View style={styles.breakdownInfo}>
              <Ionicons name={item.icon as any} size={18} color="#555" />
              <Text style={styles.breakdownLabelModern}>{item.label}</Text>
            </View>
            <Text style={styles.breakdownValueModern}>{item.value || 0}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Top Nav */}
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.iconCircle} onPress={() => router.push('/cart')}>
          <Ionicons name="cart-outline" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>{profile?.business_name || 'Business Profile'}</Text>
        <TouchableOpacity style={styles.iconCircle} onPress={() => router.push('/profile/settings')}>
          <Ionicons name="menu-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.profileInfoSection}>
        {/* Avatar & Basic Info */}
        <View style={styles.avatarRow}>
          <View style={styles.avatarWrap}>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatarImg} />
            ) : (
              <View style={styles.avatarPlaceholder}><Text style={styles.avatarText}>B</Text></View>
            )}
            {profile?.is_verified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={20} color="#00D084" />
              </View>
            )}
          </View>

          <View style={styles.statsContainer}>
            <StatItem label="Clients" value={stats.followers} onPress={() => router.push({ pathname: '/profile/follows', params: { id: session?.user?.id, type: 'clients' } })} />
            <StatItem label="Connections" value={stats.following} onPress={() => router.push({ pathname: '/profile/follows', params: { id: session?.user?.id, type: 'connections' } })} />
            <StatItem label="Network" value={stats.mutual} onPress={() => router.push({ pathname: '/profile/follows', params: { id: session?.user?.id, type: 'network' } })} />
          </View>
        </View>

        <View style={styles.nameSection}>
          <Text style={styles.displayName}>{profile?.business_name || 'Business Name'}</Text>
          <Text style={styles.handle}>@{profile?.username || 'user'}</Text>
        </View>

        {profile?.bio && <Text style={styles.bioText}>{profile.bio}</Text>}

        <View style={styles.businessMetaRow}>
          {profile?.location && (
            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={14} color="#777" />
              <Text style={styles.metaText}>{profile.location}</Text>
            </View>
          )}
          {profile?.working_hours && (
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={14} color="#777" />
              <Text style={styles.metaText}>{profile.working_hours}</Text>
            </View>
          )}
        </View>

        {/* Action Row */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/profile/edit')}>
            <Text style={styles.primaryBtnText}>Edit Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.push({ pathname: '/profile/catalog', params: { id: session?.user?.id } })}>
            <Ionicons name="storefront-outline" size={18} color="#fff" />
            <Text style={styles.secondaryBtnText}>Catalog</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="share-outline" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TabButton name="REELS" active={activeTab === 'REELS'} onPress={() => setActiveTab('REELS')} icon="grid-outline" />
        <TabButton name="REFER" active={activeTab === 'REFER'} onPress={() => setActiveTab('REFER')} icon="repeat-outline" />
        <TabButton name="LIKED" active={activeTab === 'LIKED'} onPress={() => setActiveTab('LIKED')} icon="heart-outline" />
        <TabButton name="SAVED" active={activeTab === 'SAVED'} onPress={() => setActiveTab('SAVED')} icon="bookmark-outline" />
        <TabButton name="ANALYTICS" active={activeTab === 'ANALYTICS'} onPress={() => setActiveTab('ANALYTICS')} icon="bar-chart-outline" />
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
  header: { paddingTop: 60, backgroundColor: 'rgba(0,0,0,0.3)' },
  navBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 15 },
  navTitle: { color: '#fff', fontSize: 17, fontWeight: '800', letterSpacing: -0.5 },
  iconCircle: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },

  profileInfoSection: { paddingHorizontal: 20, paddingBottom: 20 },
  avatarRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 },
  avatarWrap: { width: 92, height: 92, borderRadius: 46, position: 'relative', shadowColor: '#00D084', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10 },
  avatarImg: { width: '100%', height: '100%', borderRadius: 46, borderWidth: 2, borderColor: '#1C1C24' },
  avatarPlaceholder: { width: '100%', height: '100%', borderRadius: 46, backgroundColor: '#1C1C24', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 36, fontWeight: 'bold' },
  verifiedBadge: { position: 'absolute', bottom: 2, right: 2, backgroundColor: '#000', borderRadius: 12, padding: 2 },

  statsContainer: { flex: 1, flexDirection: 'row', justifyContent: 'space-around', marginLeft: 25 },
  statItem: { alignItems: 'center' },
  statValue: { color: '#fff', fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
  statLabel: { color: '#555', fontSize: 11, fontWeight: '800', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 },

  nameSection: { marginBottom: 15 },
  displayName: { color: '#fff', fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
  handle: { color: '#00D084', fontSize: 14, fontWeight: '700', marginTop: 2 },
  bioText: { color: '#aaa', fontSize: 14, lineHeight: 22, marginBottom: 15 },

  businessMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 25 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  metaText: { color: '#888', fontSize: 12, fontWeight: '700' },

  actionRow: { flexDirection: 'row', gap: 12, marginBottom: 15 },
  primaryBtn: { flex: 2, backgroundColor: '#D4AF37', height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', shadowColor: '#D4AF37', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10 },
  primaryBtnText: { color: '#000', fontSize: 15, fontWeight: '900' },
  secondaryBtn: { flex: 2, backgroundColor: 'rgba(255,255,255,0.08)', flexDirection: 'row', gap: 8, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  secondaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  iconBtn: { width: 48, height: 48, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },

  tabBar: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#1C1C24' },
  tab: { flex: 1, height: 54, justifyContent: 'center', alignItems: 'center' },
  activeTab: { borderBottomWidth: 3, borderBottomColor: '#00D084' },

  gridItem: { width: '33.33%', aspectRatio: 1, padding: 1.5 },
  thumbnail: { flex: 1, backgroundColor: '#0D0D12', borderRadius: 4 },
  gridOverlay: { position: 'absolute', bottom: 10, left: 10, backgroundColor: 'rgba(0,0,0,0.4)', padding: 4, borderRadius: 4 },

  // --- Analytics Modern Styles ---
  analyticsContainer: { padding: 15 },
  scoreCard: { flexDirection: 'row', backgroundColor: '#111', borderRadius: 24, padding: 25, marginBottom: 20, alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#222' },
  scoreInfo: { flex: 1 },
  scoreLabel: { color: '#666', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', marginBottom: 5 },
  scoreValue: { color: '#fff', fontSize: 32, fontWeight: '900' },
  scoreTotal: { color: '#333', fontSize: 18 },
  scoreVisual: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(0,208,132,0.1)', justifyContent: 'center', alignItems: 'center' },

  statGrid: { flexDirection: 'row', gap: 12, marginBottom: 25 },
  statBoxModern: { flex: 1, backgroundColor: '#111', borderRadius: 20, padding: 15, alignItems: 'center', borderWidth: 1, borderColor: '#1c1c1c' },
  statIconWrap: { marginBottom: 8 },
  statValModern: { color: '#fff', fontSize: 18, fontWeight: '900' },
  statLabelModern: { color: '#555', fontSize: 10, fontWeight: '700', marginTop: 2, textTransform: 'uppercase' },

  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15, paddingHorizontal: 5 },
  sectionHeaderModern: { color: '#fff', fontSize: 18, fontWeight: '900' },
  liveIndicator: { backgroundColor: 'rgba(0,208,132,0.1)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  liveIndicatorText: { color: '#00D084', fontSize: 9, fontWeight: '900' },

  insightCardModern: { backgroundColor: '#111', borderRadius: 24, padding: 20, marginBottom: 15, borderWidth: 1, borderColor: '#222' },
  insightHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  insightIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(0,208,132,0.1)', justifyContent: 'center', alignItems: 'center' },
  insightTitleModern: { color: '#fff', fontSize: 16, fontWeight: '800' },
  insightTextModern: { color: '#888', fontSize: 14, lineHeight: 22, marginBottom: 15 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#1c1c1c', padding: 12, borderRadius: 12 },
  actionBtnText: { color: '#00D084', fontSize: 13, fontWeight: '800' },

  emptyInsight: { alignItems: 'center', padding: 40 },
  emptyInsightText: { color: '#333', fontSize: 14, textAlign: 'center', marginTop: 15, fontWeight: '600' },

  breakdownCard: { backgroundColor: '#111', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#222' },
  breakdownTitle: { color: '#fff', fontSize: 16, fontWeight: '800', marginBottom: 20 },
  breakdownRowModern: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#1c1c1c' },
  breakdownInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  breakdownLabelModern: { color: '#777', fontSize: 14, fontWeight: '600' },
  breakdownValueModern: { color: '#fff', fontSize: 16, fontWeight: '900' },

  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 60 },
  emptyText: { color: '#333', fontSize: 14, fontWeight: '700', marginTop: 15 },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', zIndex: 100 }
});
