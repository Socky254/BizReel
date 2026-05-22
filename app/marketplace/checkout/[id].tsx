import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { container } from '../../../src/di/Container';
import { useAuthStore } from '../../../src/store/useAuthStore';
import { Product } from '../../../src/domain/models';
import { ErrorHandler } from '../../../src/core/error_handler/ErrorHandler';
import { SafeLinearGradient } from '../../../src/components/SafeLinearGradient';

export default function CheckoutScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const session = useAuthStore((state) => state.session);

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const found = await container.marketplaceRepository.getProductById(id as string);
      if (found) setProduct(found);
      else throw new Error('Product not found');
    } catch (e) {
      ErrorHandler.handle(e, 'CheckoutLoad');
      Alert.alert('Error', 'Could not load product details.');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!address || !phone) {
      Alert.alert('Required Information', 'Please provide delivery address and phone number.');
      return;
    }

    if (!product || !session?.user.id) return;

    try {
      setProcessing(true);

      // 1. Decisive: Create Purchase in Escrow
      // We'll use the price string and parse it for simplicity in this demo
      const priceVal = parseFloat(product.price?.replace(/[^0-9.]/g, '') || '0');

      await container.financeRepository.initiatePurchase(
        session.user.id,
        product.business_id,
        priceVal,
      );

      Alert.alert(
        'Payment Secured',
        'Your payment is now held in escrow. The seller has been notified to fulfill your order.',
        [{ text: 'View Wallet', onPress: () => router.push('/profile/wallet') }],
      );
    } catch (e) {
      ErrorHandler.handle(e, 'PaymentProcess');
      Alert.alert('Transaction Failed', 'We could not process your payment. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#00D084" size="large" />
      </View>
    );
  if (!product) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Secure Checkout</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.productCard}>
            <Image source={{ uri: product.image_url }} style={styles.productImg} />
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{product.name}</Text>
              <Text style={styles.businessName}>
                Sold by {product.profiles?.business_name || 'Partner'}
              </Text>
              <Text style={styles.productPrice}>{product.price}</Text>
            </View>
          </View>

          <View style={styles.escrowBanner}>
            <Ionicons name="lock-closed" size={18} color="#00D084" />
            <Text style={styles.escrowText}>Protected by BizReel Escrow</Text>
          </View>

          <Text style={styles.label}>Delivery Address</Text>
          <TextInput
            style={styles.input}
            placeholder="Street, City, Building..."
            placeholderTextColor="#444"
            value={address}
            onChangeText={setAddress}
            multiline
          />

          <Text style={styles.label}>Contact Phone</Text>
          <TextInput
            style={styles.input}
            placeholder="+254..."
            placeholderTextColor="#444"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />

          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryVal}>{product.price}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery</Text>
              <Text style={styles.summaryVal}>FREE</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: '#fff' }]}>Total</Text>
              <Text style={styles.totalVal}>{product.price}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.payBtn, processing && styles.payBtnDisabled]}
            onPress={handlePayment}
            disabled={processing}
          >
            {processing ? (
              <ActivityIndicator color="#000" />
            ) : (
              <>
                <Ionicons name="shield-checkmark" size={20} color="#000" />
                <Text style={styles.payText}>Pay & Secure Funds</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.footerNote}>
            Your funds will be released only when you confirm receipt.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D12' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1C1C24',
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  title: { color: '#fff', fontSize: 18, fontWeight: '900' },
  content: { padding: 20 },
  productCard: {
    flexDirection: 'row',
    backgroundColor: '#13131A',
    padding: 15,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#1C1C24',
  },
  productImg: { width: 80, height: 80, borderRadius: 12 },
  productInfo: { flex: 1, marginLeft: 15, justifyContent: 'center' },
  productName: { color: '#fff', fontSize: 16, fontWeight: '800' },
  businessName: { color: '#555', fontSize: 12, marginTop: 4 },
  productPrice: { color: '#00D084', fontSize: 18, fontWeight: '900', marginTop: 6 },
  escrowBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,208,132,0.05)',
    padding: 12,
    borderRadius: 10,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(0,208,132,0.1)',
  },
  escrowText: { color: '#00D084', fontSize: 13, fontWeight: '700' },
  label: {
    color: '#777',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
    marginLeft: 5,
  },
  input: {
    backgroundColor: '#13131A',
    borderRadius: 12,
    padding: 15,
    color: '#fff',
    fontSize: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#1C1C24',
  },
  summaryCard: {
    backgroundColor: '#13131A',
    padding: 20,
    borderRadius: 20,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#1C1C24',
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  summaryLabel: { color: '#555', fontSize: 14, fontWeight: '600' },
  summaryVal: { color: '#fff', fontSize: 14, fontWeight: '700' },
  divider: { height: 1, backgroundColor: '#1C1C24', marginVertical: 15 },
  totalVal: { color: '#00D084', fontSize: 18, fontWeight: '900' },
  payBtn: {
    backgroundColor: '#00D084',
    padding: 18,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  payBtnDisabled: { opacity: 0.5 },
  payText: { color: '#000', fontSize: 16, fontWeight: '900' },
  footerNote: { color: '#444', fontSize: 12, textAlign: 'center', marginTop: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
