import * as VideoThumbnails from 'expo-video-thumbnails';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

export class CompressionService {
  /**
   * Generates a high-quality thumbnail for a local video file.
   */
  static async generateThumbnail(videoUri: string): Promise<string | null> {
    try {
      const { uri } = await VideoThumbnails.getThumbnailAsync(videoUri, {
        time: 1000,
        quality: 0.8,
      });
      return uri;
    } catch (e) {
      console.error('[CompressionService] Thumbnail generation failed', e);
      return null;
    }
  }

  /**
   * Prepares video for upload by checking size and metadata.
   * In a full dev client, we could use react-native-video-helper here.
   */
  static async prepareForUpload(videoUri: string) {
    const fileInfo = await FileSystem.getInfoAsync(videoUri);
    if (!fileInfo.exists) throw new Error('Video file not found');

    // Log size for diagnostics (Enterprise Ledger optimization)
    const sizeMB = (fileInfo.size / (1024 * 1024)).toFixed(2);
    console.log(`[CompressionService] Preparing video: ${sizeMB} MB`);

    return {
        uri: videoUri,
        size: fileInfo.size,
        name: videoUri.split('/').pop() || 'business_reel.mp4'
    };
  }
}
