import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserPattern } from '../src/domain/models/intelligence'; // Defining separately for clean domain

const INTEL_CACHE_KEY = 'BIZREEL_USER_INTEL';

export const trackActivity = async (userId: string, action: string, metadata: any) => {
  try {
    await supabase.from('activity_logs').insert({ user_id: userId, action, metadata });
  } catch (e) {
    console.error('Intelligence tracking error:', e);
  }
};

export const getUserIntelligence = async (userId: string, businessName: string): Promise<any> => {
  const cached = await AsyncStorage.getItem(INTEL_CACHE_KEY + userId);
  const initialData = cached ? JSON.parse(cached) : null;

  // CACHE POLICY: Only refresh intelligence every 1 hour to save costs/performance
  if (initialData && initialData.timestamp && Date.now() - initialData.timestamp < 3600000) {
      return initialData;
  }

  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: logs } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('user_id', userId)
      .gt('created_at', thirtyDaysAgo)
      .order('created_at', { ascending: false })
      .limit(50);

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
    let progress = 20;
    if (profile?.avatar_url) progress += 20;
    if (profile?.bio) progress += 20;
    if (profile?.category && profile.category !== 'Other') progress += 20;

    const { count: postCount } = await supabase.from('posts').select('*', { count: 'exact', head: true }).eq('user_id', userId);
    if (postCount && postCount > 0) progress += 20;

    const pattern = {
      greeting: `Welcome, ${businessName}!`,
      suggestion: "Check your business trends.",
      mentorAdvice: "Focus on networking today.",
      setupProgress: progress,
      isNewUser: (logs?.length || 0) < 15,
      timestamp: Date.now()
    };

    await AsyncStorage.setItem(INTEL_CACHE_KEY + userId, JSON.stringify(pattern));
    return pattern;
  } catch (e) {
    return initialData || { greeting: `Welcome, ${businessName}`, setupProgress: 0, isNewUser: true };
  }
};
