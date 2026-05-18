-- =============================================================
-- FIX: Lint 0010_security_definer_view
-- =============================================================
-- Recommended Fix: Make the view respect RLS via security_invoker = on.
-- We use DROP VIEW first because CREATE OR REPLACE VIEW does not allow
-- changing column names (and the existing view appears to use "user_a").

DROP VIEW IF EXISTS public.partners_view;

CREATE VIEW public.partners_view
WITH (security_invoker = on)
AS
SELECT
    f1.follower_id AS user_id,
    p.id AS partner_id,
    p.username,
    p.business_name,
    p.avatar_url,
    p.category,
    p.is_verified
FROM public.follows f1
JOIN public.follows f2 ON f1.follower_id = f2.following_id AND f1.following_id = f2.follower_id
JOIN public.profiles p ON f1.following_id = p.id;

-- Grant select to authenticated users and anonymous (as per Supabase defaults for public schema views)
GRANT SELECT ON public.partners_view TO authenticated, anon;
