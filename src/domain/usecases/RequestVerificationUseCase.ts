import { IVerificationRepository } from '../repositories/IVerificationRepository';
import { ErrorHandler } from '../../core/error_handler/ErrorHandler';
import { eventBus, AppEvents } from '../../core/events/EventBus';

export class RequestVerificationUseCase {
  constructor(private verificationRepo: IVerificationRepository) {}

  async execute(userId: string, documentUri: string) {
    try {
      if (!documentUri) throw new Error('A business document is required for verification.');

      const request = await this.verificationRepo.submitRequest(userId, documentUri);

      // Notify the app that profile state has changed
      eventBus.emit(AppEvents.PROFILE_UPDATED);

      return request;
    } catch (e) {
      ErrorHandler.handle(e, 'RequestVerificationUseCase');
      throw e;
    }
  }
}
