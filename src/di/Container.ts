import { FeedRepositoryImpl } from '../data/repositories/FeedRepositoryImpl';
import { ProfileRepositoryImpl } from '../data/repositories/ProfileRepositoryImpl';
import { ChatRepositoryImpl } from '../data/repositories/ChatRepositoryImpl';
import { SearchRepositoryImpl } from '../data/repositories/SearchRepositoryImpl';
import { MarketplaceRepositoryImpl } from '../data/repositories/MarketplaceRepositoryImpl';
import { VerificationRepositoryImpl } from '../data/repository_impl/VerificationRepositoryImpl';
import { FinanceRepositoryImpl } from '../data/repositories/FinanceRepositoryImpl';
import { GetFeedUseCase } from '../domain/usecases/GetFeedUseCase';
import { IncrementViewUseCase } from '../domain/usecases/IncrementViewUseCase';
import { GetStoriesUseCase } from '../domain/usecases/GetStoriesUseCase';
import { GetProfileUseCase } from '../domain/usecases/GetProfileUseCase';
import { RequestVerificationUseCase } from '../domain/usecases/RequestVerificationUseCase';

class DIContainer {
  private _feedRepository = new FeedRepositoryImpl();
  private _profileRepository = new ProfileRepositoryImpl();
  private _chatRepository = new ChatRepositoryImpl();
  private _searchRepository = new SearchRepositoryImpl();
  private _marketplaceRepository = new MarketplaceRepositoryImpl();
  private _verificationRepository = new VerificationRepositoryImpl();
  private _financeRepository = new FinanceRepositoryImpl();

  // SINGLETON USE CASES
  private _getFeedUseCase = new GetFeedUseCase(this._feedRepository);
  private _incrementViewUseCase = new IncrementViewUseCase(this._feedRepository);
  private _getStoriesUseCase = new GetStoriesUseCase(this._feedRepository);
  private _getProfileUseCase = new GetProfileUseCase(this._profileRepository);
  private _requestVerificationUseCase = new RequestVerificationUseCase(this._verificationRepository);

  get getFeedUseCase() {
    return this._getFeedUseCase;
  }

  get incrementViewUseCase() {
    return this._incrementViewUseCase;
  }

  get getStoriesUseCase() {
    return this._getStoriesUseCase;
  }

  get getProfileUseCase() {
    return this._getProfileUseCase;
  }

  get requestVerificationUseCase() {
    return this._requestVerificationUseCase;
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

  get marketplaceRepository() {
    return this._marketplaceRepository;
  }

  get verificationRepository() {
    return this._verificationRepository;
  }

  get financeRepository() {
    return this._financeRepository;
  }
}

export const container = new DIContainer();
