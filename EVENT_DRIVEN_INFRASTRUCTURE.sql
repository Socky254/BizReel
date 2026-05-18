-- =============================================================
-- BIZREEL: EVENT-DRIVEN SYSTEM INFRASTRUCTURE
-- =============================================================

-- 1. CENTRAL EVENT LOG (For Orchestration)
CREATE TABLE IF NOT EXISTS public.system_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type TEXT NOT NULL, -- 'reel_uploaded', 'user_signed_up', 'order_placed'
    payload JSONB NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TRIGGER: ON REEL UPLOAD
-- This trigger automatically kicks off the AI & Media processing pipeline
CREATE OR REPLACE FUNCTION public.on_reel_uploaded()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.system_events (event_type, payload)
    VALUES (
        'reel_uploaded',
        jsonb_build_object(
            'post_id', NEW.id,
            'user_id', NEW.user_id,
            'video_url', NEW.video_url
        )
    );

    -- Future: Here we would trigger a Supabase Webhook or Edge Function
    -- to start thumbnail generation, moderation, and AI tagging.

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_reel_uploaded ON public.posts;
CREATE TRIGGER tr_reel_uploaded
AFTER INSERT ON public.posts
FOR EACH ROW EXECUTE FUNCTION public.on_reel_uploaded();

-- 3. RLS
ALTER TABLE public.system_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin only events access" ON public.system_events
FOR SELECT USING (auth.email() = 'socratesart@live.com');
