-- =============================================================
-- BIZREEL: TOTAL DOMAIN EXPANSION (AI MENTOR & LIVE COMMERCE)
-- =============================================================

-- 1. AI MENTOR DOMAIN
CREATE TABLE IF NOT EXISTS public.ai_mentor_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    topic TEXT, -- 'Marketing', 'Financials', 'Operations', 'Scaling'
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ai_mentor_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES public.ai_mentor_sessions(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.business_insights (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    insight_type TEXT, -- 'growth', 'risk', 'efficiency'
    priority TEXT DEFAULT 'medium',
    is_actioned BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. LIVE COMMERCE DOMAIN
-- Enhancing the existing live_sessions
ALTER TABLE public.live_sessions
ADD COLUMN IF NOT EXISTS stream_key TEXT,
ADD COLUMN IF NOT EXISTS playback_url TEXT,
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

CREATE TABLE IF NOT EXISTS public.live_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES public.live_sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.live_products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES public.live_sessions(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    is_pinned BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. RLS POLICIES
ALTER TABLE public.ai_mentor_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_mentor_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_products ENABLE ROW LEVEL SECURITY;

-- AI Mentor: Private access
CREATE POLICY "Users can manage their mentor sessions" ON ai_mentor_sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their mentor messages" ON ai_mentor_messages FOR ALL
USING (EXISTS (SELECT 1 FROM ai_mentor_sessions WHERE id = session_id AND user_id = auth.uid()));
CREATE POLICY "Users can view own insights" ON business_insights FOR SELECT USING (auth.uid() = user_id);

-- Live Commerce: Public view, Private control
CREATE POLICY "Anyone can view live comments" ON live_comments FOR SELECT USING (true);
CREATE POLICY "Users can post comments in live" ON live_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Anyone can view featured products" ON live_products FOR SELECT USING (true);

-- 4. ANALYTICS TRIGGER: TRENDING LIVES
CREATE OR REPLACE FUNCTION public.update_live_viewer_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.live_sessions SET viewer_count = viewer_count + 1 WHERE id = NEW.session_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.live_sessions SET viewer_count = GREATEST(0, viewer_count - 1) WHERE id = OLD.session_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
