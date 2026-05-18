import { Profile, Post } from '../models';

export interface IProfileRepository {
  getProfile(id: string): Promise<Profile | null>;
  updateProfile(id: string, updates: Partial<Profile>): Promise<void>;
  getUserReels(userId: string): Promise<Post[]>;
  getLikedReels(userId: string): Promise<Post[]>;
  getSavedReels(userId: string): Promise<Post[]>;
  getReferrals(userId: string): Promise<Post[]>;
  uploadReel(userId: string, videoUri: string, caption: string): Promise<Post>;
  getFollowStats(userId: string): Promise<{ followers: number; following: number }>;
  getMutualCount(userId1: string, userId2: string): Promise<number>;
  getPartnersCount(userId: string): Promise<number>;
  getAnalytics(userId: string): Promise<any>;
}
