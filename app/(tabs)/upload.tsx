import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Video, ResizeMode } from 'expo-av';
import { useAuthStore } from '../../src/store/useAuthStore';
import { Colors } from '../../src/core/theme/colors';
import { UploadService } from '../../src/features/upload/services/UploadService';

const { width } = Dimensions.get('window');

type UploadMode = 'SELECT' | 'POST_REEL' | 'POST_STORY' | 'START_LIVE';

export default function UploadScreen() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [mode, setMode] = useState<UploadMode>('SELECT');
  const [video, setVideo] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [category, setCategory] = useState('');
  const [uploading, setUploading] = useState(false);
  const [liveTitle, setLiveTitle] = useState('');

  const pickVideo = async (useCamera: boolean = false, isStory: boolean = false) => {
    const permission = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permission.status !== 'granted') {
      Alert.alert('Permission Denied', 'We need access to your camera/gallery to continue.');
      return;
    }

    const result = useCamera
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Videos,
          allowsEditing: true,
          aspect: [9, 16],
          quality: 1,
          videoMaxDuration: isStory ? 30 : 60,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Videos,
          allowsEditing: true,
          aspect: [9, 16],
          quality: 1,
          videoMaxDuration: isStory ? 30 : 60,
        });

    if (!result.canceled) {
      setVideo(result.assets[0].uri);
      setMode(isStory ? 'POST_STORY' : 'POST_REEL');
    }
  };

  const handlePostStory = async () => {
    if (!video) return;

    try {
      setUploading(true);
      if (!user?.id) throw new Error('Not authenticated');

      await UploadService.uploadStory(user.id, video);

      Alert.alert('Success', 'Business Story Published!', [
        {
          text: 'OK',
          onPress: () => {
            setVideo(null);
            setMode('SELECT');
            router.replace('/(tabs)');
          },
        },
      ]);
    } catch (e: any) {
      Alert.alert('Story Upload Failed', e.message);
    } finally {
      setUploading(false);
    }
  };

  const handlePostReel = async () => {
    if (!video || !caption) {
      Alert.alert('Error', 'Please add a caption to your reel.');
      return;
    }

    try {
      setUploading(true);
      if (!user?.id) throw new Error('Not authenticated');

      await UploadService.uploadReel(user.id, video, caption, category);

      Alert.alert('Success', 'Professional Reel Posted!', [
        {
          text: 'OK',
          onPress: () => {
            setVideo(null);
            setMode('SELECT');
            setCaption('');
            setCategory('');
            router.replace('/(tabs)');
          },
        },
      ]);
    } catch (e: any) {
      Alert.alert('Upload Failed', e.message);
    } finally {
      setUploading(false);
    }
  };

  const handleStartLive = async () => {
    if (!liveTitle.trim()) {
      Alert.alert('Required', 'Please give your session a title.');
      return;
    }

    try {
      setUploading(true);
      if (!user?.id) throw new Error('Not authenticated');

      const sessionId = await UploadService.startLiveSession(user.id, liveTitle);

      router.push(`/live/${sessionId}`);
    } catch (e: any) {
      Alert.alert('Live Sync Failed', e.message);
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
          <TouchableOpacity style={styles.optionCard} onPress={() => pickVideo(true, false)}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(0, 200, 83, 0.1)' }]}>
              <Ionicons name="videocam" size={32} color={Colors.primary} />
            </View>
            <Text style={styles.optionLabel}>POST REEL</Text>
            <Text style={styles.optionDesc}>Capture a fresh pitch</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionCard} onPress={() => pickVideo(false, true)}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(255, 160, 0, 0.1)' }]}>
              <Ionicons name="flash" size={32} color="#FFA000" />
            </View>
            <Text style={styles.optionLabel}>BUSINESS STORY</Text>
            <Text style={styles.optionDesc}>Quick 30s update</Text>
          </TouchableOpacity>

          <View style={styles.templateSection}>
            <Text style={styles.templateHeader}>PITCH TEMPLATES</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.templateScroll}
            >
              {[
                { title: 'Product Demo', icon: 'cube-outline' },
                { title: 'Meet the Team', icon: 'people-outline' },
                { title: 'Client Review', icon: 'star-outline' },
                { title: 'Behind Scenes', icon: 'eye-outline' },
              ].map((t) => (
                <TouchableOpacity
                  key={t.title}
                  style={styles.templateItem}
                  onPress={() => pickVideo(false, false)}
                >
                  <Ionicons name={t.icon as any} size={20} color="#fff" />
                  <Text style={styles.templateLabel}>{t.title}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <TouchableOpacity style={styles.optionCard} onPress={() => pickVideo(false, false)}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(255, 255, 255, 0.05)' }]}>
              <Ionicons name="cloud-upload" size={32} color="#fff" />
            </View>
            <Text style={styles.optionLabel}>UPLOAD VIDEO</Text>
            <Text style={styles.optionDesc}>Select from gallery</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.optionCard, styles.liveCard]}
            onPress={() => setMode('START_LIVE')}
          >
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
          <TouchableOpacity
            onPress={() => {
              setMode('SELECT');
              setVideo(null);
            }}
          >
            <Ionicons name="arrow-back" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>{mode === 'POST_REEL' ? 'New Reel' : 'Live Setup'}</Text>
          <TouchableOpacity
            onPress={
              mode === 'POST_REEL'
                ? handlePostReel
                : mode === 'POST_STORY'
                  ? handlePostStory
                  : handleStartLive
            }
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator color={Colors.primary} />
            ) : (
              <Text style={styles.postBtn}>{mode === 'START_LIVE' ? 'START' : 'POST'}</Text>
            )}
          </TouchableOpacity>
        </View>

        {mode === 'POST_REEL' || mode === 'POST_STORY' ? (
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
            {mode === 'POST_REEL' && (
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
            )}
            {mode === 'POST_STORY' && (
              <View style={styles.inputArea}>
                <Text style={[styles.label, { textAlign: 'center' }]}>
                  Quick Business Update (Max 30s)
                </Text>
                <Text style={{ color: Colors.textSecondary, textAlign: 'center', marginTop: 10 }}>
                  Stories expire after 24 hours.
                </Text>
              </View>
            )}
          </>
        ) : (
          <View style={styles.liveForm}>
            <View style={styles.liveIconBox}>
              <Ionicons name="pulse" size={60} color={Colors.primary} />
            </View>
            <Text style={styles.liveTitle}>Go Live Instantly</Text>
            <Text style={styles.liveDesc}>
              Notify all your connections and start your business broadcast.
            </Text>

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
  selectionContainer: {
    flex: 1,
    backgroundColor: '#050508',
    justifyContent: 'center',
    padding: 25,
  },
  selHeader: { marginBottom: 40 },
  selTitle: { color: '#fff', fontSize: 32, fontWeight: '900', letterSpacing: -1 },
  selSubtitle: {
    color: '#00D084',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  optionsGrid: { gap: 15 },
  optionCard: {
    backgroundColor: '#0E0E14',
    padding: 22,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  templateSection: { marginVertical: 15 },
  templateHeader: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 15,
    textTransform: 'uppercase',
  },
  templateScroll: { paddingLeft: 5 },
  templateItem: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#15151E',
    marginRight: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  templateLabel: { color: '#fff', fontSize: 12, fontWeight: '800' },
  liveCard: { borderColor: 'rgba(255, 59, 48, 0.2)' },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  optionLabel: { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: 0.5 },
  optionDesc: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    marginTop: 4,
    position: 'absolute',
    left: 98,
    bottom: 22,
  },
  mainContainer: { flex: 1, backgroundColor: '#050508' },
  scrollContent: { paddingBottom: 50 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    marginBottom: 30,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    paddingBottom: 15,
  },
  title: { color: '#fff', fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
  postBtn: { color: '#00D084', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  videoPreviewContainer: {
    width: width * 0.45,
    aspectRatio: 9 / 16,
    backgroundColor: '#0E0E14',
    marginHorizontal: 20,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  previewVideo: { flex: 1 },
  inputArea: { padding: 25 },
  label: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    marginBottom: 12,
    letterSpacing: 1.5,
  },
  captionInput: {
    backgroundColor: '#0E0E14',
    borderRadius: 20,
    padding: 20,
    color: '#fff',
    fontSize: 16,
    height: 140,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 25,
    fontWeight: '500',
  },
  categoryInput: {
    backgroundColor: '#0E0E14',
    borderRadius: 16,
    padding: 18,
    color: '#fff',
    fontSize: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    fontWeight: '600',
  },
  liveForm: { padding: 40, alignItems: 'center' },
  liveIconBox: {
    width: 100,
    height: 100,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 208, 132, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(0, 208, 132, 0.1)',
  },
  liveTitle: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  liveDesc: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 22,
    fontWeight: '500',
  },
  liveInput: {
    width: '100%',
    backgroundColor: '#0E0E14',
    borderRadius: 20,
    padding: 22,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginTop: 45,
    textAlign: 'center',
    fontWeight: '700',
  },
});
