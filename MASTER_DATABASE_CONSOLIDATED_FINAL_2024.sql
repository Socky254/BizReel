-- =============================================================
-- BIZREEL: THE ULTIMATE CONSOLIDATED DATABASE SCHEMA (FINAL 2024)
-- =============================================================
-- This script integrates ALL modules: Auth, Profiles, Reels, AI, Marketplace,
-- Live Commerce, Events, Wallets, and Verification.

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
  tier TEXT DEFAULT 'BASIC', -- 'BASIC', 'PRO', 'ENTERPRISE'
  lead_credits INTEGER DEFAULT 5,
  is_verified BOOLEAN DEFAULT false,
  verification_status TEXT DEFAULT 'unverified', -- 'unverified', 'pending', 'approved', 'rejected'
  is_live BOOLEAN DEFAULT false,
  is_private BOOLEAN DEFAULT false,
  allow_downloads BOOLEAN DEFAULT true,
  mfa_enabled BOOLEAN DEFAULT false,
  show_active_status BOOLEAN DEFAULT true,
  dm_setting TEXT DEFAULT 'everyone',
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
  price TEXT, -- Stored as text for flexible currency display (e.g. "KSh 1,200")
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
  parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  edited_at TIMESTAMP WITH TIME ZONE,
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
    status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'shipped', 'completed', 'failed'
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

