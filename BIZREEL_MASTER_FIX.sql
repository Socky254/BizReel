-- =============================================================
-- BIZREEL: THE ULTIMATE SURGICAL FIX & CONSOLIDATED SCHEMA
-- =============================================================
-- This script ensures all tables, columns, RLS policies, and
-- storage buckets are correctly configured for a fully functional app.

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. CORE SYSTEM TABLES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  business_name TEXT,
  category TEXT,
  bio TEXT,
  website TEXT,
  location TEXT,
  phone TEXT,
  working_hours TEXT,
  avatar_url TEXT,
  push_token TEXT,
  tier TEXT DEFAULT 'BASIC', -- 'BASIC', 'PRO', 'ENTERPRISE'
  lead_credits INTEGER DEFAULT 5,
  is_verified BOOLEAN DEFAULT false,
  verification_status TEXT DEFAULT 'unverified', -- 'unverified', 'pending', 'approved', 'rejected'
  is_live BOOLEAN DEFAULT false,
  is_private BOOLEAN DEFAULT false,
  allow_downloads BOOLEAN DEFAULT true,
  mfa_enabled BOOLEAN DEFAULT false,
  show_active_status BOOLEAN DEFAULT true,
  dm_setting TEXT DEFAULT 'everyone',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Robust Column Enforcement
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'unverified';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'BASIC';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS lead_credits INTEGER DEFAULT 5;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_live BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS allow_downloads BOOLEAN DEFAULT true;

CREATE TABLE IF NOT EXISTS public.posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  video_url TEXT NOT NULL,
  caption TEXT,
  category TEXT,
  views INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  is_sponsored BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.follows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

CREATE TABLE IF NOT EXISTS public.stories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    media_url TEXT NOT NULL,
    type TEXT DEFAULT 'video',
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.live_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT,
    is_active BOOLEAN DEFAULT true,
    viewer_count INTEGER DEFAULT 0,
    stream_key TEXT,
    playback_url TEXT,
    thumbnail_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.live_sessions ADD COLUMN IF NOT EXISTS playback_url TEXT;
ALTER TABLE public.live_sessions ADD COLUMN IF NOT EXISTS stream_key TEXT;
ALTER TABLE public.live_sessions ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

CREATE TABLE IF NOT EXISTS public.live_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES public.live_sessions(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.live_products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES public.live_sessions(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    is_pinned BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.verification_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    business_doc_url TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. STORAGE BUCKETS
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('avatars', 'avatars', true),
  ('reels', 'reels', true),
  ('products', 'products', true),
  ('verification', 'verification', true)
ON CONFLICT (id) DO NOTHING;

-- 4. SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;

-- Policies for Profiles
DROP POLICY IF EXISTS "Public View Profiles" ON public.profiles;
CREATE POLICY "Public View Profiles" ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users Manage Own Profile" ON public.profiles;
CREATE POLICY "Users Manage Own Profile" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Policies for Posts
DROP POLICY IF EXISTS "Public View Posts" ON public.posts;
CREATE POLICY "Public View Posts" ON public.posts FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users Manage Own Posts" ON public.posts;
CREATE POLICY "Users Manage Own Posts" ON public.posts FOR ALL USING (auth.uid() = user_id);

-- Policies for Likes/Comments
DROP POLICY IF EXISTS "Public View Likes" ON public.likes;
CREATE POLICY "Public View Likes" ON public.likes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users Toggle Likes" ON public.likes;
CREATE POLICY "Users Toggle Likes" ON public.likes FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Public View Comments" ON public.comments;
CREATE POLICY "Public View Comments" ON public.comments FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users Manage Own Comments" ON public.comments;
CREATE POLICY "Users Manage Own Comments" ON public.comments FOR ALL USING (auth.uid() = user_id);

-- Policies for Live Sessions
DROP POLICY IF EXISTS "Public View Live Sessions" ON public.live_sessions;
CREATE POLICY "Public View Live Sessions" ON public.live_sessions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users Manage Own Live Sessions" ON public.live_sessions;
CREATE POLICY "Users Manage Own Live Sessions" ON public.live_sessions FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Public View Live Comments" ON public.live_comments;
CREATE POLICY "Public View Live Comments" ON public.live_comments FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users Post Live Comments" ON public.live_comments;
CREATE POLICY "Users Post Live Comments" ON public.live_comments FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Storage Policies
DROP POLICY IF EXISTS "Avatars are public" ON storage.objects;
CREATE POLICY "Avatars are public" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
DROP POLICY IF EXISTS "Users can upload avatars" ON storage.objects;
CREATE POLICY "Users can upload avatars" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
DROP POLICY IF EXISTS "Users can update own avatars" ON storage.objects;
CREATE POLICY "Users can update own avatars" ON storage.objects FOR UPDATE WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Reels are public" ON storage.objects;
CREATE POLICY "Reels are public" ON storage.objects FOR SELECT USING (bucket_id = 'reels');
DROP POLICY IF EXISTS "Users can upload reels" ON storage.objects;
CREATE POLICY "Users can upload reels" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'reels' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 5. CORE RPC FUNCTIONS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, business_name, avatar_url, tier, is_verified, bio)
  VALUES (
    NEW.id,
    LOWER(SPLIT_PART(NEW.email, '@', 1)) || '_' || SUBSTR(CAST(gen_random_uuid() AS TEXT), 1, 4),
    COALESCE(NEW.raw_user_meta_data->>'business_name', SPLIT_PART(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    CASE WHEN NEW.email = 'Socratesart@live.com' THEN 'ENTERPRISE' ELSE 'BASIC' END,
    CASE WHEN NEW.email = 'Socratesart@live.com' THEN true ELSE false END,
    CASE WHEN NEW.email = 'Socratesart@live.com' THEN 'Founder of BizReel' ELSE '' END
  )
  ON CONFLICT (id) DO UPDATE SET
    business_name = EXCLUDED.business_name,
    avatar_url = EXCLUDED.avatar_url;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cleanup existing trigger to avoid duplicates
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Live Session RPC
CREATE OR REPLACE FUNCTION public.start_live_session(p_title TEXT, p_user_id UUID)
RETURNS UUID AS $$
DECLARE
    v_session_id UUID;
BEGIN
    UPDATE public.live_sessions
    SET is_active = false, ended_at = NOW()
    WHERE user_id = p_user_id AND is_active = true;

    INSERT INTO public.live_sessions (user_id, title, is_active, created_at)
    VALUES (p_user_id, p_title, true, NOW())
    RETURNING id INTO v_session_id;

    RETURN v_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- View Counter RPC
CREATE OR REPLACE FUNCTION public.increment_view_count(post_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.posts
    SET views = views + 1
    WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. PERMISSIONS
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;
