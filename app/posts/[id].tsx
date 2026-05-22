import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { supabase } from '../../src/lib/supabase';
import { Post } from '../../src/domain/models';
import { ReelFeedItem } from '../../src/features/home/components/ReelFeedItem';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/core/theme/colors';
import { PostMapper } from '../../src/data/mappers/PostMapper';
import { container } from '../../src/di/Container';

const { height } = Dimensions.get('window');

export default function SinglePostScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const isFocused = useIsFocused();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPost = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*, profiles(*), likes(user_id), comments(id)')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (data) {
        setPost(PostMapper.toDomain(data));
        container.incrementViewUseCase.execute(id as string);
      }
    } catch (e) {
      console.error('SinglePost Error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPost();
  };

  useEffect(() => {
    fetchPost();

    // REAL-TIME SYNC FOR THIS SPECIFIC POST
    const channel = supabase
      .channel(`single_post_${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'posts',
          filter: `id=eq.${id}`,
        },
        () => fetchPost(),
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'likes',
          filter: `post_id=eq.${id}`,
        },
        () => fetchPost(),
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `post_id=eq.${id}`,
        },
        () => fetchPost(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, fetchPost]);

  if (loading && !refreshing)
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );

  if (!post) return null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ScrollView
        contentContainerStyle={{ height: height }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
        scrollEnabled={true}
      >
        <ReelFeedItem item={post} isVisible={isFocused} onOpenComments={() => {}} />
      </ScrollView>

      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={30} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  backBtn: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 100,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    padding: 5,
  },
});