-- 5. WALLETS & TRANSACTIONS (IntaSend)
CREATE TABLE IF NOT EXISTS public.wallets (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
    balance NUMERIC DEFAULT 0,
    pending_balance NUMERIC DEFAULT 0,
    currency TEXT DEFAULT 'KES',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    amount NUMERIC NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'failed'
    provider TEXT DEFAULT 'intasend',
    provider_id TEXT UNIQUE,
    fee_amount NUMERIC DEFAULT 0,
    type TEXT, -- 'deposit', 'withdrawal', 'purchase', 'payout', 'sale'
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. LIVE COMMERCE & SOCIAL
CREATE TABLE IF NOT EXISTS public.live_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT,
    is_active BOOLEAN DEFAULT true,
    viewer_count INTEGER DEFAULT 0,
    playback_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS public.live_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES public.live_sessions(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.live_products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES public.live_sessions(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    is_pinned BOOLEAN DEFAULT false,
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

-- 7. AI & INTELLIGENCE
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

-- 8. SYSTEM & LOGS
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL, -- 'like', 'comment', 'follow', 'save', 'order_paid', 'live_started'
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
    edited_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.reposts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reviewer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL NOT NULL,
  receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(reviewer_id, receiver_id)
);

CREATE TABLE IF NOT EXISTS public.verification_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    business_doc_url TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.search_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    search_query TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- CORE RPC FUNCTIONS & ENGINES
-- ==========================================

-- 1. BUSINESS PERFORMANCE INDEX (TRUST SCORE)
CREATE OR REPLACE FUNCTION get_business_performance_index(target_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    total_orders INTEGER;
    completed_orders INTEGER;
    unique_partners INTEGER;
    total_revenue NUMERIC;
    avg_review_rating NUMERIC;
    total_reviews INTEGER;
    reliability_score NUMERIC;
    review_score NUMERIC;
    diversity_score NUMERIC;
    activity_score NUMERIC;
    final_index NUMERIC;
    total_posts INTEGER;
    total_views BIGINT;
BEGIN
    SELECT COUNT(*), COUNT(*) FILTER (WHERE status = 'completed'), COUNT(DISTINCT buyer_id), COALESCE(SUM(total_amount) FILTER (WHERE status = 'completed'), 0)
    INTO total_orders, completed_orders, unique_partners, total_revenue
    FROM public.orders WHERE business_id = target_user_id;

    SELECT AVG(rating), COUNT(*) INTO avg_review_rating, total_reviews
    FROM public.reviews WHERE receiver_id = target_user_id;

    SELECT COUNT(*), COALESCE(SUM(views), 0) INTO total_posts, total_views
    FROM public.posts WHERE user_id = target_user_id;

    reliability_score := CASE WHEN total_orders > 0 THEN (completed_orders::NUMERIC / total_orders::NUMERIC) * 100 ELSE 100 END;
    review_score := (COALESCE(avg_review_rating, 5.0) / 5.0) * 100;
    diversity_score := LEAST((unique_partners::NUMERIC / 10.0) * 100, 100);
    activity_score := LEAST(((total_posts::NUMERIC / 5.0) * 50) + ((total_views::NUMERIC / 500.0) * 50), 100);

    final_index := (reliability_score * 0.35) + (review_score * 0.40) + (diversity_score * 0.15) + (activity_score * 0.10);

    RETURN jsonb_build_object(
        'index_score', ROUND(final_index, 1),
        'fulfillment_rate', ROUND(reliability_score, 0),
        'total_closed_deals', completed_orders,
        'unique_business_partners', unique_partners,
        'total_revenue_volume', total_revenue,
        'avg_user_rating', ROUND(COALESCE(avg_review_rating, 5.0), 1),
        'trust_count', total_reviews,
        'activity_metrics', jsonb_build_object('posts', total_posts, 'views', total_views),
        'status', CASE WHEN final_index >= 92 THEN 'ELITE' WHEN final_index >= 80 THEN 'PREMIUM' WHEN final_index >= 65 THEN 'TRUSTED' ELSE 'VERIFIED' END
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. ADVANCED BUSINESS ANALYTICS
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
            'engagement_rate', CASE WHEN SUM(views) > 0 THEN ROUND(((SELECT COUNT(*) FROM public.likes WHERE post_id IN (SELECT id FROM public.posts WHERE user_id = target_user_id)) + (SELECT COUNT(*) FROM public.comments WHERE post_id IN (SELECT id FROM public.posts WHERE user_id = target_user_id)))::NUMERIC / SUM(views) * 100, 1) ELSE 0 END,
            'conversion_rate', CASE WHEN SUM(views) > 0 THEN ROUND(((SELECT COUNT(*) FROM public.reposts WHERE post_id IN (SELECT id FROM public.posts WHERE user_id = target_user_id)))::NUMERIC / SUM(views) * 100, 1) ELSE 0 END
        ),
        'recommendations', jsonb_build_array(
            jsonb_build_object('title', 'Market Expansion', 'insight', 'Your reels are gaining traction in neighboring sectors.', 'action', 'Post more content with location tags.'),
            jsonb_build_object('title', 'Engagement Boost', 'insight', 'Partners respond 40% more to video captions with questions.', 'action', 'Add a Call-to-Action to your next reel.')
        )
    ) INTO result FROM public.posts WHERE user_id = target_user_id;
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. GLOBAL SEARCH & TRENDS
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

-- 4. WITHDRAWAL REQUEST LOGIC
CREATE OR REPLACE FUNCTION public.request_withdrawal(p_user_id UUID, p_amount NUMERIC, p_method TEXT, p_details JSONB)
RETURNS UUID AS $$
DECLARE
    v_transaction_id UUID;
    v_current_balance NUMERIC;
BEGIN
    SELECT balance INTO v_current_balance FROM public.wallets WHERE user_id = p_user_id;
    IF v_current_balance < p_amount THEN RAISE EXCEPTION 'Insufficient balance'; END IF;
    UPDATE public.wallets SET balance = balance - p_amount WHERE user_id = p_user_id;
    INSERT INTO public.transactions (user_id, amount, type, status, provider, metadata)
    VALUES (p_user_id, p_amount, 'withdrawal', 'pending', 'intasend', p_details)
    RETURNING id INTO v_transaction_id;
    RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. VECTOR SEARCH FOR AI
CREATE OR REPLACE FUNCTION match_memories (query_embedding VECTOR(1536), match_threshold FLOAT, match_count INTEGER, u_id UUID)
RETURNS TABLE (id UUID, memory_key TEXT, memory_value TEXT, similarity FLOAT) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT ai_memories.id, ai_memories.memory_key, ai_memories.memory_value, 1 - (ai_memories.embedding <=> query_embedding) AS similarity
  FROM ai_memories WHERE ai_memories.user_id = u_id AND 1 - (ai_memories.embedding <=> query_embedding) > match_threshold
  ORDER BY ai_memories.embedding <=> query_embedding LIMIT match_count;
END;
$$;

-- ==========================================
-- TRIGGERS & AUTOMATION
-- ==========================================

-- Auto-Profile Creation & Wallet Init
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, business_name, avatar_url, tier)
  VALUES (
    NEW.id,
    LOWER(SPLIT_PART(NEW.email, '@', 1)) || '_' || SUBSTR(CAST(gen_random_uuid() AS TEXT), 1, 4),
    COALESCE(NEW.raw_user_meta_data->>'business_name', SPLIT_PART(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    'BASIC'
  );
  INSERT INTO public.wallets (user_id, balance) VALUES (NEW.id, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- RLS POLICIES (BASIC)
-- ==========================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public View Profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users Manage Own Profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public View Posts" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Users Manage Own Posts" ON public.posts FOR ALL USING (auth.uid() = user_id);

ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own wallet" ON public.wallets FOR SELECT USING (auth.uid() = user_id);

-- GRANTS
GRANT EXECUTE ON FUNCTION public.get_business_performance_index(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_advanced_business_analytics(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.global_search(TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_market_trends() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.request_withdrawal(UUID, NUMERIC, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION match_memories(VECTOR(1536), FLOAT, INTEGER, UUID) TO authenticated;
