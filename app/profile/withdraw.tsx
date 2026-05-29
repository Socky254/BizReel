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
import { container } from '../../src/di/Container';
import { IntasendService } from '../../src/services/IntasendService';
import { ErrorHandler } from '../../src/core/error_handler/ErrorHandler';
import { Colors } from '../../src/core/theme/colors';
import { Wallet } from '../../src/domain/models/Finance';

export default function WithdrawScreen() {
  const router = useRouter();
  const session = useAuthStore((state) => state.session);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const fetchData = React.useCallback(async () => {
    try {
      if (!session?.user.id) return;
      const [wData, pData] = await Promise.all([
        container.financeRepository.getWallet(session.user.id),
        supabase.from('profiles').select('phone').eq('id', session.user.id).single(),
      ]);

      setWallet(wData);
      if (pData.data?.phone) setPhone(pData.data.phone);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [session?.user.id]);

  const handleWithdraw = async () => {
    const numAmount = parseFloat(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount to withdraw.');
      return;
    }

    if (wallet && numAmount > wallet.balance) {
      Alert.alert('Insufficient Balance', 'You cannot withdraw more than your available balance.');
      return;
    }

    if (!phone.match(/^254[0-9]{9}$/)) {
      Alert.alert('Invalid Number', 'Please enter a valid M-Pesa number starting with 254...');
      return;
    }

    try {
      setProcessing(true);
      if (!session?.user.id) return;

      const response = await IntasendService.requestWithdrawal(numAmount, session.user.id, phone);

      if (response) {
        Alert.alert(
          'Withdrawal Initiated',
          'Your withdrawal request has been submitted and is being processed.',
          [{ text: 'OK', onPress: () => router.back() }],
        );
      }
    } catch (e: any) {
      ErrorHandler.handle(e, 'WithdrawalRequest');
      Alert.alert(
        'Withdrawal Failed',
        e.message || 'Could not process withdrawal. Please try again.',
      );
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
        <Text style={styles.title}>Withdraw Funds</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.balanceInfo}>
          <Text style={styles.balanceLabel}>Available for Withdrawal</Text>
          <Text style={styles.balanceValue}>
            {wallet?.currency || '$'}
            {wallet?.balance?.toFixed(2) || '0.00'}
          </Text>
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color="#00D084" />
          <Text style={styles.infoText}>
            Withdrawals are processed instantly to your M-Pesa number. Standard transaction fees may
            apply.
          </Text>
        </View>

        <Text style={styles.label}>Withdraw Amount (USD)</Text>
        <TextInput
          style={styles.input}
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          placeholder="0.00"
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
          onPress={handleWithdraw}
          disabled={processing}
        >
          {processing ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.btnText}>Request Withdrawal</Text>
          )}
        </TouchableOpacity>
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
  balanceInfo: {
    backgroundColor: '#0E0E14',
    padding: 25,
    borderRadius: 24,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  balanceValue: { color: '#fff', fontSize: 32, fontWeight: '900', marginTop: 10 },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,208,132,0.05)',
    padding: 15,
    borderRadius: 12,
    marginBottom: 30,
    gap: 12,
    alignItems: 'center',
  },
  infoText: { flex: 1, color: '#00D084', fontSize: 12, lineHeight: 18, fontWeight: '600' },
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
    padding: 18,
    borderRadius: 16,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    fontWeight: '700',
  },
  hint: { color: '#444', fontSize: 11, marginTop: 8, marginLeft: 5 },
  btn: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 40,
  },
  btnText: { color: '#000', fontSize: 16, fontWeight: '900' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#050508' },
});
