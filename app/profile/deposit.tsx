import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../src/core/network/supabase';
import { useAuthStore } from '../../src/store/useAuthStore';
import { IntasendService } from '../../src/services/IntasendService';
import { ErrorHandler } from '../../src/core/error_handler/ErrorHandler';
import { Colors } from '../../src/core/theme/colors';

export default function DepositScreen() {
  const router = useRouter();
  const session = useAuthStore((state) => state.session);
  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const fetchUserData = React.useCallback(async () => {
    try {
      if (!session?.user.id) return;
      const { data } = await supabase
        .from('profiles')
        .select('phone')
        .eq('id', session.user.id)
        .single();

      if (data?.phone) setPhone(data.phone);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [session?.user.id]);

  const handleDeposit = async () => {
    const numAmount = parseFloat(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount to deposit.');
      return;
    }

    if (!phone.match(/^254[0-9]{9}$/)) {
      Alert.alert('Invalid Number', 'Please enter a valid M-Pesa number starting with 254...');
      return;
    }

    try {
      setProcessing(true);
      if (!session?.user.id) return;

      const response = await IntasendService.initiateStkPush(numAmount, phone, session.user.id);

      if (response) {
        Alert.alert(
          'STK Push Sent',
          'Please enter your M-Pesa PIN on your phone to complete the deposit.',
          [{ text: 'OK', onPress: () => router.back() }],
        );
      }
    } catch (e) {
      ErrorHandler.handle(e, 'DepositSTK');
      Alert.alert('Deposit Failed', 'Could not initiate M-Pesa STK Push. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Add Funds</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.infoBox}>
          <Ionicons name="flash-outline" size={24} color={Colors.primary} />
          <Text style={styles.infoText}>
            Instant top-up via M-Pesa STK Push. Enter amount and confirm on your phone.
          </Text>
        </View>

        <Text style={styles.label}>Deposit Amount (USD)</Text>
        <TextInput
          style={styles.input}
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          placeholder="e.g. 10.00"
          placeholderTextColor="#444"
        />

        <Text style={[styles.label, { marginTop: 25 }]}>M-Pesa Phone Number</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          placeholder="2547XXXXXXXX"
          placeholderTextColor="#444"
        />
        <Text style={styles.hint}>Format: 2547XXXXXXXX</Text>

        <TouchableOpacity
          style={[styles.btn, processing && { opacity: 0.5 }]}
          onPress={handleDeposit}
          disabled={processing}
        >
          {processing ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.btnText}>Initiate Deposit</Text>
          )}
        </TouchableOpacity>

        <View style={styles.secureBadge}>
          <Ionicons name="shield-checkmark" size={14} color="#555" />
          <Text style={styles.secureText}>Secured by IntaSend Gateway</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050508' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  title: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  content: { padding: 25 },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,208,132,0.1)',
    padding: 20,
    borderRadius: 20,
    marginBottom: 35,
    gap: 15,
    alignItems: 'center',
  },
  infoText: { flex: 1, color: '#00D084', fontSize: 13, lineHeight: 18, fontWeight: '600' },
  label: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    marginBottom: 10,
    letterSpacing: 1,
  },
  input: {
    backgroundColor: '#0E0E14',
    padding: 20,
    borderRadius: 16,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    fontWeight: '700',
  },
  hint: { color: '#444', fontSize: 11, marginTop: 8, marginLeft: 5 },
  btn: {
    backgroundColor: '#00D084',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 40,
    shadowColor: '#00D084',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  btnText: { color: '#000', fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },
  secureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
    gap: 6,
  },
  secureText: { color: '#555', fontSize: 11, fontWeight: '700' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#050508' },
});
