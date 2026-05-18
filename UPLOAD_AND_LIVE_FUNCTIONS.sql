-- =============================================================
-- BIZREEL: UPLOAD & LIVE SESSION CORE FUNCTIONS
-- =============================================================

-- 1. START LIVE SESSION RPC
-- This function handles the logic for a business going live.
CREATE OR REPLACE FUNCTION public.start_live_session(p_user_id UUID, p_title TEXT)
RETURNS UUID AS $$
DECLARE
    v_session_id UUID;
BEGIN
    -- Deactivate any previous sessions for this user
    UPDATE public.live_sessions
    SET is_active = false, ended_at = NOW()
    WHERE user_id = p_user_id AND is_active = true;

    -- Create new session
    INSERT INTO public.live_sessions (user_id, title, is_active, created_at)
    VALUES (p_user_id, p_title, true, NOW())
    RETURNING id INTO v_session_id;

    -- Update profile status
    UPDATE public.profiles SET is_live = true WHERE id = p_user_id;

    RETURN v_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. END LIVE SESSION RPC
CREATE OR REPLACE FUNCTION public.end_live_session(p_session_id UUID)
RETURNS VOID AS $$
DECLARE
    v_user_id UUID;
BEGIN
    SELECT user_id INTO v_user_id FROM public.live_sessions WHERE id = p_session_id;

    UPDATE public.live_sessions
    SET is_active = false, ended_at = NOW()
    WHERE id = p_session_id;

    UPDATE public.profiles SET is_live = false WHERE id = v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. STORAGE BUCKET SETUP (Documentation/Policy)
-- Note: Buckets are usually created via Supabase Dashboard,
-- but these policies ensure they work for 'reels' and 'live_thumbs'.

/*
INSERT INTO storage.buckets (id, name, public) VALUES ('reels', 'reels', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('live_thumbs', 'live_thumbs', true) ON CONFLICT DO NOTHING;

CREATE POLICY "Public Reel Access" ON storage.objects FOR SELECT USING (bucket_id = 'reels');
CREATE POLICY "Users can upload reels" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'reels' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Public Live Thumbnails" ON storage.objects FOR SELECT USING (bucket_id = 'live_thumbs');
CREATE POLICY "Users can upload live thumbs" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'live_thumbs' AND auth.uid()::text = (storage.foldername(name))[1]);
*/

-- 4. GRANT EXECUTION
GRANT EXECUTE ON FUNCTION public.start_live_session(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.end_live_session(UUID) TO authenticated;
