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
      // 1. Fetch Backend-Driven UI Config
      const config = await ConfigEngine.getActiveConfig();
      const algorithm = config.rules.feed_ranking;

      // 2. Request Data from Repository
      const posts = await this.feedRepo.getFeed(algorithm);

      // 3. AI Ranking Layer (If user is authenticated)
      if (userId && posts.length > 0) {
        const rankedReels = await this.aiGateway.executeTask<any[]>('RECOMMENDATION', {
          userId,
          candidateIds: posts.map((p) => p.id),
        });

        if (rankedReels) {
          return posts.sort((a, b) => {
            const rankA = rankedReels.find((r) => r.id === a.id)?.score || 0;
            const rankB = rankedReels.find((r) => r.id === b.id)?.score || 0;
            return rankB - rankA;
          });
        }
      }

      return posts;
    } catch (e) {
      console.error('GetFeedUseCase Failure:', e);
      return [];
    }
  }
}
