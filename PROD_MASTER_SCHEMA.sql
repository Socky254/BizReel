-- =============================================================
-- BIZREEL: THE PRODUCTION MASTER DATABASE SCHEMA
-- =============================================================
-- Consolidated version of all previous schema scripts.
-- Includes: Profiles, Posts, Stories, Activity Logs, Likes, Comments,
-- Follows, Messages, Notifications, Saved Posts, Products, Reposts,
-- Live Sessions, Reports, Verification Requests, and Reviews.

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. TABLES

-- PROFILES: Core user and business data
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  business_name TEXT,
  category TEXT,
  bio TEXT,
  website TEXT,
  location TEXT,
  phone TEXT,
  avatar_url TEXT,
  push_token TEXT,
  is_verified BOOLEAN DEFAULT false,
  is_live BOOLEAN DEFAULT false,
  is_private BOOLEAN DEFAULT false,
  allow_downloads BOOLEAN DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- POSTS: Video Reels
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

-- STORIES: 24-hour disappearing content
CREATE TABLE IF NOT EXISTS public.stories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  video_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ACTIVITY LOGS: Intelligence & System Health
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- LIKES: Engagement
CREATE TABLE IF NOT EXISTS public.likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- COMMENTS: Discussion
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- FOLLOWS: Business Network
CREATE TABLE IF NOT EXISTS public.follows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

-- MESSAGES: Direct Communication
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- NOTIFICATIONS: System & User alerts
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL, -- 'like', 'comment', 'follow', 'referral', 'save', 'comment_like', 'message'
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SAVED POSTS: Bookmarks
CREATE TABLE IF NOT EXISTS public.saved_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- COMMENT LIKES: Engagement on discussion
CREATE TABLE IF NOT EXISTS public.comment_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

-- PRODUCTS: Business Catalog
CREATE TABLE IF NOT EXISTS public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- REPOSTS: Referrals
CREATE TABLE IF NOT EXISTS public.reposts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- LIVE SESSIONS: Real-time broadcast tracking
CREATE TABLE IF NOT EXISTS public.live_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT,
  is_active BOOLEAN DEFAULT true,
  viewer_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE
);

-- REPORTS: Content Moderation
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  reporter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- VERIFICATION REQUESTS: Business Authenticity
CREATE TABLE IF NOT EXISTS public.verification_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  business_doc_url TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- REVIEWS & RATINGS: Trust System
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reviewer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(reviewer_id, receiver_id)
);

-- 3. FUNCTIONS & TRIGGERS

