-- =============================================================
-- BIZREEL: FINAL MASTER DATABASE UPDATE (2024)
-- =============================================================
-- This script consolidates all missing features:
-- 1. Triple-Tier Networking (Partners, Connections, Clients)
-- 2. Performance Analytics & Milestones
-- 3. Automated TikTok-style Notifications
-- 4. Comment Likes & Enhanced Interactions

-- 1. SCHEMA ENHANCEMENTS

-- Ensure Profiles has missing business fields
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS working_hours TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;

-- Ensure Notifications is ready for deep linking
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- 2. AUTOMATED NOTIFICATION & ANALYTICS ENGINE

CREATE OR REPLACE FUNCTION public.create_notification()
RETURNS TRIGGER AS $$
DECLARE
    target_receiver_id UUID;
    v_post_id UUID;
    v_type TEXT;
BEGIN
    -- Determine Logic by Table

    -- LIKES
    IF TG_TABLE_NAME = 'likes' THEN
        SELECT user_id INTO target_receiver_id FROM public.posts WHERE id = NEW.post_id;
        v_post_id := NEW.post_id;
        v_type := 'like';
        IF NEW.user_id = target_receiver_id THEN RETURN NEW; END IF;

    -- COMMENTS
    ELSIF TG_TABLE_NAME = 'comments' THEN
        SELECT user_id INTO target_receiver_id FROM public.posts WHERE id = NEW.post_id;
        v_post_id := NEW.post_id;
        v_type := 'comment';
        IF NEW.user_id = target_receiver_id THEN RETURN NEW; END IF;

    -- FOLLOWS (Triple Tier Networking)
    ELSIF TG_TABLE_NAME = 'follows' THEN
        target_receiver_id := NEW.following_id;
        v_type := 'follow';
        -- Check if it's a mutual follow (Partner)
        IF EXISTS (SELECT 1 FROM public.follows WHERE follower_id = NEW.following_id AND following_id = NEW.follower_id) THEN
            v_type := 'partner_connection';
        END IF;

    -- SAVED POSTS (Intent Tracking)
    ELSIF TG_TABLE_NAME = 'saved_posts' THEN
        SELECT user_id INTO target_receiver_id FROM public.posts WHERE id = NEW.post_id;
        v_post_id := NEW.post_id;
        v_type := 'save';
        IF NEW.user_id = target_receiver_id THEN RETURN NEW; END IF;

    -- MESSAGES
    ELSIF TG_TABLE_NAME = 'messages' THEN
        target_receiver_id := NEW.receiver_id;
        v_type := 'message';

    -- PERFORMANCE ANALYTICS (Trending & Milestones)
    ELSIF TG_TABLE_NAME = 'posts' AND (OLD.views IS DISTINCT FROM NEW.views) THEN
        IF NEW.views IN (100, 500, 1000, 5000, 10000) THEN
            INSERT INTO public.notifications (receiver_id, sender_id, type, post_id, metadata)
            VALUES (NEW.user_id, NEW.user_id, 'analytics', NEW.id, jsonb_build_object('milestone', NEW.views));
        END IF;
        RETURN NEW;
    END IF;

    -- INSERT NOTIFICATION
    IF target_receiver_id IS NOT NULL THEN
        INSERT INTO public.notifications (receiver_id, sender_id, type, post_id, comment_id)
        VALUES (target_receiver_id, COALESCE(NEW.user_id, NEW.follower_id, NEW.sender_id), v_type, v_post_id,
                CASE WHEN TG_TABLE_NAME = 'comments' THEN NEW.id ELSE NULL END);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. APPLY TRIGGERS (Cleanup & Re-apply)
DROP TRIGGER IF EXISTS tr_notify_like ON public.likes;
CREATE TRIGGER tr_notify_like AFTER INSERT ON public.likes FOR EACH ROW EXECUTE FUNCTION public.create_notification();

DROP TRIGGER IF EXISTS tr_notify_comment ON public.comments;
CREATE TRIGGER tr_notify_comment AFTER INSERT ON public.comments FOR EACH ROW EXECUTE FUNCTION public.create_notification();

DROP TRIGGER IF EXISTS tr_notify_follow ON public.follows;
CREATE TRIGGER tr_notify_follow AFTER INSERT ON public.follows FOR EACH ROW EXECUTE FUNCTION public.create_notification();

DROP TRIGGER IF EXISTS tr_notify_save ON public.saved_posts;
CREATE TRIGGER tr_notify_save AFTER INSERT ON public.saved_posts FOR EACH ROW EXECUTE FUNCTION public.create_notification();

DROP TRIGGER IF EXISTS tr_notify_message ON public.messages;
CREATE TRIGGER tr_notify_message AFTER INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION public.create_notification();

DROP TRIGGER IF EXISTS tr_notify_performance ON public.posts;
CREATE TRIGGER tr_notify_performance AFTER UPDATE OF views ON public.posts FOR EACH ROW EXECUTE FUNCTION public.create_notification();

-- 4. ANALYTICS RPC (Ensure view incrementing works)
CREATE OR REPLACE FUNCTION increment_view_count(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.posts SET views = COALESCE(views, 0) + 1 WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
