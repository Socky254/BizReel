-- =============================================================
-- BIZREEL: FINAL BACKEND SYNC (SEARCH & INTELLIGENCE)
-- =============================================================
-- This script adds the RPC functions required by the new frontend:
-- 1. get_market_trends (for Search trends)
-- 2. global_search (for search logic)

-- A. SEARCH TRENDS ENGINE
CREATE OR REPLACE FUNCTION public.get_market_trends()
RETURNS TABLE (
    label TEXT,
    count_val BIGINT,
    trend_type TEXT,
    metadata JSONB
) AS $$
BEGIN
    -- Return trending sectors from profiles
    RETURN QUERY
    SELECT
        category AS label,
        COUNT(*)::BIGINT AS count_val,
        'sector'::TEXT AS trend_type,
        '{}'::JSONB AS metadata
    FROM public.profiles
    WHERE category IS NOT NULL
    GROUP BY category
    ORDER BY count_val DESC
    LIMIT 5;

    -- Return trending reels based on views
    RETURN QUERY
    SELECT
        caption AS label,
        views::BIGINT AS count_val,
        'reel'::TEXT AS trend_type,
        jsonb_build_object('id', id) AS metadata
    FROM public.posts
    WHERE caption IS NOT NULL
    ORDER BY views DESC
    LIMIT 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- B. GLOBAL SEARCH ENGINE
DROP FUNCTION IF EXISTS public.global_search(TEXT);

CREATE OR REPLACE FUNCTION public.global_search(search_term TEXT)
RETURNS TABLE (
    id UUID,
    title TEXT,
    subtitle TEXT,
    image_url TEXT,
    entity_type TEXT
) AS $$
BEGIN
    -- Search Businesses
    RETURN QUERY
    SELECT
        p.id,
        p.business_name AS title,
        '@' || p.username AS subtitle,
        p.avatar_url AS image_url,
        'business'::TEXT AS entity_type
    FROM public.profiles p
    WHERE p.business_name ILIKE '%' || search_term || '%'
       OR p.username ILIKE '%' || search_term || '%'
       OR p.category ILIKE '%' || search_term || '%';

    -- Search Reels
    RETURN QUERY
    SELECT
        r.id,
        r.caption AS title,
        p.business_name AS subtitle,
        p.avatar_url AS image_url,
        'reel'::TEXT AS entity_type
    FROM public.posts r
    JOIN public.profiles p ON r.user_id = p.id
    WHERE r.caption ILIKE '%' || search_term || '%'
       OR r.category ILIKE '%' || search_term || '%';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- GRANT EXECUTION
GRANT EXECUTE ON FUNCTION public.get_market_trends() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.global_search(TEXT) TO authenticated, anon;
