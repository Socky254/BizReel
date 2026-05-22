import { IFeedRepository } from '../repositories/IFeedRepository';
import { Story } from '../models';

export class GetStoriesUseCase {
  constructor(private feedRepo: IFeedRepository) {}

  async execute(userId?: string): Promise<Story[]> {
    return await this.feedRepo.getStories(userId);
  }
}
