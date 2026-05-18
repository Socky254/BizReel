export interface Profile {
  id: string;
  username: string;
  business_name?: string;
  category?: string;
  bio?: string;
  website?: string;
  location?: string;
  phone?: string;
  working_hours?: string;
  avatar_url?: string;
  push_token?: string;
  mfa_enabled?: boolean;
  is_verified?: boolean;
  is_live?: boolean;
  is_private?: boolean;
  allow_downloads?: boolean;
  show_active_status?: boolean;
  dm_setting?: string;
  updated_at?: string;
  created_at?: string;
}

export interface Post {
  id: string;
  user_id: string;
  video_url: string;
  caption?: string;
  category?: string;
  views?: number;
  shares?: number;
  is_sponsored?: boolean;
  created_at: string;
  profiles?: Profile;
  likes?: { user_id: string }[];
  comments?: { id: string }[];
  isSaved?: boolean;
}

export interface Product {
  id: string;
  business_id: string;
  name: string;
  description?: string;
  price?: string;
  image_url?: string;
  created_at: string;
  profiles?: Profile;
}

export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  products?: Product;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  parent_id?: string;
  content: string;
  created_at: string;
  edited_at?: string;
  profiles?: Profile;
  comment_likes?: { user_id: string }[];
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  text: string;
  is_read: boolean;
  created_at: string;
  edited_at?: string;
  sender_profile?: Profile;
  message_likes?: { user_id: string }[];
}

export interface Notification {
  id: string;
  receiver_id: string;
  sender_id: string;
  type: 'like' | 'comment' | 'follow' | 'referral' | 'mention';
  post_id?: string;
  is_read: boolean;
  created_at: string;
  sender?: Profile;
}

export interface LiveSession {
  id: string;
  user_id: string;
  title?: string;
  is_active: boolean;
  viewer_count: number;
  created_at: string;
  ended_at?: string;
  profiles?: Profile;
}
