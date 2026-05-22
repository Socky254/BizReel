import { Post, Story } from '../models';

export interface IFeedRepository {
  getFeed(algorithm: string): Promise<Post[]>;
  toggleLike(postId: string, userId: string, postOwnerId: string): Promise<void>;
  incrementView(postId: string): Promise<void>;
  getStories(userId?: string): Promise<Story[]>;
}
