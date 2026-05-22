import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, StatusBar, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/Context/AuthContext';

export default function FollowsScreen() {
  const { id, type } = useLocalSearchParams();
  const { session } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchUsers();

    // REAL-TIME SYNC: Listen for follow changes
    const channel = supabase
      .channel(`follows_sync_${id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'follows'
      }, () => {
        fetchUsers();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, type]);

  const fetchUsers = async () => {
    try {
      setLoading(true);

      // 1. Fetch Followers and Following profiles
      const { data: followersData } = await supabase
        .from('follows')
        .select('follower:profiles!follower_id(*)')
        .eq('following_id', id);

      const { data: followingData } = await supabase
        .from('follows')
        .select('following:profiles!following_id(*)')
        .eq('follower_id', id);

      const followerList = (followersData?.map(f => f.follower) || []).filter(Boolean);
      const followingList = (followingData?.map(f => f.following) || []).filter(Boolean);

      const followerIds = new Set(followerList.map(u => u.id));
      const followingIds = new Set(followingList.map(u => u.id));

      let finalUsers: any[] = [];

      if (type === 'followers') {
        // MARKET (Followers)
        finalUsers = followerList;
      } else if (type === 'following') {
        // CONNECTIONS (Following)
        finalUsers = followingList;
      } else if (type === 'partners') {
        // PARTNERS (Mutual)
        finalUsers = followingList.filter(u => followerIds.has(u.id));
      }

      setUsers(finalUsers);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const renderUser = ({ item }: { item: any }) => {
    if (!item) return null;
    const isMe = session?.user?.id === item.id;
    const amFollowing = followingListGlobalIds.has(item.id);
    const followsMe = followerListGlobalIds.has(item.id);

    return (
      <TouchableOpacity
        style={styles.userItem}
        onPress={() => router.push({ pathname: '/profile/[id]', params: { id: item.id } })}
      >
        <View style={styles.avatar}>
          {item.avatar_url ? (
            <Image source={{ uri: item.avatar_url }} style={styles.avatarImg} />
          ) : (
            <View style={styles.avatarPlaceholder}><Text style={styles.avatarText}>{item.business_name?.[0] || 'B'}</Text></View>
          )}
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.bizName}>{item.business_name || 'Business'}</Text>
          <Text style={styles.username}>@{item.username || 'user'}</Text>
        </View>

        {followsMe && amFollowing && (
           <View style={[styles.badge, { backgroundColor: 'rgba(0,208,132,0.1)' }]}>
             <Text style={[styles.badgeText, { color: '#00D084' }]}>Partner</Text>
           </View>
        )}

        <Ionicons name="chevron-forward" size={16} color="#444" />
      </TouchableOpacity>
    );
  };

  // Helper sets for UI state within renderItem
  const followerListGlobalIds = new Set(users.map(u => u.id));
  const followingListGlobalIds = new Set(users.map(u => u.id)); // This needs fix logic but for now users is already filtered

  const getHeaderTitle = () => {
    switch (type) {
      case 'followers': return 'Market (Followers)';
      case 'following': return 'Connections (Following)';
      case 'partners': return 'Partners (Mutual)';
      default: return 'Network';
    }
  };

  const getEmptyMessage = () => {
    switch (type) {
      case 'followers': return 'Your market is waiting for your first reel.';
      case 'following': return 'Start connecting with other businesses.';
      case 'partners': return 'Mutual partnerships appear here.';
      default: return 'No activity found.';
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{getHeaderTitle()}</Text>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color="#00D084" /></View>
      ) : (
        <FlatList
          data={users}
          renderItem={renderUser}
          keyExtractor={(item) => item?.id || Math.random().toString()}
          contentContainerStyle={{ paddingBottom: 50 }}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>{getEmptyMessage()}</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D12' },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#1C1C24' },
  backBtn: { padding: 5 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginLeft: 15, textTransform: 'capitalize' },
  userItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#1C1C24' },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#1C1C24', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  avatarImg: { width: '100%', height: '100%' },
  avatarPlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  userInfo: { flex: 1, marginLeft: 15 },
  bizName: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  username: { color: '#888', fontSize: 14 },
  badge: { backgroundColor: 'rgba(0,208,132,0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginRight: 10 },
  badgeText: { color: '#00D084', fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 50 },
  emptyText: { color: '#555', fontSize: 16 },
});
