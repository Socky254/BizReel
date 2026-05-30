import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

const VIDEO_CACHE_DIR = `${FileSystem.cacheDirectory}bizreel_videos/`;

export class VideoService {
  private static async ensureCacheDir() {
    if (Platform.OS === 'web') return;
    const dirInfo = await FileSystem.getInfoAsync(VIDEO_CACHE_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(VIDEO_CACHE_DIR, { intermediates: true });
    }
  }

  /**
   * High-Performance Prefetching:
   * Downloads multiple videos ahead of the user to ensure zero-latency.
   */
  static async prefetchVideos(urls: string[]) {
    if (Platform.OS === 'web') return;
    await this.ensureCacheDir();

    // Process top 3 URLs in parallel for speed
    const tasks = urls.slice(0, 3).map(url => this.prefetchVideo(url));
    await Promise.all(tasks);
  }

  private static async prefetchVideo(url: string) {
    try {
      const filename = url.split('/').pop() || `video_${Math.random().toString(36).substring(7)}.mp4`;
      const localUri = `${VIDEO_CACHE_DIR}${filename}`;

      const fileInfo = await FileSystem.getInfoAsync(localUri);
      if (!fileInfo.exists) {
        console.log(`[Elite Sync] Pre-caching asset: ${filename}`);
        await FileSystem.downloadAsync(url, localUri);
      }
    } catch (e) {
      // Silent fail - non-critical
    }
  }

  static async getCachedVideoUri(url: string): Promise<string> {
    if (Platform.OS === 'web') return url;

    await this.ensureCacheDir();
    const filename = url.split('/').pop() || `video_${Date.now()}.mp4`;
    const localUri = `${VIDEO_CACHE_DIR}${filename}`;

    const fileInfo = await FileSystem.getInfoAsync(localUri);
    return fileInfo.exists ? localUri : url;
  }
}
