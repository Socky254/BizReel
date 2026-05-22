import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  FlatList,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  Linking,
  KeyboardAvoidingView,
  Platform,
  BackHandler,
} from 'react-native';
import { SafeLinearGradient } from '../../src/components/SafeLinearGradient';
import { supabase } from '../../src/lib/supabase';
import { useAuth } from '../../src/Context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function PublicProfileScreen() {
  const params = useLocalSearchParams();
  const id = params.id as string;
  const { session } = useAuth();
  const [reels, setReels] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [likedReels, setLikedReels] = useState<any[]>([]);
  const [referralReels, setReferralReels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [clientsCount, setClientsCount] = useState(0);
  const [connectionsCount, setConnectionsCount] = useState(0);
  const [networkCount, setNetworkCount] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [userRating, setUserRating] = useState(5);
  const [userComment, setUserComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const [activeTab, setActiveTab] = useState<'PORTFOLIO' | 'CATALOG' | 'REFER' | 'REVIEWS'>(
    'PORTFOLIO',
  );
  const [reviews, setReviews] = useState<any[]>([]);
  const [savedReels, setSavedReels] = useState<any[]>([]);
  const [perfIndex, setPerfIndex] = useState<any>(null);

  const router = useRouter();
  const isOwnProfile = session?.user?.id === id;

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
    if (id) {
      initPublicProfile();

      // REAL-TIME RATINGS: Listen for review changes
      const channel = supabase
        .channel(`public_ratings_${id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'reviews',
            filter: `receiver_id=eq.${id}`,
          },
          () => {
            fetchRatings();
            fetchReviews();
          },
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [id]);

  const initPublicProfile = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchProfileAndReels(),
        fetchRatings(),
        fetchReviews(),
        fetchLikedReels(),
        fetchReferralReels(),
        fetchPerformanceIndex(),
        fetchProducts(),
        isOwnProfile ? fetchSavedReels() : Promise.resolve(),
      ]);
    } catch (err) {
      console.error('Public profile init error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('business_id', id)
        .order('created_at', { ascending: false });
      setProducts(data || []);
    } catch (e) {}
  };

  const fetchReviews = async () => {
    try {
      const { data } = await supabase
        .from('reviews')
        .select('*, profiles:reviewer_id(username, business_name, avatar_url)')
        .eq('receiver_id', id)
        .order('created_at', { ascending: false });
      setReviews(data || []);
    } catch (e) {}
  };

  const fetchPerformanceIndex = async () => {
    try {
      const { data, error } = await supabase.rpc('get_business_performance_index', {
        target_user_id: id,
      });
      if (data) setPerfIndex(data);
    } catch (e) {}
  };

  const fetchProfileAndReels = async () => {
    try {
      const { data: pData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (pData) setProfile(pData);

      const { data: rData } = await supabase
        .from('posts')
        .select('*, profiles(*)')
        .eq('user_id', id)
        .order('created_at', { ascending: false });
      setReels(rData || []);

      if (session?.user?.id) {
        const { data: fData } = await supabase
          .from('follows')
          .select('*')
          .eq('follower_id', session.user.id)
          .eq('following_id', id)
          .maybeSingle();
        setIsFollowing(!!fData);

        const { data: mData } = await supabase.rpc('get_mutual_connections_count', {
          user_id_a: session.user.id,
          user_id_b: id,
        });
        setNetworkCount(mData || 0);
      }

      const [followersRes, followingRes] = await Promise.all([
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', id),
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', id),
      ]);

      setClientsCount(followersRes.count || 0);
      setConnectionsCount(followingRes.count || 0);
    } catch (e) {
      console.error('Fetch profile/reels error:', e);
    }
  };

  const fetchSavedReels = async () => {
    if (!session?.user?.id) return;
    try {
      const { data } = await supabase
        .from('saved_posts')
        .select('post_id, posts(*, profiles(*))')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });
      if (data) setSavedReels(data.map((item: any) => item.posts).filter((p: any) => p !== null));
    } catch (e) {}
  };

  const fetchLikedReels = async () => {
    try {
      const { data } = await supabase
        .from('likes')
        .select('post_id, posts(*, profiles(*))')
        .eq('user_id', id)
        .order('created_at', { ascending: false });
      if (data) setLikedReels(data.map((item: any) => item.posts).filter((p: any) => p !== null));
    } catch (e) {}
  };

  const fetchReferralReels = async () => {
    try {
      const { data } = await supabase
        .from('reposts')
        .select('post_id, posts(*, profiles(*))')
        .eq('user_id', id)
        .order('created_at', { ascending: false });
      if (data)
        setReferralReels(data.map((item: any) => item.posts).filter((p: any) => p !== null));
    } catch (e) {}
  };

  const fetchRatings = async () => {
    const { data } = await supabase.from('reviews').select('rating').eq('receiver_id', id);
    if (data && data.length > 0) {
      const sum = data.reduce((acc, curr) => acc + curr.rating, 0);
      setAverageRating(sum / data.length);
    }
  };

  const toggleFollow = async () => {
    if (!session?.user?.id || isOwnProfile) return;
    const newState = !isFollowing;
    setIsFollowing(newState);

    if (newState) {
      await supabase.from('follows').insert({ follower_id: session.user.id, following_id: id });
    } else {
      await supabase
        .from('follows')
        .delete()
        .match({ follower_id: session.user.id, following_id: id });
    }
  };

  const submitReview = async () => {
    if (!session?.user?.id) return;
    setIsSubmittingReview(true);
    await supabase.from('reviews').upsert({
      reviewer_id: session.user.id,
      receiver_id: id,
      rating: userRating,
      comment: userComment,
    });
    setIsSubmittingReview(false);
    setShowReviewModal(false);
    fetchRatings();
    Alert.alert('Success', 'Rating submitted.');
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>{profile?.business_name || 'Business'}</Text>
        <TouchableOpacity style={styles.iconCircle}>
          <Ionicons name="ellipsis-vertical" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.centeredInfo}>
        <View style={[styles.avatarWrap, profile?.is_live && styles.avatarLive]}>
          {profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.avatarImg} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>B</Text>
            </View>
          )}
        </View>
        <Text style={styles.username}>@{profile?.username || 'user'}</Text>

        <View style={styles.statsRowInline}>
          <TouchableOpacity
            style={styles.statBoxInline}
            onPress={() =>
              router.push({ pathname: '/profile/follows', params: { id, type: 'clients' } })
            }
          >
            <Text style={styles.statValInline}>{clientsCount}</Text>
            <Text style={styles.statLabelInline}>Clients</Text>
          </TouchableOpacity>
          <View style={styles.statDivider} />
          <TouchableOpacity
            style={styles.statBoxInline}
            onPress={() =>
              router.push({ pathname: '/profile/follows', params: { id, type: 'connections' } })
            }
          >
            <Text style={styles.statValInline}>{connectionsCount}</Text>
            <Text style={styles.statLabelInline}>Connections</Text>
          </TouchableOpacity>
          <View style={styles.statDivider} />
          <TouchableOpacity
            style={styles.statBoxInline}
            onPress={() =>
              router.push({ pathname: '/profile/follows', params: { id, type: 'network' } })
            }
          >
            <Text style={styles.statValInline}>{networkCount}</Text>
            <Text style={styles.statLabelInline}>Network</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.profileActionRow}>
          <TouchableOpacity
            style={[styles.connectBtn, isFollowing && styles.connectedBtn]}
            onPress={toggleFollow}
          >
            <Text style={[styles.connectText, isFollowing && { color: '#fff' }]}>
              {isFollowing ? 'Connected' : 'Connect'}
            </Text>
          </TouchableOpacity>

          <View style={styles.actionGroup}>
            <TouchableOpacity
              style={styles.iconActionBtn}
              onPress={() => router.push({ pathname: '/chat/[id]', params: { id } })}
            >
              <Ionicons name="chatbubble-outline" size={20} color="#fff" />
            </TouchableOpacity>

            {profile?.phone && (
              <TouchableOpacity
                style={[styles.iconActionBtn, { backgroundColor: '#00D084' }]}
                onPress={() => Linking.openURL(`tel:${profile.phone}`)}
              >
                <Ionicons name="call" size={20} color="#000" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {profile?.bio && <Text style={styles.profileBio}>{profile.bio}</Text>}

        {perfIndex && (
          <View style={styles.perfCard}>
            <View style={styles.perfRow}>
              <View style={styles.perfItem}>
                <Text style={styles.perfVal}>{perfIndex.index_score}</Text>
                <Text style={styles.perfLabel}>SCORE</Text>
              </View>
              <View style={styles.perfDivider} />
              <View style={styles.perfItem}>
                <Text style={styles.perfVal}>{perfIndex.fulfillment_rate}%</Text>
                <Text style={styles.perfLabel}>SUCCESS</Text>
              </View>
              <View style={styles.perfDivider} />
              <View style={styles.perfItem}>
                <Text style={styles.perfVal}>{perfIndex.unique_business_partners || 0}</Text>
                <Text style={styles.perfLabel}>PARTNERS</Text>
              </View>
              <View style={styles.perfDivider} />
              <View style={styles.perfItem}>
                <Text style={styles.perfVal}>{perfIndex.total_closed_deals}</Text>
                <Text style={styles.perfLabel}>DEALS</Text>
              </View>
            </View>
            <View style={styles.perfBadge}>
              <Text style={styles.perfStatusText}>{perfIndex.status} ENTERPRISE</Text>
            </View>
          </View>
        )}

        <View style={styles.businessCategoryRow}>
          <Ionicons name="business" size={14} color="#00D084" />
          <Text style={styles.categoryText}>{profile?.category || 'General Business'}</Text>
        </View>

        <TouchableOpacity
          style={styles.trustBadge}
          onPress={() => !isOwnProfile && setShowReviewModal(true)}
        >
          <View style={styles.starsInline}>
            {[1, 2, 3, 4, 5].map((s) => (
              <Ionicons
                key={s}
                name={s <= Math.round(averageRating) ? 'star' : 'star-outline'}
                size={16}
                color="#FFCC00"
              />
            ))}
          </View>
          <Text style={styles.trustText}>
            {averageRating > 0 ? averageRating.toFixed(1) : '5.0'} Trust Score
          </Text>
          {!isOwnProfile && <Text style={styles.rateLink}>• Rate</Text>}
        </TouchableOpacity>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'PORTFOLIO' && styles.activeTab]}
          onPress={() => setActiveTab('PORTFOLIO')}
        >
          <Ionicons
            name="apps-outline"
            size={22}
            color={activeTab === 'PORTFOLIO' ? '#00D084' : '#555'}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'CATALOG' && styles.activeTab]}
          onPress={() => setActiveTab('CATALOG')}
        >
          <Ionicons
            name="grid-outline"
            size={22}
            color={activeTab === 'CATALOG' ? '#00D084' : '#555'}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'REVIEWS' && styles.activeTab]}
          onPress={() => setActiveTab('REVIEWS')}
        >
          <Ionicons
            name="star-outline"
            size={22}
            color={activeTab === 'REVIEWS' ? '#00D084' : '#555'}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'REFER' && styles.activeTab]}
          onPress={() => setActiveTab('REFER')}
        >
          <Ionicons
            name="repeat-outline"
            size={22}
            color={activeTab === 'REFER' ? '#00D084' : '#555'}
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  const activeData = useMemo(() => {
    if (activeTab === 'PORTFOLIO') return reels;
    if (activeTab === 'CATALOG') return products;
    if (activeTab === 'REFER') return referralReels;
    if (activeTab === 'REVIEWS') return reviews;
    return [];
  }, [activeTab, reels, products, referralReels, reviews]);

  const renderReviewItem = ({ item }: { item: any }) => (
    <View style={styles.reviewItem}>
      <View style={styles.reviewHeader}>
        <Image source={{ uri: item.profiles?.avatar_url }} style={styles.reviewAvatar} />
        <View style={styles.reviewInfo}>
          <Text style={styles.reviewUser}>
            {item.profiles?.business_name || item.profiles?.username}
          </Text>
          <View style={styles.starsInlineMini}>
            {[1, 2, 3, 4, 5].map((s) => (
              <Ionicons
                key={s}
                name={s <= item.rating ? 'star' : 'star-outline'}
                size={10}
                color="#FFCC00"
              />
            ))}
          </View>
        </View>
        <Text style={styles.reviewDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
      </View>
      <Text style={styles.reviewComment}>{item.comment}</Text>
    </View>
  );

  const renderGridItem = ({ item }: { item: any }) => {
    if (activeTab === 'CATALOG') {
      return (
        <TouchableOpacity
          style={styles.gridItem}
          onPress={() => router.push({ pathname: '/profile/catalog', params: { id } })}
        >
          <Image source={{ uri: item.image_url }} style={styles.thumbnail} contentFit="cover" />
          <View style={styles.priceOverlay}>
            <Text style={styles.priceText}>{item.price}</Text>
          </View>
        </TouchableOpacity>
      );
    }
    return (
      <TouchableOpacity
        style={styles.gridItem}
        onPress={() => router.push({ pathname: '/posts/[id]' as any, params: { id: item.id } })}
      >
        <Video
          source={{ uri: item.video_url }}
          style={styles.thumbnail}
          resizeMode={ResizeMode.COVER}
          shouldPlay={false}
          isMuted
        />
        <View style={styles.playOverlay}>
          <Ionicons name="play" size={12} color="#fff" />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <FlatList
        data={activeData}
        numColumns={activeTab === 'REVIEWS' ? 1 : 3}
        ListHeaderComponent={renderHeader}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          if (activeTab === 'REVIEWS') return renderReviewItem({ item });
          return renderGridItem({ item });
        }}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No {activeTab.toLowerCase()} yet.</Text>
          </View>
        }
      />
      {loading && (
        <View style={styles.loading}>
          <ActivityIndicator color="#00D084" size="large" />
        </View>
      )}

      <Modal visible={showReviewModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalContent}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Rate {profile?.business_name}</Text>
              <TouchableOpacity onPress={() => setShowReviewModal(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.ratingArea}>
              <Text style={styles.ratingLabel}>Select Partner Trust Score</Text>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity key={star} onPress={() => setUserRating(star)}>
                    <Ionicons
                      name={star <= userRating ? 'star' : 'star-outline'}
                      size={40}
                      color={star <= userRating ? '#FFCC00' : '#333'}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TextInput
              style={styles.reviewInput}
              placeholder="Describe your professional experience..."
              placeholderTextColor="#555"
              multiline
              value={userComment}
              onChangeText={setUserComment}
            />

            <TouchableOpacity
              style={styles.submitReviewBtn}
              onPress={submitReview}
              disabled={isSubmittingReview}
            >
              {isSubmittingReview ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.submitReviewText}>Submit Review</Text>
              )}
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  header: { paddingTop: 60 },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  navTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  iconCircle: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  centeredInfo: { alignItems: 'center', paddingHorizontal: 20 },
  avatarWrap: { width: 100, height: 100, borderRadius: 50, marginBottom: 15 },
  avatarLive: { borderWidth: 2, borderColor: '#FF0050' },
  avatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
    borderWidth: 1,
    borderColor: '#1C1C24',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
    backgroundColor: '#1C1C24',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: '#fff', fontSize: 40, fontWeight: 'bold' },
  username: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 20 },
  statsRowInline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  statBoxInline: { alignItems: 'center', paddingHorizontal: 15 },
  statValInline: { color: '#fff', fontSize: 18, fontWeight: '800' },
  statLabelInline: { color: '#777', fontSize: 12, fontWeight: '600', marginTop: 2 },
  statDivider: { width: 1, height: 15, backgroundColor: '#333' },
  profileActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 10,
  },
  connectBtn: {
    flex: 1,
    backgroundColor: '#00D084',
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectedBtn: { backgroundColor: '#1C1C24', borderWidth: 1, borderColor: '#2C2C34' },
  connectText: { color: '#000', fontSize: 14, fontWeight: '900', letterSpacing: 0.5 },
  actionGroup: { flexDirection: 'row', gap: 8 },
  catalogBtn: { width: 48, height: 48, borderRadius: 12, overflow: 'hidden' },
  catalogGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  iconActionBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#1C1C24',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2C2C34',
  },
  profileBio: {
    color: '#eee',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  perfCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    padding: 15,
    width: '100%',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  perfRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 10,
  },
  perfItem: { alignItems: 'center' },
  perfVal: { color: '#fff', fontSize: 18, fontWeight: '900' },
  perfLabel: { color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: '800', marginTop: 4 },
  perfDivider: { width: 1, height: 20, backgroundColor: 'rgba(255,255,255,0.1)' },
  perfBadge: {
    alignSelf: 'center',
    backgroundColor: 'rgba(0,208,132,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: 'rgba(0,208,132,0.3)',
  },
  perfStatusText: { color: '#00D084', fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  businessCategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    marginBottom: 5,
  },
  categoryText: { color: '#00D084', fontSize: 13, fontWeight: '800', textTransform: 'uppercase' },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,204,0,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: 'rgba(255,204,0,0.2)',
  },
  starsInline: { flexDirection: 'row', gap: 2 },
  starsInlineMini: { flexDirection: 'row', gap: 1 },
  trustText: { color: '#FFCC00', fontSize: 13, fontWeight: '900' },
  rateLink: { color: '#FFCC00', fontSize: 12, fontWeight: '600', opacity: 0.8 },
  reviewItem: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#1C1C24' },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  reviewAvatar: { width: 32, height: 32, borderRadius: 16, marginRight: 10 },
  reviewInfo: { flex: 1 },
  reviewUser: { color: '#fff', fontSize: 14, fontWeight: '700' },
  reviewDate: { color: '#555', fontSize: 11 },
  reviewComment: { color: '#aaa', fontSize: 14, lineHeight: 20 },
  tabBar: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#1C1C24' },
  tab: { flex: 1, height: 50, justifyContent: 'center', alignItems: 'center' },
  activeTab: { borderBottomWidth: 2, borderBottomColor: '#fff' },
  gridItem: { width: '33.33%', aspectRatio: 3 / 4, padding: 1 },
  thumbnail: { flex: 1, backgroundColor: '#111' },
  gridOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 4,
    borderRadius: 4,
  },
  priceOverlay: {
    position: 'absolute',
    bottom: 5,
    left: 5,
    right: 5,
    backgroundColor: 'rgba(0, 200, 83, 0.8)',
    paddingVertical: 2,
    borderRadius: 4,
    alignItems: 'center',
  },
  priceText: { color: '#000', fontSize: 9, fontWeight: '900' },
  playOverlay: { position: 'absolute', bottom: 8, left: 8 },
  loading: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: '#16161E',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 25,
    paddingBottom: 50,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: '900' },
  ratingArea: { alignItems: 'center', marginBottom: 30 },
  ratingLabel: {
    color: '#888',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 15,
  },
  starsRow: { flexDirection: 'row', gap: 10 },
  reviewInput: {
    backgroundColor: '#0D0D12',
    borderRadius: 15,
    padding: 18,
    color: '#fff',
    height: 120,
    textAlignVertical: 'top',
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#2C2C34',
  },
  submitReviewBtn: {
    backgroundColor: '#00D084',
    padding: 18,
    borderRadius: 15,
    alignItems: 'center',
  },
  submitReviewText: { color: '#000', fontSize: 16, fontWeight: '900' },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 50,
    paddingHorizontal: 40,
  },
  emptyText: { color: '#555', fontSize: 14, textAlign: 'center', fontWeight: '600' },
});
