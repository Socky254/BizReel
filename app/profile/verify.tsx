import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { container } from '../../src/di/Container';
import { useAuthStore } from '../../src/store/useAuthStore';
import { ErrorHandler } from '../../src/core/error_handler/ErrorHandler';

export default function VerificationScreen() {
  const router = useRouter();
  const session = useAuthStore((state) => state.session);
  const [loading, setLoading] = useState(false);
  const [docImage, setDocImage] = useState<string | null>(null);

  const pickDocument = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setDocImage(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!docImage || !session?.user.id) {
      Alert.alert("Missing Document", "Please select a business registration document to proceed.");
      return;
    }

    try {
      setLoading(true);
      await container.requestVerificationUseCase.execute(session.user.id, docImage);

      Alert.alert(
        "Application Submitted",
        "Our team will review your business documents within 24-48 hours.",
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch (e) {
      ErrorHandler.handle(e, 'VerificationSubmit');
      Alert.alert("Error", "Failed to submit verification request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Business Verification</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={24} color="#00D084" />
          <Text style={styles.infoText}>
            Verified businesses get a green checkmark, higher trust scores, and priority placement in the marketplace.
          </Text>
        </View>

        <Text style={styles.label}>Requirements</Text>
        <View style={styles.reqItem}>
            <Ionicons name="radio-button-on" size={12} color="#00D084" />
            <Text style={styles.reqText}>Government-issued business license</Text>
        </View>
        <View style={styles.reqItem}>
            <Ionicons name="radio-button-on" size={12} color="#00D084" />
            <Text style={styles.reqText}>Clear photo or scan (PDF/JPG/PNG)</Text>
        </View>

        <TouchableOpacity style={styles.uploadArea} onPress={pickDocument}>
          {docImage ? (
            <Image source={{ uri: docImage }} style={styles.previewImage} />
          ) : (
            <View style={styles.uploadPlaceholder}>
              <Ionicons name="cloud-upload-outline" size={40} color="#555" />
              <Text style={styles.uploadText}>Select Document Image</Text>
            </View>
          )}
        </TouchableOpacity>

        {docImage && (
            <TouchableOpacity style={styles.changeBtn} onPress={pickDocument}>
                <Text style={styles.changeText}>Change Document</Text>
            </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.submitBtn, (!docImage || loading) && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={!docImage || loading}
        >
          {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.submitText}>Submit for Review</Text>}
        </TouchableOpacity>

        <Text style={styles.privacyNote}>
          Your documents are encrypted and only accessible by authorized BizReel compliance officers.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D12' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#1C1C24' },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  title: { color: '#fff', fontSize: 18, fontWeight: '900' },
  content: { padding: 25 },
  infoBox: { flexDirection: 'row', backgroundColor: 'rgba(0,208,132,0.1)', padding: 20, borderRadius: 16, marginBottom: 30, gap: 15 },
  infoText: { flex: 1, color: '#00D084', fontSize: 14, lineHeight: 20, fontWeight: '600' },
  label: { color: '#fff', fontSize: 16, fontWeight: '800', marginBottom: 15 },
  reqItem: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  reqText: { color: '#777', fontSize: 14, fontWeight: '600' },
  uploadArea: { width: '100%', height: 250, backgroundColor: '#13131A', borderRadius: 20, borderStyle: 'dashed', borderWidth: 2, borderColor: '#222', marginTop: 20, overflow: 'hidden' },
  uploadPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
  uploadText: { color: '#555', fontSize: 14, fontWeight: '700' },
  previewImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  changeBtn: { alignSelf: 'center', marginTop: 15 },
  changeText: { color: '#00D084', fontSize: 14, fontWeight: '800' },
  submitBtn: { backgroundColor: '#00D084', padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 40 },
  submitBtnDisabled: { opacity: 0.5 },
  submitText: { color: '#000', fontSize: 16, fontWeight: '900' },
  privacyNote: { color: '#444', fontSize: 12, textAlign: 'center', marginTop: 20, lineHeight: 18 }
});
