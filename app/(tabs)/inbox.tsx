import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { supabase } from '../../src/lib/supabase';
import { useAuth } from '../../src/Context/AuthContext';
import { VibrantBackground } from '../../src/components/VibrantBackground';

export default function InboxScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'NOTIFICATIONS' | 'MESSAGES'>('NOTIFICATIONS');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (session?.user?.id) {
      fetchData();

      // REAL-TIME NOTIFICATION & MESSAGE ENGINE
      const notificationsSub = supabase
        .channel('inbox-activities')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `receiver_id=eq.${session.user.id}`
        }, (payload) => {
          handleNewActivity(payload.new);
        })
        .subscribe();

      const messagesSub = supabase
        .channel('inbox-messages')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${session.user.id}`
        }, () => {
          fetchMessages(); // Refresh message list on any new message
        })
        .subscribe();

      return () => {
        supabase.removeChannel(notificationsSub);
        supabase.removeChannel(messagesSub);
      };
    }
  }, [session?.user?.id]);

  const handleNewActivity = async (newNotification: any) => {
    // Fetch sender profile for the new notification
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', newNotification.sender_id)
      .single();

    const notificationWithSender = { ...newNotification, sender: data };
    setNotifications(prev => [notificationWithSender, ...prev]);
  };

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchNotifications(), fetchMessages()]);
    setLoading(false);
  };

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*, sender:profiles!notifications_sender_id_fkey(*)')
        .eq('receiver_id', session?.user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchMessages = async () => {
    try {
      // Fetch latest messages for each conversation
      const { data, error } = await supabase.rpc('get_conversation_list', { u_id: session?.user?.id });
      if (error) throw error;
      setMessages(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const renderNotification = ({ item }: any) => {
    const getIcon = () => {
      switch (item.type) {
        case 'like': return { name: 'heart', color: '#FF3B30' };
        case 'comment': return { name: 'chatbubble', color: '#00D084' };
        case 'follow': return { name: 'person-add', color: '#007AFF' };
        case 'partner_connection': return { name: 'hand-left', color: '#00D084' };
        case 'referral': return { name: 'share-social', color: '#FF9500' };
        case 'save': return { name: 'bookmark', color: '#5856D6' };
        case 'analytics': return { name: 'stats-chart', color: '#00D084' };
        case 'new_review': return { name: 'star', color: '#FFCC00' };
        default: return { name: 'notifications', color: '#fff' };
      }
    };

    const icon = getIcon();

    return (
      <TouchableOpacity
        style={[styles.item, !item.is_read && styles.unreadItem]}
        onPress={async () => {
          if (!item.is_read) {
            await supabase.from('notifications').update({ is_read: true }).eq('id', item.id);
            setNotifications(notifications.map(n => n.id === item.id ? { ...n, is_read: true } : n));
          }
          if (item.post_id) router.push({ pathname: '/(tabs)', params: { initialPost: item.post_id } });
          else if (item.type === 'follow' || item.type === 'partner_connection') router.push({ pathname: '/profile/[id]', params: { id: item.sender_id } });
        }}
      >
        <View style={styles.avatarContainer}>
          {item.sender?.avatar_url ? (
            <Image source={{ uri: item.sender.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.placeholderAvatar}><Text style={styles.avatarText}>B</Text></View>
          )}
          <View style={[styles.typeIcon, { backgroundColor: icon.color }]}>
            <Ionicons name={icon.name as any} size={10} color="#fff" />
          </View>
        </View>
        <View style={styles.itemInfo}>
          <Text style={styles.itemTitle} numberOfLines={2}>
            {item.type === 'analytics' ? (
              <Text style={styles.bold}>System Milestone: </Text>
            ) : (
              <Text style={styles.bold}>{item.sender?.business_name || 'A partner'}</Text>
            )}

            {item.type === 'like' && ' liked your reel.'}
            {item.type === 'comment' && ' commented on your reel.'}
            {item.type === 'follow' && ' started following your business.'}
            {item.type === 'partner_connection' && ' is now a verified Partner!'}
            {item.type === 'referral' && ' shared your profile with their network.'}
            {item.type === 'save' && ' bookmarked your reel.'}
            {item.type === 'analytics' && ` Your reel reached ${item.metadata?.milestone || 'a new'} view milestone!`}
            {item.type === 'new_review' && ' left a trust score review on your profile.'}
          </Text>
          <Text style={styles.itemTime}>{new Date(item.created_at).toLocaleDateString()}</Text>
        </View>
        {!item.is_read && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  const renderMessage = ({ item }: any) => (
    <TouchableOpacity style={styles.item} onPress={() => router.push({ pathname: '/chat/[id]', params: { id: item.other_user_id } })}>
      <View style={styles.avatarContainer}>
        {item.other_avatar_url ? (
          <Image source={{ uri: item.other_avatar_url }} style={styles.avatar} />
        ) : (
          <View style={styles.placeholderAvatar}><Text style={styles.avatarText}>B</Text></View>
        )}
        {item.unread_count > 0 && <View style={styles.unreadBadge} />}
      </View>
      <View style={styles.itemInfo}>
        <View style={styles.row}>
          <Text style={styles.itemTitle} numberOfLines={1}>{item.other_business_name || 'User'}</Text>
          <Text style={styles.itemTime}>{new Date(item.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
        </View>
        <Text style={[styles.itemSubtitle, item.unread_count > 0 && styles.unreadText]} numberOfLines={1}>
          {item.last_message_text}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <VibrantBackground>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Inbox</Text>
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'NOTIFICATIONS' && styles.activeTab]}
              onPress={() => setActiveTab('NOTIFICATIONS')}
            >
              <Text style={[styles.tabText, activeTab === 'NOTIFICATIONS' && styles.activeTabText]}>Activities</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'MESSAGES' && styles.activeTab]}
              onPress={() => setActiveTab('MESSAGES')}
            >
              <Text style={[styles.tabText, activeTab === 'MESSAGES' && styles.activeTabText]}>Messages</Text>
            </TouchableOpacity>
          </View>
        </View>

        {loading && !refreshing ? (
          <ActivityIndicator color="#00D084" style={{ marginTop: 50 }} />
        ) : (
          <FlatList
            data={activeTab === 'NOTIFICATIONS' ? notifications : messages}
            keyExtractor={(item) => item.id || item.other_user_id}
            renderItem={activeTab === 'NOTIFICATIONS' ? renderNotification : renderMessage}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00D084" />}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="mail-open-outline" size={60} color="#1C1C24" />
                <Text style={styles.emptyText}>Nothing here yet.</Text>
              </View>
            }
            contentContainerStyle={{ paddingBottom: 100 }}
          />
        )}
      </View>
    </VibrantBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 60, paddingHorizontal: 20, backgroundColor: 'transparent', paddingBottom: 15 },
  title: { color: '#fff', fontSize: 28, fontWeight: '900', letterSpacing: -1, marginBottom: 25 },
  tabContainer: { flexDirection: 'row', gap: 25, marginBottom: 5 },
  tab: { paddingBottom: 12 },
  activeTab: { borderBottomWidth: 3, borderBottomColor: '#00D084' },
  tabText: { color: '#444', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
  activeTabText: { color: '#fff' },
  unreadItem: { backgroundColor: 'rgba(0,208,132,0.06)', borderColor: 'rgba(0,208,132,0.15)' },
  unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#00D084', marginLeft: 12 },
  item: { flexDirection: 'row', alignItems: 'center', padding: 18, marginHorizontal: 15, marginVertical: 4, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.02)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  avatarContainer: { position: 'relative' },
  avatar: { width: 56, height: 56, borderRadius: 28, borderWidth: 1, borderColor: '#1C1C24' },
  placeholderAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#1C1C24', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  typeIcon: { position: 'absolute', bottom: -2, right: -2, width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#050508' },
  unreadBadge: { position: 'absolute', top: 0, right: 0, width: 14, height: 14, borderRadius: 7, backgroundColor: '#00D084', borderWidth: 2, borderColor: '#050508' },
  itemInfo: { flex: 1, marginLeft: 18 },
  itemTitle: { color: '#ccc', fontSize: 14, lineHeight: 22 },
  itemSubtitle: { color: '#666', fontSize: 14, marginTop: 4, fontWeight: '500' },
  unreadText: { color: '#fff', fontWeight: '800' },
  bold: { fontWeight: '900', color: '#fff' },
  itemTime: { color: '#333', fontSize: 12, fontWeight: '700', marginTop: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  emptyContainer: { alignItems: 'center', marginTop: 120 },
  emptyText: { color: '#222', fontSize: 18, fontWeight: '800', marginTop: 25 }
});
