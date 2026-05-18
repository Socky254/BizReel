import { IProfileRepository } from '../repositories/IProfileRepository';
import { Profile } from '../models';

export class GetProfileUseCase {
  constructor(private profileRepo: IProfileRepository) {}

  async execute(id: string): Promise<Profile | null> {
    return await this.profileRepo.getProfile(id);
  }
}
