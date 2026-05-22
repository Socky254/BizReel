import { IChatRepository } from '../../domain/repositories/IChatRepository';
import { Message } from '../../domain/models';
import { supabase } from '../../core/network/supabase';

export class ChatRepositoryImpl implements IChatRepository {
  async getMessages(otherId: string, currentUserId: string): Promise<Message[]> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
        .or(`sender_id.eq.${otherId},receiver_id.eq.${otherId}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as Message[];
    } catch (e) {
      console.error('ChatRepo Error (getMessages):', e);
      return [];
    }
  }

  async sendMessage(receiverId: string, senderId: string, text: string): Promise<void> {
    const { error } = await supabase.from('messages').insert({
      sender_id: senderId,
      receiver_id: receiverId,
      text: text.trim(),
    });
    if (error) throw error;
  }

  subscribeToMessages(currentUserId: string, callback: (message: Message) => void): () => void {
    const subscription = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          if (
            payload.new.receiver_id === currentUserId ||
            payload.new.sender_id === currentUserId
          ) {
            callback(payload.new as unknown as Message);
          }
        },
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }
}
