-- =============================================================
-- BIZREEL: THE DEFINITIVE MASTER CONSOLIDATED SCHEMA (2024)
-- =============================================================
-- This script integrates ALL modules: Auth, Profiles, Reels, AI, Marketplace,
-- Live Commerce, Events, and Search. It includes fixes for price parsing
-- and network/security diagnostics.

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. CORE SYSTEM TABLES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  business_name TEXT,
  category TEXT,
  bio TEXT,
  website TEXT,
  location TEXT,
  phone TEXT,
  working_hours TEXT,
  avatar_url TEXT,
  push_token TEXT,
  is_verified BOOLEAN DEFAULT false,
  is_live BOOLEAN DEFAULT false,
  is_private BOOLEAN DEFAULT false,
  allow_downloads BOOLEAN DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  video_url TEXT NOT NULL,
  caption TEXT,
  category TEXT,
  views INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  is_sponsored BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price TEXT, -- Stored as text for flexibility, but cast to numeric in RPCs
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. INTERACTION & NETWORKING
CREATE TABLE IF NOT EXISTS public.likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.follows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

CREATE TABLE IF NOT EXISTS public.saved_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- 4. MARKETPLACE & COMMERCE
CREATE TABLE IF NOT EXISTS public.cart (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

CREATE TABLE IF NOT EXISTS public.orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    buyer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    business_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    total_amount NUMERIC NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'shipped', 'completed'
    payment_method TEXT,
    shipping_address JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL,
    price_at_purchase NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. AI & INTELLIGENCE
CREATE TABLE IF NOT EXISTS public.ai_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    session_type TEXT NOT NULL,
    context_summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ai_memories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    memory_key TEXT NOT NULL,
    memory_value TEXT NOT NULL,
    importance_score FLOAT DEFAULT 0.5,
    embedding VECTOR(1536),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. SYSTEM INFRASTRUCTURE
CREATE TABLE IF NOT EXISTS public.system_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    status TEXT DEFAULT 'pending',
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. CORE SYSTEM FUNCTIONS (The "Engine")

-- A. Auto-Profile Creation on Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, business_name, avatar_url)
  VALUES (
    NEW.id,
    LOWER(SPLIT_PART(NEW.email, '@', 1)) || '_' || SUBSTR(CAST(gen_random_uuid() AS TEXT), 1, 4),
    COALESCE(NEW.raw_user_meta_data->>'business_name', SPLIT_PART(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- B. Notification & Analytics Engine
CREATE OR REPLACE FUNCTION public.create_notification()
RETURNS TRIGGER AS $$
DECLARE
    target_receiver_id UUID;
    v_post_id UUID;
    v_type TEXT;
BEGIN
    IF TG_TABLE_NAME = 'likes' THEN
        SELECT user_id INTO target_receiver_id FROM public.posts WHERE id = NEW.post_id;
        v_post_id := NEW.post_id;
        v_type := 'like';
    ELSIF TG_TABLE_NAME = 'comments' THEN
        SELECT user_id INTO target_receiver_id FROM public.posts WHERE id = NEW.post_id;
        v_post_id := NEW.post_id;
        v_type := 'comment';
    ELSIF TG_TABLE_NAME = 'follows' THEN
        target_receiver_id := NEW.following_id;
        v_type := 'follow';
        IF EXISTS (SELECT 1 FROM public.follows WHERE follower_id = NEW.following_id AND following_id = NEW.follower_id) THEN
            v_type := 'partner_connection';
        END IF;
    ELSIF TG_TABLE_NAME = 'saved_posts' THEN
        SELECT user_id INTO target_receiver_id FROM public.posts WHERE id = NEW.post_id;
        v_post_id := NEW.post_id;
        v_type := 'save';
    END IF;

    IF target_receiver_id IS NOT NULL AND target_receiver_id != auth.uid() THEN
        INSERT INTO public.notifications (receiver_id, sender_id, type, post_id)
        VALUES (target_receiver_id, auth.uid(), v_type, v_post_id);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- C. Search Trends RPC
CREATE OR REPLACE FUNCTION public.get_market_trends()
RETURNS TABLE (label TEXT, count_val BIGINT, trend_type TEXT, metadata JSONB) AS $$
BEGIN
    RETURN QUERY
    SELECT category AS label, COUNT(*)::BIGINT AS count_val, 'sector'::TEXT AS trend_type, '{}'::JSONB AS metadata
    FROM public.profiles WHERE category IS NOT NULL GROUP BY category ORDER BY count_val DESC LIMIT 5;

    RETURN QUERY
    SELECT caption AS label, views::BIGINT AS count_val, 'reel'::TEXT AS trend_type, jsonb_build_object('id', id) AS metadata
    FROM public.posts WHERE caption IS NOT NULL ORDER BY views DESC LIMIT 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- D. Global Search RPC
DROP FUNCTION IF EXISTS public.global_search(TEXT);

CREATE OR REPLACE FUNCTION public.global_search(search_term TEXT)
RETURNS TABLE (id UUID, title TEXT, subtitle TEXT, image_url TEXT, entity_type TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT p.id, p.business_name AS title, '@' || p.username AS subtitle, p.avatar_url AS image_url, 'business'::TEXT AS entity_type
    FROM public.profiles p WHERE p.business_name ILIKE '%' || search_term || '%' OR p.username ILIKE '%' || search_term || '%';

    RETURN QUERY
    SELECT r.id, r.caption AS title, p.business_name AS subtitle, p.avatar_url AS image_url, 'reel'::TEXT AS entity_type
    FROM public.posts r JOIN public.profiles p ON r.user_id = p.id WHERE r.caption ILIKE '%' || search_term || '%';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- E. Checkout Logic (with Price Parsing)
CREATE OR REPLACE FUNCTION public.process_checkout(p_buyer_id UUID, p_business_id UUID, p_address JSONB, p_payment_method TEXT)
RETURNS UUID AS $$
DECLARE
    v_order_id UUID;
    v_total NUMERIC := 0;
BEGIN
    -- Calculate total by stripping non-numeric characters from price TEXT field
    SELECT SUM(CAST(REGEXP_REPLACE(p.price, '[^0-9.]', '', 'g') AS NUMERIC) * c.quantity)
    INTO v_total
    FROM public.cart c
    JOIN public.products p ON c.product_id = p.id
    WHERE c.user_id = p_buyer_id AND p.business_id = p_business_id;

    INSERT INTO public.orders (buyer_id, business_id, total_amount, status, payment_method, shipping_address)
    VALUES (p_buyer_id, p_business_id, v_total, 'pending', p_payment_method, p_address)
    RETURNING id INTO v_order_id;

    INSERT INTO public.order_items (order_id, product_id, quantity, price_at_purchase)
    SELECT v_order_id, product_id, quantity, CAST(REGEXP_REPLACE((SELECT price FROM public.products WHERE id = cart.product_id), '[^0-9.]', '', 'g') AS NUMERIC)
    FROM public.cart WHERE user_id = p_buyer_id AND product_id IN (SELECT id FROM public.products WHERE business_id = p_business_id);

    DELETE FROM public.cart WHERE user_id = p_buyer_id AND product_id IN (SELECT id FROM public.products WHERE business_id = p_business_id);
    RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- F. Live Streaming Orchestration
CREATE OR REPLACE FUNCTION public.start_live_session(p_title TEXT, p_user_id UUID)
RETURNS UUID AS $$
DECLARE
    v_session_id UUID;
BEGIN
    -- Deactivate any existing sessions for this user
    UPDATE public.live_sessions
    SET is_active = false, ended_at = NOW()
    WHERE user_id = p_user_id AND is_active = true;

    INSERT INTO public.live_sessions (user_id, title, is_active, created_at)
    VALUES (p_user_id, p_title, true, NOW())
    RETURNING id INTO v_session_id;

    RETURN v_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- G. Business Analytics RPC
CREATE OR REPLACE FUNCTION get_business_analytics(target_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total_views', COALESCE(SUM(views), 0),
        'total_shares', COALESCE(SUM(shares), 0),
        'total_likes', (SELECT COUNT(*) FROM public.likes WHERE post_id IN (SELECT id FROM public.posts WHERE user_id = target_user_id)),
        'total_comments', (SELECT COUNT(*) FROM public.comments WHERE post_id IN (SELECT id FROM public.posts WHERE user_id = target_user_id)),
        'total_reposts', (SELECT COUNT(*) FROM public.reposts WHERE post_id IN (SELECT id FROM public.posts WHERE user_id = target_user_id)),
        'total_clients', (SELECT COUNT(*) FROM public.follows WHERE following_id = target_user_id),
        'total_connections', (SELECT COUNT(*) FROM public.follows WHERE follower_id = target_user_id),
        'engagement_rate', CASE
            WHEN SUM(views) > 0 THEN
                ROUND(((SELECT COUNT(*) FROM public.likes WHERE post_id IN (SELECT id FROM public.posts WHERE user_id = target_user_id)) +
                (SELECT COUNT(*) FROM public.comments WHERE post_id IN (SELECT id FROM public.posts WHERE user_id = target_user_id)))::NUMERIC / SUM(views) * 100, 2)
            ELSE 0
        END
    ) INTO result
    FROM public.posts
    WHERE user_id = target_user_id;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- G. Networking Metrics RPC
CREATE OR REPLACE FUNCTION get_mutual_connections_count(user_id_a UUID, user_id_b UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER
        FROM public.follows f1
        JOIN public.follows f2 ON f1.following_id = f2.following_id
        WHERE f1.follower_id = user_id_a
        AND f2.follower_id = user_id_b
        AND f1.following_id != user_id_a
        AND f1.following_id != user_id_b
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_partners_count(u_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER
        FROM public.follows f1
        WHERE f1.follower_id = u_id
        AND EXISTS (
            SELECT 1 FROM public.follows f2
            WHERE f2.follower_id = f1.following_id
            AND f2.following_id = u_id
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. TRIGGERS
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS tr_notify_like ON public.likes;
CREATE TRIGGER tr_notify_like AFTER INSERT ON public.likes FOR EACH ROW EXECUTE FUNCTION public.create_notification();

-- 9. RLS & PERMISSIONS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public View Profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users Manage Own Profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Diagnostic Policy (Used by app for pre-flight connectivity checks)
CREATE POLICY "Diagnostic View" ON public.profiles FOR SELECT USING (true);

GRANT EXECUTE ON FUNCTION public.get_market_trends() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.global_search(TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.process_checkout(UUID, UUID, JSONB, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.start_live_session(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_business_analytics(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_mutual_connections_count(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_partners_count(UUID) TO authenticated;

-- H. Storage Bucket for Products
-- Run this if the bucket doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for Products
CREATE POLICY "Product images are public" ON storage.objects FOR SELECT USING (bucket_id = 'products');
CREATE POLICY "Users can upload product images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'products' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update own product images" ON storage.objects FOR UPDATE WITH CHECK (bucket_id = 'products' AND auth.uid()::text = (storage.foldername(name))[1]);

-- I. Conversation List RPC
CREATE OR REPLACE FUNCTION get_conversation_list(u_id UUID)
RETURNS TABLE (
    other_user_id UUID,
    other_username TEXT,
    other_business_name TEXT,
    other_avatar_url TEXT,
    last_message_text TEXT,
    last_message_at TIMESTAMP WITH TIME ZONE,
    unread_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH last_messages AS (
        SELECT
            CASE
                WHEN sender_id = u_id THEN receiver_id
                ELSE sender_id
            END as peer_id,
            text,
            created_at,
            is_read,
            receiver_id,
            ROW_NUMBER() OVER(PARTITION BY (CASE WHEN sender_id = u_id THEN receiver_id ELSE sender_id END) ORDER BY created_at DESC) as rn
        FROM public.messages
        WHERE sender_id = u_id OR receiver_id = u_id
    ),
    unread_counts AS (
        SELECT sender_id as peer_id, COUNT(*) as count
        FROM public.messages
        WHERE receiver_id = u_id AND is_read = false
        GROUP BY sender_id
    )
    SELECT
        p.id,
        p.username,
        p.business_name,
        p.avatar_url,
        lm.text,
        lm.created_at,
        COALESCE(uc.count, 0)::BIGINT
    FROM last_messages lm
    JOIN public.profiles p ON lm.peer_id = p.id
    LEFT JOIN unread_counts uc ON lm.peer_id = uc.peer_id
    WHERE lm.rn = 1
    ORDER BY lm.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_conversation_list(UUID) TO authenticated;
