import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { container } from '../../src/di/Container';
import { supabase } from '../../src/lib/supabase';
import { useAuthStore } from '../../src/store/useAuthStore';
import { Wallet, Transaction } from '../../src/domain/models/Finance';
import { ErrorHandler } from '../../src/core/error_handler/ErrorHandler';
import { SafeLinearGradient } from '../../src/components/SafeLinearGradient';

export default function WalletScreen() {
  const router = useRouter();
  const session = useAuthStore((state) => state.session);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadWalletData();

    if (session?.user?.id) {
      // REAL-TIME WALLET & TRANSACTION SYNC
      const walletChannel = supabase
        .channel(`wallet_sync_${session.user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'wallets',
            filter: `user_id=eq.${session.user.id}`,
          },
          () => {
            loadWalletData();
          },
        )
        .subscribe();

      const txChannel = supabase
        .channel(`tx_sync_${session.user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'transactions',
            filter: `user_id=eq.${session.user.id}`,
          },
          () => {
            loadWalletData();
          },
        )
        .subscribe();

      return () => {
        supabase.removeChannel(walletChannel);
        supabase.removeChannel(txChannel);
      };
    }
  }, [session?.user?.id]);

  const loadWalletData = async () => {
    if (!session?.user?.id) return;
    try {
      setLoading(true);
      const [wData, tData] = await Promise.all([
        container.financeRepository.getWallet(session.user.id),
        container.financeRepository.getTransactions(session.user.id),
      ]);
      setWallet(wData);
      setTransactions(tData);
    } catch (e) {
      ErrorHandler.handle(e, 'WalletLoad');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWalletData();
    setRefreshing(false);
  };

  const renderTransaction = ({ item }: { item: Transaction }) => {
    const isOutgoing = item.sender_id === session?.user?.id;
    return (
      <View style={styles.transactionItem}>
        <View
          style={[
            styles.iconBox,
            { backgroundColor: isOutgoing ? '#1C1C24' : 'rgba(0,208,132,0.1)' },
          ]}
        >
          <Ionicons
            name={isOutgoing ? 'arrow-up-outline' : 'arrow-down-outline'}
            size={20}
            color={isOutgoing ? '#777' : '#00D084'}
          />
        </View>
        <View style={styles.transactionInfo}>
          <Text style={styles.transactionType}>{item.type.toUpperCase()}</Text>
          <Text style={styles.transactionDate}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.transactionAmountBox}>
          <Text style={[styles.transactionAmount, { color: isOutgoing ? '#fff' : '#00D084' }]}>
            {isOutgoing ? '-' : '+'}${item.amount.toFixed(2)}
          </Text>
          <Text style={styles.transactionStatus}>{item.status}</Text>
        </View>
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.headerContent}>
      <SafeLinearGradient colors={['#00D084', '#00A86B']} style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Available Balance</Text>
        <Text style={styles.balanceValue}>
          {wallet?.currency || '$'}
          {wallet?.balance?.toFixed(2) || '0.00'}
        </Text>
        <View style={styles.pendingRow}>
          <Ionicons name="time-outline" size={14} color="rgba(0,0,0,0.5)" />
          <Text style={styles.pendingText}>
            Pending: {wallet?.currency || '$'}
            {wallet?.pending_balance?.toFixed(2) || '0.00'}
          </Text>
        </View>
      </SafeLinearGradient>

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/profile/deposit')}>
          <Ionicons name="add-circle-outline" size={24} color="#fff" />
          <Text style={styles.actionText}>Add Funds</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/profile/withdraw')}>
          <Ionicons name="wallet-outline" size={24} color="#fff" />
          <Text style={styles.actionText}>Withdraw</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.payoutSettingsBtn}
        onPress={() => router.push('/profile/payout-setup')}
      >
        <Ionicons name="settings-outline" size={18} color="#00D084" />
        <Text style={styles.payoutSettingsText}>M-Pesa Payout Settings</Text>
        <Ionicons name="chevron-forward" size={16} color="#444" style={{ marginLeft: 'auto' }} />
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Recent Transactions</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>BizReel Wallet</Text>
        <TouchableOpacity onPress={loadWalletData}>
          <Ionicons name="refresh-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator color="#00D084" size="large" />
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          renderItem={renderTransaction}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00D084" />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={48} color="#222" />
              <Text style={styles.emptyText}>No transactions yet</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050508' },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  navTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  headerContent: { padding: 20 },
  balanceCard: { padding: 25, borderRadius: 24, marginBottom: 20 },
  balanceLabel: {
    color: 'rgba(0,0,0,0.6)',
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  balanceValue: { color: '#000', fontSize: 36, fontWeight: '900', marginVertical: 10 },
  pendingRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  pendingText: { color: 'rgba(0,0,0,0.5)', fontSize: 13, fontWeight: '600' },
  actionRow: { flexDirection: 'row', gap: 15, marginBottom: 30 },
  actionBtn: {
    flex: 1,
    backgroundColor: '#0E0E14',
    padding: 15,
    borderRadius: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  actionText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  payoutSettingsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0E0E14',
    padding: 15,
    borderRadius: 16,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 12,
  },
  payoutSettingsText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '800', marginBottom: 15 },
  list: { paddingBottom: 40 },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0E0E14',
    padding: 15,
    borderRadius: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  iconBox: {
    width: 45,
    height: 45,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionInfo: { flex: 1, marginLeft: 15 },
  transactionType: { color: '#fff', fontSize: 14, fontWeight: '800' },
  transactionDate: { color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 2 },
  transactionAmountBox: { alignItems: 'flex-end' },
  transactionAmount: { fontSize: 16, fontWeight: '900' },
  transactionStatus: {
    color: 'rgba(255,255,255,0.2)',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 4,
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#050508' },
  emptyState: { alignItems: 'center', marginTop: 50 },
  emptyText: { color: 'rgba(255,255,255,0.2)', marginTop: 15, fontSize: 16, fontWeight: '600' },
});
