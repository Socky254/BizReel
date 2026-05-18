import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Post } from '../domain/models';
import { SyncService } from '../services/SyncService';
import { useAuthStore } from '../store/useAuthStore';

interface Props {
  post: Post;
  onOpenComments: () => void;
}

export const ReelInteraction = ({ post, onOpenComments }: Props) => {
  const { user } = useAuthStore();
  const [isLiked, setIsLiked] = useState(post.likes?.some(l => l.user_id === user?.id) || false);
  const [isSaved, setIsSaved] = useState(post.isSaved || false);
  const [isReposted, setIsReposted] = useState(false); // We'd ideally fetch this or include in model
  const [likeCount, setLikeCount] = useState(post.likes?.length || 0);

  const handleLike = async () => {
    if (!user) return;
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    setLikeCount(prev => newLikedState ? prev + 1 : prev - 1);

    await SyncService.enqueue('like', { post_id: post.id, user_id: user.id }, newLikedState ? 'add' : 'remove');
  };

  const handleSave = async () => {
    if (!user) return;
    const newSavedState = !isSaved;
    setIsSaved(newSavedState);

    await SyncService.enqueue('save', { post_id: post.id, user_id: user.id }, newSavedState ? 'add' : 'remove');
  };

  const handleRefer = async () => {
    if (!user) return;
    const newRepostedState = !isReposted;
    setIsReposted(newRepostedState);

    await SyncService.enqueue('repost', { post_id: post.id, user_id: user.id }, newRepostedState ? 'add' : 'remove');
  };

  const handleShare = async () => {
    try {
      const result = await Share.share({
        message: `Check out this business reel on BizReel! ${post.video_url}`,
      });
      if (result.action === Share.sharedAction) {
        await SyncService.enqueue('share', { post_id: post.id, user_id: user?.id });
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <View style={styles.container}>
      {/* LIKE */}
      <TouchableOpacity style={styles.actionBtn} onPress={handleLike}>
        <Ionicons name={isLiked ? "heart" : "heart-outline"} size={32} color={isLiked ? "#FF3B30" : "#fff"} />
        <Text style={styles.actionText}>{likeCount}</Text>
      </TouchableOpacity>

      {/* COMMENT */}
      <TouchableOpacity style={styles.actionBtn} onPress={onOpenComments}>
        <Ionicons name="chatbubble-outline" size={30} color="#fff" />
        <Text style={styles.actionText}>{post.comments?.length || 0}</Text>
      </TouchableOpacity>

      {/* REFER / REPOST */}
      <TouchableOpacity style={styles.actionBtn} onPress={handleRefer}>
        <Ionicons name="repeat-outline" size={32} color={isReposted ? "#00D084" : "#fff"} />
        <Text style={[styles.actionText, isReposted && {color: '#00D084'}]}>Refer</Text>
      </TouchableOpacity>

      {/* SAVE */}
      <TouchableOpacity style={styles.actionBtn} onPress={handleSave}>
        <Ionicons name={isSaved ? "bookmark" : "bookmark-outline"} size={28} color={isSaved ? "#00C853" : "#fff"} />
        <Text style={[styles.actionText, isSaved && {color: '#00C853'}]}>{isSaved ? "Saved" : "Save"}</Text>
      </TouchableOpacity>

      {/* SHARE */}
      <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
        <Ionicons name="paper-plane-outline" size={28} color="#fff" />
        <Text style={styles.actionText}>Share</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 15,
    bottom: 120,
    alignItems: 'center',
    gap: 20,
  },
  actionBtn: {
    alignItems: 'center',
  },
  actionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: {width: -1, height: 1},
    textShadowRadius: 10
  }
});
