-- ADVANCED ANALYTICS WITH AI-DRIVEN RECOMMENDATIONS (HEURISTICS)
CREATE OR REPLACE FUNCTION get_advanced_business_analytics(target_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    stats RECORD;
    recommendations JSONB := '[]'::JSONB;
    engagement_val NUMERIC;
    conversion_val NUMERIC;
BEGIN
    -- 1. Gather Base Stats
    SELECT
        COALESCE(SUM(views), 0) as total_views,
        COALESCE(SUM(shares), 0) as total_shares,
        (SELECT COUNT(*) FROM public.likes WHERE post_id IN (SELECT id FROM public.posts WHERE user_id = target_user_id)) as total_likes,
        (SELECT COUNT(*) FROM public.comments WHERE post_id IN (SELECT id FROM public.posts WHERE user_id = target_user_id)) as total_comments,
        (SELECT COUNT(*) FROM public.follows WHERE following_id = target_user_id) as total_clients,
        (SELECT COUNT(*) FROM public.follows WHERE follower_id = target_user_id) as total_connections
    INTO stats
    FROM public.posts
    WHERE user_id = target_user_id;

    engagement_val := CASE WHEN stats.total_views > 0 THEN (stats.total_likes + stats.total_comments)::NUMERIC / stats.total_views * 100 ELSE 0 END;
    conversion_val := CASE WHEN stats.total_views > 0 THEN stats.total_clients::NUMERIC / stats.total_views * 100 ELSE 0 END;

    -- 2. Generate Heuristic Recommendations

    -- Low Engagement Recommendation
    IF engagement_val < 2 AND stats.total_views > 100 THEN
        recommendations := recommendations || jsonb_build_object(
            'title', 'Boost Engagement',
            'insight', 'Your engagement rate (' || ROUND(engagement_val, 1) || '%) is below industry average.',
            'action', 'Try asking questions in your reel captions to spark conversations.'
        );
    END IF;

    -- High Share vs Low Follow Recommendation
    IF stats.total_shares > stats.total_clients AND stats.total_views > 50 THEN
        recommendations := recommendations || jsonb_build_object(
            'title', 'Convert Viewers to Clients',
            'insight', 'People are sharing your content, but not following yet.',
            'action', 'Add a clear Call-to-Action (CTA) in your bio or reels to "Connect for more updates".'
        );
    END IF;

    -- Consistency Check (Simplified)
    IF (SELECT COUNT(*) FROM public.posts WHERE user_id = target_user_id AND created_at > NOW() - INTERVAL '7 days') = 0 THEN
        recommendations := recommendations || jsonb_build_object(
            'title', 'Consistency is Key',
            'insight', 'You haven''t posted in the last 7 days.',
            'action', 'Post at least 3 reels a week to stay relevant in the algorithm.'
        );
    END IF;

    -- Empty Catalog Check
    IF (SELECT COUNT(*) FROM public.products WHERE business_id = target_user_id) = 0 THEN
        recommendations := recommendations || jsonb_build_object(
            'title', 'Setup Your Shop',
            'insight', 'Your business catalog is empty.',
            'action', 'Add products or services to your catalog to allow clients to browse your offerings.'
        );
    END IF;

    -- 3. Return Combined Payload
    RETURN jsonb_build_object(
        'stats', jsonb_build_object(
            'total_views', stats.total_views,
            'total_shares', stats.total_shares,
            'total_likes', stats.total_likes,
            'total_comments', stats.total_comments,
            'total_clients', stats.total_clients,
            'total_connections', stats.total_connections,
            'engagement_rate', ROUND(engagement_val, 2),
            'conversion_rate', ROUND(conversion_val, 2)
        ),
        'recommendations', recommendations,
        'performance_metrics', (
            SELECT jsonb_agg(d) FROM (
                SELECT
                    date_trunc('day', created_at)::date as day,
                    SUM(views) as daily_views
                FROM public.posts
                WHERE user_id = target_user_id
                GROUP BY 1
                ORDER BY 1 DESC
                LIMIT 7
            ) d
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
