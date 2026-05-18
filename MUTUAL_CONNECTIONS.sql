CREATE OR REPLACE FUNCTION get_mutual_connections_count(user_id_a UUID, user_id_b UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER
        FROM public.follows f1
        JOIN public.follows f2 ON f1.following_id = f2.following_id
        WHERE f1.follower_id = user_id_a
        AND f2.follower_id = user_id_b
        AND f1.following_id != user_id_a
        AND f1.following_id != user_id_b
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_partners_count(u_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER
        FROM public.follows f1
        WHERE f1.follower_id = u_id
        AND EXISTS (
            SELECT 1 FROM public.follows f2
            WHERE f2.follower_id = f1.following_id
            AND f2.following_id = u_id
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
