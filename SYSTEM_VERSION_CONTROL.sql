-- SYSTEM VERSION CONTROL & SEARCH LOGGING

-- 1. TABLE TO TRACK APP VERSIONS
CREATE TABLE IF NOT EXISTS public.app_versions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    version_code TEXT NOT NULL UNIQUE,
    is_mandatory BOOLEAN DEFAULT false,
    release_notes TEXT,
    download_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed initial version
INSERT INTO public.app_versions (version_code, release_notes, is_mandatory)
VALUES ('1.0.0', 'Initial professional B2B release with Discover, Market, and Analytics.', false)
ON CONFLICT DO NOTHING;

-- 2. SEARCH TELEMETRY (For Market Analytics)
CREATE TABLE IF NOT EXISTS public.search_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    search_query TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE public.app_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view app version" ON public.app_versions FOR SELECT USING (true);
CREATE POLICY "Users can view own search logs" ON public.search_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert search logs" ON public.search_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
