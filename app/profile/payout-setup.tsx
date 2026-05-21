import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../src/core/network/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { ErrorHandler } from '../../src/core/error_handler/ErrorHandler';

export default function PayoutSetupScreen() {
  const router = useRouter();
  const session = useAuthStore((state) => state.session);
  const [mpesaNumber, setMpesaNumber] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCurrentDetails();
  }, []);

  const fetchCurrentDetails = async () => {
    try {
      if (!session?.user.id) return;
      const { data, error } = await supabase
        .from('profiles')
        .select('phone')
        .eq('id', session.user.id)
        .single();

      if (data?.phone) setMpesaNumber(data.phone);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!mpesaNumber.match(/^254[0-9]{9}$/)) {
      Alert.alert("Invalid Number", "Please enter a valid M-Pesa number starting with 254...");
      return;
    }

    try {
      setSaving(true);
      const { error } = await supabase
        .from('profiles')
        .update({ phone: mpesaNumber })
        .eq('id', session?.user.id);

      if (error) throw error;

      Alert.alert("Success", "Payout details updated. All future withdrawals will be sent to this number.", [
        { text: "OK", onPress: () => router.back() }
      ]);
    } catch (e) {
      ErrorHandler.handle(e, 'SavePayout');
      Alert.alert("Error", "Failed to save payout details.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator color="#00D084" size="large" /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.title}>Payout Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.infoBox}>
            <Ionicons name="cash-outline" size={24} color="#00D084" />
            <Text style={styles.infoText}>Funds from the marketplace are sent to this M-Pesa number after the buyer confirms receipt.</Text>
        </View>

        <Text style={styles.label}>M-Pesa Number (Recipient)</Text>
        <TextInput
          style={styles.input}
          value={mpesaNumber}
          onChangeText={setMpesaNumber}
          keyboardType="phone-pad"
          placeholder="254..."
          placeholderTextColor="#444"
        />
        <Text style={styles.hint}>Format: 2547XXXXXXXX</Text>

        <TouchableOpacity style={[styles.btn, saving && {opacity: 0.5}]} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="#000" /> : <Text style={styles.btnText}>Save Payout Details</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D12' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#1C1C24' },
  title: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  content: { padding: 25 },
  infoBox: { flexDirection: 'row', backgroundColor: 'rgba(0,208,132,0.1)', padding: 20, borderRadius: 16, marginBottom: 30, gap: 15 },
  infoText: { flex: 1, color: '#00D084', fontSize: 13, lineHeight: 18, fontWeight: '600' },
  label: { color: '#777', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', marginBottom: 10 },
  input: { backgroundColor: '#13131A', padding: 18, borderRadius: 12, color: '#fff', fontSize: 16, borderWidth: 1, borderColor: '#1C1C24' },
  hint: { color: '#444', fontSize: 12, marginTop: 8, marginLeft: 5 },
  btn: { backgroundColor: '#00D084', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 40 },
  btnText: { color: '#000', fontSize: 16, fontWeight: '900' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});
