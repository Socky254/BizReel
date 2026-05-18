import { AiGateway } from '../../core/ai/AiGateway';
import { supabase } from '../../lib/supabase';

/**
 * Enterprise-grade Feed Engine Use Case
 *
 * Implements the multi-layer feed generation:
 * 1. Fetch base reels
 * 2. Pass to AI Recommendation Layer for ranking
 * 3. Return personalized feed
 */

export class GetRecommendedFeedUseCase {
    private aiGateway = AiGateway.getInstance();

    async execute(userId: string, limit: number = 10) {
        // 1. Fetch base reels from Postgres
        const { data: reels, error } = await supabase
            .from('posts')
            .select('*, profiles(*)')
            .order('created_at', { ascending: false })
            .limit(limit * 2); // Fetch more to allow AI ranking

        if (error) throw error;

        // 2. AI Ranking Layer (Call Gateway)
        // In a real system, this would call a ranking engine.
        // For now, we simulate the structure.
        const rankedReels = await this.aiGateway.executeTask<any[]>('RECOMENDATION', {
            userId,
            candidateIds: reels.map(r => r.id),
            userContext: {
                // Fetch recent interactions from activity_logs to pass to AI
            }
        });

        if (rankedReels) {
            // Sort reels based on AI ranking
            return reels.sort((a, b) => {
                const rankA = rankedReels.find(r => r.id === a.id)?.score || 0;
                const rankB = rankedReels.find(r => r.id === b.id)?.score || 0;
                return rankB - rankA;
            }).slice(0, limit);
        }

        return reels.slice(0, limit);
    }
}
