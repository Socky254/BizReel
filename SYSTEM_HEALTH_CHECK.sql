-- =============================================================
-- BIZREEL: SYSTEM HEALTH CHECK & DIAGNOSTICS
-- =============================================================

-- 1. VERIFY CORE EXTENSIONS
SELECT name, default_version, installed_version
FROM pg_available_extensions
WHERE name IN ('vector', 'uuid-ossp', 'pgcrypto', 'pg_net');

-- 2. VERIFY CORE TABLES EXISTENCE
DO $$
DECLARE
    required_tables TEXT[] := ARRAY[
        'profiles', 'posts', 'activity_logs', 'likes', 'comments',
        'follows', 'messages', 'notifications', 'products',
        'categories', 'subscription_tiers', 'orders', 'ai_memories'
    ];
    t TEXT;
BEGIN
    FOREACH t IN ARRAY required_tables LOOP
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = t) THEN
            RAISE WARNING 'Missing table: %', t;
        END IF;
    END LOOP;
END $$;

-- 3. CHECK AI MEMORY VECTOR DIMENSION
-- Should be 1536 for most OpenAI/Gemini models
SELECT column_name, data_type, udt_name
FROM information_schema.columns
WHERE table_name = 'ai_memories' AND column_name = 'embedding';

-- 4. RE-ESTABLISH RLS (Security Guardrails)
-- This ensures that any tables created during development have basic RLS.
ALTER TABLE IF EXISTS public.system_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ai_sessions ENABLE ROW LEVEL SECURITY;

-- 5. PERFORMANCE INDEXES (Diagnostic Fix)
-- Add indexes for common search and filter patterns if they don't exist.
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON public.posts(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_receiver_id ON public.notifications(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver ON public.messages(sender_id, receiver_id);
