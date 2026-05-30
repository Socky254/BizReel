import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  ViewToken,
  Text,
  StatusBar,
  TouchableOpacity,
  Platform,
  RefreshControl,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { container } from '../../../di/Container';
import { SyncService } from '../../../services/SyncService';
import { Post } from '../../../domain/models';
import { CommentsModal } from '../../../components/CommentsModal';
import { useAuthStore } from '../../../store/useAuthStore';
import { EnterpriseReel } from '../../../components/EnterpriseReel';
import { ReelFeedItem } from '../components/ReelFeedItem';
import { StoriesBar } from '../components/StoriesBar';
import { Colors } from '../../../core/theme/colors';
import { supabase } from '../../../lib/supabase';
import { VideoService } from '../../../services/VideoService';
import { SkeletonLoader } from '../../../components/SkeletonLoader';
import * as Haptics from 'expo-haptics';
import { MarketTicker } from '../../../components/MarketTicker';
import Animated, {
  FadeIn,
  FadeInDown,
  useSharedValue,
  withRepeat,
  withTiming,
  useAnimatedStyle,
} from 'react-native-reanimated';

const { height } = Dimensions.get('window');

const PulseIndicator = () => {
  const opacity = useSharedValue(0.4);
  useEffect(() => {
    opacity.value = withRepeat(withTiming(1, { duration: 1000 }), -1, true);
  }, []);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <View style={styles.pulseContainer}>
      <Animated.View style={[styles.pulseDot, style]} />
      <Text style={styles.pulseText}>LIVE MARKET PULSE</Text>
    </View>
  );
};

