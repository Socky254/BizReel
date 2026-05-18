-- INBOX & MESSAGING SQL UPDATES

-- A. FUNCTION TO FETCH CONVERSATION LIST WITH LATEST MESSAGE
CREATE OR REPLACE FUNCTION get_conversation_list(u_id UUID)
RETURNS TABLE (
    other_user_id UUID,
    other_username TEXT,
    other_business_name TEXT,
    other_avatar_url TEXT,
    last_message_text TEXT,
    last_message_at TIMESTAMP WITH TIME ZONE,
    unread_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH latest_messages AS (
        SELECT
            CASE WHEN sender_id = u_id THEN receiver_id ELSE sender_id END as contact_id,
            text,
            created_at,
            is_read,
            receiver_id,
            ROW_NUMBER() OVER (PARTITION BY (CASE WHEN sender_id = u_id THEN receiver_id ELSE sender_id END) ORDER BY created_at DESC) as rn
        FROM public.messages
        WHERE sender_id = u_id OR receiver_id = u_id
    ),
    unread_counts AS (
        SELECT sender_id as contact_id, COUNT(*) as cnt
        FROM public.messages
        WHERE receiver_id = u_id AND is_read = false
        GROUP BY sender_id
    )
    SELECT
        p.id as other_user_id,
        p.username as other_username,
        p.business_name as other_business_name,
        p.avatar_url as other_avatar_url,
        m.text as last_message_text,
        m.created_at as last_message_at,
        COALESCE(u.cnt, 0)::BIGINT as unread_count
    FROM latest_messages m
    JOIN public.profiles p ON m.contact_id = p.id
    LEFT JOIN unread_counts u ON p.id = u.contact_id
    WHERE m.rn = 1
    ORDER BY m.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- B. ENSURE NOTIFICATIONS TABLE HAS SENDER PROFILE RELATION
-- This is just for documentation, the relation exists via the foreign key.

-- C. GRANT PERMISSIONS
GRANT EXECUTE ON FUNCTION get_conversation_list(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_conversation_list(UUID) TO anon;

-- D. ROW LEVEL SECURITY FOR MESSAGES
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own messages" ON public.messages;
CREATE POLICY "Users can view their own messages" ON public.messages
FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
CREATE POLICY "Users can send messages" ON public.messages
FOR INSERT WITH CHECK (auth.uid() = sender_id);
