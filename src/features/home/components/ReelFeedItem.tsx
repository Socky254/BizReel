import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Text,
  TouchableOpacity,
  Pressable,
  AppState,
  AppStateStatus,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { useIsFocused } from '@react-navigation/native';
import { SafeLinearGradient } from '../../../components/SafeLinearGradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Post } from '../../../domain/models';
import { ReelInteraction } from '../../../components/ReelInteraction';
import { Colors } from '../../../core/theme/colors';
import { useAuthStore } from '../../../store/useAuthStore';
import { supabase } from '../../../lib/supabase';
import { SyncService } from '../../../services/SyncService';
import { deletePost } from '../../../services/postService';
import { Watermark } from '../../../components/Watermark';
import { VideoService } from '../../../services/VideoService';
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  useSharedValue,
  FadeIn,
  runOnJS,
} from 'react-native-reanimated';

const { height, width } = Dimensions.get('window');

interface Props {
  item: Post;
  isVisible: boolean;
  onOpenComments: (postId: string) => void;
}

export const ReelFeedItem = React.memo(({ item, isVisible, onOpenComments }: Props) => {
  const router = useRouter();
  const isFocused = useIsFocused();
  const { user } = useAuthStore();

  const [isPaused, setIsPaused] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);
  const [progress, setProgress] = useState(0);
  const [showLikeHeart, setShowLikeHeart] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [shouldPlay, setShouldPlay] = useState(false);
  const [showHUD, setShowHUD] = useState(false);
  const [perfIndex, setPerfIndex] = useState<any>(null);
  const [isFetchingPerf, setIsFetchingPerf] = useState(false);
  const [resolvedVideoUri, setResolvedVideoUri] = useState<string | null>(null);
  const [cachedPerfIndexes, setCachedPerfIndexes] = useState<Record<string, any>>({});

  const lastTap = useRef<number>(0);
  const videoRef = useRef<Video>(null);
  const playTimeout = useRef<NodeJS.Timeout | null>(null);

  const pulse = useSharedValue(1);
  const heartScale = useSharedValue(0);

  // Resolve cached URI for instant playback
  useEffect(() => {
    let isMounted = true;
    VideoService.getCachedVideoUri(item.video_url).then((uri) => {
      if (isMounted) setResolvedVideoUri(uri);
    });
    return () => { isMounted = false; };
  }, [item.video_url]);

  const videoSource = useMemo(() =>
    resolvedVideoUri ? { uri: resolvedVideoUri } : { uri: item.video_url },
  [resolvedVideoUri, item.video_url]);

  // Lifecycle & Performance Optimization
  useEffect(() => {
    const subscription = AppState.addEventListener('change', setAppState);
    return () => {
        subscription.remove();
        if (playTimeout.current) clearTimeout(playTimeout.current);
    };
  }, []);

  useEffect(() => {
    if (!videoRef.current) return;

    if (isVisible && isFocused && appState === 'active' && !isPaused) {
      // PRO OPTIMIZATION: Small delay before playing to ensure smooth scrolling
      if (playTimeout.current) clearTimeout(playTimeout.current);
      playTimeout.current = setTimeout(() => {
        setShouldPlay(true);
        videoRef.current?.playAsync().catch(() => {});
      }, 300);
    } else {
      if (playTimeout.current) clearTimeout(playTimeout.current);
      setShouldPlay(false);
      videoRef.current?.pauseAsync().catch(() => {});
    }
  }, [isVisible, isFocused, appState, isPaused]);

  // Check follow status
  useEffect(() => {
    if (isVisible && user && item.user_id) {
        supabase
          .from('follows')
          .select('*')
          .eq('follower_id', user.id)
          .eq('following_id', item.user_id)
          .maybeSingle()
          .then(({ data }) => setIsFollowing(!!data));
    }
  }, [isVisible, user, item.user_id]);

  useEffect(() => {
    if (!isFollowing) {
      pulse.value = withRepeat(
        withSequence(withTiming(1.05, { duration: 800 }), withTiming(1, { duration: 800 })),
        -1,
        true,
      );
    } else {
      pulse.value = withTiming(1);
    }
  }, [isFollowing]);

  const handleConnect = async () => {
    if (!user || item.user_id === user.id) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const newState = !isFollowing;
    setIsFollowing(newState);

    await SyncService.enqueue(
      'follow',
      { follower_id: user.id, following_id: item.user_id },
      newState ? 'add' : 'remove',
    );
  };

  const handleDoubleTap = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setShowLikeHeart(true);
    heartScale.value = withSequence(
      withTiming(1.2, { duration: 150 }),
      withTiming(1, { duration: 150 }),
      withTiming(0, { duration: 500 }, () => {
        runOnJS(setShowLikeHeart)(false);
      }),
    );

    if (user) {
      await SyncService.enqueue('like', { post_id: item.id, user_id: user.id }, 'add');
    }
  };

  const handleTap = () => {
    const now = Date.now();
    if (lastTap.current && now - lastTap.current < 300) {
      handleDoubleTap();
    } else {
      Haptics.selectionAsync();
      setIsPaused(!isPaused);
    }
    lastTap.current = now;
  };

  const handleLongPress = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setShowHUD(true);

    // Fetch or Use Cached Trust Analytics
    const businessId = item.user_id;
    if (cachedPerfIndexes[businessId]) {
      setPerfIndex(cachedPerfIndexes[businessId]);
      return;
    }

    if (!isFetchingPerf) {
      try {
        setIsFetchingPerf(true);
        const { data } = await supabase.rpc('get_business_performance_index', {
          target_user_id: businessId,
        });
        if (data) {
          setPerfIndex(data);
          setCachedPerfIndexes(prev => ({ ...prev, [businessId]: data }));
        }
      } catch (e) {
        console.error('Error fetching trust analytics:', e);
      } finally {
        setIsFetchingPerf(false);
      }
    }
  };

  const handlePressOut = () => {
    if (showHUD) setShowHUD(false);
  };

  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded && status.durationMillis) {
      setProgress(status.positionMillis / status.durationMillis);
      if (!isLoaded) setIsLoaded(true);
    }
  };

  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));
  const heartStyle = useAnimatedStyle(() => ({ transform: [{ scale: heartScale.value }], opacity: heartScale.value }));

  return (
    <View style={styles.postContainer}>
      <Pressable
        style={styles.videoTouchable}
        onPress={handleTap}
        onLongPress={handleLongPress}
        onPressOut={handlePressOut}
        delayLongPress={400}
      >
        <Video
          ref={videoRef}
          source={videoSource}
          style={styles.video}
          resizeMode={ResizeMode.COVER}
          shouldPlay={shouldPlay}
          isLooping
          onPlaybackStatusUpdate={onPlaybackStatusUpdate}
        />

        {isPaused && (
          <Animated.View entering={FadeIn.duration(200)} style={styles.pauseOverlay}>
            <View style={styles.pauseCircle}><Ionicons name="play" size={40} color="#fff" /></View>
          </Animated.View>
        )}

        {showLikeHeart && (
          <Animated.View style={[styles.heartOverlay, heartStyle]}>
            <Ionicons name="heart" size={100} color="#00D084" />
          </Animated.View>
        )}

        {isLoaded && <Watermark businessName={item.profiles?.business_name} />}

        <IntelligenceHUD
          isVisible={showHUD}
          businessName={item.profiles?.business_name || 'Enterprise'}
          category={item.profiles?.category || 'General'}
          perfIndex={perfIndex}
        />
      </Pressable>

      <SafeLinearGradient
        colors={['rgba(0,0,0,0.4)', 'transparent', 'rgba(0,0,0,0.7)']}
        locations={[0, 0.4, 1]}
        style={styles.fullOverlay}
      />

      <View style={styles.overlayBottom}>
        <Animated.View entering={FadeIn.delay(300)} style={styles.businessRow}>
          <TouchableOpacity
            onPress={() => router.push({ pathname: '/profile/[id]', params: { id: item.user_id } })}
            style={styles.profileInfo}
          >
            <View style={styles.avatarWrap}>
              {item.profiles?.avatar_url ? (
                <Image source={{ uri: item.profiles.avatar_url }} style={styles.avatarImg} contentFit="cover" transition={500} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitial}>{(item.profiles?.business_name || 'B').charAt(0).toUpperCase()}</Text>
                </View>
              )}
            </View>
            <View style={styles.businessTextInfo}>
              <View style={styles.businessNameRow}>
                <Text style={styles.businessName}>{item.profiles?.business_name || 'Premium Business'}</Text>
                {item.profiles?.is_verified && <Ionicons name="checkmark-circle" size={16} color={Colors.primary} />}
              </View>
              <View style={styles.sectorBadge}>
                 <Text style={styles.sectorText}>{item.profiles?.category || 'General Business'}</Text>
              </View>
            </View>
          </TouchableOpacity>

          {user?.id !== item.user_id && (
            <Animated.View style={pulseStyle}>
              <TouchableOpacity
                style={[styles.connectBtn, { backgroundColor: isFollowing ? '#333' : '#00D084' }]}
                onPress={handleConnect}
              >
                <Text style={[styles.connectBtnText, isFollowing && { color: 'rgba(255,255,255,0.6)' }]}>
                    {isFollowing ? 'Networked' : 'Partner'}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </Animated.View>

        <Text style={styles.caption} numberOfLines={2}>{item.caption}</Text>
      </View>

      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBackground}>
          <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
        </View>
      </View>

      <ReelInteraction post={item} onOpenComments={() => onOpenComments(item.id)} />
    </View>
  );
});

