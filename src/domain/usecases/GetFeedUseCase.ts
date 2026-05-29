import { IFeedRepository } from '../repositories/IFeedRepository';
import { Post } from '../models';
import { ConfigEngine } from '../../core/config/ConfigEngine';
import { AiGateway } from '../../core/ai/AiGateway';

/**
 * Enterprise GetFeedUseCase
 *
 * Flow:
 * 1. Fetch Remote Config for Algorithm
 * 2. Fetch Data from Repository
 * 3. Apply AI Ranking (Point 8 Architecture)
 */
export class GetFeedUseCase {
  private aiGateway = AiGateway.getInstance();

  constructor(private feedRepo: IFeedRepository) {}

  async execute(userId?: string): Promise<Post[]> {
    try {
      // 1. Fetch Backend-Driven UI Config (with fast fallback)
      const config = await ConfigEngine.getActiveConfig();
      const algorithm = config.rules.feed_ranking;

      // 2. Request Data from Repository
      const posts = await this.feedRepo.getFeed(algorithm);

      // 3. AI Ranking Layer (Async optimization: Don't let AI fail the whole feed)
      if (userId && posts.length > 0) {
        try {
          // Add a timeout to AI ranking to ensure feed loads even if AI is slow
          const aiRankingPromise = this.aiGateway.executeTask<any[]>('RECOMMENDATION', {
            userId,
            candidateIds: posts.map((p) => p.id),
          });

          const timeoutPromise = new Promise<null>((_, reject) =>
            setTimeout(() => reject(new Error('AI Timeout')), 2000),
          );

          const rankedReels = await Promise.race([aiRankingPromise, timeoutPromise]);

          if (rankedReels) {
            return posts.sort((a, b) => {
              const rankA = rankedReels.find((r: any) => r.id === a.id)?.score || 0;
              const rankB = rankedReels.find((r: any) => r.id === b.id)?.score || 0;
              return rankB - rankA;
            });
          }
        } catch (aiError) {
          console.log('GetFeedUseCase: AI ranking skipped or timed out.', aiError);
          // Fallback to default sorting (posts) is handled by returning posts at end
        }
      }

      return posts;
    } catch (e) {
      console.error('GetFeedUseCase Failure:', e);
      return [];
    }
  }
}
