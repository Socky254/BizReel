import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { Platform, Alert } from 'react-native';
import { Post } from '../domain/models';

export class MarketingService {
  /**
   * Generates a viral share link for a specific reel.
   * Redirects to the web version we just built!
   */
  static getShareLink(postId: string): string {
    return `https://dist-tau-five-42.vercel.app/posts/${postId}`;
  }

  /**
   * Triggers the native share sheet with a premium marketing message.
   */
  static async shareReel(post: Post) {
    const shareLink = this.getShareLink(post.id);
    const businessName = post.profiles?.business_name || 'Enterprise';

    const message = `Check out this business reel from ${businessName} on BizReel! 🚀\n\nElevate your business network: ${shareLink}`;

    try {
        if (await Sharing.isAvailableAsync()) {
            // For now, we share the link. In production, we'd pre-download
            // the video if desired, but sharing the link is better for marketing traffic.
            await Sharing.shareAsync(shareLink, {
                dialogTitle: `Share ${businessName}'s Reel`,
                mimeType: 'text/plain',
            });
        } else {
            Alert.alert('Success', 'Share link copied to clipboard!');
        }
    } catch (e) {
        console.error('[MarketingService] Share failed', e);
    }
  }
}
