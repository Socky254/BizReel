-- =============================================================
-- BIZREEL: FIX VECTOR EXTENSION AND ENHANCE ANALYTICS
-- =============================================================

-- 1. ENABLE EXTENSION (Fixes "type 'vector' does not exist")
-- This must be run by a superuser or on a Supabase project that supports pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. RE-CREATE AI MEMORIES WITH VECTOR SUPPORT
DROP TABLE IF EXISTS public.ai_memories;
CREATE TABLE IF NOT EXISTS public.ai_memories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    memory_key TEXT NOT NULL,
    memory_value TEXT NOT NULL,
    importance_score FLOAT DEFAULT 0.5,
    embedding VECTOR(1536), -- This will now work
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. ANALYTICS TRIGGER: AUTO-LOG REEL VIEWS
-- Ensures even simple views are tracked for AI recommendations
CREATE OR REPLACE FUNCTION public.log_reel_view()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.reel_views (post_id, viewer_id, device_type)
    VALUES (NEW.id, auth.uid(), 'mobile_app');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. RLS ENHANCEMENT
ALTER TABLE public.ai_memories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own AI memories" ON public.ai_memories;
CREATE POLICY "Users can manage their own AI memories"
ON public.ai_memories FOR ALL USING (auth.uid() = user_id);
