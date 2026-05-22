import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Text,
  TouchableOpacity,
  StatusBar,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '../../../core/theme/colors';
import { supabase } from '../../../lib/supabase';
import { LiveSession, LiveComment } from '../../../domain/models/live';
import { LiveProductOverlay } from '../components/LiveProductOverlay';
import { LiveCommentSection } from '../components/LiveCommentSection';
import { useCartStore } from '../../../store/useCartStore';
import { useAuthStore } from '../../../store/useAuthStore';

const { height, width } = Dimensions.get('window');

export const LivestreamScreen = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const { addItem } = useCartStore();

  const [session, setSession] = useState<LiveSession | null>(null);
  const [comments, setComments] = useState<LiveComment[]>([]);
  const [pinnedProduct, setPinnedProduct] = useState<any>(null);
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    fetchSession();
    const commentCleanup = subscribeToComments();
    const productCleanup = subscribeToPinnedProducts();
    return () => {
      commentCleanup();
      productCleanup();
    };
  }, [id]);

  const fetchSession = async () => {
    const { data } = await supabase
      .from('live_sessions')
      .select('*, profiles(business_name, avatar_url)')
      .eq('id', id)
      .single();
    if (data) setSession(data);
  };

  const subscribeToComments = () => {
    const channel = supabase
      .channel(`live_comments:${id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'live_comments',
          filter: `session_id=eq.${id}`,
        },
        async (payload) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, avatar_url')
            .eq('id', payload.new.user_id)
            .single();

          const newComment: LiveComment = {
            ...(payload.new as any),
            profiles: profile,
          };
          setComments((prev) => [newComment, ...prev]);
        },
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  };

  const subscribeToPinnedProducts = () => {
    const channel = supabase
      .channel(`live_products:${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'live_products',
          filter: `session_id=eq.${id}`,
        },
        fetchPinnedProduct,
      )
      .subscribe();

    fetchPinnedProduct();
    return () => supabase.removeChannel(channel);
  };

  const fetchPinnedProduct = async () => {
    const { data } = await supabase
      .from('live_products')
      .select('*, products(*)')
      .eq('session_id', id)
      .eq('is_pinned', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) setPinnedProduct(data.products);
    else setPinnedProduct(null);
  };

  const handleSendComment = async () => {
    if (!commentText.trim() || !user) return;
    await supabase.from('live_comments').insert({
      session_id: id,
      user_id: user.id,
      content: commentText.trim(),
    });
    setCommentText('');
  };

  const handleAddToCart = async (product: any) => {
    if (!user) {
      Alert.alert('Authentication Required', 'Please sign in to add items to your cart.');
      return;
    }
    await addItem(user.id, product.id);
    Alert.alert('Added to Cart', `${product.name} has been added to your cart.`);
  };

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      {session?.playback_url ? (
        <Video
          source={{ uri: session.playback_url }}
          style={styles.fullVideo}
          resizeMode={ResizeMode.COVER}
          shouldPlay
          isLooping
        />
      ) : (
        <View style={[styles.fullVideo, styles.placeholder]}>
          <Ionicons name="videocam-off" size={48} color={Colors.surfaceElevated} />
          <Text style={styles.placeholderText}>Connecting to stream...</Text>
        </View>
      )}

      <View style={styles.topBar}>
        <View style={styles.bizInfo}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.bizAvatar}>
            <Ionicons name="business" size={20} color={Colors.primary} />
          </View>
          <View>
            <Text style={styles.bizName}>{session?.profiles?.business_name || 'Business'}</Text>
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          </View>
        </View>
        <View style={styles.viewerBadge}>
          <Ionicons name="eye" size={14} color="#fff" />
          <Text style={styles.viewerText}>{session?.viewer_count || 0}</Text>
        </View>
      </View>

      <View style={styles.sideActions}>
        <TouchableOpacity style={styles.actionBtn}>
          <Ionicons name="heart" size={30} color={Colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Ionicons name="share-social" size={28} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/cart')}>
          <Ionicons name="cart-outline" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      <LiveProductOverlay
        product={pinnedProduct}
        onClose={() => setPinnedProduct(null)}
        onAddToCart={handleAddToCart}
      />

      <LiveCommentSection comments={comments} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.bottomArea}
      >
        <View style={styles.inputBox}>
          <TextInput
            style={styles.input}
            placeholder="Say something..."
            placeholderTextColor="rgba(255,255,255,0.6)"
            value={commentText}
            onChangeText={setCommentText}
            onSubmitEditing={handleSendComment}
          />
          <TouchableOpacity onPress={handleSendComment}>
            <Ionicons name="send" size={20} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  fullVideo: { ...StyleSheet.absoluteFillObject },
  placeholder: { justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' },
  placeholderText: { color: Colors.textTertiary, marginTop: 10, fontSize: 12, fontWeight: '700' },
  topBar: {
    position: 'absolute',
    top: 50,
    left: 15,
    right: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  bizInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  backBtn: { marginRight: 5 },
  bizAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bizName: { color: '#fff', fontWeight: '800', fontSize: 14 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FF3B30' },
  liveText: { color: '#FF3B30', fontSize: 10, fontWeight: '900' },
  viewerBadge: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  viewerText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  sideActions: { position: 'absolute', right: 15, bottom: 200, gap: 20, alignItems: 'center' },
  actionBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomArea: { position: 'absolute', bottom: 30, left: 15, right: 15, zIndex: 20 },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 25,
    paddingHorizontal: 15,
    height: 50,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  input: { flex: 1, color: '#fff', fontSize: 14 },
});
