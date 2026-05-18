import { Profile, Product } from './index';

export interface LiveSession {
    id: string;
    user_id: string;
    title: string;
    is_active: boolean;
    viewer_count: number;
    stream_key?: string;
    playback_url?: string;
    thumbnail_url?: string;
    created_at: string;
    ended_at?: string;
    profiles?: Profile;
}

export interface LiveComment {
    id: string;
    session_id: string;
    user_id: string;
    content: string;
    created_at: string;
    profiles?: {
        username: string;
        avatar_url: string;
    };
}

export interface LiveProduct {
    id: string;
    session_id: string;
    product_id: string;
    is_pinned: boolean;
    products?: Product;
}
