import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const INTEL_CACHE_KEY = 'BIZREEL_USER_INTEL';

export interface StrategyInsight {
    title: string;
    insight: string;
    action: string;
}

export class IntelligenceService {
  /**
   * Tracks a user's action for later AI analysis.
   */
  static async trackActivity(userId: string, action: string, metadata: any = {}) {
    try {
      await supabase.from('activity_logs').insert({
          user_id: userId,
          action,
          metadata: { ...metadata, platform: 'mobile', timestamp: new Date().toISOString() }
      });
    } catch (e) {
      console.error('Intelligence tracking error:', e);
    }
  }

  /**
   * Generates predictive business strategy insights using historical data.
   */
  static async getStrategyIntelligence(userId: string): Promise<StrategyInsight[]> {
    try {
      // 1. Fetch Advanced Analytics from RPC
      const { data: analytics, error } = await supabase.rpc('get_advanced_business_analytics', {
        target_user_id: userId
      });

      if (error || !analytics) throw error;

      // 2. Logic-based insight generation (Simulating AI logic)
      const insights: StrategyInsight[] = [];
      const stats = analytics.stats;

      if (stats.engagement_rate > 5) {
        insights.push({
          title: "High Capital Velocity",
          insight: "Your content is generating engagement 2x higher than the sector average.",
          action: "Increase post frequency to 3x weekly to maintain momentum."
        });
      }

      if (stats.total_views > 1000 && stats.conversion_rate < 1) {
        insights.push({
          title: "Conversion Bottleneck",
          insight: "High reach but low partnership conversion detected in your recent reels.",
          action: "Add a clearer Call-to-Action (CTA) in your video descriptions."
        });
      }

      if (stats.total_reposts > 10) {
          insights.push({
            title: "Network Authority Rising",
            insight: "Your reels are being shared within top-tier professional circles.",
            action: "Consider launching a 'Syndicate Group Buy' for your best-selling product."
          });
      }

      // Default insight if none generated
      if (insights.length === 0) {
          insights.push({
            title: "Market Entry Optimization",
            insight: "Your digital footprint is currently in the 'Warm-up' phase.",
            action: "Upload 3 more reels this week to trigger the discovery algorithm."
          });
      }

      return insights;
    } catch (e) {
      console.error("Failed to generate strategy intelligence:", e);
      return [{
          title: "Network Syncing",
          insight: "Intelligence algorithms are currently processing your market data.",
          action: "Continue your current activity to provide more data points."
      }];
    }
  }

  /**
   * Simple profile setup progress tracker
   */
  static async getSetupProgress(userId: string): Promise<number> {
    try {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
        let progress = 20; // Default for signup
        if (profile?.avatar_url) progress += 20;
        if (profile?.bio) progress += 20;
        if (profile?.category && profile.category !== 'Other') progress += 20;

        const { count } = await supabase.from('posts').select('*', { count: 'exact', head: true }).eq('user_id', userId);
        if (count && count > 0) progress += 20;

        return progress;
    } catch (e) {
        return 0;
    }
  }

  /**
   * Calls the AI Gateway Edge Function for RAG-based content generation or mentor responses.
   */
  static async getAIMentorResponse(userMessage: string): Promise<string> {
    try {
      const { data, error } = await supabase.functions.invoke('ai-gateway', {
        body: { task: 'CONTENT_GEN', payload: { userMessage } }
      });
      if (error) throw error;
      return data.caption;
    } catch (e) {
      console.error('AI Mentor Error:', e);
      return "I'm having trouble connecting to my central logic right now. Please try again.";
    }
  }
}


