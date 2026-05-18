import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, StatusBar, Image, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/Context/AuthContext';

export default function CatalogScreen() {
  const { id } = useLocalSearchParams();
  const { session } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const isOwnProfile = session?.user?.id === id;

  useEffect(() => {
    fetchProducts();
  }, [id]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data } = await supabase.from('products').select('*').eq('business_id', id);
      setProducts(data || []);
    } finally {
      setLoading(false);
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
        if (error.code === '23505') { // Unique constraint violation
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Business Catalog</Text>
        {isOwnProfile ? (
          <TouchableOpacity onPress={() => Alert.alert("Add Product", "Product management is being integrated.")}>
            <Ionicons name="add-circle-outline" size={26} color="#00D084" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => router.push('/cart')}>
            <Ionicons name="cart-outline" size={26} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ActivityIndicator color="#00D084" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.item}>
              {item.image_url && <Image source={{ uri: item.image_url }} style={styles.img} />}
              <View style={styles.info}>
                <View style={styles.row}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.price}>{item.price}</Text>
                </View>
                <Text style={styles.desc}>{item.description}</Text>

                {!isOwnProfile && (
                  <TouchableOpacity style={styles.addToCartBtn} onPress={() => addToCart(item)}>
                    <Text style={styles.addToCartText}>Add to Cart</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No products found.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D12' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#1C1C24' },
  title: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  item: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#1C1C24', flexDirection: 'row' },
  img: { width: 90, height: 90, borderRadius: 12 },
  info: { flex: 1, marginLeft: 15 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { color: '#fff', fontSize: 16, fontWeight: '800' },
  price: { color: '#D4AF37', fontWeight: '900', fontSize: 15 },
  desc: { color: '#777', marginTop: 6, fontSize: 13, lineHeight: 18 },
  addToCartBtn: { backgroundColor: '#D4AF37', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, marginTop: 15, alignSelf: 'flex-start', shadowColor: '#D4AF37', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 5 },
  addToCartText: { color: '#000', fontSize: 13, fontWeight: '900' },
  empty: { color: '#555', textAlign: 'center', marginTop: 50 }
});
