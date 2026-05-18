import { FeedRepositoryImpl } from '../data/repositories/FeedRepositoryImpl';
import { ProfileRepositoryImpl } from '../data/repositories/ProfileRepositoryImpl';
import { ChatRepositoryImpl } from '../data/repositories/ChatRepositoryImpl';
import { SearchRepositoryImpl } from '../data/repositories/SearchRepositoryImpl';
import { GetFeedUseCase } from '../domain/usecases/GetFeedUseCase';
import { GetProfileUseCase } from '../domain/usecases/GetProfileUseCase';

class DIContainer {
  private _feedRepository = new FeedRepositoryImpl();
  private _profileRepository = new ProfileRepositoryImpl();
  private _chatRepository = new ChatRepositoryImpl();
  private _searchRepository = new SearchRepositoryImpl();

  get getFeedUseCase() {
    return new GetFeedUseCase(this._feedRepository);
  }

  get getProfileUseCase() {
    return new GetProfileUseCase(this._profileRepository);
  }

  get profileRepository() {
    return this._profileRepository;
  }

  get chatRepository() {
    return this._chatRepository;
  }

  get searchRepository() {
    return this._searchRepository;
  }
}

export const container = new DIContainer();
