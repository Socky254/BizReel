import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../src/lib/supabase';
import { useAuthStore } from '../../src/store/useAuthStore';
import { VibrantBackground } from '../../src/components/VibrantBackground';
import { decode } from 'base64-arraybuffer';

export default function EditProfileScreen() {
  const router = useRouter();
  const { session } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const [profile, setProfile] = useState({
    business_name: '',
    category: '',
    bio: '',
    location: '',
    working_hours: '',
    avatar_url: '',
  });

  useEffect(() => {
    if (session?.user?.id) {
      fetchProfile();
    }
  }, [session?.user?.id]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session?.user?.id)
        .single();

      if (data) {
        setProfile({
          business_name: data.business_name || '',
          category: data.category || '',
          bio: data.bio || '',
          location: data.location || '',
          working_hours: data.working_hours || '',
          avatar_url: data.avatar_url || '',
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      uploadAvatar(result.assets[0].base64);
    }
  };

  const uploadAvatar = async (base64: string) => {
    try {
      setUpdating(true);
      const filePath = `${session?.user?.id}/avatar_${Date.now()}.png`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, decode(base64), { contentType: 'image/png' });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from('avatars').getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', session?.user?.id);

      if (updateError) throw updateError;

      setProfile({ ...profile, avatar_url: publicUrl });
      Alert.alert('Success', 'Avatar updated!');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleSave = async () => {
    try {
      setUpdating(true);
      const { error } = await supabase
        .from('profiles')
        .update({
          business_name: profile.business_name,
          category: profile.category,
          bio: profile.bio,
          location: profile.location,
          working_hours: profile.working_hours,
        })
        .eq('id', session?.user?.id);

      if (error) throw error;
      Alert.alert('Success', 'Profile updated!');
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00D084" />
      </View>
    );
  }

  return (
    <VibrantBackground>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Edit Profile</Text>
          <TouchableOpacity onPress={handleSave} disabled={updating}>
            {updating ? (
              <ActivityIndicator color="#00D084" />
            ) : (
              <Text style={styles.saveBtnText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.avatarSection}>
            <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
              {profile.avatar_url ? (
                <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.placeholder]}>
                  <Ionicons name="camera" size={30} color="#555" />
                </View>
              )}
              <View style={styles.editBadge}>
                <Ionicons name="pencil" size={14} color="#fff" />
              </View>
            </TouchableOpacity>
            <Text style={styles.changeAvatarText}>Change Profile Picture</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Business Name</Text>
            <TextInput
              style={styles.input}
              value={profile.business_name}
              onChangeText={(text) => setProfile({ ...profile, business_name: text })}
              placeholder="Your Business Name"
              placeholderTextColor="#555"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Business Category</Text>
            <TextInput
              style={styles.input}
              value={profile.category}
              onChangeText={(text) => setProfile({ ...profile, category: text })}
              placeholder="e.g. Technology, Manufacturing, Retail"
              placeholderTextColor="#555"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={profile.bio}
              onChangeText={(text) => setProfile({ ...profile, bio: text })}
              placeholder="Professional summary..."
              placeholderTextColor="#555"
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Location</Text>
            <TextInput
              style={styles.input}
              value={profile.location}
              onChangeText={(text) => setProfile({ ...profile, location: text })}
              placeholder="e.g. Nairobi, Kenya"
              placeholderTextColor="#555"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Opening Hours</Text>
            <TextInput
              style={styles.input}
              value={profile.working_hours}
              onChangeText={(text) => setProfile({ ...profile, working_hours: text })}
              placeholder="e.g. Mon-Fri: 8am - 5pm"
              placeholderTextColor="#555"
            />
          </View>

          <View style={{ height: 50 }} />
        </ScrollView>
      </View>
    </VibrantBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#050508',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  title: { color: '#fff', fontSize: 18, fontWeight: '900' },
  saveBtnText: { color: '#D4AF37', fontSize: 16, fontWeight: '900' },
  content: { flex: 1, paddingHorizontal: 20 },
  avatarSection: { alignItems: 'center', marginVertical: 30 },
  avatarContainer: { width: 100, height: 100, position: 'relative' },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 2, borderColor: '#D4AF37' },
  placeholder: { backgroundColor: '#1C1C24', justifyContent: 'center', alignItems: 'center' },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#D4AF37',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000',
  },
  changeAvatarText: { color: '#D4AF37', fontSize: 14, fontWeight: '700', marginTop: 15 },
  inputGroup: { marginBottom: 25 },
  label: {
    color: '#555',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    marginBottom: 10,
    letterSpacing: 1,
  },
  input: {
    backgroundColor: '#0D0D12',
    borderRadius: 12,
    padding: 15,
    color: '#fff',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#1C1C24',
  },
  textArea: { height: 100, textAlignVertical: 'top' },
});
