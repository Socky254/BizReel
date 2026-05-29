import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Text,
  AppState,
  AppStateStatus,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../src/lib/supabase';
import { Story } from '../../src/domain/models';
import { Image } from 'expo-image';
import { Colors } from '../../src/core/theme/colors';
import { useAuthStore } from '../../src/store/useAuthStore';
import { deleteStory } from '../../src/services/postService';

const { width, height } = Dimensions.get('window');

export default function StoryViewerScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const isFocused = useIsFocused();
  const { user } = useAuthStore();
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);
  const [isDeleting, setIsDeleting] = useState(false);
  const videoRef = useRef<Video>(null);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      setAppState(nextAppState);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    fetchStory();
  }, [id]);

  const fetchStory = async () => {
    try {
      const { data, error } = await supabase
        .from('stories')
        .select('*, profiles(*)')
        .eq('id', id)
        .single();

      if (error) throw error;
      setStory(data);
    } catch (e) {
      console.error(e);
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (!story) return;

    Alert.alert('Delete Story', 'Are you sure you want to permanently delete this story?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setIsDeleting(true);
          const result = await deleteStory(story.id, story.media_url);
          setIsDeleting(false);
          if (result.success) {
            router.back();
          } else {
            Alert.alert('Error', result.error || 'Failed to delete story');
          }
        },
      },
    ]);
  };

  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded && status.durationMillis) {
      const p = status.positionMillis / status.durationMillis;
      setProgress(p);
      if (status.didJustFinish) {
        router.back();
      }
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  if (!story) return null;

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      <Video
        ref={videoRef}
        source={{ uri: story.media_url }}
        style={styles.video}
        resizeMode={ResizeMode.COVER}
        shouldPlay={isFocused && appState === 'active'}
        onPlaybackStatusUpdate={onPlaybackStatusUpdate}
      />

      {/* Progress Bars */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBarBackground}>
          <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
        </View>
      </View>

      {/* Header Info */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          {story.profiles?.avatar_url ? (
            <Image source={{ uri: story.profiles.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.placeholderAvatar}>
              <Text style={styles.avatarText}>
                {(story.profiles?.business_name || 'B').charAt(0)}
              </Text>
            </View>
          )}
          <View style={{ marginLeft: 10 }}>
            <Text style={styles.username}>
              {story.profiles?.business_name || story.profiles?.username}
            </Text>
            <Text style={styles.time}>Business Update</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
          {story.user_id === user?.id && (
            <TouchableOpacity onPress={handleDelete} disabled={isDeleting}>
              {isDeleting ? (
                <ActivityIndicator size="small" color="#FF3B30" />
              ) : (
                <Ionicons name="trash-outline" size={24} color="#FF3B30" />
              )}
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={30} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Interactions (Optional for Story) */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.replyBtn}>
          <Text style={styles.replyText}>Send a partnership inquiry...</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push({ pathname: '/profile/[id]', params: { id: story.user_id } })}
        >
          <Ionicons name="business-outline" size={26} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  video: { width, height },
  progressContainer: {
    position: 'absolute',
    top: 40,
    left: 10,
    right: 10,
    height: 3,
    flexDirection: 'row',
    gap: 4,
  },
  progressBarBackground: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#fff',
  },
  header: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
  },
  placeholderAvatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: '#000', fontWeight: '900' },
  username: { color: '#fff', fontWeight: '800', fontSize: 14 },
  time: { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 2 },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  replyBtn: {
    flex: 1,
    height: 45,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  replyText: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
});
