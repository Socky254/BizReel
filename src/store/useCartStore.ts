import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  name: string;
  price: string;
  image_url?: string;
}

interface CartState {
  items: CartItem[];
  loading: boolean;
  total: number;
  fetchCart: (userId: string) => Promise<void>;
  addItem: (userId: string, productId: string) => Promise<void>;
  removeItem: (userId: string, productId: string) => Promise<void>;
  clearCart: () => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  loading: false,
  total: 0,

  fetchCart: async (userId: string) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('cart')
        .select('*, products(*)')
        .eq('user_id', userId);

      if (error) throw error;

      const cartItems: CartItem[] = data.map((item: any) => ({
        id: item.id,
        product_id: item.product_id,
        quantity: item.quantity,
        name: item.products.name,
        price: item.products.price,
        image_url: item.products.image_url,
      }));

      const total = cartItems.reduce((acc, item) => {
        const priceStr = item.price || '0';
        const price = parseFloat(priceStr.replace(/[^0-9.]/g, '')) || 0;
        return acc + price * item.quantity;
      }, 0);

      set({ items: cartItems, total, loading: false });
    } catch (e) {
      console.error('Fetch cart error:', e);
      set({ loading: false });
    }
  },

  addItem: async (userId: string, productId: string) => {
    try {
      const { error } = await supabase
        .from('cart')
        .upsert({ user_id: userId, product_id: productId }, { onConflict: 'user_id,product_id' });

      if (error) throw error;
      await get().fetchCart(userId);
    } catch (e) {
      console.error('Add to cart error:', e);
    }
  },

  removeItem: async (userId: string, productId: string) => {
    try {
      const { error } = await supabase
        .from('cart')
        .delete()
        .eq('user_id', userId)
        .eq('product_id', productId);

      if (error) throw error;
      await get().fetchCart(userId);
    } catch (e) {
      console.error('Remove from cart error:', e);
    }
  },

  clearCart: () => set({ items: [], total: 0 }),
}));
