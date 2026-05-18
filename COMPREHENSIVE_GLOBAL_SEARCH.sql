-- COMPREHENSIVE GLOBAL SEARCH ENGINE (EVERYTHING SEARCH)
CREATE OR REPLACE FUNCTION public.global_search(search_term TEXT)
RETURNS TABLE (
    id UUID,
    title TEXT,
    subtitle TEXT,
    image_url TEXT,
    entity_type TEXT,
    metadata JSONB
) AS $$
BEGIN
    -- 1. Search Businesses (Profiles)
    RETURN QUERY
    SELECT
        p.id,
        p.business_name AS title,
        '@' || p.username AS subtitle,
        p.avatar_url AS image_url,
        'business'::TEXT AS entity_type,
        jsonb_build_object('category', p.category, 'location', p.location) AS metadata
    FROM public.profiles p
    WHERE p.business_name ILIKE '%' || search_term || '%'
       OR p.username ILIKE '%' || search_term || '%'
       OR p.category ILIKE '%' || search_term || '%'
       OR p.bio ILIKE '%' || search_term || '%';

    -- 2. Search Reels (Posts)
    RETURN QUERY
    SELECT
        r.id,
        r.caption AS title,
        p.business_name AS subtitle,
        p.avatar_url AS image_url,
        'reel'::TEXT AS entity_type,
        jsonb_build_object('user_id', r.user_id, 'views', r.views) AS metadata
    FROM public.posts r
    JOIN public.profiles p ON r.user_id = p.id
    WHERE r.caption ILIKE '%' || search_term || '%'
       OR r.category ILIKE '%' || search_term || '%';

    -- 3. Search Products (Catalog)
    RETURN QUERY
    SELECT
        pr.id,
        pr.name AS title,
        p.business_name AS subtitle,
        pr.image_url AS image_url,
        'product'::TEXT AS entity_type,
        jsonb_build_object('price', pr.price, 'business_id', pr.business_id) AS metadata
    FROM public.products pr
    JOIN public.profiles p ON pr.business_id = p.id
    WHERE pr.name ILIKE '%' || search_term || '%'
       OR pr.description ILIKE '%' || search_term || '%';

    -- 4. Search Market Categories
    RETURN QUERY
    SELECT
        DISTINCT ON (category)
        gen_random_uuid() as id,
        category as title,
        'Business Sector' as subtitle,
        NULL as image_url,
        'sector'::TEXT as entity_type,
        '{}'::JSONB as metadata
    FROM public.profiles
    WHERE category ILIKE '%' || search_term || '%';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- GRANT EXECUTE
GRANT EXECUTE ON FUNCTION public.global_search(TEXT) TO authenticated, anon;
