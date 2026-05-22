import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share, Vibration } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Post } from '../domain/models';
import { SafeLinearGradient } from './SafeLinearGradient';
import { SyncService } from '../services/SyncService';
import { useAuthStore } from '../store/useAuthStore';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming
} from 'react-native-reanimated';
import { Colors } from '../core/theme/colors';

interface Props {
  post: Post;
  onOpenComments: () => void;
}

const InteractionButton = ({ icon, label, count, active, activeColor, onPress, animatedScale }: any) => {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: animatedScale.value }],
  }));

  return (
    <TouchableOpacity style={styles.actionBtn} onPress={onPress} activeOpacity={0.7}>
      <Animated.View style={animatedStyle}>
        <Ionicons name={active ? icon : `${icon}-outline`} size={28} color={active ? activeColor : "#fff"} />
      </Animated.View>
      <Text style={[styles.actionText, active && { color: activeColor }]}>
        {count !== undefined ? count : label}
      </Text>
    </TouchableOpacity>
  );
};

export const ReelInteraction = ({ post, onOpenComments }: Props) => {
  const router = useRouter();
  const { user } = useAuthStore();
  const [isLiked, setIsLiked] = useState(post.likes?.some((l: any) => l.user_id === user?.id) || false);
  const [isSaved, setIsSaved] = useState(post.isSaved || false);
  const [isReposted, setIsReposted] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes?.length || 0);

  const likeScale = useSharedValue(1);
  const saveScale = useSharedValue(1);
  const promoteScale = useSharedValue(1);
  const dealScale = useSharedValue(1);

  const triggerFeedback = useCallback((scaleValue: any) => {
    Vibration.vibrate(10);
    scaleValue.value = withSequence(
      withSpring(1.4, { damping: 2, stiffness: 300 }),
      withSpring(1)
    );
  }, []);

  const handleLike = async () => {
    if (!user) return;
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    setLikeCount((prev: number) => newLikedState ? prev + 1 : prev - 1);
    triggerFeedback(likeScale);

    await SyncService.enqueue('like', { post_id: post.id, user_id: user.id }, newLikedState ? 'add' : 'remove');
  };

  const handleSave = async () => {
    if (!user) return;
    const newSavedState = !isSaved;
    setIsSaved(newSavedState);
    triggerFeedback(saveScale);

    await SyncService.enqueue('save', { post_id: post.id, user_id: user.id }, newSavedState ? 'add' : 'remove');
  };

  const handleRefer = async () => {
    if (!user) return;
    const newRepostedState = !isReposted;
    setIsReposted(newRepostedState);
    triggerFeedback(promoteScale);

    await SyncService.enqueue('repost', { post_id: post.id, user_id: user.id }, newRepostedState ? 'add' : 'remove');
  };

  const handleShare = async () => {
    try {
      const result = await Share.share({
        title: 'BizReel Enterprise Insight',
        message: `Strategic business reel shared from BizReel: ${post.video_url}`,
      });
      if (result.action === Share.sharedAction) {
        await SyncService.enqueue('share', { post_id: post.id, user_id: user?.id });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeal = () => {
    if (!user) return;
    triggerFeedback(dealScale);
    router.push({ pathname: '/chat/[id]', params: { id: post.user_id, mode: 'DEAL', postId: post.id } });
  };

  return (
    <View style={styles.glassContainer}>
      <SafeLinearGradient
        colors={['rgba(255,255,255,0.05)', 'rgba(0,0,0,0.4)']}
        style={StyleSheet.absoluteFill}
      />

      <TouchableOpacity style={styles.actionBtn} onPress={handleDeal}>
        <SafeLinearGradient
          colors={['#00E676', '#00C853']}
          style={styles.dealBadge}
        >
          <Ionicons name="briefcase" size={22} color="#000" />
        </SafeLinearGradient>
      </TouchableOpacity>

      <InteractionButton
        icon="heart"
        count={likeCount}
        active={isLiked}
        activeColor="#FF3B30"
        onPress={handleLike}
        animatedScale={likeScale}
      />

      <TouchableOpacity style={styles.actionBtn} onPress={onOpenComments}>
        <Ionicons name="chatbubble-ellipses" size={26} color="#fff" />
        <Text style={styles.actionText}>{post.comments?.length || 0}</Text>
      </TouchableOpacity>

      <InteractionButton
        icon="repeat"
        count={undefined}
        label="Promote"
        active={isReposted}
        activeColor={Colors.primary}
        onPress={handleRefer}
        animatedScale={promoteScale}
      />

      <InteractionButton
        icon="bookmark"
        count={undefined}
        label="Curate"
        active={isSaved}
        activeColor="#FFCC00"
        onPress={handleSave}
        animatedScale={saveScale}
      />

      <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
        <Ionicons name="paper-plane" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  glassContainer: {
    position: 'absolute',
    right: 15,
    bottom: 110,
    alignItems: 'center',
    gap: 20,
    zIndex: 10,
    paddingVertical: 25,
    paddingHorizontal: 8,
    borderRadius: 30,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  actionBtn: {
    alignItems: 'center',
    width: 50,
  },
  actionText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dealBadge: {
    width: 44,
    height: 44,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00C853',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  }
});
