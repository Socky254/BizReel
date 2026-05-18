-- =============================================================
-- BIZREEL: ADVANCED AI & GRANULAR ANALYTICS
-- =============================================================

-- 1. GRANULAR REEL ANALYTICS (Replacing simple counters for deep insights)
CREATE TABLE IF NOT EXISTS public.reel_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    viewer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    duration_watched INTEGER, -- in seconds
    is_fully_watched BOOLEAN DEFAULT false,
    device_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.reel_shares (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    sharer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    platform TEXT, -- 'whatsapp', 'internal', 'copy_link', etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. AI INFRASTRUCTURE
CREATE TABLE IF NOT EXISTS public.ai_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    session_type TEXT NOT NULL, -- 'business_consultant', 'content_optimizer', 'market_analyst'
    context_summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ai_memories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    memory_key TEXT NOT NULL,
    memory_value TEXT NOT NULL,
    importance_score FLOAT DEFAULT 0.5,
    embedding VECTOR(1536), -- Requires pgvector for RAG
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. ENHANCED ANALYTICS VIEWS
CREATE OR REPLACE VIEW public.v_business_retention AS
SELECT
    p.user_id,
    COUNT(DISTINCT v.viewer_id) as unique_viewers,
    AVG(v.duration_watched) as avg_watch_time,
    (SELECT COUNT(*) FROM public.follows WHERE following_id = p.user_id) as total_followers
FROM public.posts p
LEFT JOIN public.reel_views v ON p.id = v.post_id
GROUP BY p.user_id;

-- 4. RLS POLICIES
ALTER TABLE public.reel_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reel_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reel analytics"
ON public.reel_views FOR SELECT
USING (EXISTS (SELECT 1 FROM public.posts WHERE posts.id = reel_views.post_id AND posts.user_id = auth.uid()));

CREATE POLICY "Users can manage their own AI sessions"
ON public.ai_sessions FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own AI memories"
ON public.ai_memories FOR ALL
USING (auth.uid() = user_id);
