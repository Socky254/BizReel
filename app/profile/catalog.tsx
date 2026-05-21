import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, StatusBar, Image, Alert, Modal, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/Context/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';

export default function CatalogScreen() {
  const { id } = useLocalSearchParams();
  const { session } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newImage, setNewImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Syndicate State
  const [showSyndicateModal, setShowSyndicateModal] = useState(false);
  const [selectedProduct, setSelectedPost] = useState<any>(null);
  const [targetQty, setTargetQty] = useState('');
  const [discountPrice, setDiscountPrice] = useState('');
  const [expiryDays, setExpiryDays] = useState('7');

  const router = useRouter();

  const isOwnProfile = session?.user?.id === id;

  useEffect(() => {
    fetchProducts();
  }, [id]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data } = await supabase.from('products').select('*').eq('business_id', id).order('created_at', { ascending: false });
      setProducts(data || []);
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setNewImage(result.assets[0].uri);
      (result.assets[0] as any).base64String = result.assets[0].base64;
    }
  };

  const handleAddProduct = async () => {
    if (!newName || !newPrice) {
      Alert.alert("Error", "Product name and price are required.");
      return;
    }

    setIsSubmitting(true);
    let imageUrl = null;

    try {
      if (newImage) {
        // Simple unique filename
        const fileName = `${session?.user?.id}/${Date.now()}.jpg`;

        // We need to re-pick or store base64 string during pick
        // For simplicity in this optimization, assuming we have the base64 from pickImage
        // Since we can't easily re-read file in RN without extra libs, we used base64 in pickImage.

        // Find the base64 string we stored in a temporary hacky way or re-read
        // Actually, let's use the standard approach.

        const base64Data = await fetch(newImage).then(res => res.blob()).then(blob => {
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
          });
        }) as string;

        const pureBase64 = base64Data.split(',')[1];

        const { error: uploadError } = await supabase.storage
          .from('products')
          .upload(fileName, decode(pureBase64), {
            contentType: 'image/jpeg',
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(fileName);
        imageUrl = publicUrl;
      }

      const { error } = await supabase.from('products').insert({
        business_id: session?.user?.id,
        name: newName,
        price: newPrice,
        description: newDescription,
        image_url: imageUrl,
      });

      if (error) throw error;

      Alert.alert("Success", "Product added to your catalog.");
      setShowAddModal(false);
      setNewName('');
      setNewPrice('');
      setNewDescription('');
      setNewImage(null);
      fetchProducts();
    } catch (e: any) {
      Alert.alert("Upload Failed", e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addToCart = async (product: any) => {
    if (!session?.user?.id) {
      Alert.alert("Error", "Please login to add items to cart.");
      return;
    }

    try {
      const { error } = await supabase.from('cart').insert({
        user_id: session.user.id,
        product_id: product.id,
        quantity: 1
      });

      if (error) {
        if (error.code === '23505') {
          Alert.alert("Already in Cart", "This item is already in your cart.");
        } else {
          throw error;
        }
      } else {
        Alert.alert("Success", `${product.name} added to cart!`);
      }
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  const handleCreateSyndicate = async () => {
    if (!targetQty || !discountPrice) {
      Alert.alert("Error", "Target quantity and discount price are required.");
      return;
    }

    try {
      setIsSubmitting(true);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + parseInt(expiryDays));

      const { error } = await supabase.from('syndicates').insert({
        creator_id: session?.user?.id,
        product_id: selectedProduct.id,
        target_quantity: parseInt(targetQty),
        discount_price: parseFloat(discountPrice),
        expires_at: expiresAt.toISOString(),
      });

      if (error) throw error;

      Alert.alert("Syndicate Launched", "Group Buy deal is now active!");
      setShowSyndicateModal(false);
      setTargetQty('');
      setDiscountPrice('');
    } catch (e: any) {
      Alert.alert("Launch Failed", e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Business Catalog</Text>
        {isOwnProfile ? (
          <TouchableOpacity onPress={() => setShowAddModal(true)}>
            <Ionicons name="add-circle" size={28} color="#00C853" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => router.push('/cart')}>
            <Ionicons name="cart-outline" size={26} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ActivityIndicator color="#00C853" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 100 }}
          renderItem={({ item }) => (
            <View style={styles.item}>
              {item.image_url ? (
                <Image source={{ uri: item.image_url }} style={styles.img} />
              ) : (
                <View style={[styles.img, { backgroundColor: '#1C1C24', justifyContent: 'center', alignItems: 'center' }]}>
                  <Ionicons name="image-outline" size={30} color="#333" />
                </View>
              )}
              <View style={styles.info}>
                <View style={styles.row}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.price}>{item.price}</Text>
                </View>
                <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>

                {!isOwnProfile && (
                  <TouchableOpacity style={styles.addToCartBtn} onPress={() => addToCart(item)}>
                    <Text style={styles.addToCartText}>Add to Cart</Text>
                  </TouchableOpacity>
                )}

                {isOwnProfile && (
                  <TouchableOpacity
                    style={styles.syndicateBtn}
                    onPress={() => {
                      setSelectedPost(item);
                      setShowSyndicateModal(true);
                    }}
                  >
                    <Ionicons name="people" size={16} color={Colors.primary} />
                    <Text style={styles.syndicateBtnText}>Create Group Buy</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="basket-outline" size={50} color="#1C1C24" />
              <Text style={styles.empty}>Your catalog is empty.</Text>
            </View>
          }
        />
      )}

      {/* Add Product Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Product</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                {newImage ? (
                  <Image source={{ uri: newImage }} style={styles.previewImg} />
                ) : (
                  <>
                    <Ionicons name="camera-outline" size={40} color="#555" />
                    <Text style={styles.pickerText}>Upload Product Photo</Text>
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>PRODUCT NAME</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Professional Camera"
                  placeholderTextColor="#444"
                  value={newName}
                  onChangeText={setNewName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>PRICE (e.g. KES 1,200)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="KES 0.00"
                  placeholderTextColor="#444"
                  value={newPrice}
                  onChangeText={setNewPrice}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>DESCRIPTION</Text>
                <TextInput
                  style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
                  placeholder="Describe your product features..."
                  placeholderTextColor="#444"
                  multiline
                  value={newDescription}
                  onChangeText={setNewDescription}
                />
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, isSubmitting && { opacity: 0.7 }]}
                onPress={handleAddProduct}
                disabled={isSubmitting}
              >
                {isSubmitting ? <ActivityIndicator color="#000" /> : <Text style={styles.submitBtnText}>List Product</Text>}
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Syndicate Modal */}
      <Modal visible={showSyndicateModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Launch Syndicate Deal</Text>
              <TouchableOpacity onPress={() => setShowSyndicateModal(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
               <Text style={styles.modalSubtitle}>Create a group buy deal for {selectedProduct?.name}</Text>

               <View style={styles.inputGroup}>
                <Text style={styles.label}>TARGET QUANTITY (Units needed for discount)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 50"
                  placeholderTextColor="#444"
                  keyboardType="numeric"
                  value={targetQty}
                  onChangeText={setTargetQty}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>DISCOUNT PRICE (Per unit when target met)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 850.00"
                  placeholderTextColor="#444"
                  keyboardType="numeric"
                  value={discountPrice}
                  onChangeText={setDiscountPrice}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>EXPIRY (Days from now)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="7"
                  placeholderTextColor="#444"
                  keyboardType="numeric"
                  value={expiryDays}
                  onChangeText={setExpiryDays}
                />
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: Colors.primary }, isSubmitting && { opacity: 0.7 }]}
                onPress={handleCreateSyndicate}
                disabled={isSubmitting}
              >
                <Text style={styles.submitBtnText}>LAUNCH DEAL</Text>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D12' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#1C1C24' },
  title: { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
  item: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#1C1C24', flexDirection: 'row' },
  img: { width: 90, height: 90, borderRadius: 16, backgroundColor: '#111' },
  info: { flex: 1, marginLeft: 15 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { color: '#fff', fontSize: 16, fontWeight: '800' },
  price: { color: '#00C853', fontWeight: '900', fontSize: 15 },
  desc: { color: '#666', marginTop: 6, fontSize: 13, lineHeight: 18 },
  addToCartBtn: { backgroundColor: '#00C853', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, marginTop: 15, alignSelf: 'flex-start' },
  addToCartText: { color: '#000', fontSize: 13, fontWeight: '900' },
  syndicateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 200, 83, 0.3)',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginTop: 15,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 200, 83, 0.05)'
  },
  syndicateBtnText: { color: '#00C853', fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  empty: { color: '#333', textAlign: 'center', marginTop: 15, fontWeight: '700' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#16161E', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, height: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: '900' },
  modalSubtitle: { color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 25, fontWeight: '600' },
  imagePicker: { width: '100%', height: 200, backgroundColor: '#0D0D12', borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 25, borderStyle: 'dashed', borderWidth: 1, borderColor: '#333', overflow: 'hidden' },
  previewImg: { width: '100%', height: '100%' },
  pickerText: { color: '#555', marginTop: 10, fontWeight: '700', fontSize: 12, textTransform: 'uppercase' },
  inputGroup: { marginBottom: 20 },
  label: { color: '#00C853', fontSize: 10, fontWeight: '900', marginBottom: 8, letterSpacing: 1 },
  input: { backgroundColor: '#0D0D12', borderRadius: 12, padding: 15, color: '#fff', fontSize: 15, borderWidth: 1, borderColor: '#1C1C24' },
  submitBtn: { backgroundColor: '#00C853', padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 10, marginBottom: 50 },
  submitBtnText: { color: '#000', fontSize: 16, fontWeight: '900' }
});
