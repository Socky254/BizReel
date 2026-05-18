import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../core/theme/colors';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../../store/useAuthStore';

export const CheckoutScreen = () => {
    const { businessId, total } = useLocalSearchParams();
    const { user } = useAuthStore();
    const router = useRouter();

    const [loading, setLoading] = useState(false);
    const [address, setAddress] = useState({
        street: '',
        city: '',
        contactPhone: user?.phone || ''
    });
    const [paymentMethod, setPaymentMethod] = useState<'MPESA' | 'CARD'>('MPESA');

    const handlePlaceOrder = async () => {
        if (!address.street || !address.city || !address.contactPhone) {
            Alert.alert("Missing Info", "Please provide delivery details.");
            return;
        }

        try {
            setLoading(true);

            // 1. Process via RPC
            const { data: orderId, error } = await supabase.rpc('process_checkout', {
                p_buyer_id: user?.id,
                p_business_id: businessId,
                p_address: address,
                p_payment_method: paymentMethod
            });

            if (error) throw error;

            // 2. Mock Payment Processing (Simulating Gateway)
            if (paymentMethod === 'MPESA') {
                Alert.alert("STK Push Sent", "Please enter your M-Pesa PIN on your phone to complete payment.");
            }

            // 3. Log Transaction
            await supabase.from('transactions').insert({
                order_id: orderId,
                user_id: user?.id,
                amount: parseFloat(total as string),
                provider: paymentMethod.toLowerCase(),
                status: 'success' // In real app, this waits for webhook
            });

            Alert.alert("Order Placed!", "Your business order has been sent to the supplier.", [
                { text: "View Orders", onPress: () => router.replace('/(tabs)/market') }
            ]);

        } catch (e: any) {
            Alert.alert("Checkout Failed", e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.container}
        >
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Secure Checkout</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Delivery Details</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Street / Office Address"
                        placeholderTextColor={Colors.textTertiary}
                        value={address.street}
                        onChangeText={(t) => setAddress({ ...address, street: t })}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="City"
                        placeholderTextColor={Colors.textTertiary}
                        value={address.city}
                        onChangeText={(t) => setAddress({ ...address, city: t })}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Contact Phone Number"
                        placeholderTextColor={Colors.textTertiary}
                        keyboardType="phone-pad"
                        value={address.contactPhone}
                        onChangeText={(t) => setAddress({ ...address, contactPhone: t })}
                    />
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Payment Method</Text>
                    <View style={styles.paymentRow}>
                        <TouchableOpacity
                            style={[styles.payOption, paymentMethod === 'MPESA' && styles.payOptionActive]}
                            onPress={() => setPaymentMethod('MPESA')}
                        >
                            <Ionicons name="phone-portrait-outline" size={24} color={paymentMethod === 'MPESA' ? Colors.primary : Colors.textSecondary} />
                            <Text style={[styles.payText, paymentMethod === 'MPESA' && { color: Colors.primary }]}>M-Pesa</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.payOption, paymentMethod === 'CARD' && styles.payOptionActive]}
                            onPress={() => setPaymentMethod('CARD')}
                        >
                            <Ionicons name="card-outline" size={24} color={paymentMethod === 'CARD' ? Colors.primary : Colors.textSecondary} />
                            <Text style={[styles.payText, paymentMethod === 'CARD' && { color: Colors.primary }]}>Credit Card</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.summaryCard}>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Subtotal</Text>
                        <Text style={styles.summaryValue}>KES {total}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Delivery Fee</Text>
                        <Text style={styles.summaryValue}>KES 0.00</Text>
                    </View>
                    <View style={[styles.summaryRow, styles.totalRow]}>
                        <Text style={styles.totalLabel}>Grand Total</Text>
                        <Text style={styles.totalValue}>KES {total}</Text>
                    </View>
                </View>

                <TouchableOpacity
                    style={[styles.placeBtn, loading && { opacity: 0.7 }]}
                    onPress={handlePlaceOrder}
                    disabled={loading}
                >
                    {loading ? <ActivityIndicator color="#000" /> : (
                        <>
                            <Ionicons name="lock-closed" size={18} color="#000" style={{ marginRight: 10 }} />
                            <Text style={styles.placeBtnText}>CONFIRM ORDER</Text>
                        </>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: Colors.surfaceElevated },
    headerTitle: { color: '#fff', fontSize: 18, fontWeight: '900' },
    content: { padding: 20 },
    section: { marginBottom: 30 },
    sectionTitle: { color: Colors.primary, fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 15 },
    input: { backgroundColor: Colors.surface, borderRadius: 12, padding: 15, color: '#fff', fontSize: 15, borderWidth: 1, borderColor: Colors.border, marginBottom: 12 },
    paymentRow: { flexDirection: 'row', gap: 12 },
    payOption: { flex: 1, backgroundColor: Colors.surface, padding: 15, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', gap: 8 },
    payOptionActive: { borderColor: Colors.primary, backgroundColor: 'rgba(0, 200, 83, 0.05)' },
    payText: { color: Colors.textSecondary, fontSize: 13, fontWeight: '700' },
    summaryCard: { backgroundColor: Colors.surface, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: Colors.border, marginBottom: 30 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    summaryLabel: { color: Colors.textSecondary, fontSize: 14 },
    summaryValue: { color: '#fff', fontWeight: '700' },
    totalRow: { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 15, marginTop: 5 },
    totalLabel: { color: '#fff', fontSize: 16, fontWeight: '900' },
    totalValue: { color: Colors.primary, fontSize: 18, fontWeight: '900' },
    placeBtn: { backgroundColor: Colors.primary, padding: 18, borderRadius: 15, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
    placeBtnText: { color: '#000', fontSize: 16, fontWeight: '900', letterSpacing: 1 }
});
