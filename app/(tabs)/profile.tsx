import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, FlatList, ActivityIndicator, ScrollView, RefreshControl, Dimensions, Alert, Linking, BackHandler } from 'react-native';
import { useAuth } from '../../src/Context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { SafeLinearGradient } from '../../src/components/SafeLinearGradient';
import { Colors } from '../../src/core/theme/colors';
import { Post, Profile } from '../../src/domain/models';
import { container } from '../../src/di/Container';
import { supabase } from '../../src/lib/supabase';
import { ErrorHandler } from '../../src/core/error_handler/ErrorHandler';
import { IntelligenceService, StrategyInsight } from '../../src/services/IntelligenceService';
import { SkeletonLoader } from '../../src/components/SkeletonLoader';

const { width } = Dimensions.get('window');

const ProfileSkeleton = () => (
    <View style={styles.container}>
        <View style={styles.header}>
            <View style={styles.navBar}>
                <SkeletonLoader width={40} height={40} borderRadius={12} />
                <SkeletonLoader width={150} height={20} />
                <SkeletonLoader width={40} height={40} borderRadius={12} />
            </View>
            <View style={styles.profileInfoSection}>
                <View style={styles.avatarRow}>
                    <SkeletonLoader width={90} height={90} borderRadius={30} />
                    <View style={styles.statsContainer}>
                        <SkeletonLoader width="30%" height={60} borderRadius={16} />
                        <SkeletonLoader width="30%" height={60} borderRadius={16} />
                        <SkeletonLoader width="30%" height={60} borderRadius={16} />
                    </View>
                </View>
                <SkeletonLoader width={200} height={30} style={{ marginBottom: 10 }} />
                <SkeletonLoader width={150} height={20} style={{ marginBottom: 20 }} />
                <SkeletonLoader width="100%" height={60} style={{ marginBottom: 20 }} />
                <View style={styles.actionRow}>
                    <SkeletonLoader width="40%" height={50} borderRadius={14} />
                    <SkeletonLoader width="25%" height={50} borderRadius={14} />
                    <SkeletonLoader width="25%" height={50} borderRadius={14} />
                </View>
            </View>
        </View>
    </View>
);

const StatItem = ({ label, value, onPress }: any) => (
  <TouchableOpacity style={styles.statItem} onPress={onPress}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </TouchableOpacity>
);

const TabButton = ({ active, onPress, icon, label }: any) => (
  <TouchableOpacity
    style={[styles.tab, active && styles.activeTab]}
    onPress={onPress}
  >
    <Ionicons name={icon} size={20} color={active ? '#00D084' : 'rgba(255,255,255,0.4)'} />
    {active && <Text style={styles.tabLabel}>{label}</Text>}
  </TouchableOpacity>
);

