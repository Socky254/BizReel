import { IFeedRepository } from '../../domain/repositories/IFeedRepository';
import { Post } from '../../domain/models';
import { supabase } from '../../core/network/supabase';
import { PostMapper } from '../mappers/PostMapper';

export class FeedRepositoryImpl implements IFeedRepository {
  async getFeed(algorithm: string): Promise<Post[]> {
    try {
      let query = supabase.from('posts').select('*, profiles(*), likes(user_id), comments(id)');

      if (algorithm === 'trending') {
        query = query.order('views', { ascending: false });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;
      if (error) throw error;

      // Use Mapper to transform DTO to Domain Model (Architecture Principle 3)
      return PostMapper.toDomainList(data || []);
    } catch (e) {
      console.error("Data Layer Error: Falling back to empty state", e);
      return [];
    }
  }

  async toggleLike(postId: string, userId: string, postOwnerId: string): Promise<void> {
    await supabase.from('likes').upsert({ post_id: postId, user_id: userId });
  }

  async incrementView(postId: string): Promise<void> {
    await supabase.rpc('increment_view_count', { post_id: postId });
  }
}
