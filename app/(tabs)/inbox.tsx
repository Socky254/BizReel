import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { supabase } from '../../src/lib/supabase';
import { useAuth } from '../../src/Context/AuthContext';

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
        case 'order_paid': return { name: 'cash', color: '#00D084' };
        case 'live_started': return { name: 'radio', color: '#FF3B30' };
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
          else if (item.type === 'order_paid') router.push('/profile/dashboard');
          else if (item.type === 'live_started') router.push('/(tabs)'); // Or to the specific live room if you have the ID
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
            {item.type === 'order_paid' && ' completed a payment for their order!'}
            {item.type === 'live_started' && ' is now LIVE! Join the commerce session.'}
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
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Inbox</Text>
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'NOTIFICATIONS' && styles.activeTab]}
              onPress={() => setActiveTab('NOTIFICATIONS')}
            >
              <Text style={[styles.tabText, activeTab === 'NOTIFICATIONS' && styles.activeTabText]}>Market Signals</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'MESSAGES' && styles.activeTab]}
              onPress={() => setActiveTab('MESSAGES')}
            >
              <Text style={[styles.tabText, activeTab === 'MESSAGES' && styles.activeTabText]}>Executive Comms</Text>
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
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050508' },
  header: { paddingTop: 60, paddingHorizontal: 25, backgroundColor: 'transparent', paddingBottom: 20 },
  title: { color: '#fff', fontSize: 32, fontWeight: '900', letterSpacing: -1.5, marginBottom: 25 },
  tabContainer: { flexDirection: 'row', gap: 30 },
  tab: { paddingBottom: 15 },
  activeTab: { borderBottomWidth: 2, borderBottomColor: '#00D084' },
  tabText: { color: 'rgba(255,255,255,0.2)', fontSize: 13, fontWeight: '900', letterSpacing: 1.5, textTransform: 'uppercase' },
  activeTabText: { color: '#fff' },
  unreadItem: { backgroundColor: 'rgba(0,208,132,0.03)', borderColor: 'rgba(0,208,132,0.1)' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#00D084' },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 22,
    marginHorizontal: 15,
    marginVertical: 8,
    borderRadius: 24,
    backgroundColor: '#0E0E14',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 3
  },
  avatarContainer: { position: 'relative' },
  avatar: { width: 52, height: 52, borderRadius: 18, borderWidth: 1, borderColor: '#111' },
  placeholderAvatar: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: '#080808',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)'
  },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: '900' },
  typeIcon: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000'
  },
  unreadBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#00D084',
    borderWidth: 2,
    borderColor: '#000'
  },
  itemInfo: { flex: 1, marginLeft: 15 },
  itemTitle: { color: 'rgba(255,255,255,0.5)', fontSize: 14, lineHeight: 22 },
  itemSubtitle: { color: 'rgba(255,255,255,0.3)', fontSize: 13, marginTop: 4, fontWeight: '500' },
  unreadText: { color: '#fff', fontWeight: '800' },
  bold: { fontWeight: '900', color: '#fff' },
  itemTime: { color: 'rgba(255,255,255,0.2)', fontSize: 10, fontWeight: '800', textTransform: 'uppercase', marginTop: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  emptyContainer: { alignItems: 'center', marginTop: 120, padding: 40 },
  emptyText: { color: 'rgba(255,255,255,0.1)', fontSize: 14, fontWeight: '900', marginTop: 20, textTransform: 'uppercase', letterSpacing: 2 }
});

