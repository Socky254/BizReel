import { Message } from '../models';

export interface IChatRepository {
  getMessages(otherId: string, currentUserId: string): Promise<Message[]>;
  sendMessage(receiverId: string, senderId: string, text: string): Promise<void>;
  subscribeToMessages(currentUserId: string, callback: (message: Message) => void): () => void;
}
