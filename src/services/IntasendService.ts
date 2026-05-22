import { supabase } from '../lib/supabase';

export interface StkPushResponse {
  id: string;
  invoice: {
    invoice_id: string;
    state: string;
    amount: string;
    net_amount: string;
  };
  customer: any;
  payment_link: string;
}

export class IntasendService {
  /**
   * Triggers an M-Pesa STK Push via Supabase Edge Function
   */
  static async initiateStkPush(
    amount: number,
    phone: string,
    userId: string,
    orderId?: string,
  ): Promise<StkPushResponse> {
    const { data, error } = await supabase.functions.invoke('intasend-payments', {
      body: {
        action: 'stk-push',
        amount,
        phone: phone.startsWith('0') ? '254' + phone.substring(1) : phone, // Ensure 254 format
        userId,
        orderId,
      },
    });

    if (error) {
      console.error('Intasend Service Error:', error);
      throw new Error(error.message || 'Failed to initiate payment');
    }

    return data;
  }

  /**
   * Request a withdrawal (Send Money) via Supabase Edge Function
   */
  static async requestWithdrawal(amount: number, userId: string, phone: string) {
    // 1. First record the withdrawal in the database (this also checks balance via RPC)
    const { data: transactionId, error: rpcError } = await supabase.rpc('request_withdrawal', {
      p_user_id: userId,
      p_amount: amount,
      p_method: 'MPESA',
      p_details: { phone },
    });

    if (rpcError) throw rpcError;

    // 2. Trigger the actual disbursement via Edge Function
    const { data, error } = await supabase.functions.invoke('intasend-payments', {
      body: {
        action: 'withdraw',
        amount,
        userId,
        phone,
        transactionId,
      },
    });

    if (error) throw error;
    return data;
  }
}
