import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../Context/AuthContext';
import { useRouter } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

export default function CreateScreen() {
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState('');
  const [caption, setCaption] = useState('');
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const { session } = useAuth();
  const router = useRouter();

  const pickVideo = async (useCamera: boolean) => {
    try {
      const permissionResult = useCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert("Permission Required", "Camera/Gallery access is needed to post reels.");
        return;
      }

      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        aspect: [9, 16],
        quality: 1,
      };

      const result = useCamera
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setVideoUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Picker Error:', error);
      Alert.alert("Error", "Failed to open camera/gallery");
    }
  };

  const handleUpload = async () => {
    if (!session?.user || !videoUri) {
      Alert.alert("Error", "Please select a video first.");
      return;
    }

    try {
      setUploading(true);
      setStatus('Processing video...');

      const base64 = await FileSystem.readAsStringAsync(videoUri, {
        encoding: FileSystem.EncodingType.Base64
      });

      const fileName = `${session.user.id}/${Date.now()}.mp4`;

      setStatus('Uploading to cloud...');

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('reels')
        .upload(fileName, decode(base64), {
          contentType: 'video/mp4',
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      setStatus('Publishing...');

      const { data: { publicUrl } } = supabase.storage
        .from('reels')
        .getPublicUrl(fileName);

      const { error: dbError } = await supabase
        .from('posts')
        .insert({
          user_id: session.user.id,
          video_url: publicUrl,
          caption: caption,
          created_at: new Date().toISOString(),
        });

      if (dbError) throw dbError;

      setStatus('Success!');
      Alert.alert("Published!", "Your business reel is live.", [
        { text: "Awesome", onPress: () => {
          setVideoUri(null);
          setCaption('');
          router.replace('/(tabs)');
        }}
      ]);

    } catch (error: any) {
      console.error('Upload Error:', error);
      Alert.alert("Upload Failed", error.message);
    } finally {
      setUploading(false);
      setStatus('');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.header}>Share a <Text style={{color: '#00D084'}}>Reel</Text></Text>

        {uploading ? (
          <View style={styles.loadingArea}>
            <ActivityIndicator size="large" color="#00D084" />
            <Text style={styles.statusText}>{status}</Text>
          </View>
        ) : (
          <View style={styles.content}>
            {!videoUri ? (
              <View style={styles.buttonGrid}>
                <TouchableOpacity style={styles.actionButton} onPress={() => pickVideo(true)}>
                  <Ionicons name="camera" size={40} color="#00D084" />
                  <Text style={styles.buttonLabel}>Record</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton} onPress={() => pickVideo(false)}>
                  <Ionicons name="images" size={40} color="#00D084" />
                  <Text style={styles.buttonLabel}>Gallery</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.previewContainer}>
                <View style={styles.selectedIndicator}>
                  <Ionicons name="checkmark-circle" size={24} color="#00D084" />
                  <Text style={styles.selectedText}>Video Selected</Text>
                  <TouchableOpacity onPress={() => setVideoUri(null)}>
                    <Text style={styles.changeText}>Change</Text>
                  </TouchableOpacity>
                </View>

                <TextInput
                  style={styles.captionInput}
                  placeholder="Write a catchy caption for your business..."
                  placeholderTextColor="#666"
                  multiline
                  value={caption}
                  onChangeText={setCaption}
                />

                <TouchableOpacity style={styles.publishButton} onPress={handleUpload}>
                  <Text style={styles.publishButtonText}>Publish Reel</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  scrollContent: { flexGrow: 1, padding: 25, justifyContent: 'center' },
  header: { color: '#fff', fontSize: 32, fontWeight: 'bold', textAlign: 'center', marginBottom: 40 },
  content: { width: '100%' },
  buttonGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  actionButton: { width: '47%', backgroundColor: '#111', padding: 30, borderRadius: 20, alignItems: 'center', borderWidth: 1, borderColor: '#222' },
  buttonLabel: { color: '#fff', marginTop: 10, fontWeight: 'bold' },
  previewContainer: { backgroundColor: '#111', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: '#222' },
  selectedIndicator: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  selectedText: { color: '#fff', marginLeft: 10, flex: 1, fontWeight: '600' },
  changeText: { color: '#00D084', fontWeight: 'bold' },
  captionInput: { backgroundColor: '#000', color: '#fff', padding: 15, borderRadius: 12, height: 120, textAlignVertical: 'top', fontSize: 16, marginBottom: 20, borderWidth: 1, borderColor: '#333' },
  publishButton: { backgroundColor: '#00D084', padding: 18, borderRadius: 15, alignItems: 'center' },
  publishButtonText: { color: '#000', fontSize: 18, fontWeight: 'bold' },
  loadingArea: { alignItems: 'center', backgroundColor: '#111', padding: 40, borderRadius: 20 },
  statusText: { color: '#fff', marginTop: 20, fontSize: 16 }
});