import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions, ActivityIndicator, RefreshControl, StatusBar, TouchableOpacity, Pressable } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { supabase } from '../../lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../Context/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { height, width } = Dimensions.get('window');
const TAB_BAR_HEIGHT = 60;
const FEED_HEIGHT = height - TAB_BAR_HEIGHT;

type FeedType = 'FOR_YOU' | 'FOLLOWING' | 'EXPLORE';

const ReelItem = ({ item }: { item: any }) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const videoRef = useRef<Video>(null);

  const togglePlayPause = () => {
    if (isPlaying) {
      videoRef.current?.pauseAsync();
    } else {
      videoRef.current?.playAsync();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <Pressable onPress={togglePlayPause} style={[styles.reelContainer, { height: FEED_HEIGHT }]}>
      <Video
        ref={videoRef}
        style={styles.video}
        source={{ uri: item.video_url }}
        resizeMode={ResizeMode.COVER}
        shouldPlay={isPlaying}
        isLooping
        onError={(e) => console.log('Video error:', e)}
      />

      {!isPlaying && (
        <View style={styles.playOverlay}>
          <Ionicons name="play" size={80} color="rgba(255,255,255,0.6)" />
        </View>
      )}

      <View style={styles.sideActions}>
        <TouchableOpacity style={styles.actionBtn}>
          <Ionicons name="heart" size={35} color="#fff" />
          <Text style={styles.actionText}>Like</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Ionicons name="chatbubble-ellipses" size={32} color="#fff" />
          <Text style={styles.actionText}>Chat</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomInfo}>
        <View style={styles.userRow}>
          <View style={styles.avatarCircle}>
             <Text style={{color: '#fff', fontSize: 10}}>{(item.profiles?.business_name || 'B')[0]}</Text>
          </View>
          <Text style={styles.username}>@{item.profiles?.username || 'biz_user'}</Text>
        </View>
        <Text style={styles.caption}>{item.caption || 'BizReel Showcase'}</Text>
        {item.profiles?.category && (
           <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{item.profiles.category}</Text>
           </View>
        )}
      </View>
    </Pressable>
  );
};

export default function FeedScreen() {
  const [reels, setReels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<FeedType>('FOR_YOU');
  const { session } = useAuth();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    fetchReels();
  }, [activeTab]);

  const fetchReels = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('posts')
        .select('*, profiles(username, business_name, category)');

      // Simple Algorithmic logic
      if (activeTab === 'FOR_YOU') {
        // Shuffle or pick trending (simulated by random order in SQL if we had it, but for now just latest)
        query = query.order('created_at', { ascending: false });
      } else if (activeTab === 'FOLLOWING') {
        // Only show posts from users the current user follows
        // Note: Requires a 'follows' table. Defaulting to recent for now.
        query = query.order('created_at', { ascending: false });
      } else if (activeTab === 'EXPLORE') {
        // Could filter by categories the user hasn't seen
        query = query.order('created_at', { ascending: true });
      }

      const { data, error } = await query.limit(10);

      if (error) throw error;
      setReels(data || []);
    } catch (err: any) {
      console.error('Fetch Error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const TabItem = ({ title, type }: { title: string, type: FeedType }) => (
    <TouchableOpacity onPress={() => setActiveTab(type)} style={styles.tabItem}>
      <Text style={[styles.tabText, activeTab === type && styles.tabTextActive]}>{title}</Text>
      {activeTab === type && <View style={styles.tabIndicator} />}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent />

      {/* Top Navigation Tabs */}
      <View style={[styles.topTabs, { paddingTop: insets.top + 10 }]}>
        <TabItem title="Following" type="FOLLOWING" />
        <TabItem title="For You" type="FOR_YOU" />
        <TabItem title="Explore" type="EXPLORE" />
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00D084" />
        </View>
      ) : (
        <FlatList
          data={reels}
          renderItem={({ item }) => <ReelItem item={item} />}
          keyExtractor={(item) => item.id.toString()}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          snapToInterval={FEED_HEIGHT}
          snapToAlignment="start"
          decelerationRate="fast"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchReels(); }} tintColor="#00D084" />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  topTabs: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    zIndex: 10,
    backgroundColor: 'transparent',
  },
  tabItem: {
    marginHorizontal: 15,
    alignItems: 'center',
  },
  tabText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 16,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  tabTextActive: {
    color: '#fff',
  },
  tabIndicator: {
    height: 3,
    width: 25,
    backgroundColor: '#00D084',
    marginTop: 5,
    borderRadius: 2,
  },
  reelContainer: { width: width, backgroundColor: '#111' },
  video: { flex: 1 },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  sideActions: { position: 'absolute', right: 15, bottom: 120, alignItems: 'center' },
  actionBtn: { alignItems: 'center', marginBottom: 20 },
  actionText: { color: '#fff', fontSize: 12, marginTop: 4, fontWeight: '600' },
  bottomInfo: { position: 'absolute', bottom: 30, left: 15, right: 80 },
  userRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  avatarCircle: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#333', borderWidth: 1, borderColor: '#00D084', justifyContent: 'center', alignItems: 'center' },
  username: { color: '#fff', fontWeight: 'bold', fontSize: 16, marginLeft: 10 },
  caption: { color: '#fff', fontSize: 14, textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2 },
  categoryBadge: { alignSelf: 'flex-start', backgroundColor: 'rgba(0,208,132,0.2)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginTop: 8, borderWidth: 0.5, borderColor: '#00D084' },
  categoryText: { color: '#00D084', fontSize: 11, fontWeight: 'bold' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  refreshBtn: { marginTop: 20, padding: 10, backgroundColor: '#111', borderRadius: 10 },
});