import * as FileSystem from 'expo-file-system';

const VIDEO_CACHE_DIR = `${FileSystem.cacheDirectory}bizreel_videos/`;

export class VideoService {
  /**
   * Ensures the cache directory exists.
   */
  private static async ensureCacheDir() {
    const dirInfo = await FileSystem.getInfoAsync(VIDEO_CACHE_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(VIDEO_CACHE_DIR, { intermediates: true });
    }
  }

  /**
   * Gets a cached URI for a video URL. If not cached, it returns the original URL
   * but starts downloading it in the background for next time.
   */
  static async getCachedVideoUri(url: string): Promise<string> {
    await this.ensureCacheDir();
    const filename = url.split('/').pop() || `video_${Date.now()}.mp4`;
    const localUri = `${VIDEO_CACHE_DIR}${filename}`;

    const fileInfo = await FileSystem.getInfoAsync(localUri);
    if (fileInfo.exists) {
      return localUri;
    }

    // Return original URL but trigger background download for future plays
    this.prefetchVideo(url);
    return url;
  }

  /**
   * Downloads a video to local cache for instant playback later.
   */
  static async prefetchVideo(url: string) {
    try {
      await this.ensureCacheDir();
      const filename = url.split('/').pop() || `video_${Date.now()}.mp4`;
      const localUri = `${VIDEO_CACHE_DIR}${filename}`;

      const fileInfo = await FileSystem.getInfoAsync(localUri);
      if (!fileInfo.exists) {
        console.log(`[VideoService] Prefetching: ${url}`);
        await FileSystem.downloadAsync(url, localUri);
      }
    } catch (e) {
      console.warn(`[VideoService] Prefetch failed for ${url}`, e);
    }
  }

  /**
   * Clears old cache to free up space.
   */
  static async clearCache() {
    try {
      await FileSystem.deleteAsync(VIDEO_CACHE_DIR, { idempotent: true });
      await this.ensureCacheDir();
    } catch (e) {
      console.error("[VideoService] Cache clear error", e);
    }
  }
}
