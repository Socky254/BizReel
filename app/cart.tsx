import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../src/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/Context/AuthContext';
import { VibrantBackground } from '../src/components/VibrantBackground';

export default function CartScreen() {
  const { session } = useAuth();
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (session?.user?.id) {
      fetchCart();
    }
  }, [session?.user?.id]);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('cart')
        .select('*, products(*, profiles(business_name))')
        .eq('user_id', session?.user?.id);

      if (error) throw error;
      setCartItems(data || []);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (id: string) => {
    try {
      const { error } = await supabase.from('cart').delete().eq('id', id);
      if (error) throw error;
      setCartItems(cartItems.filter(item => item.id !== id));
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  const updateQuantity = async (id: string, delta: number) => {
    const item = cartItems.find(i => i.id === id);
    if (!item) return;

    const newQty = Math.max(1, item.quantity + delta);
    if (newQty === item.quantity) return;

    try {
      const { error } = await supabase.from('cart').update({ quantity: newQty }).eq('id', id);
      if (error) throw error;
      setCartItems(cartItems.map(i => i.id === id ? { ...i, quantity: newQty } : i));
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((acc, item) => {
      const price = parseFloat(item.products.price.replace(/[^0-9.]/g, '')) || 0;
      return acc + (price * item.quantity);
    }, 0);
  };

  return (
    <VibrantBackground>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Your Business Cart</Text>
          <View style={{ width: 40 }} />
        </View>

        {loading ? (
          <ActivityIndicator color="#00D084" style={{ marginTop: 20 }} />
        ) : (
          <FlatList
            data={cartItems}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.cartItem}>
                <Image source={{ uri: item.products.image_url }} style={styles.img} />
                <View style={styles.info}>
                  <Text style={styles.businessName}>{item.products.profiles?.business_name}</Text>
                  <Text style={styles.productName}>{item.products.name}</Text>
                  <Text style={styles.price}>{item.products.price}</Text>

                  <View style={styles.qtyRow}>
                    <View style={styles.qtyControls}>
                      <TouchableOpacity onPress={() => updateQuantity(item.id, -1)} style={styles.qtyBtn}>
                        <Ionicons name="remove" size={16} color="#fff" />
                      </TouchableOpacity>
                      <Text style={styles.qtyText}>{item.quantity}</Text>
                      <TouchableOpacity onPress={() => updateQuantity(item.id, 1)} style={styles.qtyBtn}>
                        <Ionicons name="add" size={16} color="#fff" />
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity onPress={() => removeItem(item.id)}>
                      <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="cart-outline" size={60} color="#1C1C24" />
                <Text style={styles.emptyText}>Your cart is empty.</Text>
                <TouchableOpacity style={styles.exploreBtn} onPress={() => router.push('/(tabs)/search')}>
                  <Text style={styles.exploreBtnText}>Explore Businesses</Text>
                </TouchableOpacity>
              </View>
            }
            contentContainerStyle={{ paddingBottom: 150 }}
          />
        )}

        {cartItems.length > 0 && (
          <View style={styles.footer}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Estimated Total</Text>
              <Text style={styles.totalValue}>KES {calculateTotal().toLocaleString()}</Text>
            </View>
            <TouchableOpacity style={styles.checkoutBtn} onPress={() => Alert.alert("Checkout", "Checkout process is being integrated with our payment gateway.")}>
              <Text style={styles.checkoutText}>Proceed to Inquiry</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </VibrantBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20 },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  title: { color: '#fff', fontSize: 18, fontWeight: '900' },
  cartItem: { flexDirection: 'row', padding: 20, borderBottomWidth: 1, borderBottomColor: '#1C1C24' },
  img: { width: 80, height: 80, borderRadius: 12 },
  info: { flex: 1, marginLeft: 15 },
  businessName: { color: '#555', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', marginBottom: 4 },
  productName: { color: '#fff', fontSize: 16, fontWeight: '800' },
  price: { color: '#00D084', fontSize: 14, fontWeight: '900', marginTop: 4 },
  qtyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  qtyControls: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1C1C24', borderRadius: 20, padding: 4 },
  qtyBtn: { width: 28, height: 28, justifyContent: 'center', alignItems: 'center' },
  qtyText: { color: '#fff', marginHorizontal: 15, fontWeight: '800' },
  footer: { position: 'absolute', bottom: 0, width: '100%', backgroundColor: '#0D0D12', padding: 25, borderTopWidth: 1, borderTopColor: '#1C1C24' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  totalLabel: { color: '#888', fontSize: 14, fontWeight: '700' },
  totalValue: { color: '#fff', fontSize: 18, fontWeight: '900' },
  checkoutBtn: { backgroundColor: '#00D084', padding: 18, borderRadius: 15, alignItems: 'center' },
  checkoutText: { color: '#000', fontSize: 16, fontWeight: '900' },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#555', fontSize: 16, fontWeight: '700', marginTop: 20 },
  exploreBtn: { marginTop: 25, backgroundColor: '#1C1C24', paddingHorizontal: 25, paddingVertical: 12, borderRadius: 10 },
  exploreBtnText: { color: '#fff', fontWeight: '800' }
});
