-- COMPREHENSIVE BUSINESS ANALYTICS FUNCTION
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
