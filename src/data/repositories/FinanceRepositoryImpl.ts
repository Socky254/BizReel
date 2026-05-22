import { supabase } from '../../core/network/supabase';
import { Wallet, Transaction } from '../../domain/models/Finance';
import { IntasendService } from '../../services/IntasendService';

export class FinanceRepositoryImpl {
  async getWallet(userId: string): Promise<Wallet | null> {
    try {
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return data as Wallet;
    } catch (e) {
      console.error('FinanceRepo Error (getWallet):', e);
      return null;
    }
  }

  async getTransactions(userId: string): Promise<Transaction[]> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as Transaction[];
    } catch (e) {
      console.error('FinanceRepo Error (getTransactions):', e);
      return [];
    }
  }

  async initiatePurchase(buyerId: string, sellerId: string, amount: number) {
    // This is now largely handled by the Checkout flow calling IntasendService
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        user_id: buyerId,
        amount: amount,
        type: 'purchase',
        status: 'pending',
        provider: 'intasend',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async requestWithdrawal(userId: string, amount: number, phone: string) {
    return await IntasendService.requestWithdrawal(amount, userId, phone);
  }
}
