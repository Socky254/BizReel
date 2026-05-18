-- =============================================================
-- BIZREEL: DEFINITIVE VECTOR REPAIR & SCHEMA SYNC
-- =============================================================

-- 1. ENABLE EXTENSION FIRST (Standalone statement)
-- If this fails, the user must enable pgvector in their Supabase/Postgres dashboard.
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. CREATE AI MEMORIES (Separated to ensure vector type is recognized)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vector') THEN
        RAISE EXCEPTION 'The "vector" type is missing. Please enable the pgvector extension in your database dashboard.';
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.ai_memories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    memory_key TEXT NOT NULL,
    memory_value TEXT NOT NULL,
    importance_score FLOAT DEFAULT 0.5,
    embedding VECTOR(1536), -- 1536 is standard for OpenAI embeddings
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. SYNC REMAINING AI TABLES
CREATE TABLE IF NOT EXISTS public.ai_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    session_type TEXT NOT NULL,
    context_summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. PERMISSIONS
ALTER TABLE public.ai_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own AI memories" ON public.ai_memories;
CREATE POLICY "Users can manage their own AI memories"
ON public.ai_memories FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own AI sessions" ON public.ai_sessions;
CREATE POLICY "Users can manage their own AI sessions"
ON public.ai_sessions FOR ALL USING (auth.uid() = user_id);
