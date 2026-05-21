export interface Wallet {
  user_id: string;
  balance: number;
  pending_balance: number;
  currency: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  sender_id: string;
  receiver_id: string;
  amount: number;
  fee_amount: number;
  type: 'purchase' | 'subscription' | 'withdrawal' | 'boost';
  status: 'pending' | 'completed' | 'failed' | 'escrow';
  metadata: any;
  created_at: string;
}
