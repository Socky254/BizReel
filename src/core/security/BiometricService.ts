import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

const BIOMETRIC_ENABLED_KEY = 'bizreel_biometric_enabled';

export class BiometricService {
  /**
   * Checks if the device supports any form of biometrics.
   */
  static async isSupported(): Promise<boolean> {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return compatible && enrolled;
  }

  /**
   * Sets whether biometric login is enabled for this user.
   */
  static async setEnabled(enabled: boolean): Promise<void> {
    await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, JSON.stringify(enabled));
  }

  /**
   * Checks if the user has opted-in to biometric login.
   */
  static async isEnabled(): Promise<boolean> {
    const value = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
    return value ? JSON.parse(value) : false;
  }

  /**
   * Triggers the biometric prompt (Fingerprint/FaceID).
   */
  static async authenticate(reason: string = 'Confirm your identity to access BizReel HQ'): Promise<boolean> {
    try {
      const results = await LocalAuthentication.authenticateAsync({
        promptMessage: reason,
        fallbackLabel: 'Use Passcode',
        disableDeviceFallback: false,
      });

      return results.success;
    } catch (e) {
      console.error('[BiometricService] Auth error', e);
      return false;
    }
  }

  /**
   * Helper to ask user to enable biometrics after a successful manual login.
   */
  static async promptActivation() {
    const supported = await this.isSupported();
    const alreadyEnabled = await this.isEnabled();

    if (supported && !alreadyEnabled) {
      Alert.alert(
        'Enable Biometric Access',
        'Would you like to use Fingerprint or FaceID for faster, more secure access to BizReel HQ?',
        [
          { text: 'Not Now', style: 'cancel' },
          { text: 'Enable', onPress: () => this.setEnabled(true) },
        ]
      );
    }
  }
}
