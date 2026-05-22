-- =============================================================
-- BIZREEL: CONCLUSIVE BUSINESS PERFORMANCE INDEX (UPDATED)
-- =============================================================
-- This script enhances the business performance calculation by
-- integrating transaction diversity, volume, and engagement metrics.

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
