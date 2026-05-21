import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { useAuth } from '../../src/Context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { VibrantBackground } from '../../src/components/VibrantBackground';
import { Alert, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../src/core/theme/colors';

export default function ChatScreen() {
  const { id, mode, postId } = useLocalSearchParams();
  const { session } = useAuth();
  const router = useRouter();

  const [messages, setMessages] = useState<any[]>([]);
  const [partner, setPartner] = useState<any>(null);
  const [post, setPost] = useState<any>(null);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (id && session?.user?.id) {
      fetchPartner();
      fetchMessages();
      if (postId) fetchPost();

      const subscription = supabase
        .channel(`chat:${id}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `sender_id=eq.${id},receiver_id=eq.${session.user.id}`
        }, (payload) => {
          setMessages(prev => [payload.new, ...prev]);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, [id]);

  const fetchPartner = async () => {
    const { data } = await supabase.from('profiles').select('*').eq('id', id).single();
    if (data) setPartner(data);
  };

  const fetchPost = async () => {
    const { data } = await supabase.from('posts').select('*').eq('id', postId).single();
    if (data) setPost(data);
  };

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${session?.user?.id},receiver_id.eq.${id}),and(sender_id.eq.${id},receiver_id.eq.${session?.user?.id})`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMessages(data || []);

      // Mark as read
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('sender_id', id)
        .eq('receiver_id', session?.user?.id)
        .eq('is_read', false);

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!text.trim() || sending) return;

    // LEADS MONETIZATION LOGIC: If first message and it's a DEAL mode, deduct credit
    if (messages.length === 0 && mode === 'DEAL') {
      const { data: profile } = await supabase.from('profiles').select('lead_credits, tier').eq('id', session?.user?.id).single();
      if (profile && profile.lead_credits <= 0 && profile.tier === 'BASIC') {
        Alert.alert("Lead Credits Empty", "You have used your 5 free business leads. Upgrade to PRO to unlock unlimited market connections.", [
          { text: "Upgrade to PRO", onPress: () => router.push('/profile/settings') },
          { text: "Cancel", style: 'cancel' }
        ]);
        return;
      }
      // Deduct credit
      await supabase.rpc('deduct_lead_credit', { u_id: session?.user?.id });
    }

    const messageText = text.trim();
    setText('');
    setSending(true);

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: session?.user?.id,
          receiver_id: id,
          text: messageText
        })
        .select()
        .single();

      if (error) throw error;
      setMessages(prev => [data, ...prev]);
    } catch (e) {
      Alert.alert("Error", "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  return (
    <VibrantBackground>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.partnerInfo} onPress={() => router.push({ pathname: '/profile/[id]', params: { id } })}>
            {partner?.avatar_url ? (
              <Image source={{ uri: partner.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={styles.placeholderAvatar}><Text style={styles.avatarText}>B</Text></View>
            )}
            <View>
              <Text style={styles.partnerName}>{partner?.business_name || 'Business Partner'}</Text>
              <Text style={styles.partnerStatus}>Online</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.headerIcon}>
            <Ionicons name="ellipsis-vertical" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {mode === 'DEAL' && post && (
          <View style={styles.dealContext}>
            <Image source={{ uri: post.video_url }} style={styles.dealThumbnail} />
            <View style={styles.dealInfo}>
              <Text style={styles.dealBadgeText}>SYNDICATE PROPOSAL</Text>
              <Text style={styles.dealTitle} numberOfLines={1}>{post.caption || 'Business Opportunity'}</Text>
            </View>
            <View style={styles.dealAction}>
               <Ionicons name="shield-checkmark" size={20} color={Colors.primary} />
            </View>
          </View>
        )}

        {loading ? (
          <View style={styles.center}><ActivityIndicator color="#00D084" /></View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            inverted
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const isMine = item.sender_id === session?.user?.id;
              return (
                <View style={[styles.messageBubble, isMine ? styles.myBubble : styles.theirBubble]}>
                  <Text style={[styles.messageText, isMine ? styles.myText : styles.theirText]}>
                    {item.text}
                  </Text>
                  <Text style={[styles.messageTime, isMine ? styles.myTime : styles.theirTime]}>
                    {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              );
            }}
            contentContainerStyle={styles.listContent}
          />
        )}

        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.attachBtn}>
            <Ionicons name="add" size={24} color="#555" />
          </TouchableOpacity>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Start a professional inquiry..."
              placeholderTextColor="#555"
              value={text}
              onChangeText={setText}
              multiline
            />
          </View>
          <TouchableOpacity
            style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!text.trim() || sending}
          >
            {sending ? <ActivityIndicator size="small" color="#000" /> : <Ionicons name="send" size={20} color="#000" />}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </VibrantBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 60, paddingHorizontal: 20, paddingBottom: 15, backgroundColor: 'rgba(0,0,0,0.3)', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  partnerInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', marginLeft: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: '#1C1C24' },
  placeholderAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1C1C24', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  partnerName: { color: '#fff', fontSize: 16, fontWeight: '800', marginLeft: 12 },
  partnerStatus: { color: '#00D084', fontSize: 11, fontWeight: '700', marginLeft: 12, marginTop: 2 },
  headerIcon: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 20, paddingBottom: 40 },
  messageBubble: { maxWidth: '80%', padding: 16, borderRadius: 24, marginBottom: 15 },
  myBubble: { alignSelf: 'flex-end', backgroundColor: '#00D084', borderBottomRightRadius: 4 },
  theirBubble: { alignSelf: 'flex-start', backgroundColor: '#1C1C24', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  messageText: { fontSize: 15, lineHeight: 20 },
  myText: { color: '#000', fontWeight: '500' },
  theirText: { color: '#eee', fontWeight: '500' },
  messageTime: { fontSize: 10, marginTop: 6, fontWeight: '600' },
  myTime: { color: 'rgba(0,0,0,0.4)', textAlign: 'right' },
  theirTime: { color: '#444' },
  inputContainer: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 15, paddingVertical: 15, backgroundColor: '#050508', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  attachBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  inputWrapper: { flex: 1, backgroundColor: '#111', borderRadius: 22, paddingHorizontal: 18, paddingVertical: 10, marginHorizontal: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  input: { color: '#fff', fontSize: 15, maxHeight: 100 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#00D084', justifyContent: 'center', alignItems: 'center', shadowColor: '#00D084', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  sendBtnDisabled: { backgroundColor: '#1C1C24', shadowOpacity: 0 },
  dealContext: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 208, 132, 0.1)',
    padding: 12,
    marginHorizontal: 20,
    marginTop: 15,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 208, 132, 0.2)'
  },
  dealThumbnail: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#000'
  },
  dealInfo: {
    flex: 1,
    marginLeft: 12
  },
  dealBadgeText: {
    color: '#00D084',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1
  },
  dealTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2
  },
  dealAction: {
    paddingLeft: 10
  }
});