export const FeedFeatureScreen = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const { initialPost } = useLocalSearchParams();
  const { session } = useAuthStore();
  const router = useRouter();
  const isFocused = useIsFocused();
  const flatListRef = useRef<FlatList>(null);

  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  const loadFeed = useCallback(
    async (isInitial = false) => {
      try {
        if (isInitial) setLoading(true);
        setError(null);
        const data = await container.getFeedUseCase.execute(session?.user?.id);
        if (data.length === 0) {
          setError('Your market is quiet. Be the first to disrupt the industry.');
        }
        setPosts(initialPost ? [...data].sort((a, b) => (a.id === initialPost ? -1 : 1)) : data);
      } catch (err) {
        setError('Global network synchronization interrupted.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    },
    [container.getFeedUseCase, session?.user?.id, initialPost],
  );

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 80,
  }).current;

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0) {
      const index = viewableItems[0].index ?? 0;
      const newActiveId = viewableItems[0].item.id;

      if (newActiveId !== activeId) {
        setActiveId(newActiveId);
        container.incrementViewUseCase.execute(newActiveId);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      // PREMIUM POLISH: PREFETCH NEXT VIDEOS
      const nextUrls = posts.slice(index + 1, index + 3).map(p => p.video_url);
      if (nextUrls.length > 0) {
        VideoService.prefetchVideos(nextUrls);
      }
    }
  }).current;

  useEffect(() => {
    loadFeed(true);

    const channel = supabase
      .channel('market_feed_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => {
          loadFeed(false);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadFeed]);

  // DESKTOP KEYBOARD SHORTCUTS
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const currentIndex = posts.findIndex(p => p.id === activeId);
      if (e.key === 'ArrowDown' || e.key === 'j') {
        if (currentIndex < posts.length - 1) flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        if (currentIndex > 0) flatListRef.current?.scrollToIndex({ index: currentIndex - 1, animated: true });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeId, posts]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFeed(false);
    setRefreshing(false);
  };

  const handleManualRetry = () => loadFeed(true);

  const handleOpenComments = useCallback((id: string) => {
    setSelectedPostId(id);
    setCommentModalVisible(true);
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: Post }) => (
      <ReelFeedItem
        item={item}
        isVisible={isFocused && item.id === activeId}
        onOpenComments={handleOpenComments}
      />
    ),
    [activeId, isFocused, handleOpenComments],
  );

  if (loading)
    return (
      <View style={styles.center}>
        <View style={{ width: '100%', height: '100%', padding: 20 }}>
            <SkeletonLoader width="100%" height={height * 0.7} borderRadius={20} style={{ marginBottom: 20 }} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
                <SkeletonLoader width={50} height={50} borderRadius={25} />
                <View style={{ flex: 1, gap: 8 }}>
                    <SkeletonLoader width="60%" height={15} />
                    <SkeletonLoader width="40%" height={10} />
                </View>
            </View>
        </View>
        <Animated.Text entering={FadeIn.delay(300)} style={[styles.loadingText, { position: 'absolute' }]}>
          Accessing Enterprise Ledger...
        </Animated.Text>
      </View>
    );

  if (error)
    return (
      <View style={styles.center}>
        <Animated.View entering={FadeInDown.duration(800)} style={styles.emptyContent}>
          <View style={styles.emptyIconCircle}><Ionicons name="rocket-outline" size={40} color={Colors.primary} /></View>
          <Text style={styles.emptyTitle}>THE MARKET IS WAITING</Text>
          <Text style={styles.emptyText}>Be the first to disrupt the industry with your business reels.</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/upload')} style={styles.primaryActionBtn}>
            <Text style={styles.primaryActionBtnText}>Launch First Reel</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleManualRetry} style={styles.ghostBtn}>
            <Text style={styles.ghostBtnText}>Refresh Network</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <Animated.View entering={FadeIn.duration(1000)} style={styles.header}>
        <View><Text style={styles.headerTitle}>BIZREEL</Text><PulseIndicator /></View>
        <TouchableOpacity style={styles.headerIconButton} onPress={() => router.push('/(tabs)/market')}>
            <Ionicons name="search-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </Animated.View>

      <View style={styles.tickerContainer}>
        <MarketTicker />
      </View>

      <View style={styles.storiesWrapper}><StoriesBar /></View>

      <FlatList
        ref={flatListRef}
        data={posts}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        pagingEnabled
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        removeClippedSubviews={Platform.OS === 'android'}
        initialNumToRender={1}
        maxToRenderPerBatch={1}
        windowSize={Platform.OS === 'android' ? 2 : 3}
        updateCellsBatchingPeriod={Platform.OS === 'android' ? 150 : 100}
        listKey="main_feed"
        showsVerticalScrollIndicator={false}
        snapToInterval={height}
        snapToAlignment="start"
        decelerationRate="fast"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        getItemLayout={(_, index) => ({ length: height, offset: height * index, index })}
      />

      <CommentsModal visible={commentModalVisible} postId={selectedPostId} session={session} onClose={() => setCommentModalVisible(false)} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { position: 'absolute', top: Platform.OS === 'ios' ? 60 : 45, left: 0, right: 0, zIndex: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 25 },
  tickerContainer: { position: 'absolute', top: Platform.OS === 'ios' ? 115 : 100, left: 0, right: 0, zIndex: 9 },
  storiesWrapper: { position: 'absolute', top: Platform.OS === 'ios' ? 145 : 130, left: 0, right: 0, zIndex: 10 },
  headerTitle: { color: '#fff', fontSize: 26, fontWeight: '900', letterSpacing: -1 },
  headerIconButton: { width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(5, 5, 8, 0.5)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  pulseContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  pulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.primary, marginRight: 6 },
  pulseText: { color: Colors.primary, fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#050508', padding: 40 },
  loadingText: { color: 'rgba(255,255,255,0.4)', marginTop: 20, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2 },
  emptyContent: { alignItems: 'center', width: '100%' },
  emptyIconCircle: { width: 100, height: 100, borderRadius: 35, backgroundColor: 'rgba(0, 200, 83, 0.05)', justifyContent: 'center', alignItems: 'center', marginBottom: 30, borderWidth: 1, borderColor: 'rgba(0, 200, 83, 0.15)' },
  emptyTitle: { color: '#fff', fontSize: 24, fontWeight: '900', textAlign: 'center' },
  emptyText: { color: 'rgba(255,255,255,0.5)', fontSize: 14, textAlign: 'center', marginBottom: 35 },
  primaryActionBtn: { backgroundColor: Colors.primary, paddingHorizontal: 35, paddingVertical: 20, borderRadius: 20 },
  primaryActionBtnText: { color: '#000', fontWeight: '900', fontSize: 15 },
  ghostBtn: { marginTop: 20, padding: 10 },
  ghostBtnText: { color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: '700' },
});
