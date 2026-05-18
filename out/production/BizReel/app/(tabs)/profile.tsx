import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, StatusBar, FlatList, Dimensions, ActivityIndicator, Modal, TextInput } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../Context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = width / 3;

export default function ProfileScreen() {
  const { session } = useAuth();
  const [reels, setReels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    fetchProfileAndReels();
  }, []);

  const fetchProfileAndReels = async () => {
    try {
      if (!session?.user) return;
      setLoading(true);

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      setProfile(profileData);

      const { data: reelsData } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      setReels(reelsData || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert("Logout", "Sign out of BizReel?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: () => supabase.auth.signOut() }
    ]);
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity style={styles.settingsBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
      </TouchableOpacity>

      <View style={styles.avatar}>
        <Text style={styles.avatarInitial}>
          {profile?.business_name?.[0]?.toUpperCase() || profile?.username?.[0]?.toUpperCase() || session?.user?.email?.[0]?.toUpperCase()}
        </Text>
      </View>

      <Text style={styles.businessNameText}>{profile?.business_name || 'Business Name'}</Text>
      <Text style={styles.usernameText}>@{profile?.username || 'username'}</Text>

      <View style={styles.categoryBadge}>
        <Text style={styles.categoryText}>{profile?.category || 'General'}</Text>
      </View>

      {profile?.location && (
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={14} color="#888" />
          <Text style={styles.locationText}>{profile.location}</Text>
        </View>
      )}

      <Text style={styles.bioText}>{profile?.bio || 'No bio provided.'}</Text>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{reels.length}</Text>
          <Text style={styles.statLabel}>Reels</Text>
        </View>
        <View style={[styles.statItem, styles.statBorder]}>
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>Followers</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>Following</Text>
        </View>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.editBtn} onPress={() => router.push('/onboarding')}>
          <Text style={styles.editBtnText}>Edit Business Info</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.contentTabs}>
        <TouchableOpacity style={styles.tab}><Ionicons name="grid-outline" size={24} color="#00D084" /></TouchableOpacity>
        <TouchableOpacity style={styles.tab}><Ionicons name="bookmark-outline" size={24} color="#888" /></TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <FlatList
        data={reels}
        renderItem={({ item }) => (
          <View style={styles.gridItem}>
            <Video source={{ uri: item.video_url }} style={styles.gridVideo} resizeMode={ResizeMode.COVER} shouldPlay={false} isMuted={true} />
          </View>
        )}
        keyExtractor={(item) => item.id}
        numColumns={3}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      {loading && <View style={styles.loadingOverlay}><ActivityIndicator color="#00D084" size="large" /></View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { alignItems: 'center', paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20 },
  settingsBtn: { position: 'absolute', top: 50, right: 20, padding: 10 },
  avatar: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#1C1C1E', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#00D084', marginBottom: 15 },
  avatarInitial: { color: '#fff', fontSize: 36, fontWeight: 'bold' },
  businessNameText: { color: '#fff', fontSize: 22, fontWeight: 'bold', textAlign: 'center' },
  usernameText: { color: '#00D084', fontSize: 16, fontWeight: '600', marginTop: 2 },
  categoryBadge: { backgroundColor: '#121212', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginTop: 10, borderWidth: 1, borderColor: '#222' },
  categoryText: { color: '#888', fontSize: 12, fontWeight: 'bold' },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  locationText: { color: '#888', fontSize: 13, marginLeft: 4 },
  bioText: { color: '#ccc', fontSize: 14, marginTop: 12, textAlign: 'center', lineHeight: 20 },
  statsRow: { flexDirection: 'row', marginTop: 25, width: '100%' },
  statItem: { alignItems: 'center', flex: 1 },
  statBorder: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#222' },
  statNumber: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
  statLabel: { color: '#888', fontSize: 11, marginTop: 2 },
  actionRow: { marginTop: 25, width: '100%' },
  editBtn: { backgroundColor: '#1C1C1E', height: 40, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  editBtnText: { color: '#fff', fontWeight: 'bold' },
  contentTabs: { flexDirection: 'row', height: 45, borderTopWidth: 1, borderTopColor: '#121212', marginTop: 20, width: '100%' },
  tab: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  gridItem: { width: COLUMN_WIDTH, aspectRatio: 3/4, padding: 1 },
  gridVideo: { flex: 1, backgroundColor: '#111' },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
});