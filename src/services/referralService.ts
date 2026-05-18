import { supabase } from '../lib/supabase';

export const referPost = async (postId: string, userId: string, postOwnerId: string) => {
  try {
    // 1. Create the referral entry
    const { error: referralError } = await supabase
      .from('reposts')
      .insert({
        post_id: postId,
        user_id: userId
      });

    if (referralError) throw referralError;

    return { success: true };
  } catch (err: any) {
    console.error('Referral error:', err);
    return { success: false, error: err.message };
  }
};

export const fetchReferrals = async (userId: string) => {
  const { data, error } = await supabase
    .from('reposts')
    .select('*, posts(*, profiles(*))')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data.map(item => item.posts);
};