const styles = StyleSheet.create({
  postContainer: { width: width, height: height, backgroundColor: '#000' },
  videoTouchable: { flex: 1 },
  video: { width: '100%', height: '100%' },
  fullOverlay: { ...StyleSheet.absoluteFillObject },
  pauseOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)' },
  pauseCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  heartOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  overlayBottom: { position: 'absolute', bottom: 30, left: 0, right: 0, paddingHorizontal: 20, paddingBottom: 70, zIndex: 5 },
  profileInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatarWrap: { width: 48, height: 48, borderRadius: 18, marginRight: 15, backgroundColor: '#111' },
  avatarImg: { width: '100%', height: '100%', borderRadius: 18 },
  avatarPlaceholder: { width: '100%', height: '100%', borderRadius: 18, backgroundColor: 'rgba(0, 208, 132, 0.1)', justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { color: Colors.primary, fontSize: 18, fontWeight: '900' },
  businessTextInfo: { justifyContent: 'center' },
  businessName: { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
  businessNameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sectorBadge: { backgroundColor: 'rgba(0, 208, 132, 0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 2, alignSelf: 'flex-start' },
  sectorText: { color: Colors.primary, fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  businessRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, justifyContent: 'space-between' },
  connectBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  connectBtnText: { color: '#000', fontSize: 13, fontWeight: '900', textTransform: 'uppercase' },
  caption: { color: 'rgba(255,255,255,0.9)', fontSize: 15, lineHeight: 22, marginBottom: 15 },
  progressBarContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 2 },
  progressBarBackground: { flex: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  progressBarFill: { height: '100%', backgroundColor: Colors.primary },
});
