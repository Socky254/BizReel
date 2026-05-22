import { IFeedRepository } from '../repositories/IFeedRepository';

export class IncrementViewUseCase {
  constructor(private feedRepo: IFeedRepository) {}

  async execute(postId: string): Promise<void> {
    await this.feedRepo.incrementView(postId);
  }
}
