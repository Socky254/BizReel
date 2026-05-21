import { IVerificationRepository, VerificationRequest } from '../../domain/repositories/IVerificationRepository';
import { supabase } from '../../core/network/supabase';

export class VerificationRepositoryImpl implements IVerificationRepository {
  async submitRequest(userId: string, documentUri: string): Promise<VerificationRequest> {
    // 1. Upload Document to Storage
    const fileName = `${userId}/${Date.now()}_doc.pdf`; // Assuming PDF or Image

    // We use fetch to get the blob from the local URI for reliable uploading in React Native
    const response = await fetch(documentUri);
    const blob = await response.blob();

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('verification')
      .upload(fileName, blob);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('verification')
      .getPublicUrl(fileName);

    // 2. Create DB Entry
    const { data, error } = await supabase
      .from('verification_requests')
      .insert({
        user_id: userId,
        business_doc_url: publicUrl,
        status: 'pending'
      })
      .select('*')
      .single();

    if (error) throw error;

    // 3. Update Profile status to 'pending' to show UI feedback immediately
    await supabase.from('profiles').update({ verification_status: 'pending' }).eq('id', userId);

    return data as VerificationRequest;
  }

  async getLatestRequest(userId: string): Promise<VerificationRequest | null> {
    const { data, error } = await supabase
      .from('verification_requests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data as VerificationRequest;
  }
}
