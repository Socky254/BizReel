import { IProfileRepository } from '../../domain/repositories/IProfileRepository';
import { Profile, Post } from '../../domain/models';
import { supabase } from '../../core/network/supabase';
import { ProfileMapper } from '../mappers/ProfileMapper';
import { PostMapper } from '../mappers/PostMapper';

export class ProfileRepositoryImpl implements IProfileRepository {
  async getProfile(id: string): Promise<Profile | null> {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      return data ? ProfileMapper.toDomain(data) : null;
    } catch (e) {
      console.error("ProfileRepo Error (getProfile):", e);
      return null;
    }
  }

  async updateProfile(id: string, updates: Partial<Profile>): Promise<void> {
    const { error } = await supabase.from('profiles').update(updates).eq('id', id);
    if (error) throw error;
  }

  async getUserReels(userId: string): Promise<Post[]> {
    try {
      const { data, error } = await supabase.from('posts').select('*, profiles(*)').eq('user_id', userId).order('created_at', { ascending: false });
      if (error) throw error;
      return PostMapper.toDomainList(data || []);
    } catch (e) {
      console.error("ProfileRepo Error (getUserReels):", e);
      return [];
    }
  }

  async getLikedReels(userId: string): Promise<Post[]> {
    try {
      const { data, error } = await supabase.from('likes').select('post_id, posts(*, profiles(*))').eq('user_id', userId).order('created_at', { ascending: false });
      if (error) throw error;
      const rawPosts = (data || []).map((item: any) => item.posts).filter((p: any) => p !== null);
      return PostMapper.toDomainList(rawPosts);
    } catch (e) {
      console.error("ProfileRepo Error (getLikedReels):", e);
      return [];
    }
  }

  async getSavedReels(userId: string): Promise<Post[]> {
    try {
      const { data, error } = await supabase.from('saved_posts').select('post_id, posts(*, profiles(*))').eq('user_id', userId).order('created_at', { ascending: false });
      if (error) throw error;
      const rawPosts = (data || []).map((item: any) => item.posts).filter((p: any) => p !== null);
      return PostMapper.toDomainList(rawPosts);
    } catch (e) {
      console.error("ProfileRepo Error (getSavedReels):", e);
      return [];
    }
  }

  async getReferrals(userId: string): Promise<Post[]> {
    try {
      const { data, error } = await supabase.from('reposts').select('post_id, posts(*, profiles(*))').eq('user_id', userId).order('created_at', { ascending: false });
      if (error) throw error;
      const rawPosts = (data || []).map((item: any) => item.posts).filter((p: any) => p !== null);
      return PostMapper.toDomainList(rawPosts);
    } catch (e) {
      console.error("ProfileRepo Error (getReferrals):", e);
      return [];
    }
  }

  async uploadReel(userId: string, videoUri: string, caption: string): Promise<Post> {
    // 1. Generate filename
    const fileName = `${userId}/${Date.now()}.mp4`;

    // 2. Upload to Supabase Storage (Assumes 'reels' bucket exists)
    const formData = new FormData();
    formData.append('file', {
      uri: videoUri,
      name: 'video.mp4',
      type: 'video/mp4',
    } as any);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('reels')
      .upload(fileName, formData);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('reels')
      .getPublicUrl(fileName);

    // 3. Create DB Record
    const { data, error } = await supabase.from('posts').insert({
      user_id: userId,
      video_url: publicUrl,
      caption: caption
    }).select('*, profiles(*)').single();

    if (error) throw error;
    return PostMapper.toDomain(data);
  }

  async getFollowStats(userId: string): Promise<{ followers: number; following: number }> {
    const [followersRes, followingRes] = await Promise.all([
      supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', userId),
      supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId),
    ]);
    return {
      followers: followersRes.count || 0,
      following: followingRes.count || 0,
    };
  }

  async getMutualCount(userId1: string, userId2: string): Promise<number> {
    if (userId1 === userId2) return 0;
    // Common businesses both users are "connected" to (following)
    const { data, error } = await supabase.rpc('get_mutual_connections_count', {
      user_id_a: userId1,
      user_id_b: userId2
    });
    if (error) {
      console.error("Mutual Count Error:", error);
      return 0;
    }
    return data || 0;
  }

  async getPartnersCount(userId: string): Promise<number> {
    const { data, error } = await supabase.rpc('get_partners_count', { u_id: userId });
    if (error) return 0;
    return data || 0;
  }

  async getAnalytics(userId: string): Promise<any> {
    const { data, error } = await supabase.rpc('get_advanced_business_analytics', { target_user_id: userId });
    if (error) {
      console.error("Advanced Analytics Error:", error);
      return null;
    }
    return data;
  }
}
