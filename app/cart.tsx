import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Image, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../src/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../src/store/useAuthStore';
import { Colors } from '../src/core/theme/colors';

export default function CartScreen() {
  const { user } = useAuthStore();
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (user?.id) {
      fetchCart();
    }
  }, [user?.id]);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('cart')
        .select('*, products(*, profiles(business_name))')
        .eq('user_id', user?.id);

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

  // Group items by Business (B2B necessity)
  const groupedItems = cartItems.reduce((acc: any, item: any) => {
    const bizId = item.products.business_id;
    if (!acc[bizId]) {
      acc[bizId] = {
        name: item.products.profiles?.business_name || 'Business',
        items: [],
        total: 0
      };
    }
    acc[bizId].items.push(item);
    const price = parseFloat(item.products.price.replace(/[^0-9.]/g, '')) || 0;
    acc[bizId].total += (price * item.quantity);
    return acc;
  }, {});

  if (loading) return (
    <View style={styles.center}><ActivityIndicator color={Colors.primary} size="large" /></View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Business Cart</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {Object.keys(groupedItems).length === 0 ? (
           <View style={styles.empty}>
              <Ionicons name="cart-outline" size={80} color={Colors.surfaceElevated} />
              <Text style={styles.emptyText}>Your cart is currently empty.</Text>
           </View>
        ) : (
          Object.keys(groupedItems).map(bizId => (
            <View key={bizId} style={styles.bizGroup}>
                <View style={styles.bizHeader}>
                   <Ionicons name="business" size={16} color={Colors.primary} />
                   <Text style={styles.bizName}>{groupedItems[bizId].name}</Text>
                </View>

                {groupedItems[bizId].items.map((item: any) => (
                  <View key={item.id} style={styles.itemRow}>
                     <Image source={{ uri: item.products.image_url }} style={styles.itemImg} />
                     <View style={styles.itemInfo}>
                        <Text style={styles.itemName}>{item.products.name}</Text>
                        <Text style={styles.itemPrice}>{item.products.price} x {item.quantity}</Text>
                     </View>
                     <TouchableOpacity onPress={() => removeItem(item.id)}>
                        <Ionicons name="trash-outline" size={18} color="#FF3B30" />
                     </TouchableOpacity>
                  </View>
                ))}

                <View style={styles.bizFooter}>
                    <View>
                        <Text style={styles.totalLabel}>Subtotal</Text>
                        <Text style={styles.totalValue}>KES {groupedItems[bizId].total.toLocaleString()}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.checkoutBtn}
                      onPress={() => router.push({
                        pathname: '/checkout',
                        params: { businessId: bizId, total: groupedItems[bizId].total }
                      })}
                    >
                        <Text style={styles.checkoutText}>Checkout</Text>
                    </TouchableOpacity>
                </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: Colors.surfaceElevated },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '900' },
  scroll: { padding: 15 },
  empty: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: Colors.textSecondary, fontSize: 16, marginTop: 20, fontWeight: '600' },
  bizGroup: { backgroundColor: Colors.surface, borderRadius: 20, padding: 15, marginBottom: 20, borderWidth: 1, borderColor: Colors.border },
  bizHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 15, borderBottomWidth: 1, borderBottomColor: Colors.border, paddingBottom: 10 },
  bizName: { color: Colors.primary, fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  itemImg: { width: 50, height: 50, borderRadius: 10, backgroundColor: Colors.surfaceElevated },
  itemInfo: { flex: 1, marginLeft: 12 },
  itemName: { color: '#fff', fontSize: 15, fontWeight: '700' },
  itemPrice: { color: Colors.textSecondary, fontSize: 13, marginTop: 2 },
  bizFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 15, borderTopWidth: 1, borderTopColor: Colors.border },
  totalLabel: { color: Colors.textSecondary, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  totalValue: { color: '#fff', fontSize: 18, fontWeight: '900' },
  checkoutBtn: { backgroundColor: Colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  checkoutText: { color: '#000', fontWeight: '900', fontSize: 13 }
});