export default function ProfileScreen() {
  const { session } = useAuth();
  const router = useRouter();

  const [reels, setReels] = useState<Post[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [likedReels, setLikedReels] = useState<Post[]>([]);
  const [savedReels, setSavedReels] = useState<Post[]>([]);
  const [referralReels, setReferralReels] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState({ followers: 0, following: 0, mutual: 0 });
  const [analytics, setAnalytics] = useState<any>(null);
  const [strategyInsights, setStrategyInsights] = useState<StrategyInsight[]>([]);
  const [activeTab, setActiveTab] = useState<'PORTFOLIO' | 'CATALOG' | 'SAVED' | 'REFER' | 'ANALYTICS'>('PORTFOLIO');
  const [perfIndex, setPerfIndex] = useState<any>(null);
  const [averageRating, setAverageRating] = useState(5.0);

  const fetchData = useCallback(async () => {
    if (!session?.user?.id) return;
    const uid = session.user.id;
    try {
      const [pData, rData, lData, sData, refData, followStats, aData, sInsights, pIndex, reviewsData, prodData] = await Promise.all([
        container.getProfileUseCase.execute(uid),
        container.profileRepository.getUserReels(uid),
        container.profileRepository.getLikedReels(uid),
        container.profileRepository.getSavedReels(uid),
        container.profileRepository.getReferrals(uid),
        container.profileRepository.getFollowStats(uid),
        container.profileRepository.getAnalytics(uid),
        IntelligenceService.getStrategyIntelligence(uid),
        supabase.rpc('get_business_performance_index', { target_user_id: uid }).then(res => res.data),
        supabase.from('reviews').select('rating').eq('receiver_id', uid),
        container.marketplaceRepository.getProducts(uid)
      ]);

      setProfile(pData);
      setReels(rData);
      setLikedReels(lData);
      setSavedReels(sData);
      setReferralReels(refData);
      setAnalytics(aData);
      setStrategyInsights(sInsights);
      setPerfIndex(pIndex);
      setProducts(prodData);

      if (reviewsData.data && reviewsData.data.length > 0) {
        const sum = reviewsData.data.reduce((acc: number, curr: any) => acc + curr.rating, 0);
        setAverageRating(sum / reviewsData.data.length);
      }

      const partnersCount = await container.profileRepository.getPartnersCount(uid);
      setStats({ ...followStats, mutual: partnersCount });
    } catch (err) {
      ErrorHandler.handle(err, 'ProfileFetchData');
    }
  }, [session?.user?.id]);


  const initProfile = useCallback(async () => {
    setLoading(true);
    await fetchData();
    setLoading(false);
  }, [fetchData]);

  useEffect(() => {
    const backAction = () => {
      if (activeTab !== 'PORTFOLIO') {
        setActiveTab('PORTFOLIO');
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [activeTab]);

  useEffect(() => {
    if (session?.user?.id) {
      initProfile();

      const followChannel = supabase
        .channel(`profile_follows_${session.user.id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'follows' }, () => fetchData())
        .subscribe();

      const profileChannel = supabase
        .channel(`profile_data_${session.user.id}`)
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${session.user.id}`
        }, () => fetchData())
        .subscribe();

      const postChannel = supabase
        .channel(`profile_posts_${session.user.id}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'posts',
          filter: `user_id=eq.${session.user.id}`
        }, () => fetchData())
        .subscribe();

      const reviewsChannel = supabase
        .channel(`profile_reviews_${session.user.id}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'reviews',
          filter: `receiver_id=eq.${session.user.id}`
        }, () => fetchData())
        .subscribe();

      return () => {
        supabase.removeChannel(followChannel);
        supabase.removeChannel(profileChannel);
        supabase.removeChannel(postChannel);
        supabase.removeChannel(reviewsChannel);
      };
    }
  }, [session?.user?.id, initProfile]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const renderAnalytics = () => {
    if (!analytics) return (
      <View style={styles.emptyAnalytics}>
        <ActivityIndicator color={Colors.primary} />
        <Text style={styles.loadingText}>Synchronizing Market Intelligence...</Text>
      </View>
    );

    return (
      <View style={styles.analyticsContainer}>
        <View style={styles.scoreCard}>
          <View style={styles.scoreInfo}>
            <Text style={styles.scoreLabel}>Enterprise Maturity Index</Text>
            <Text style={styles.scoreValue}>
              {perfIndex?.index_score || (analytics?.stats?.engagement_rate ? Math.round(Number(analytics.stats.engagement_rate) * 1.5) : 92)}
              <Text style={styles.scoreTotal}>/100</Text>
            </Text>
          </View>
          <View style={styles.scoreVisual}>
            <Ionicons name="ribbon" size={32} color={perfIndex?.status === 'ELITE' ? "#D4AF37" : "#00D084"} />
          </View>
        </View>

        <View style={styles.statGrid}>
          <View style={styles.statBoxModern}>
            <View style={styles.statIconWrap}><Ionicons name="analytics" size={18} color="#00D084" /></View>
            <Text style={styles.statValModern}>{analytics?.stats?.total_views?.toLocaleString() || '0'}</Text>
            <Text style={styles.statLabelModern}>Market Reach</Text>
          </View>
          <View style={styles.statBoxModern}>
            <View style={styles.statIconWrap}><Ionicons name="pulse" size={18} color="#00D084" /></View>
            <Text style={styles.statValModern}>{analytics?.stats?.engagement_rate || '0'}%</Text>
            <Text style={styles.statLabelModern}>Capital Velocity</Text>
          </View>
          <View style={styles.statBoxModern}>
            <View style={styles.statIconWrap}><Ionicons name="briefcase" size={18} color="#00D084" /></View>
            <Text style={styles.statValModern}>{analytics?.stats?.total_reposts || '0'}</Text>
            <Text style={styles.statLabelModern}>Partnerships</Text>
          </View>
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeaderModern}>Predictive Strategy Intelligence</Text>
          <View style={styles.liveIndicator}><Text style={styles.liveIndicatorText}>OPTIMIZED</Text></View>
        </View>

        {strategyInsights.length > 0 ? (
          strategyInsights.map((rec, idx) => (
            <View key={idx} style={styles.insightCardModern}>
              <View style={styles.insightHeader}>
                <View style={styles.insightIcon}><Ionicons name="shield-checkmark" size={20} color="#00D084" /></View>
                <Text style={styles.insightTitleModern}>{rec.title}</Text>
              </View>
              <Text style={styles.insightTextModern}>{rec.insight}</Text>
              <TouchableOpacity style={styles.actionBtn}>
                <Text style={styles.actionBtnText}>Execute: {rec.action}</Text>
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

        <View style={styles.breakdownCard}>
          <Text style={styles.breakdownTitle}>Network Interaction Analytics</Text>
          {[
            { label: 'Strategic Endorsements', value: analytics?.stats?.total_likes || 0, icon: 'heart-outline' },
            { label: 'Market Referrals', value: analytics?.stats?.total_reposts || 0, icon: 'repeat-outline' },
            { label: 'Intent-to-Purchase Saves', value: analytics?.stats?.total_shares || 0, icon: 'bookmark-outline' },
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

        <TouchableOpacity style={styles.feedbackCard} onPress={() => router.push('/profile/settings')}>
          <SafeLinearGradient colors={['#111', '#050505']} style={styles.feedbackGradient}>
            <View style={styles.feedbackIcon}><Ionicons name="chatbox-ellipses" size={20} color={Colors.primary} /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.feedbackTitle}>Enterprise Feedback Channel</Text>
              <Text style={styles.feedbackSubtitle}>Direct line to our systems architecture team.</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#333" />
          </SafeLinearGradient>
        </TouchableOpacity>
      </View>
    );
  };

  const showProfileMenu = () => {
    Alert.alert(
      "Enterprise Command Center",
      "Manage your professional presence",
      [
        { text: "View Portfolio (Reels)", onPress: () => setActiveTab('REELS') },
        { text: "Business Intelligence", onPress: () => setActiveTab('ANALYTICS') },
        { text: "Collections", onPress: () => {
            Alert.alert("Collections", "Select content to view", [
                { text: "Saved Reels", onPress: () => setActiveTab('SAVED') },
                { text: "Liked Reels", onPress: () => setActiveTab('LIKED') },
                { text: "Cancel", style: "cancel" }
            ]);
        }},
        { text: "Settings & Privacy", onPress: () => router.push('/profile/settings') },
        { text: "Executive Dashboard", onPress: () => router.push('/profile/dashboard') },
        { text: "Cancel", style: "cancel" }
      ]
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <SafeLinearGradient
        colors={['rgba(0, 200, 83, 0.15)', 'rgba(0,0,0,0)']}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.iconCircle} onPress={() => router.push('/cart')}>
          <Ionicons name="wallet-outline" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={styles.navTitleContainer}>
          <Text style={styles.navTitle}>{profile?.business_name?.toUpperCase() || 'ENTERPRISE PROFILE'}</Text>
          <View style={styles.onlineBadge} />
        </View>
        <TouchableOpacity style={styles.iconCircle} onPress={() => router.push('/profile/settings')}>
          <Ionicons name="reorder-four-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {strategyInsights.length > 0 && (
          <TouchableOpacity
            style={styles.strategyPulse}
            onPress={() => setActiveTab('ANALYTICS')}
          >
              <Ionicons name="bulb" size={16} color={Colors.primary} />
              <Text style={styles.strategyText} numberOfLines={1}>
                  STRATEGY PULSE: {strategyInsights[0].insight}
              </Text>
          </TouchableOpacity>
      )}

      <View style={styles.profileInfoSection}>
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
            <StatItem label="Market" value={stats.followers} onPress={() => router.push({ pathname: '/profile/follows', params: { id: session?.user?.id, type: 'followers' } })} />
            <StatItem label="Partners" value={stats.mutual} onPress={() => router.push({ pathname: '/profile/follows', params: { id: session?.user?.id, type: 'partners' } })} />
            <StatItem label="Connections" value={stats.following} onPress={() => router.push({ pathname: '/profile/follows', params: { id: session?.user?.id, type: 'following' } })} />
          </View>
        </View>

        <View style={styles.nameSection}>
          <View style={styles.displayNameRow}>
            <Text style={styles.displayName}>{profile?.business_name || 'Business Entity'}</Text>
            <View style={[styles.tierBadge, perfIndex?.status === 'ELITE' && { backgroundColor: 'rgba(212, 175, 55, 0.15)', borderColor: 'rgba(212, 175, 55, 0.3)' }]}>
                <Text style={[styles.tierText, perfIndex?.status === 'ELITE' && { color: '#D4AF37' }]}>{perfIndex?.status || 'PLATINUM'}</Text>
            </View>
          </View>
          <View style={styles.ratingRow}>
             <View style={styles.stars}>
                {[1, 2, 3, 4, 5].map((s) => (<Ionicons key={s} name={s <= Math.round(averageRating) ? "star" : "star-outline"} size={14} color="#FFD700" />))}
             </View>
             <Text style={styles.ratingText}>{averageRating.toFixed(1)} Trust Score</Text>
          </View>
          <Text style={styles.handle}>ID: {profile?.username || 'user_id'}</Text>
        </View>

        {profile?.bio && <Text style={styles.bioText}>{profile.bio}</Text>}

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/profile/edit')}><Text style={styles.primaryBtnText}>EDIT PROFILE</Text></TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.push('/profile/add-product')}><Ionicons name="add-circle" size={18} color="#fff" /><Text style={styles.secondaryBtnText}>LIST PRODUCT</Text></TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => setActiveTab('ANALYTICS')}><Ionicons name="analytics" size={20} color={activeTab === 'ANALYTICS' ? Colors.primary : "#fff"} /></TouchableOpacity>
        </View>
      </View>

      <View style={styles.tabBar}>
        <TabButton active={activeTab === 'PORTFOLIO'} onPress={() => setActiveTab('PORTFOLIO')} icon="apps-outline" label="PORTFOLIO" />
        <TabButton active={activeTab === 'CATALOG'} onPress={() => setActiveTab('CATALOG')} icon="grid-outline" label="CATALOG" />
        <TabButton active={activeTab === 'REFER'} onPress={() => setActiveTab('REFER')} icon="trending-up-outline" label="EXPOSURE" />
        <TabButton active={activeTab === 'SAVED'} onPress={() => setActiveTab('SAVED')} icon="bookmark-outline" label="SAVED" />
      </View>
    </View>
  );

  const activeData = useMemo(() => {
    if (activeTab === 'PORTFOLIO') return reels;
    if (activeTab === 'CATALOG') return products;
    if (activeTab === 'SAVED') return savedReels;
    if (activeTab === 'REFER') return referralReels;
    return [];
  }, [activeTab, reels, products, savedReels, referralReels]);

  if (loading && !refreshing) return <ProfileSkeleton />;

  const renderGridItem = ({ item }: { item: any }) => {
    if (activeTab === 'CATALOG') {
      return (
        <TouchableOpacity style={styles.gridItem} onPress={() => router.push({ pathname: '/profile/catalog', params: { id: session?.user?.id } })}>
          <Image source={{ uri: item.image_url }} style={styles.thumbnail} contentFit="cover" />
          <View style={styles.priceOverlay}><Text style={styles.priceText}>{item.price}</Text></View>
        </TouchableOpacity>
      );
    }
    return (
      <TouchableOpacity style={styles.gridItem} onPress={() => router.push({ pathname: '/posts/[id]', params: { id: item.id } })}>
        <Video source={{ uri: item.video_url }} style={styles.thumbnail} resizeMode={ResizeMode.COVER} shouldPlay={false} isMuted />
        <View style={styles.gridOverlay}><Ionicons name="play" size={12} color="#fff" /></View>
      </TouchableOpacity>
    );
  };

  return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        {activeTab === 'ANALYTICS' ? (
          <ScrollView contentContainerStyle={{ paddingBottom: 120 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00D084" />}>
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
            renderItem={renderGridItem}
            contentContainerStyle={{ paddingBottom: 120 }}
            ListEmptyComponent={!loading ? (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconCircle}><Ionicons name={activeTab === 'SAVED' ? 'bookmark' : 'videocam'} size={32} color="rgba(0, 208, 132, 0.2)" /></View>
                <Text style={styles.emptyTitle}>NO {activeTab} ASSETS</Text>
                <Text style={styles.emptySubtitle}>Your professional portfolio will appear here once synchronized.</Text>
                <TouchableOpacity style={styles.emptyActionBtn} onPress={() => router.push('/(tabs)/upload')}><Text style={styles.emptyActionText}>CREATE NEW ASSET</Text></TouchableOpacity>
              </View>
            ) : null}
          />
        )}
      </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { paddingTop: 60, backgroundColor: 'rgba(0,0,0,0.5)' },
  navBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 25 },
  navTitleContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  navTitle: { color: '#fff', fontSize: 13, fontWeight: '900', letterSpacing: 2 },
  onlineBadge: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#00D084' },
  strategyPulse: { marginHorizontal: 20, marginBottom: 20, padding: 12, backgroundColor: 'rgba(0,208,132,0.05)', borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: 'rgba(0,208,132,0.1)' },
  strategyText: { color: Colors.primary, fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  iconCircle: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  profileInfoSection: { paddingHorizontal: 20, paddingBottom: 25 },
  avatarRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  avatarWrap: { width: 90, height: 90, borderRadius: 30, position: 'relative', overflow: 'visible' },
  avatarImg: { width: '100%', height: '100%', borderRadius: 30, borderWidth: 2, borderColor: '#111' },
  avatarPlaceholder: { width: '100%', height: '100%', borderRadius: 30, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  avatarText: { color: '#fff', fontSize: 32, fontWeight: '900' },
  verifiedBadge: { position: 'absolute', top: -5, right: -5, backgroundColor: '#000', borderRadius: 12, padding: 2 },
  statsContainer: { flex: 1, flexDirection: 'row', gap: 10, marginLeft: 20 },
  statItem: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, paddingVertical: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  statValue: { color: '#fff', fontSize: 18, fontWeight: '900' },
  statLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '800', marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 },
  nameSection: { marginBottom: 20 },
  displayNameRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  displayName: { color: '#fff', fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  tierBadge: { backgroundColor: 'rgba(212, 175, 55, 0.15)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, borderWidth: 0.5, borderColor: 'rgba(212, 175, 55, 0.3)' },
  tierText: { color: '#D4AF37', fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  stars: { flexDirection: 'row', gap: 2 },
  ratingText: { color: '#FFD700', fontSize: 11, fontWeight: '800' },
  handle: { color: '#00D084', fontSize: 13, fontWeight: '700', marginTop: 4, opacity: 0.8 },
  bioText: { color: 'rgba(255,255,255,0.6)', fontSize: 14, lineHeight: 22, marginBottom: 20 },
  actionRow: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  primaryBtn: { flex: 2, backgroundColor: 'rgba(255,255,255,0.1)', height: 44, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  primaryBtnText: { color: '#fff', fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
  secondaryBtn: { flex: 2, backgroundColor: 'rgba(255,255,255,0.1)', flexDirection: 'row', gap: 8, height: 44, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  secondaryBtnText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  iconBtn: { width: 44, height: 44, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)', backgroundColor: 'rgba(0,0,0,0.3)', marginTop: 10 },
  tab: { flex: 1, height: 60, justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: 2 },
  activeTab: { borderBottomWidth: 2, borderBottomColor: '#00D084' },
  tabLabel: { color: '#00D084', fontSize: 8, fontWeight: '900', letterSpacing: 0.5 },
  gridItem: { width: '33.33%', aspectRatio: 1, padding: 1 },
  thumbnail: { flex: 1, backgroundColor: '#050505' },
  gridOverlay: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.5)', padding: 4, borderRadius: 4 },
  priceOverlay: { position: 'absolute', bottom: 5, left: 5, right: 5, backgroundColor: 'rgba(0, 200, 83, 0.8)', paddingVertical: 2, borderRadius: 4, alignItems: 'center' },
  priceText: { color: '#000', fontSize: 9, fontWeight: '900' },
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
  emptyAnalytics: { flex: 1, padding: 40, alignItems: 'center', justifyContent: 'center', marginTop: 50 },
  loadingText: { color: 'rgba(255,255,255,0.4)', marginTop: 20, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 80, padding: 40 },
  emptyIconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(0, 208, 132, 0.05)', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyTitle: { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: 1 },
  emptySubtitle: { color: 'rgba(255,255,255,0.4)', fontSize: 14, textAlign: 'center', marginTop: 10, lineHeight: 22, paddingHorizontal: 20 },
  emptyActionBtn: { backgroundColor: '#00D084', paddingHorizontal: 25, paddingVertical: 15, borderRadius: 12, marginTop: 30 },
  emptyActionText: { color: '#000', fontSize: 12, fontWeight: '900', letterSpacing: 1 }
});
