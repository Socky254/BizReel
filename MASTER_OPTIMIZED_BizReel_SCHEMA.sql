-- =============================================================
-- BIZREEL: MASTER OPTIMIZED ENTERPRISE SCHEMA (FINAL)
-- =============================================================
-- This script ensures database integrity, ultra-optimized trust scores,
-- and high-performance indexing for the Silicon Savannah ecosystem.

-- 1. SECURITY & INTEGRITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 2. DYNAMIC BUSINESS CATEGORY INDEXING
CREATE INDEX IF NOT EXISTS idx_profiles_category ON public.profiles(category);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON public.posts(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_business_id ON public.orders(business_id);

-- 3. THE CONCLUSIVE AUTHENTIC SCORE ENGINE (OPTIMIZED)
-- Formula: (35% Success) + (40% Ratings) + (15% Diversity) + (10% Activity)
CREATE OR REPLACE FUNCTION get_business_performance_index(target_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    -- Transaction Data
    v_total_orders INTEGER;
    v_completed_orders INTEGER;
    v_unique_partners INTEGER;

    -- Review Data
    v_avg_rating NUMERIC;
    v_total_reviews INTEGER;

    -- Activity Data
    v_total_posts INTEGER;
    v_total_views BIGINT;

    -- Weighted Scores
    v_reliability_score NUMERIC; -- 35%
    v_review_score NUMERIC;      -- 40%
    v_diversity_score NUMERIC;   -- 15%
    v_activity_score NUMERIC;    -- 10%
    v_final_index NUMERIC;
BEGIN
    -- [STEP 1] GATHER TRANSACTIONAL INTELLIGENCE
    SELECT
        COUNT(*),
        COUNT(*) FILTER (WHERE status = 'completed'),
        COUNT(DISTINCT buyer_id)
    INTO v_total_orders, v_completed_orders, v_unique_partners
    FROM public.orders
    WHERE business_id = target_user_id;

    -- [STEP 2] GATHER REPUTATIONAL INTELLIGENCE
    SELECT AVG(rating), COUNT(*)
    INTO v_avg_rating, v_total_reviews
    FROM public.reviews
    WHERE receiver_id = target_user_id;

    -- [STEP 3] GATHER PLATFORM ENGAGEMENT DATA
    SELECT COUNT(*), COALESCE(SUM(views), 0)
    INTO v_total_posts, v_total_views
    FROM public.posts
    WHERE user_id = target_user_id;

    -- [STEP 4] NORMALIZE SCORES (0-100)

    -- Reliability: 100% for startups/new users, actual rate for active users
    v_reliability_score := CASE WHEN v_total_orders > 0 THEN (v_completed_orders::NUMERIC / v_total_orders::NUMERIC) * 100 ELSE 100 END;

    -- Reviews: 5.0 base rating = 100%
    v_review_score := (COALESCE(v_avg_rating, 5.0) / 5.0) * 100;

    -- Diversity: Target 10 unique business partners for 100%
    v_diversity_score := LEAST((COALESCE(v_unique_partners, 0)::NUMERIC / 10.0) * 100, 100);

    -- Activity: Target 5 posts and 1,000 views for 100%
    v_activity_score := LEAST(((COALESCE(v_total_posts, 0)::NUMERIC / 5.0) * 50) + ((COALESCE(v_total_views, 0)::NUMERIC / 1000.0) * 50), 100);

    -- [STEP 5] CALCULATE CONCLUSIVE PERFORMANCE INDEX
    v_final_index := (v_reliability_score * 0.35) +
                     (v_review_score * 0.40) +
                     (v_diversity_score * 0.15) +
                     (v_activity_score * 0.10);

    RETURN jsonb_build_object(
        'index_score', ROUND(v_final_index, 1),
        'fulfillment_rate', ROUND(v_reliability_score, 0),
        'total_closed_deals', v_completed_orders,
        'unique_partners', v_unique_partners,
        'avg_user_rating', ROUND(COALESCE(v_avg_rating, 5.0), 1),
        'trust_count', v_total_reviews,
        'status', CASE
            WHEN v_final_index >= 95 THEN 'ELITE PLATINUM'
            WHEN v_final_index >= 85 THEN 'PREMIUM'
            WHEN v_final_index >= 70 THEN 'TRUSTED'
            ELSE 'VERIFIED BUSINESS'
        END
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. CLEANUP DEPRECATED COLUMNS (Integrity Check)
-- Ensure 'category' exists on profiles for the industry matching system
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='category') THEN
        ALTER TABLE public.profiles ADD COLUMN category TEXT;
    END IF;
END $$;

-- 5. GRANT PERMISSIONS
GRANT EXECUTE ON FUNCTION public.get_business_performance_index(UUID) TO authenticated, anon;

-- FINAL AUDIT: All systems optimized.
