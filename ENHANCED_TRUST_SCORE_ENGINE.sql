-- =============================================================
-- BIZREEL: ENHANCED BUSINESS TRUST & RELIABILITY ENGINE
-- =============================================================
-- This script upgrades the trust scoring mechanism to include
-- verification status, profile completeness, and longevity.

CREATE OR REPLACE FUNCTION get_business_performance_index(target_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    -- Core Stats
    total_orders INTEGER;
    completed_orders INTEGER;
    unique_partners INTEGER;
    total_revenue NUMERIC;
    avg_review_rating NUMERIC;
    total_reviews INTEGER;
    total_posts INTEGER;
    total_views BIGINT;

    -- Profile Data for Trust Signals
    v_is_verified BOOLEAN;
    v_tier TEXT;
    v_created_at TIMESTAMP WITH TIME ZONE;
    v_bio TEXT;
    v_phone TEXT;
    v_location TEXT;
    v_website TEXT;
    v_avatar_url TEXT;

    -- Component Scores (Normalized 0-100)
    reliability_score NUMERIC; -- 30%
    review_score NUMERIC;      -- 30%
    verification_score NUMERIC;-- 20%
    activity_score NUMERIC;    -- 10%
    trust_signal_score NUMERIC;-- 10%

    final_index NUMERIC;
BEGIN
    -- 1. GATHER TRANSACTIONAL & ENGAGEMENT DATA
    SELECT
        COUNT(*),
        COUNT(*) FILTER (WHERE status = 'completed'),
        COUNT(DISTINCT buyer_id),
        COALESCE(SUM(total_amount) FILTER (WHERE status = 'completed'), 0)
    INTO total_orders, completed_orders, unique_partners, total_revenue
    FROM public.orders WHERE business_id = target_user_id;

    SELECT AVG(rating), COUNT(*)
    INTO avg_review_rating, total_reviews
    FROM public.reviews WHERE receiver_id = target_user_id;

    SELECT COUNT(*), COALESCE(SUM(views), 0)
    INTO total_posts, total_views
    FROM public.posts WHERE user_id = target_user_id;

    -- 2. GATHER PROFILE DATA
    SELECT
        is_verified, tier, created_at, bio, phone, location, website, avatar_url
    INTO
        v_is_verified, v_tier, v_created_at, v_bio, v_phone, v_location, v_website, v_avatar_url
    FROM public.profiles WHERE id = target_user_id;

    -- 3. CALCULATE COMPONENT SCORES

    -- Reliability: Success Rate (Default 100 for new businesses to avoid cold start penalty)
    reliability_score := CASE WHEN total_orders > 0 THEN (completed_orders::NUMERIC / total_orders::NUMERIC) * 100 ELSE 100 END;

    -- Review Score: Normalized (Default 5.0)
    review_score := (COALESCE(avg_review_rating, 5.0) / 5.0) * 100;

    -- Verification Score:
    verification_score := 0;
    IF v_is_verified THEN verification_score := verification_score + 75; END IF;
    IF v_tier = 'PRO' THEN verification_score := verification_score + 15;
    ELSIF v_tier = 'ENTERPRISE' THEN verification_score := verification_score + 25; END IF;
    verification_score := LEAST(verification_score, 100);

    -- Activity Score: Posts & Views
    activity_score := LEAST(((total_posts::NUMERIC / 5.0) * 50) + ((total_views::NUMERIC / 500.0) * 50), 100);

    -- Trust Signals (Profile Completeness & Longevity)
    trust_signal_score := 0;
    IF v_bio IS NOT NULL AND v_bio <> '' THEN trust_signal_score := trust_signal_score + 20; END IF;
    IF v_phone IS NOT NULL AND v_phone <> '' THEN trust_signal_score := trust_signal_score + 20; END IF;
    IF v_location IS NOT NULL AND v_location <> '' THEN trust_signal_score := trust_signal_score + 20; END IF;
    IF v_website IS NOT NULL AND v_website <> '' THEN trust_signal_score := trust_signal_score + 20; END IF;
    IF v_avatar_url IS NOT NULL AND v_avatar_url <> '' THEN trust_signal_score := trust_signal_score + 20; END IF;

    -- Longevity Bonus (if > 3 months)
    IF v_created_at < (NOW() - INTERVAL '3 months') THEN
        trust_signal_score := trust_signal_score + 10;
    END IF;
    trust_signal_score := LEAST(trust_signal_score, 100);

    -- 4. FINAL WEIGHTED INDEX
    final_index := (reliability_score * 0.30) +
                   (review_score * 0.30) +
                   (verification_score * 0.20) +
                   (activity_score * 0.10) +
                   (trust_signal_score * 0.10);

    RETURN jsonb_build_object(
        'index_score', ROUND(final_index, 1),
        'reliability', ROUND(reliability_score, 0),
        'fulfillment_rate', ROUND(reliability_score, 0), -- Backward compatibility
        'reputation', ROUND(review_score, 0),
        'verification_level', ROUND(verification_score, 0),
        'trust_signals', ROUND(trust_signal_score, 0),
        'total_closed_deals', completed_orders,
        'unique_partners', unique_partners,
        'unique_business_partners', unique_partners, -- Backward compatibility
        'avg_rating', ROUND(COALESCE(avg_review_rating, 5.0), 1),
        'avg_user_rating', ROUND(COALESCE(avg_review_rating, 5.0), 1), -- Backward compatibility
        'status', CASE
            WHEN final_index >= 95 THEN 'PLATINUM ELITE'
            WHEN final_index >= 85 THEN 'PREMIUM TRUSTED'
            WHEN final_index >= 70 THEN 'VERIFIED PARTNER'
            WHEN final_index >= 50 THEN 'ACTIVE BUSINESS'
            ELSE 'NEW ENTITY'
        END,
        'recommendation', CASE
            WHEN NOT v_is_verified THEN 'Apply for verification to boost trust score by 20%.'
            WHEN trust_signal_score < 80 THEN 'Complete your business profile (bio, location) to improve reliability rating.'
            WHEN reliability_score < 80 THEN 'Improve order fulfillment rate to reach Elite status.'
            ELSE 'Maintain high engagement and excellent service to keep your Elite status.'
        END
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
