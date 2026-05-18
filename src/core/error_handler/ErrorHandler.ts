import { Alert } from 'react-native';

export class ErrorHandler {
  static handle(error: any, context?: string) {
    console.error(`[${context || 'ERROR'}]`, error);

    // Filter which errors should be shown to user
    const message = error.message || "An unexpected error occurred.";

    // In production, we'd log to a service like Sentry here
  }

  static showError(message: string, title: string = "Notice") {
    Alert.alert(title, message);
  }
}
