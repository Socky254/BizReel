import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Text,
  TouchableOpacity,
  Pressable,
  Vibration,
  AppState,
  AppStateStatus,
} from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Image } from 'expo-image';
import { SafeLinearGradient } from '../../../components/SafeLinearGradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Post } from '../../../domain/models';
import { ReelInteraction } from '../../../components/ReelInteraction';
import { Colors } from '../../../core/theme/colors';
import { useAuthStore } from '../../../store/useAuthStore';
import { supabase } from '../../../lib/supabase';
import { SyncService } from '../../../services/SyncService';
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
  const { user } = useAuthStore();
  const [isPaused, setIsPaused] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);
  const [progress, setProgress] = useState(0);
  const [showLikeHeart, setShowLikeHeart] = useState(false);
  const lastTap = useRef<number>(0);
  const videoRef = useRef<Video>(null);

  const pulse = useSharedValue(1);
  const heartScale = useSharedValue(0);
  const videoSource = useMemo(() => ({ uri: item.video_url }), [item.video_url]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      setAppState(nextAppState);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (!isVisible) {
      setIsPaused(false);
      setProgress(0);
    }
    checkFollowStatus();
  }, [isVisible]);

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

  const checkFollowStatus = async () => {
    if (!user || !item.user_id) return;
    const { data } = await supabase
      .from('follows')
      .select('*')
      .eq('follower_id', user.id)
      .eq('following_id', item.user_id)
      .maybeSingle();
    setIsFollowing(!!data);
  };

  const handleConnect = async () => {
    if (!user || item.user_id === user.id) return;
    Vibration.vibrate(10);
    const newState = !isFollowing;
    setIsFollowing(newState);

    await SyncService.enqueue(
      'follow',
      { follower_id: user.id, following_id: item.user_id },
      newState ? 'add' : 'remove',
    );
  };

  const handleTap = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    if (lastTap.current && now - lastTap.current < DOUBLE_TAP_DELAY) {
      handleDoubleTap();
    } else {
      setIsPaused(!isPaused);
    }
    lastTap.current = now;
  };

  const handleDoubleTap = async () => {
    Vibration.vibrate(15);
    setShowLikeHeart(true);
    heartScale.value = withSequence(
      withTiming(1.2, { duration: 150 }),
      withTiming(1, { duration: 150 }),
      withTiming(0, { duration: 500 }, () => {
        runOnJS(setShowLikeHeart)(false);
      }),
    );

    // Trigger like via SyncService for architectural consistency
    if (user) {
      await SyncService.enqueue('like', { post_id: item.id, user_id: user.id }, 'add');
    }
  };

  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded && status.durationMillis) {
      setProgress(status.positionMillis / status.durationMillis);
    }
  };

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
    opacity: heartScale.value,
  }));

  return (
    <View style={styles.postContainer}>
      <Pressable style={styles.videoTouchable} onPress={handleTap}>
        <Video
          ref={videoRef}
          source={videoSource}
          style={styles.video}
          resizeMode={ResizeMode.COVER}
          shouldPlay={isVisible && !isPaused && appState === 'active'}
          isLooping
          isMuted={isMuted}
          onPlaybackStatusUpdate={onPlaybackStatusUpdate}
        />

        {isPaused && (
          <Animated.View entering={FadeIn.duration(200)} style={styles.pauseOverlay}>
            <View style={styles.pauseCircle}>
              <Ionicons name="play" size={40} color="#fff" />
            </View>
          </Animated.View>
        )}

        {showLikeHeart && (
          <Animated.View style={[styles.heartOverlay, heartStyle]}>
            <Ionicons name="heart" size={100} color="#00C853" />
          </Animated.View>
        )}
      </Pressable>

      {/* GRADIENT OVERLAYS */}
      <SafeLinearGradient
        colors={['rgba(0,0,0,0.6)', 'transparent', 'transparent', 'rgba(0,0,0,0.85)']}
        locations={[0, 0.2, 0.6, 1]}
        style={styles.fullOverlay}
      />

      {/* FEED INFO & CAPTION */}
      <View style={styles.overlayBottom}>
        <Animated.View entering={FadeIn.delay(300)} style={styles.businessRow}>
          <TouchableOpacity
            onPress={() => router.push({ pathname: '/profile/[id]', params: { id: item.user_id } })}
            style={styles.profileInfo}
          >
            <View style={styles.avatarWrap}>
              {item.profiles?.avatar_url ? (
                <Image
                  source={{ uri: item.profiles.avatar_url }}
                  style={styles.avatarImg}
                  contentFit="cover"
                  transition={500}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitial}>
                    {(item.profiles?.business_name || 'B').charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              {item.profiles?.is_verified && (
                <View style={styles.verifiedBadgeMini}>
                  <Ionicons name="checkmark-circle" size={12} color={Colors.primary} />
                </View>
              )}
            </View>
            <View style={styles.businessTextInfo}>
              <View style={styles.businessNameRow}>
                <Text style={styles.businessName}>
                  {item.profiles?.business_name || 'Premium Business'}
                </Text>
                {item.profiles?.is_verified && (
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color={Colors.primary}
                    style={styles.verifiedIcon}
                  />
                )}
                {item.profiles?.username?.toLowerCase().startsWith('socratesart') && (
                  <View style={[styles.platinumBadge, { backgroundColor: 'rgba(0, 208, 132, 0.15)', borderColor: Colors.primary }]}>
                    <Ionicons name="star" size={10} color={Colors.primary} />
                    <Text style={[styles.platinumText, { color: Colors.primary }]}>FOUNDER</Text>
                  </View>
                )}
                {item.profiles?.is_verified && !item.profiles?.username?.toLowerCase().startsWith('socratesart') && (
                  <View style={styles.platinumBadge}>
                    <Ionicons name="shield-checkmark" size={10} color="#D4AF37" />
                    <Text style={styles.platinumText}>ELITE</Text>
                  </View>
                )}
              </View>
              <View style={styles.sectorBadge}>
                <Ionicons
                  name="business-outline"
                  size={10}
                  color={Colors.primary}
                  style={{ marginRight: 4 }}
                />
                <Text style={styles.sectorText}>
                  {item.profiles?.category || 'General Business'}
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {user?.id !== item.user_id && (
            <Animated.View style={pulseStyle}>
              <TouchableOpacity
                style={[styles.connectBtn, { backgroundColor: isFollowing ? '#333' : '#00C853' }]}
                onPress={handleConnect}
              >
                <View style={styles.connectGradient}>
                  <Text
                    style={[
                      styles.connectBtnText,
                      isFollowing && { color: 'rgba(255,255,255,0.6)' },
                    ]}
                  >
                    {isFollowing ? 'Networked' : 'Partner'}
                  </Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          )}
        </Animated.View>

        <Text style={styles.caption} numberOfLines={3}>
          {item.caption}
        </Text>

        <View style={styles.metaRow}>
          <View style={styles.tag}>
            <Text style={styles.tagText}>Enterprise</Text>
          </View>
          <View style={styles.timestampRow}>
            <Ionicons name="calendar-outline" size={12} color="rgba(255,255,255,0.5)" />
            <Text style={styles.timestampText}>
              {new Date(item.created_at).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
          </View>
        </View>
      </View>

      {/* PROGRESS LINE */}
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
  pauseOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  pauseCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  heartOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  muteBtn: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    backdropFilter: 'blur(10px)', // For web/unsupported notice
  },
  overlayBottom: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 70,
    zIndex: 5,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarWrap: {
    width: 48,
    height: 48,
    borderRadius: 18,
    marginRight: 15,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
    backgroundColor: 'rgba(0, 200, 83, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 200, 83, 0.2)',
  },
  avatarInitial: {
    color: Colors.primary,
    fontSize: 18,
    fontWeight: '900',
  },
  verifiedBadgeMini: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#000',
    borderRadius: 10,
    padding: 1,
  },
  businessTextInfo: {
    justifyContent: 'center',
  },
  businessName: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  businessNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  platinumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  platinumText: {
    color: '#D4AF37',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  sectorBadge: {
    backgroundColor: 'rgba(0, 200, 83, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
    alignSelf: 'flex-start',
  },
  sectorText: {
    color: Colors.primary,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  businessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    justifyContent: 'space-between',
  },
  verifiedIcon: {
    marginLeft: 5,
  },
  connectBtn: {
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  connectGradient: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  connectBtnText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  caption: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 22,
    marginBottom: 15,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  tag: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  tagText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  timestampRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  timestampText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontWeight: '600',
  },
  progressBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  progressBarBackground: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
});
