import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert, Dimensions, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Video, ResizeMode } from 'expo-av';
import { supabase } from '../../src/lib/supabase';
import { useAuthStore } from '../../src/store/useAuthStore';
import { Colors } from '../../src/core/theme/colors';

const { width } = Dimensions.get('window');

type UploadMode = 'SELECT' | 'POST_REEL' | 'START_LIVE';

export default function UploadScreen() {
  const { session, user } = useAuthStore();
  const router = useRouter();
  const [mode, setMode] = useState<UploadMode>('SELECT');
  const [video, setVideo] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [category, setCategory] = useState('');
  const [uploading, setUploading] = useState(false);
  const [liveTitle, setLiveTitle] = useState('');

  const pickVideo = async (useCamera: boolean = false) => {
    const permission = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permission.status !== 'granted') {
      Alert.alert("Permission Denied", "We need access to your camera/gallery to continue.");
      return;
    }

    const result = useCamera
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Videos,
          allowsEditing: true,
          aspect: [9, 16],
          quality: 1,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Videos,
          allowsEditing: true,
          aspect: [9, 16],
          quality: 1,
        });

    if (!result.canceled) {
      setVideo(result.assets[0].uri);
      setMode('POST_REEL');
    }
  };

  const handlePostReel = async () => {
    if (!video || !caption) {
      Alert.alert("Error", "Please add a caption to your reel.");
      return;
    }

    try {
      setUploading(true);
      const userId = user?.id;
      if (!userId) throw new Error("Not authenticated");

      // Use the modular architecture service style (ideally would be a UseCase)
      const filename = `${userId}/${Date.now()}.mp4`;

      const response = await fetch(video);
      const blob = await response.blob();

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('reels')
        .upload(filename, blob);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('reels')
        .getPublicUrl(filename);

      const { error: dbError } = await supabase.from('posts').insert({
        user_id: userId,
        video_url: publicUrl,
        caption: caption,
        category: category || 'General'
      });

      if (dbError) throw dbError;

      Alert.alert("Success", "Professional Reel Posted!", [
        { text: "OK", onPress: () => {
          setVideo(null);
          setMode('SELECT');
          router.replace('/(tabs)');
        }}
      ]);
    } catch (e: any) {
      Alert.alert("Upload Failed", e.message);
    } finally {
      setUploading(false);
    }
  };

  const handleStartLive = async () => {
    if (!liveTitle.trim()) {
      Alert.alert("Required", "Please give your session a title.");
      return;
    }

    try {
      setUploading(true);
      const { data: sessionId, error } = await supabase.rpc('start_live_session', {
        p_user_id: user?.id,
        p_title: liveTitle.trim()
      });

      if (error) throw error;

      router.push(`/live/${sessionId}`);
    } catch (e: any) {
      Alert.alert("Live Sync Failed", e.message);
    } finally {
      setUploading(false);
    }
  };

  if (mode === 'SELECT') {
    return (
      <View style={styles.selectionContainer}>
        <View style={styles.selHeader}>
            <Text style={styles.selTitle}>Create & Connect</Text>
            <Text style={styles.selSubtitle}>Engage your business partners in real-time</Text>
        </View>

        <View style={styles.optionsGrid}>
            <TouchableOpacity style={styles.optionCard} onPress={() => pickVideo(true)}>
                <View style={[styles.iconBox, { backgroundColor: 'rgba(0, 200, 83, 0.1)' }]}>
                    <Ionicons name="videocam" size={32} color={Colors.primary} />
                </View>
                <Text style={styles.optionLabel}>RECORD</Text>
                <Text style={styles.optionDesc}>Capture a fresh pitch</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.optionCard} onPress={() => pickVideo(false)}>
                <View style={[styles.iconBox, { backgroundColor: 'rgba(255, 255, 255, 0.05)' }]}>
                    <Ionicons name="cloud-upload" size={32} color="#fff" />
                </View>
                <Text style={styles.optionLabel}>UPLOAD</Text>
                <Text style={styles.optionDesc}>Select from gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.optionCard, styles.liveCard]} onPress={() => setMode('START_LIVE')}>
                <View style={[styles.iconBox, { backgroundColor: 'rgba(255, 59, 48, 0.1)' }]}>
                    <Ionicons name="radio" size={32} color="#FF3B30" />
                </View>
                <Text style={styles.optionLabel}>GO LIVE</Text>
                <Text style={styles.optionDesc}>Start live commerce</Text>
            </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => { setMode('SELECT'); setVideo(null); }}>
            <Ionicons name="arrow-back" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>{mode === 'POST_REEL' ? 'New Reel' : 'Live Setup'}</Text>
          <TouchableOpacity
            onPress={mode === 'POST_REEL' ? handlePostReel : handleStartLive}
            disabled={uploading}
          >
             {uploading ? <ActivityIndicator color={Colors.primary} /> : <Text style={styles.postBtn}>{mode === 'POST_REEL' ? 'POST' : 'START'}</Text>}
          </TouchableOpacity>
        </View>

        {mode === 'POST_REEL' ? (
          <>
            <View style={styles.videoPreviewContainer}>
                {video && (
                    <Video
                        source={{ uri: video }}
                        style={styles.previewVideo}
                        resizeMode={ResizeMode.COVER}
                        shouldPlay
                        isLooping
                        isMuted
                    />
                )}
            </View>
            <View style={styles.inputArea}>
                <Text style={styles.label}>Business Caption</Text>
                <TextInput
                    style={styles.captionInput}
                    placeholder="Tell your partners about this..."
                    placeholderTextColor={Colors.textTertiary}
                    multiline
                    value={caption}
                    onChangeText={setCaption}
                />
                <Text style={styles.label}>Market Category</Text>
                <TextInput
                    style={styles.categoryInput}
                    placeholder="e.g. Services, Manufacturing"
                    placeholderTextColor={Colors.textTertiary}
                    value={category}
                    onChangeText={setCategory}
                />
            </View>
          </>
        ) : (
          <View style={styles.liveForm}>
             <View style={styles.liveIconBox}>
                 <Ionicons name="pulse" size={60} color={Colors.primary} />
             </View>
             <Text style={styles.liveTitle}>Go Live Instantly</Text>
             <Text style={styles.liveDesc}>Notify all your connections and start your business broadcast.</Text>

             <TextInput
                style={styles.liveInput}
                placeholder="Live Session Title (e.g. New Product Launch)"
                placeholderTextColor={Colors.textTertiary}
                value={liveTitle}
                onChangeText={setLiveTitle}
             />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  selectionContainer: { flex: 1, backgroundColor: Colors.background, justifyContent: 'center', padding: 25 },
  selHeader: { marginBottom: 40 },
  selTitle: { color: Colors.textPrimary, fontSize: 32, fontWeight: '900' },
  selSubtitle: { color: Colors.primary, fontSize: 14, fontWeight: '700', marginTop: 8 },
  optionsGrid: { gap: 15 },
  optionCard: { backgroundColor: Colors.surface, padding: 20, borderRadius: 24, borderWidth: 1, borderColor: Colors.border, flexDirection: 'row', alignItems: 'center' },
  liveCard: { borderColor: 'rgba(255, 59, 48, 0.3)' },
  iconBox: { width: 64, height: 64, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 20 },
  optionLabel: { color: Colors.textPrimary, fontSize: 18, fontWeight: '900', letterSpacing: 1 },
  optionDesc: { color: Colors.textSecondary, fontSize: 12, marginTop: 4, position: 'absolute', left: 104, bottom: 20 },
  mainContainer: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingBottom: 50 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingHorizontal: 20, marginBottom: 20 },
  title: { color: Colors.textPrimary, fontSize: 20, fontWeight: '900' },
  postBtn: { color: Colors.primary, fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  videoPreviewContainer: { width: width - 40, aspectRatio: 9/16, backgroundColor: Colors.surface, marginHorizontal: 20, borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border },
  previewVideo: { flex: 1 },
  inputArea: { padding: 20 },
  label: { color: Colors.textTertiary, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', marginBottom: 10, letterSpacing: 1 },
  captionInput: { backgroundColor: Colors.surface, borderRadius: 18, padding: 18, color: Colors.textPrimary, fontSize: 15, height: 120, textAlignVertical: 'top', borderWidth: 1, borderColor: Colors.border, marginBottom: 20 },
  categoryInput: { backgroundColor: Colors.surface, borderRadius: 18, padding: 18, color: Colors.textPrimary, fontSize: 15, borderWidth: 1, borderColor: Colors.border },
  liveForm: { padding: 40, alignItems: 'center' },
  liveIconBox: { width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(0, 200, 83, 0.05)', justifyContent: 'center', alignItems: 'center', marginBottom: 30 },
  liveTitle: { color: Colors.textPrimary, fontSize: 24, fontWeight: '900', textAlign: 'center' },
  liveDesc: { color: Colors.textSecondary, fontSize: 14, textAlign: 'center', marginTop: 10, lineHeight: 22 },
  liveInput: { width: '100%', backgroundColor: Colors.surface, borderRadius: 18, padding: 20, color: Colors.textPrimary, fontSize: 16, borderWidth: 1, borderColor: Colors.border, marginTop: 40, textAlign: 'center' }
});
