-- =============================================================
-- BIZREEL: AUTOMATED NOTIFICATION TRIGGERS (TIKTOK STYLE)
-- =============================================================
-- This script ensures all user interactions automatically generate
-- notifications. Run this in your Supabase SQL Editor.

-- 1. Ensure notification table has comment_id for linked interactions
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE;

-- 2. Notification Trigger Function
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

-- 3. Apply Triggers to Interaction Tables

-- Likes
DROP TRIGGER IF EXISTS tr_notify_like ON public.likes;
CREATE TRIGGER tr_notify_like AFTER INSERT ON public.likes FOR EACH ROW EXECUTE FUNCTION public.create_notification();

-- Comments
DROP TRIGGER IF EXISTS tr_notify_comment ON public.comments;
CREATE TRIGGER tr_notify_comment AFTER INSERT ON public.comments FOR EACH ROW EXECUTE FUNCTION public.create_notification();

-- Comment Likes
DROP TRIGGER IF EXISTS tr_notify_comment_like ON public.comment_likes;
CREATE TRIGGER tr_notify_comment_like AFTER INSERT ON public.comment_likes FOR EACH ROW EXECUTE FUNCTION public.create_notification();

-- Follows
DROP TRIGGER IF EXISTS tr_notify_follow ON public.follows;
CREATE TRIGGER tr_notify_follow AFTER INSERT ON public.follows FOR EACH ROW EXECUTE FUNCTION public.create_notification();

-- Saved Posts
DROP TRIGGER IF EXISTS tr_notify_save ON public.saved_posts;
CREATE TRIGGER tr_notify_save AFTER INSERT ON public.saved_posts FOR EACH ROW EXECUTE FUNCTION public.create_notification();

-- Messages
DROP TRIGGER IF EXISTS tr_notify_message ON public.messages;
CREATE TRIGGER tr_notify_message AFTER INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION public.create_notification();

-- Reposts
DROP TRIGGER IF EXISTS tr_notify_repost ON public.reposts;
CREATE TRIGGER tr_notify_repost AFTER INSERT ON public.reposts FOR EACH ROW EXECUTE FUNCTION public.create_notification();

-- Reviews
DROP TRIGGER IF EXISTS tr_notify_review ON public.reviews;
CREATE TRIGGER tr_notify_review AFTER INSERT ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.create_notification();
