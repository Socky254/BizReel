import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, StatusBar, Image, Alert, Modal, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/useAuthStore';
import { container } from '../../src/di/Container';
import { Product } from '../../src/domain/models';
import { ErrorHandler } from '../../src/core/error_handler/ErrorHandler';

export default function CatalogScreen() {
  const { id } = useLocalSearchParams();
  const session = useAuthStore((state) => state.session);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Syndicate (Group Buy) State
  const [showSyndicateModal, setShowSyndicateModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
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
      const data = await container.marketplaceRepository.getProducts(id as string);
      setProducts(data);
    } catch (e) {
      ErrorHandler.handle(e, 'FetchCatalog');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (product: Product) => {
    if (!session?.user?.id) {
      Alert.alert("Login Required", "Please sign in to add items to your cart.");
      return;
    }

    try {
      await container.marketplaceRepository.addToCart(session.user.id, product.id);
      Alert.alert("Success", `${product.name} added to cart.`);
    } catch (e) {
      ErrorHandler.showError("Failed to add item to cart.");
    }
  };

  const handleLaunchSyndicate = async () => {
    if (!targetQty || !discountPrice || !selectedProduct) {
      Alert.alert("Missing Info", "Please provide all syndicate details.");
      return;
    }

    try {
      setIsSubmitting(true);
      await container.marketplaceRepository.createSyndicate(
        session!.user.id,
        selectedProduct.id,
        parseInt(targetQty),
        parseFloat(discountPrice),
        parseInt(expiryDays)
      );

      Alert.alert("Syndicate Launched", "Group Buy deal is now active!");
      setShowSyndicateModal(false);
      setTargetQty('');
      setDiscountPrice('');
    } catch (e) {
      ErrorHandler.handle(e, 'LaunchSyndicate');
      Alert.alert("Error", "Failed to launch group deal.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <View style={styles.item}>
      <Image source={{ uri: item.image_url }} style={styles.img} />
      <View style={styles.info}>
        <View style={styles.row}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.price}>{item.price}</Text>
        </View>
        <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>

        {!isOwnProfile ? (
          <View style={styles.buyerActions}>
            <TouchableOpacity style={styles.buyNowBtn} onPress={() => router.push({ pathname: '/marketplace/checkout/[id]', params: { id: item.id } })}>
                <Text style={styles.buyNowText}>Buy Now</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addToCartBtn} onPress={() => handleAddToCart(item)}>
                <Ionicons name="cart-outline" size={20} color="#00D084" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.syndicateBtn}
            onPress={() => {
              setSelectedProduct(item);
              setShowSyndicateModal(true);
            }}
          >
            <Ionicons name="people" size={16} color="#00D084" />
            <Text style={styles.syndicateBtnText}>Launch Group Buy</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Partner Catalog</Text>
        {isOwnProfile ? (
          <TouchableOpacity onPress={() => router.push('/profile/add-product')}>
            <Ionicons name="add-circle" size={28} color="#00D084" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => router.push('/cart')}>
            <Ionicons name="cart-outline" size={26} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color="#00D084" size="large" /></View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          renderItem={renderProduct}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="basket-outline" size={50} color="#1C1C24" />
              <Text style={styles.emptyText}>This business has no products listed yet.</Text>
            </View>
          }
        />
      )}

      {/* Syndicate Modal */}
      <Modal visible={showSyndicateModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Launch Group Buy Deal</Text>
              <TouchableOpacity onPress={() => setShowSyndicateModal(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
               <Text style={styles.modalSubtitle}>Create a volume discount deal for {selectedProduct?.name}</Text>

               <View style={styles.inputGroup}>
                <Text style={styles.label}>TARGET QUANTITY (Units for discount)</Text>
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
                <Text style={styles.label}>DISCOUNT PRICE (KES)</Text>
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
                <Text style={styles.label}>DURATION (Days)</Text>
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
                style={[styles.submitBtn, isSubmitting && { opacity: 0.7 }]}
                onPress={handleLaunchSyndicate}
                disabled={isSubmitting}
              >
                {isSubmitting ? <ActivityIndicator color="#000" /> : <Text style={styles.submitBtnText}>LAUNCH DEAL</Text>}
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
  title: { color: '#fff', fontSize: 18, fontWeight: '900' },
  backBtn: { width: 40 },
  list: { paddingBottom: 100 },
  item: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#1C1C24', flexDirection: 'row' },
  img: { width: 100, height: 100, borderRadius: 16, backgroundColor: '#13131A' },
  info: { flex: 1, marginLeft: 15 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  name: { color: '#fff', fontSize: 16, fontWeight: '800', flex: 1 },
  price: { color: '#00D084', fontWeight: '900', fontSize: 15, marginLeft: 10 },
  desc: { color: '#666', marginTop: 6, fontSize: 13, lineHeight: 18 },
  buyerActions: { flexDirection: 'row', gap: 10, marginTop: 15 },
  buyNowBtn: { flex: 1, backgroundColor: '#00D084', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  buyNowText: { color: '#000', fontSize: 13, fontWeight: '900' },
  addToCartBtn: { width: 40, height: 40, backgroundColor: 'rgba(0,208,132,0.1)', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  syndicateBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: 'rgba(0, 208, 132, 0.3)', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 8, marginTop: 15, alignSelf: 'flex-start', backgroundColor: 'rgba(0, 208, 132, 0.05)' },
  syndicateBtnText: { color: '#00D084', fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
  emptyContainer: { alignItems: 'center', marginTop: 100, padding: 40 },
  emptyText: { color: '#333', textAlign: 'center', marginTop: 15, fontWeight: '700', fontSize: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#16161E', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, height: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: '900' },
  modalSubtitle: { color: '#555', fontSize: 13, marginBottom: 25, fontWeight: '600' },
  inputGroup: { marginBottom: 20 },
  label: { color: '#00D084', fontSize: 10, fontWeight: '900', marginBottom: 8, letterSpacing: 1 },
  input: { backgroundColor: '#0D0D12', borderRadius: 12, padding: 15, color: '#fff', fontSize: 15, borderWidth: 1, borderColor: '#1C1C24' },
  submitBtn: { backgroundColor: '#00D084', padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 10 },
  submitBtnText: { color: '#000', fontSize: 16, fontWeight: '900' }
});
