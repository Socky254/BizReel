import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from './supabase';

export async function registerForPushNotificationsAsync(userId: string) {
  if (!userId) return;

  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  // Check if it's a physical device
  const isDevice = Constants.executionEnvironment !== 'storeClient';

  if (isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('Push permissions denied');
      return;
    }

    try {
      // Robust Project ID fetching
      const projectId = Constants.expoConfig?.extra?.eas?.projectId ||
                        Constants.easConfig?.projectId ||
                        '020ed245-4101-4c4f-8836-132f3a65d79b'; // Fallback to last known

      token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;

      if (token) {
        await supabase.from('profiles').update({ push_token: token }).eq('id', userId);
        console.log('Push token synced');
      }
    } catch (e) {
      console.error('Push token error:', e);
    }
  }

  return token;
}
