import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, ScrollView, Alert, ActivityIndicator, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { container } from '../../src/di/Container';
import { useAuthStore } from '../../store/useAuthStore';
import { ErrorHandler } from '../../src/core/error_handler/ErrorHandler';

export default function AddProductScreen() {
  const router = useRouter();
  const session = useAuthStore((state) => state.session);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  const handleSave = async () => {
    if (!name || !price || !image) {
        Alert.alert("Missing Info", "Please provide a name, price, and image.");
        return;
    }

    try {
      setLoading(true);
      if (!session?.user?.id) throw new Error("Not authenticated");

      await container.marketplaceRepository.createProduct(session.user.id, {
        name,
        description,
        price: `KSh ${price}`,
        imageUri: image
      });

      Alert.alert("Success", "Product added to your catalog.", [
          { text: "OK", onPress: () => router.back() }
      ]);
    } catch (e) {
      ErrorHandler.handle(e, 'AddProduct');
      Alert.alert("Error", "Failed to list product. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>List New Product</Text>
        <TouchableOpacity onPress={handleSave} disabled={loading} style={styles.saveAction}>
          {loading ? <ActivityIndicator color="#00D084" /> : <Text style={styles.saveBtnText}>List</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.imageArea} onPress={pickImage}>
          {image ? <Image source={{ uri: image }} style={styles.preview} /> : (
            <View style={styles.placeholder}>
              <Ionicons name="camera-outline" size={48} color="#333" />
              <Text style={styles.placeholderText}>Add Product Photo</Text>
              <Text style={styles.placeholderSub}>High quality images sell faster</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.form}>
          <Text style={styles.label}>Product Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Professional Camera Gear"
            placeholderTextColor="#444"
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>Price (KES)</Text>
          <TextInput
            style={styles.input}
            placeholder="0.00"
            placeholderTextColor="#444"
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, { height: 120, textAlignVertical: 'top' }]}
            placeholder="Describe what makes this product special..."
            placeholderTextColor="#444"
            value={description}
            onChangeText={setDescription}
            multiline
          />

          <View style={styles.infoNote}>
             <Ionicons name="shield-checkmark-outline" size={16} color="#00D084" />
             <Text style={styles.noteText}>Every sale is protected by BizReel Escrow.</Text>
          </View>
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D12' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#1C1C24' },
  backBtn: { width: 40 },
  title: { color: '#fff', fontSize: 18, fontWeight: '900' },
  saveAction: { width: 60, alignItems: 'flex-end' },
  saveBtnText: { color: '#00D084', fontSize: 16, fontWeight: '900' },
  imageArea: { width: '100%', aspectRatio: 1.2, backgroundColor: '#13131A', justifyContent: 'center', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#1C1C24' },
  preview: { width: '100%', height: '100%', resizeMode: 'cover' },
  placeholder: { alignItems: 'center' },
  placeholderText: { color: '#555', marginTop: 15, fontSize: 16, fontWeight: '800' },
  placeholderSub: { color: '#333', fontSize: 12, marginTop: 5, fontWeight: '600' },
  form: { padding: 25 },
  label: { color: '#555', fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, marginLeft: 5 },
  input: { backgroundColor: '#13131A', padding: 18, borderRadius: 12, color: '#fff', fontSize: 16, marginBottom: 25, borderWidth: 1, borderColor: '#1C1C24' },
  infoNote: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(0,208,132,0.05)', padding: 15, borderRadius: 12, marginTop: 10 },
  noteText: { color: '#00D084', fontSize: 13, fontWeight: '600' }
});
