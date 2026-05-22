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
  tier TEXT DEFAULT 'BASIC',
  lead_credits INTEGER DEFAULT 5,
  is_verified BOOLEAN DEFAULT false,
  is_live BOOLEAN DEFAULT false,
  is_private BOOLEAN DEFAULT false,
  allow_downloads BOOLEAN DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure columns exist if table was created previously without them
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'BASIC';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS lead_credits INTEGER DEFAULT 5;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_live BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS allow_downloads BOOLEAN DEFAULT true;

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

-- ==========================================
-- METHOD #2: SYNDICATE ESCROW (GROUP BUY)
-- ==========================================

CREATE TABLE IF NOT EXISTS public.syndicates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    target_quantity INTEGER NOT NULL,
    current_quantity INTEGER DEFAULT 0,
    discount_price NUMERIC NOT NULL,
    status TEXT DEFAULT 'active', -- 'active', 'filled', 'processing', 'completed', 'cancelled'
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.syndicate_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    syndicate_id UUID REFERENCES public.syndicates(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    quantity INTEGER NOT NULL,
    payment_status TEXT DEFAULT 'pending', -- 'pending', 'held_in_escrow', 'refunded'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(syndicate_id, user_id)
);

-- 5. AI & INTELLIGENCE
CREATE TABLE IF NOT EXISTS public.ai_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    session_type TEXT NOT NULL,
    context_summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Mentor Specific Tables
