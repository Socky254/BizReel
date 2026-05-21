import { supabase } from '../../../lib/supabase';

export class UploadService {
    static async uploadReel(userId: string, videoUri: string, caption: string, category: string) {
        const filename = `${userId}/${Date.now()}.mp4`;

        // 1. Convert URI to Blob/ArrayBuffer
        const response = await fetch(videoUri);
        const blob = await response.blob();
        const arrayBuffer = await new Response(blob).arrayBuffer();

        // 2. Upload to Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('reels')
            .upload(filename, arrayBuffer, {
                contentType: 'video/mp4',
                upsert: false
            });

        if (uploadError) throw uploadError;

        // 3. Get Public URL
        const { data: { publicUrl } } = supabase.storage
            .from('reels')
            .getPublicUrl(filename);

        // 4. Insert into DB
        const { data: postData, error: dbError } = await supabase.from('posts').insert({
            user_id: userId,
            video_url: publicUrl,
            caption: caption,
            category: category || 'General'
        }).select().single();

        if (dbError) throw dbError;

        return postData;
    }

    static async startLiveSession(userId: string, title: string) {
        const { data: sessionId, error } = await supabase.rpc('start_live_session', {
            p_user_id: userId,
            p_title: title.trim()
        });

        if (error) throw error;
        return sessionId;
    }
}