-- A. Auto-Profile Creation on Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, business_name, avatar_url)
  VALUES (
    NEW.id,
    LOWER(SPLIT_PART(NEW.email, '@', 1)) || '_' || SUBSTR(CAST(gen_random_uuid() AS TEXT), 1, 4),
    COALESCE(NEW.raw_user_meta_data->>'business_name', SPLIT_PART(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- B. Analytics Incrementers
CREATE OR REPLACE FUNCTION increment_view_count(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.posts SET views = COALESCE(views, 0) + 1 WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_shares(post_id_param UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.posts SET shares = COALESCE(shares, 0) + 1 WHERE id = post_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- C. FREE TIER OPTIMIZATIONS (Post Limits)
CREATE OR REPLACE FUNCTION check_post_limit()
RETURNS TRIGGER AS $$
BEGIN
    IF (SELECT COUNT(*) FROM public.posts WHERE user_id = NEW.user_id) >= 10 THEN
        RAISE EXCEPTION 'Free tier limit reached: Max 10 reels per user during testing.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_check_post_limit ON public.posts;
CREATE TRIGGER tr_check_post_limit
BEFORE INSERT ON public.posts
FOR EACH ROW EXECUTE FUNCTION check_post_limit();

-- D. AUTOMATIC CLEANUP (Keep DB small)
CREATE OR REPLACE FUNCTION purge_excess_data()
RETURNS TRIGGER AS $$
BEGIN
    -- Purge old logs (> 50 per user)
    DELETE FROM public.activity_logs
    WHERE user_id = NEW.user_id AND id NOT IN (
        SELECT id FROM public.activity_logs WHERE user_id = NEW.user_id ORDER BY created_at DESC LIMIT 50
    );
    -- Purge old notifications (> 30 per user)
    DELETE FROM public.notifications
    WHERE receiver_id = NEW.receiver_id AND id NOT IN (
        SELECT id FROM public.notifications WHERE receiver_id = NEW.receiver_id ORDER BY created_at DESC LIMIT 30
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_purge_logs ON public.activity_logs;
CREATE TRIGGER tr_purge_logs AFTER INSERT ON public.activity_logs FOR EACH ROW EXECUTE FUNCTION purge_excess_data();

-- E. AUTOMATED NOTIFICATIONS (TikTok-style system)
CREATE OR REPLACE FUNCTION public.create_notification()
RETURNS TRIGGER AS $$
DECLARE
    target_receiver_id UUID;
    v_post_id UUID;
BEGIN
    -- LIKES
    IF TG_TABLE_NAME = 'likes' THEN
        SELECT user_id INTO target_receiver_id FROM public.posts WHERE id = NEW.post_id;
        v_post_id := NEW.post_id;
        IF NEW.user_id = target_receiver_id THEN RETURN NEW; END IF;
        INSERT INTO public.notifications (receiver_id, sender_id, type, post_id)
        VALUES (target_receiver_id, NEW.user_id, 'like', v_post_id);

    -- COMMENTS
    ELSIF TG_TABLE_NAME = 'comments' THEN
        SELECT user_id INTO target_receiver_id FROM public.posts WHERE id = NEW.post_id;
        v_post_id := NEW.post_id;
        IF NEW.user_id = target_receiver_id THEN RETURN NEW; END IF;
        INSERT INTO public.notifications (receiver_id, sender_id, type, post_id, comment_id)
        VALUES (target_receiver_id, NEW.user_id, 'comment', v_post_id, NEW.id);

    -- COMMENT LIKES
    ELSIF TG_TABLE_NAME = 'comment_likes' THEN
        SELECT user_id, post_id INTO target_receiver_id, v_post_id FROM public.comments WHERE id = NEW.comment_id;
        IF NEW.user_id = target_receiver_id THEN RETURN NEW; END IF;
        INSERT INTO public.notifications (receiver_id, sender_id, type, post_id, comment_id)
        VALUES (target_receiver_id, NEW.user_id, 'comment_like', v_post_id, NEW.comment_id);

    -- FOLLOWS
    ELSIF TG_TABLE_NAME = 'follows' THEN
        target_receiver_id := NEW.following_id;
        INSERT INTO public.notifications (receiver_id, sender_id, type)
        VALUES (target_receiver_id, NEW.follower_id, 'follow');

    -- SAVED POSTS
    ELSIF TG_TABLE_NAME = 'saved_posts' THEN
        SELECT user_id INTO target_receiver_id FROM public.posts WHERE id = NEW.post_id;
        v_post_id := NEW.post_id;
        IF NEW.user_id = target_receiver_id THEN RETURN NEW; END IF;
        INSERT INTO public.notifications (receiver_id, sender_id, type, post_id)
        VALUES (target_receiver_id, NEW.user_id, 'save', v_post_id);

    -- MESSAGES
    ELSIF TG_TABLE_NAME = 'messages' THEN
        INSERT INTO public.notifications (receiver_id, sender_id, type)
        VALUES (NEW.receiver_id, NEW.sender_id, 'message');

    -- REPOSTS (Referrals)
    ELSIF TG_TABLE_NAME = 'reposts' THEN
        SELECT user_id INTO target_receiver_id FROM public.posts WHERE id = NEW.post_id;
        v_post_id := NEW.post_id;
        IF NEW.user_id = target_receiver_id THEN RETURN NEW; END IF;
        INSERT INTO public.notifications (receiver_id, sender_id, type, post_id)
        VALUES (target_receiver_id, NEW.user_id, 'referral', v_post_id);

    -- REVIEWS
    ELSIF TG_TABLE_NAME = 'reviews' THEN
        INSERT INTO public.notifications (receiver_id, sender_id, type)
        VALUES (NEW.receiver_id, NEW.reviewer_id, 'new_review');
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Interaction Triggers
DROP TRIGGER IF EXISTS tr_notify_like ON public.likes;
CREATE TRIGGER tr_notify_like AFTER INSERT ON public.likes FOR EACH ROW EXECUTE FUNCTION public.create_notification();

DROP TRIGGER IF EXISTS tr_notify_comment ON public.comments;
CREATE TRIGGER tr_notify_comment AFTER INSERT ON public.comments FOR EACH ROW EXECUTE FUNCTION public.create_notification();

DROP TRIGGER IF EXISTS tr_notify_comment_like ON public.comment_likes;
CREATE TRIGGER tr_notify_comment_like AFTER INSERT ON public.comment_likes FOR EACH ROW EXECUTE FUNCTION public.create_notification();

DROP TRIGGER IF EXISTS tr_notify_follow ON public.follows;
CREATE TRIGGER tr_notify_follow AFTER INSERT ON public.follows FOR EACH ROW EXECUTE FUNCTION public.create_notification();

DROP TRIGGER IF EXISTS tr_notify_save ON public.saved_posts;
CREATE TRIGGER tr_notify_save AFTER INSERT ON public.saved_posts FOR EACH ROW EXECUTE FUNCTION public.create_notification();

DROP TRIGGER IF EXISTS tr_notify_message ON public.messages;
CREATE TRIGGER tr_notify_message AFTER INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION public.create_notification();

DROP TRIGGER IF EXISTS tr_notify_repost ON public.reposts;
CREATE TRIGGER tr_notify_repost AFTER INSERT ON public.reposts FOR EACH ROW EXECUTE FUNCTION public.create_notification();

DROP TRIGGER IF EXISTS tr_notify_review ON public.reviews;
CREATE TRIGGER tr_notify_review AFTER INSERT ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.create_notification();

-- 4. ROW LEVEL SECURITY (RLS) POLICIES

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reposts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_posts ENABLE ROW LEVEL SECURITY;

-- Policies: Standard Pattern (Public View, Private Edit)

CREATE POLICY "Public profiles are viewable" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users edit own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Posts are public" ON posts FOR SELECT USING (true);
CREATE POLICY "Users manage own posts" ON posts FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own logs" ON activity_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Owner access to logs" ON activity_logs FOR SELECT USING (auth.email() = 'socratesart@live.com');

CREATE POLICY "Likes are public" ON likes FOR SELECT USING (true);
CREATE POLICY "Users manage own likes" ON likes FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Follows are public" ON follows FOR SELECT USING (true);
CREATE POLICY "Users manage own follows" ON follows FOR ALL USING (auth.uid() = follower_id);

CREATE POLICY "Users view own notifications" ON notifications FOR SELECT USING (auth.uid() = receiver_id);
CREATE POLICY "Users manage own messages" ON messages FOR ALL USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Stories are public" ON stories FOR SELECT USING (true);
CREATE POLICY "Users manage own stories" ON stories FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Comments are public" ON comments FOR SELECT USING (true);
CREATE POLICY "Users manage own comments" ON comments FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Products are public" ON products FOR SELECT USING (true);
CREATE POLICY "Businesses manage products" ON products FOR ALL USING (auth.uid() = business_id);

CREATE POLICY "Reposts are public" ON reposts FOR SELECT USING (true);
CREATE POLICY "Users manage own reposts" ON reposts FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Live sessions are public" ON live_sessions FOR SELECT USING (true);
CREATE POLICY "Users manage own live sessions" ON live_sessions FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can report" ON reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Users can view own verification" ON verification_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Reviews are public" ON reviews FOR SELECT USING (true);
CREATE POLICY "Users manage own reviews" ON reviews FOR ALL USING (auth.uid() = reviewer_id);

CREATE POLICY "Users manage own saved posts" ON saved_posts FOR ALL USING (auth.uid() = user_id);
