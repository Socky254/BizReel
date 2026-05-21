import { supabase } from '../../core/network/supabase';
import { Product } from '../../domain/models';

export class MarketplaceRepositoryImpl {
  async getProducts(businessId?: string): Promise<Product[]> {
    try {
      let query = supabase.from('products').select('*, profiles(*)');
      if (businessId) query = query.eq('business_id', businessId);

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;

      return (data || []) as Product[];
    } catch (e) {
      console.error("MarketplaceRepo Error (getProducts):", e);
      return [];
    }
  }

  async getProductById(id: string): Promise<Product | null> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, profiles(*)')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Product;
    } catch (e) {
      console.error("MarketplaceRepo Error (getProductById):", e);
      return null;
    }
  }

  async createProduct(userId: string, product: { name: string, description: string, price: string, imageUri: string }) {
    // 1. Upload Image to 'products' bucket
    const fileName = `${userId}/${Date.now()}_prod.jpg`;

    // We use fetch to get the blob from the local URI for reliable uploading
    const response = await fetch(product.imageUri);
    const blob = await response.blob();

    const { error: uploadError } = await supabase.storage
      .from('products')
      .upload(fileName, blob);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('products')
      .getPublicUrl(fileName);

    // 2. Insert into DB
    const { data, error } = await supabase.from('products').insert({
      business_id: userId,
      name: product.name,
      description: product.description,
      price: product.price,
      image_url: publicUrl
    }).select().single();

    if (error) throw error;
    return data;
  }

  async addToCart(userId: string, productId: string) {
    const { error } = await supabase.from('cart').insert({
      user_id: userId,
      product_id: productId,
      quantity: 1
    });

    // Handle unique constraint (already in cart)
    if (error && error.code !== '23505') throw error;
  }

  async createSyndicate(userId: string, productId: string, targetQty: number, discountPrice: number, expiryDays: number) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiryDays);

    const { data, error } = await supabase.from('syndicates').insert({
      creator_id: userId,
      product_id: productId,
      target_quantity: targetQty,
      discount_price: discountPrice,
      expires_at: expiresAt.toISOString(),
    }).select().single();

    if (error) throw error;
    return data;
  }
}
