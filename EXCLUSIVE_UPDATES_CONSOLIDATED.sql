-- =============================================================
-- BIZREEL: EXCLUSIVE SYSTEM UPDATES (CONSOLIDATED 2024)
-- =============================================================
-- This script contains all structural and logic updates for
-- Networking (Calls), Profiles, Collections, and AI Gateway.

-- 1. PROFILE ENHANCEMENTS (Support for Calls & Privacy)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS allow_downloads BOOLEAN DEFAULT true;

-- 2. CORE COLLECTIONS & INTERACTION
CREATE TABLE IF NOT EXISTS public.likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.saved_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, post_id)
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

-- 3. AI & RAG INFRASTRUCTURE
CREATE TABLE IF NOT EXISTS public.ai_memories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    memory_key TEXT NOT NULL,
    memory_value TEXT NOT NULL,
    importance_score FLOAT DEFAULT 0.5,
    embedding VECTOR(1536),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RAG: Vector Similarity Search for AI Memories
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

-- 4. BUSINESS INTELLIGENCE (ANALYTICS ENGINE)
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

-- 5. PERFORMANCE INDEX (TRUST SCORE)
CREATE OR REPLACE FUNCTION get_business_performance_index(target_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    total_orders INTEGER;
    completed_orders INTEGER;
    avg_review_rating NUMERIC;
    reliability_score NUMERIC;
    performance_index NUMERIC;
BEGIN
    SELECT COUNT(*), COUNT(*) FILTER (WHERE status = 'completed')
    INTO total_orders, completed_orders
    FROM public.orders
    WHERE business_id = target_user_id;

    SELECT AVG(rating)
    INTO avg_review_rating
    FROM public.reviews
    WHERE receiver_id = target_user_id;

    IF total_orders > 0 THEN
        reliability_score := (completed_orders::NUMERIC / total_orders::NUMERIC) * 100;
    ELSE
        reliability_score := 100;
    END IF;

    performance_index := (COALESCE(avg_review_rating, 5.0) / 5.0 * 50) + (reliability_score / 100 * 50);

    RETURN jsonb_build_object(
        'index_score', ROUND(performance_index, 1),
        'fulfillment_rate', ROUND(reliability_score, 0),
        'total_closed_deals', completed_orders,
        'avg_user_rating', ROUND(COALESCE(avg_review_rating, 5.0), 1),
        'status', CASE
            WHEN performance_index >= 90 THEN 'ELITE'
            WHEN performance_index >= 75 THEN 'TRUSTED'
            ELSE 'PROBATION'
        END
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. PERMISSIONS & GRANTS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
GRANT EXECUTE ON FUNCTION public.get_advanced_business_analytics(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_business_performance_index(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION match_memories(VECTOR(1536), FLOAT, INTEGER, UUID) TO authenticated;
