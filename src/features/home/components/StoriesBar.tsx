import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { container } from '../../../di/Container';
import { Story } from '../../../domain/models';
import { Colors } from '../../../core/theme/colors';
import { useAuthStore } from '../../../store/useAuthStore';
import { useRouter } from 'expo-router';

export const StoriesBar = () => {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    loadStories();
  }, []);

  const loadStories = async () => {
    try {
      const data = await container.getStoriesUseCase.execute(user?.id);
      setStories(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const renderStoryItem = ({ item }: { item: Story }) => (
    <TouchableOpacity
      style={styles.storyContainer}
      onPress={() => router.push({ pathname: '/stories/[id]' as any, params: { id: item.id } })}
    >
      <View style={styles.avatarCircle}>
        {item.profiles?.avatar_url ? (
          <Image source={{ uri: item.profiles.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={styles.placeholderAvatar}>
            <Text style={styles.avatarText}>{(item.profiles?.business_name || 'B').charAt(0)}</Text>
          </View>
        )}
        {item.profiles?.is_verified && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={14} color={Colors.primary} />
          </View>
        )}
      </View>
      <Text style={styles.username} numberOfLines={1}>
        {item.profiles?.business_name || item.profiles?.username || 'Partner'}
      </Text>
    </TouchableOpacity>
  );

  if (loading && stories.length === 0) return null;

  return (
    <View style={styles.container}>
      <FlatList
        data={stories}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        renderItem={renderStoryItem}
        ListHeaderComponent={
          user ? (
            <TouchableOpacity
              style={styles.addStoryBtn}
              onPress={() => router.push('/(tabs)/upload')}
            >
              <View style={styles.addIconContainer}>
                <Ionicons name="add" size={24} color="#000" />
              </View>
              <Text style={styles.username}>Add Story</Text>
            </TouchableOpacity>
          ) : null
        }
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 110,
    backgroundColor: 'transparent',
    paddingVertical: 10,
    zIndex: 20,
  },
  listContent: {
    paddingHorizontal: 15,
    alignItems: 'center',
  },
  storyContainer: {
    alignItems: 'center',
    marginHorizontal: 8,
    width: 70,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: Colors.primary,
    padding: 2,
    marginBottom: 6,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  placeholderAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#000',
    borderRadius: 10,
    padding: 1,
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
  },
  username: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    width: '100%',
    textAlign: 'center',
  },
  addStoryBtn: {
    alignItems: 'center',
    marginRight: 15,
    width: 70,
  },
  addIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
});
