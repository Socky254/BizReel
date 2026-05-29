import { Post } from '../domain/models';
import { FeedRepositoryImpl } from '../data/repositories/FeedRepositoryImpl';
import { supabase } from '../lib/supabase';
import { SyncService } from './SyncService';

const feedRepo = new FeedRepositoryImpl();

export const incrementViewCount = async (postId: string) => {
  await feedRepo.incrementView(postId);
};

export const toggleLike = async (postId: string, userId: string, isLiked: boolean) => {
  // Sync logic unified here
  await SyncService.enqueue(
    'like',
    { post_id: postId, user_id: userId },
    isLiked ? 'add' : 'remove',
  );
};

export const toggleSave = async (postId: string, userId: string, isSaved: boolean) => {
  // Sync logic unified here
  await SyncService.enqueue(
    'save',
    { post_id: postId, user_id: userId },
    isSaved ? 'add' : 'remove',
  );
};

export const deletePost = async (postId: string, videoUrl: string) => {
  try {
    const { error: dbError } = await supabase.from('posts').delete().eq('id', postId);
    if (dbError) throw dbError;

    const urlParts = videoUrl.split('/reels/');
    if (urlParts.length > 1) {
      const filePath = urlParts[1];
      await supabase.storage.from('reels').remove([filePath]);
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
};

export const deleteStory = async (storyId: string, mediaUrl: string) => {
  try {
    const { error: dbError } = await supabase.from('stories').delete().eq('id', storyId);
    if (dbError) throw dbError;

    const urlParts = mediaUrl.split('/stories/');
    if (urlParts.length > 1) {
      const filePath = urlParts[1];
      await supabase.storage.from('stories').remove([filePath]);
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
};

export const updatePost = async (postId: string, updates: { caption?: string }) => {
  try {
    const { error } = await supabase.from('posts').update(updates).eq('id', postId);
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
};