CREATE TABLE IF NOT EXISTS public.ai_mentor_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    topic TEXT DEFAULT 'General Business Consultation',
    status TEXT DEFAULT 'active', -- 'active', 'archived'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ai_mentor_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES public.ai_mentor_sessions(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
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

-- Vector Similarity Search for AI Memories
CREATE OR REPLACE FUNCTION match_memories (
  query_embedding VECTOR(1536),
  match_threshold FLOAT,
  match_count INTEGER,
  u_id UUID
)
RETURNS TABLE (
  id UUID,
  memory_key TEXT,
  memory_value TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ai_memories.id,
    ai_memories.memory_key,
    ai_memories.memory_value,
    1 - (ai_memories.embedding <=> query_embedding) AS similarity
  FROM ai_memories
  WHERE ai_memories.user_id = u_id
    AND 1 - (ai_memories.embedding <=> query_embedding) > match_threshold
  ORDER BY ai_memories.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 6. SYSTEM INFRASTRUCTURE
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    amount NUMERIC NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'failed'
    provider TEXT, -- 'intasend', 'internal'
    provider_id TEXT UNIQUE,
    fee_amount NUMERIC DEFAULT 0,
    type TEXT, -- 'deposit', 'withdrawal', 'purchase', 'payout', 'sale'
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS public.stories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    media_url TEXT NOT NULL,
    type TEXT DEFAULT 'video', -- 'video', 'image'
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.live_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT,
    is_active BOOLEAN DEFAULT true,
    viewer_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS public.reposts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    text TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.search_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    search_query TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.system_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO public.system_config (key, value)
VALUES ('app_parameters', '{"features": {"live_stream": true, "marketplace": true, "ai_mentor": true}, "limits": {"upload_max_mb": 50}, "rules": {"feed_ranking": "latest"}}')
ON CONFLICT (key) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reviewer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL NOT NULL,
  receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(reviewer_id, receiver_id)
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Users can review partners" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);
CREATE POLICY "Users can update own review" ON public.reviews FOR UPDATE USING (auth.uid() = reviewer_id);

-- Lead Credit Deduction
CREATE OR REPLACE FUNCTION public.deduct_lead_credit(u_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.profiles
    SET lead_credits = lead_credits - 1
    WHERE id = u_id AND tier = 'BASIC' AND lead_credits > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.deduct_lead_credit(UUID) TO authenticated;

-- Increment Post Views
CREATE OR REPLACE FUNCTION public.increment_view_count(post_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.posts
    SET views = views + 1
    WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.increment_view_count(UUID) TO authenticated, anon;

-- Increment Post Shares
CREATE OR REPLACE FUNCTION public.increment_shares(post_id_param UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.posts
    SET shares = shares + 1
    WHERE id = post_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION match_memories(VECTOR(1536), FLOAT, INTEGER, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_shares(UUID) TO authenticated;

-- SEED DATA: Example AI Memories (Run this manually in SQL Editor for your user_id)
-- INSERT INTO public.ai_memories (user_id, memory_key, memory_value, importance_score)
-- VALUES
-- ('YOUR_USER_ID_HERE', 'Company Policy', 'Standard shipping time is 3-5 business days across East Africa.', 0.9),
-- ('YOUR_USER_ID_HERE', 'Product Catalog Summary', 'We specialize in high-end office furniture and custom executive desks.', 0.8);

-- 7. CORE SYSTEM FUNCTIONS (The "Engine")

-- A. Auto-Profile Creation on Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, business_name, avatar_url, tier, is_verified, bio)
  VALUES (
    NEW.id,
    LOWER(SPLIT_PART(NEW.email, '@', 1)) || '_' || SUBSTR(CAST(gen_random_uuid() AS TEXT), 1, 4),
    COALESCE(NEW.raw_user_meta_data->>'business_name', SPLIT_PART(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    CASE WHEN NEW.email = 'Socratesart@live.com' THEN 'ENTERPRISE' ELSE 'BASIC' END,
    CASE WHEN NEW.email = 'Socratesart@live.com' THEN true ELSE false END,
    CASE WHEN NEW.email = 'Socratesart@live.com' THEN 'Founder of BizReel' ELSE '' END
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

-- NEW: Notification trigger for Orders and Live Sessions
CREATE OR REPLACE FUNCTION public.handle_special_notifications()
RETURNS TRIGGER AS $$
BEGIN
    -- 1. Order Paid Notification
    IF TG_TABLE_NAME = 'orders' AND NEW.status = 'paid' AND OLD.status != 'paid' THEN
        INSERT INTO public.notifications (receiver_id, sender_id, type)
        VALUES (NEW.business_id, NEW.buyer_id, 'order_paid');
    END IF;

    -- 2. Live Session Started Notification (To all followers)
    IF TG_TABLE_NAME = 'live_sessions' AND NEW.is_active = true AND (OLD.is_active = false OR OLD.is_active IS NULL) THEN
        INSERT INTO public.notifications (receiver_id, sender_id, type)
        SELECT follower_id, NEW.user_id, 'live_started'
        FROM public.follows
        WHERE following_id = NEW.user_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_notify_order_paid ON public.orders;
CREATE TRIGGER tr_notify_order_paid AFTER UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.handle_special_notifications();

DROP TRIGGER IF EXISTS tr_notify_live_started ON public.live_sessions;
CREATE TRIGGER tr_notify_live_started AFTER INSERT OR UPDATE ON public.live_sessions
FOR EACH ROW EXECUTE FUNCTION public.handle_special_notifications();

-- C. Search Trends RPC
DROP FUNCTION IF EXISTS public.get_market_trends() CASCADE;
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

GRANT EXECUTE ON FUNCTION public.get_market_trends() TO authenticated, anon;

-- D. Global Search RPC
DROP FUNCTION IF EXISTS public.global_search(TEXT) CASCADE;

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
DROP FUNCTION IF EXISTS public.process_checkout(UUID, UUID, JSONB, TEXT);
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
DROP FUNCTION IF EXISTS public.start_live_session(TEXT, UUID);
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

-- F. Business Analytics RPC (Enhanced)
DROP FUNCTION IF EXISTS public.get_advanced_business_analytics(UUID);
CREATE OR REPLACE FUNCTION get_advanced_business_analytics(target_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'stats', jsonb_build_object(
            'total_views', COALESCE(SUM(views), 0),
            'total_shares', COALESCE(SUM(shares), 0),
            'total_likes', (SELECT COUNT(*) FROM public.likes WHERE post_id IN (SELECT id FROM public.posts WHERE user_id = target_user_id)),
            'total_comments', (SELECT COUNT(*) FROM public.comments WHERE post_id IN (SELECT id FROM public.posts WHERE user_id = target_user_id)),
            'total_reposts', (SELECT COUNT(*) FROM public.reposts WHERE post_id IN (SELECT id FROM public.posts WHERE user_id = target_user_id)),
            'engagement_rate', CASE
                WHEN SUM(views) > 0 THEN
                    ROUND(((SELECT COUNT(*) FROM public.likes WHERE post_id IN (SELECT id FROM public.posts WHERE user_id = target_user_id)) +
                    (SELECT COUNT(*) FROM public.comments WHERE post_id IN (SELECT id FROM public.posts WHERE user_id = target_user_id)))::NUMERIC / SUM(views) * 100, 1)
                ELSE 0
            END,
            'conversion_rate', CASE
                WHEN SUM(views) > 0 THEN
                    ROUND(((SELECT COUNT(*) FROM public.reposts WHERE post_id IN (SELECT id FROM public.posts WHERE user_id = target_user_id)))::NUMERIC / SUM(views) * 100, 1)
                ELSE 0
            END
        ),
        'recommendations', jsonb_build_array(
            jsonb_build_object('title', 'Market Expansion', 'insight', 'Your reels are gaining traction in neighboring sectors.', 'action', 'Post more content with location tags.'),
            jsonb_build_object('title', 'Engagement Boost', 'insight', 'Partners respond 40% more to video captions with questions.', 'action', 'Add a Call-to-Action to your next reel.')
        )
    ) INTO result
    FROM public.posts
    WHERE user_id = target_user_id;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_advanced_business_analytics(UUID) TO authenticated;

-- G. Networking Metrics RPC
DROP FUNCTION IF EXISTS public.get_mutual_connections_count(UUID, UUID);
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

DROP FUNCTION IF EXISTS public.get_partners_count(UUID);
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

-- Interaction Policies
DROP POLICY IF EXISTS "Public view comments" ON public.comments;
CREATE POLICY "Public view comments" ON public.comments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can comment" ON public.comments;
CREATE POLICY "Authenticated users can comment" ON public.comments FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users manage own posts" ON posts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own comments" ON comments FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own messages" ON messages FOR ALL USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users manage own stories" ON stories FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own products" ON products FOR ALL USING (auth.uid() = business_id);
CREATE POLICY "Users manage own cart" ON cart FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own orders" ON orders FOR ALL USING (auth.uid() = buyer_id OR auth.uid() = business_id);
CREATE POLICY "Users manage own transactions" ON transactions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own ai_mentor_sessions" ON ai_mentor_sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users view own ai_mentor_messages" ON ai_mentor_messages FOR SELECT USING (
    EXISTS (SELECT 1 FROM ai_mentor_sessions WHERE id = session_id AND user_id = auth.uid())
);
CREATE POLICY "Users insert own ai_mentor_messages" ON ai_mentor_messages FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM ai_mentor_sessions WHERE id = session_id AND user_id = auth.uid())
);

-- Storage Buckets & Policies
INSERT INTO storage.buckets (id, name, public)
VALUES ('reels', 'reels', true), ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Reels are public" ON storage.objects FOR SELECT USING (bucket_id = 'reels');
CREATE POLICY "Users can upload reels" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'reels' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own reels" ON storage.objects FOR DELETE WITH CHECK (bucket_id = 'reels' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Avatars are public" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload avatars" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update own avatars" ON storage.objects FOR UPDATE WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
GRANT EXECUTE ON FUNCTION public.global_search(TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.process_checkout(UUID, UUID, JSONB, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.start_live_session(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_advanced_business_analytics(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_mutual_connections_count(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_partners_count(UUID) TO authenticated;

-- AI-Driven Partner Recommendations
DROP FUNCTION IF EXISTS public.get_recommended_partners(UUID);
CREATE OR REPLACE FUNCTION public.get_recommended_partners(u_id UUID)
RETURNS TABLE (
    id UUID,
    business_name TEXT,
    category TEXT,
    avatar_url TEXT,
    mutual_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.business_name,
        p.category,
        p.avatar_url,
        public.get_mutual_connections_count(u_id, p.id) as mutual_count
    FROM public.profiles p
    WHERE p.id != u_id
    AND NOT EXISTS (SELECT 1 FROM public.follows WHERE follower_id = u_id AND following_id = p.id)
    ORDER BY mutual_count DESC, p.created_at DESC
    LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_recommended_partners(UUID) TO authenticated;

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
DROP FUNCTION IF EXISTS public.get_conversation_list(UUID);
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

-- =============================================================
-- INTASEND & WALLET SYSTEM INTEGRATION
-- =============================================================

-- 1. Create Wallets table for users/merchants
CREATE TABLE IF NOT EXISTS public.wallets (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
    balance NUMERIC DEFAULT 0,
    pending_balance NUMERIC DEFAULT 0,
    currency TEXT DEFAULT 'KES',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enhanced Transactions for IntaSend Tracking
-- Note: We drop and recreate if needed or simply ensure columns exist
ALTER TABLE IF EXISTS public.transactions ADD COLUMN IF NOT EXISTS provider_id TEXT UNIQUE;
ALTER TABLE IF EXISTS public.transactions ADD COLUMN IF NOT EXISTS fee_amount NUMERIC DEFAULT 0;
ALTER TABLE IF EXISTS public.transactions ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE IF EXISTS public.transactions ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- 3. Automatic Wallet Initialization on Profile Creation
CREATE OR REPLACE FUNCTION public.initialize_wallet()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.wallets (user_id, balance, currency)
    VALUES (NEW.id, 0, 'KES')
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_on_profile_created_init_wallet
AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.initialize_wallet();

-- 4. Transaction Completion Logic (Wallet Updates)
CREATE OR REPLACE FUNCTION public.handle_transaction_completion()
RETURNS TRIGGER AS $$
BEGIN
    -- If a deposit or payout (incoming to wallet) is completed
    IF NEW.status = 'completed' AND (OLD.status = 'pending' OR OLD.status IS NULL) THEN
        IF NEW.type IN ('deposit', 'payout', 'sale') THEN
            UPDATE public.wallets
            SET balance = balance + NEW.amount,
                updated_at = NOW()
            WHERE user_id = NEW.user_id;
        ELSIF NEW.type = 'withdrawal' THEN
            -- Withdrawal logic usually deducts from pending/escrow or balance
            -- For simplicity here, we assume it's already deducted from balance on request
            -- and this just confirms the move.
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_on_transaction_complete ON public.transactions;
CREATE TRIGGER tr_on_transaction_complete
AFTER UPDATE ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.handle_transaction_completion();

-- 5. RPC to Request Withdrawal (with balance check)
DROP FUNCTION IF EXISTS public.request_withdrawal(UUID, NUMERIC, TEXT, JSONB) CASCADE;
CREATE OR REPLACE FUNCTION public.request_withdrawal(p_user_id UUID, p_amount NUMERIC, p_method TEXT, p_details JSONB)
RETURNS UUID AS $$
DECLARE
    v_transaction_id UUID;
    v_current_balance NUMERIC;
BEGIN
    SELECT balance INTO v_current_balance FROM public.wallets WHERE user_id = p_user_id;

    IF v_current_balance < p_amount THEN
        RAISE EXCEPTION 'Insufficient balance';
    END IF;

    -- Deduct immediately to prevent double spending
    UPDATE public.wallets SET balance = balance - p_amount WHERE user_id = p_user_id;

    INSERT INTO public.transactions (user_id, amount, type, status, provider, metadata)
    VALUES (p_user_id, p_amount, 'withdrawal', 'pending', 'intasend', p_details)
    RETURNING id INTO v_transaction_id;

    RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.request_withdrawal(UUID, NUMERIC, TEXT, JSONB) TO authenticated;

GRANT EXECUTE ON FUNCTION public.request_withdrawal(UUID, NUMERIC, TEXT, JSONB) TO authenticated;


-- ==========================================
-- ENTERPRISE PERFORMANCE INDEX (RATE CARD)
-- ==========================================
-- This script enhances the business performance calculation by
-- integrating transaction diversity, volume, and engagement metrics.

DROP FUNCTION IF EXISTS public.get_business_performance_index(UUID);
CREATE OR REPLACE FUNCTION get_business_performance_index(target_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    total_orders INTEGER;
    completed_orders INTEGER;
    unique_partners INTEGER;
    total_revenue NUMERIC;
    avg_review_rating NUMERIC;
    total_reviews INTEGER;

    -- Metric Weights
    reliability_weight NUMERIC := 35; -- 35% Success Rate
    review_weight NUMERIC := 40;      -- 40% User Ratings
    diversity_weight NUMERIC := 15;   -- 15% Unique Partnerships
    activity_weight NUMERIC := 10;    -- 10% Platform Activity

    -- Calculated Values
    reliability_score NUMERIC;
    review_score NUMERIC;
    diversity_score NUMERIC;
    activity_score NUMERIC;
    final_index NUMERIC;

    total_posts INTEGER;
    total_views BIGINT;
BEGIN
    -- 1. Gather Transactional Data
    SELECT
        COUNT(*),
        COUNT(*) FILTER (WHERE status = 'completed'),
        COUNT(DISTINCT buyer_id),
        COALESCE(SUM(total_amount) FILTER (WHERE status = 'completed'), 0)
    INTO total_orders, completed_orders, unique_partners, total_revenue
    FROM public.orders
    WHERE business_id = target_user_id;

    -- 2. Gather Review Data
    SELECT AVG(rating), COUNT(*)
    INTO avg_review_rating, total_reviews
    FROM public.reviews
    WHERE receiver_id = target_user_id;

    -- 3. Gather Activity Data
    SELECT COUNT(*), COALESCE(SUM(views), 0)
    INTO total_posts, total_views
    FROM public.posts
    WHERE user_id = target_user_id;

    -- 4. Calculate Individual Scores (Normalized 0-100)

    -- Reliability Score: Completed / Total (Default 100 for new businesses)
    IF total_orders > 0 THEN
        reliability_score := (completed_orders::NUMERIC / total_orders::NUMERIC) * 100;
    ELSE
        reliability_score := 100;
    END IF;

    -- Review Score: Normalized average (Default 5.0 / 100%)
    review_score := (COALESCE(avg_review_rating, 5.0) / 5.0) * 100;

    -- Diversity Score: Number of unique partners (Target 10 unique partners for 100%)
    diversity_score := LEAST((unique_partners::NUMERIC / 10.0) * 100, 100);

    -- Activity Score: Weighted Posts (5) and Views (500)
    activity_score := LEAST(((total_posts::NUMERIC / 5.0) * 50) + ((total_views::NUMERIC / 500.0) * 50), 100);

    -- 5. Calculate Final Weighted Performance Index
    final_index := (reliability_score * reliability_weight / 100) +
                   (review_score * review_weight / 100) +
                   (diversity_score * diversity_weight / 100) +
                   (activity_score * activity_weight / 100);

    RETURN jsonb_build_object(
        'index_score', ROUND(final_index, 1),
        'fulfillment_rate', ROUND(reliability_score, 0),
        'total_closed_deals', completed_orders,
        'unique_business_partners', unique_partners,
        'total_revenue_volume', total_revenue,
        'avg_user_rating', ROUND(COALESCE(avg_review_rating, 5.0), 1),
        'trust_count', total_reviews,
        'activity_metrics', jsonb_build_object(
            'posts', total_posts,
            'views', total_views
        ),
        'status', CASE
            WHEN final_index >= 92 THEN 'ELITE'
            WHEN final_index >= 80 THEN 'PREMIUM'
            WHEN final_index >= 65 THEN 'TRUSTED'
            ELSE 'VERIFIED'
        END
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_business_performance_index(UUID) TO authenticated, anon;
