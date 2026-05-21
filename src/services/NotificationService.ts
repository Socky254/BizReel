import { supabase } from '../lib/supabase';

export interface Notification {
  id: string;
  receiver_id: string;
  sender_id: string;
  type: 'like' | 'comment' | 'follow' | 'save' | 'order_paid' | 'live_started' | 'partner_connection';
  post_id?: string;
  is_read: boolean;
  created_at: string;
  sender?: {
    username: string;
    business_name: string;
    avatar_url: string;
  };
}

export class NotificationService {
  static async getNotifications(userId: string): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*, sender:profiles!sender_id(username, business_name, avatar_url)')
      .eq('receiver_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
    return data as Notification[];
  }

  static async markAsRead(notificationId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) console.error('Error marking notification as read:', error);
  }

  static async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
    return count || 0;
  }
}
