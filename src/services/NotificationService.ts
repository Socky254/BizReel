import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';

export class NotificationService {
  /**
   * Configures how notifications are handled when the app is foregrounded.
   */
  static configure() {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  }

  /**
   * Registers for push notifications and saves the token to the user profile.
   */
  static async registerForPushNotifications(userId: string) {
    if (Platform.OS === 'web') return;

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }

    const token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log('[NotificationService] Expo Push Token:', token);

    // Save token to Supabase profiles table
    const { error } = await supabase
      .from('profiles')
      .update({ push_token: token })
      .eq('id', userId);

    if (error) {
      console.error('[NotificationService] Error saving token to DB:', error.message);
    }
  }
}
