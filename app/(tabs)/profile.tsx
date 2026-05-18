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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState({ followers: 0, following: 0, mutual: 0 });
  const [analytics, setAnalytics] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'REELS' | 'LIKED' | 'SAVED' | 'ANALYTICS'>('REELS');

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
    const [pData, rData, lData, sData, followStats, aData] = await Promise.all([
      container.getProfileUseCase.execute(uid),
      container.profileRepository.getUserReels(uid),
      container.profileRepository.getLikedReels(uid),
      container.profileRepository.getSavedReels(uid),
      container.profileRepository.getFollowStats(uid),
      container.profileRepository.getAnalytics(uid),
    ]);

    setProfile(pData);
    setReels(rData);
    setLikedReels(lData);
    setSavedReels(sData);
    setAnalytics(aData);

    const partnersCount = await container.profileRepository.getPartnersCount(uid);
    setStats({ ...followStats, mutual: partnersCount });
  };

  const renderAnalytics = () => (
    <View style={styles.analyticsContainer}>
      <View style={styles.statCard}>
        <Text style={styles.statTitle}>Performance Overview</Text>
        <View style={styles.statGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statValueLarge}>{analytics?.stats?.total_views?.toLocaleString() || 0}</Text>
            <Text style={styles.statLabel}>Total Reach</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValueLarge}>{analytics?.stats?.engagement_rate || 0}%</Text>
            <Text style={styles.statLabel}>Engagement</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValueLarge}>{analytics?.stats?.conversion_rate || 0}%</Text>
            <Text style={styles.statLabel}>Conversion</Text>
          </View>
        </View>
      </View>

      <Text style={styles.sectionHeader}>Business Insights</Text>
      {analytics?.recommendations?.length > 0 ? (
        analytics.recommendations.map((rec: any, idx: number) => (
          <View key={idx} style={styles.insightCard}>
            <View style={styles.insightHeader}>
              <Ionicons name="bulb-outline" size={20} color="#00D084" />
              <Text style={styles.insightTitle}>{rec.title}</Text>
            </View>
            <Text style={styles.insightText}>{rec.insight}</Text>
            <View style={styles.actionBadge}>
              <Text style={styles.actionText}>Tip: {rec.action}</Text>
            </View>
          </View>
        ))
      ) : (
        <View style={styles.insightCard}>
          <Text style={styles.insightText}>Keep posting to unlock more detailed business insights!</Text>
        </View>
      )}

      <View style={styles.statCard}>
        <Text style={styles.statTitle}>Interaction Breakdown</Text>
        {[
          { label: 'Likes', value: analytics?.stats?.total_likes },
          { label: 'Comments', value: analytics?.stats?.total_comments },
          { label: 'Shares/Referrals', value: analytics?.stats?.total_shares },
        ].map((item, idx) => (
          <View key={idx} style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>{item.label}</Text>
            <Text style={styles.breakdownValue}>{item.value || 0}</Text>
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
    return [];
  }, [activeTab, reels, likedReels, savedReels]);

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

  analyticsContainer: { padding: 20 },
  statCard: { padding: 24, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginBottom: 25, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20 },
  statTitle: { color: '#666', fontSize: 11, fontWeight: '900', textTransform: 'uppercase', marginBottom: 20, letterSpacing: 1.5 },
  statGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  statBox: { alignItems: 'center' },
  statValueLarge: { color: '#fff', fontSize: 28, fontWeight: '900', letterSpacing: -1 },

  sectionHeader: { color: '#D4AF37', fontSize: 12, fontWeight: '900', textTransform: 'uppercase', marginBottom: 20, letterSpacing: 2, marginLeft: 5 },
  insightCard: { backgroundColor: 'rgba(212, 175, 55, 0.05)', borderRadius: 24, padding: 24, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.15)' },
  insightHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  insightTitle: { color: '#D4AF37', fontSize: 16, fontWeight: '900' },
  insightText: { color: '#aaa', fontSize: 14, lineHeight: 22, marginBottom: 18 },
  actionBadge: { backgroundColor: 'rgba(212, 175, 55, 0.1)', padding: 12, borderRadius: 12, borderLeftWidth: 4, borderLeftColor: '#D4AF37' },
  actionText: { color: '#D4AF37', fontSize: 13, fontWeight: '800' },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18, paddingBottom: 18, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  breakdownLabel: { color: '#999', fontSize: 15, fontWeight: '600' },
  breakdownValue: { color: '#fff', fontSize: 16, fontWeight: '900' },

  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 60 },
  emptyText: { color: '#333', fontSize: 14, fontWeight: '700', marginTop: 15 },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', zIndex: 100 }
});
