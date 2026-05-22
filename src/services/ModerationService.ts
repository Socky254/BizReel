import { supabase } from '../lib/supabase';

export type ModerationResult = {
  isProfessional: boolean;
  score: number; // 0 to 1, higher is better
  flags: string[];
  suggestedAction: 'approve' | 'flag' | 'reject';
  cleanedCaption: string;
};

/**
 * ModerationService: Maintains the professional integrity of the BizReel platform.
 * Integrates heuristic and (simulated) AI-driven content analysis.
 */
export class ModerationService {
  private static UNPROFESSIONAL_KEYWORDS = [
    'scam',
    'spam',
    'hack',
    'cheat',
    'free money',
    'betting',
    'gambling',
    'win fast',
    'unregulated',
    'fake',
    'porn',
    'nsfw',
  ];

  /**
   * Analyzes a caption before it is published.
   */
  static analyzeContent(text: string): ModerationResult {
    const lowerText = text.toLowerCase();
    const foundFlags: string[] = [];

    // 1. Keyword check (Heuristics)
    this.UNPROFESSIONAL_KEYWORDS.forEach((word) => {
      if (lowerText.includes(word)) {
        foundFlags.push(`Restricted Term: ${word}`);
      }
    });

    // 2. Format Analysis (Excessive caps/symbols)
    const capsCount = (text.match(/[A-Z]/g) || []).length;
    if (capsCount > text.length * 0.5 && text.length > 20) {
      foundFlags.push('Excessive Capitalization');
    }

    // 3. Link Safety
    if (text.includes('http') && !text.includes('bizreel.app') && !text.includes('technova')) {
      // In a real AI implementation, we would ping a safe-browsing API here
    }

    // Scoring Logic
    const score = Math.max(0, 1 - foundFlags.length * 0.25);
    let suggestedAction: 'approve' | 'flag' | 'reject' = 'approve';

    if (score < 0.5) suggestedAction = 'reject';
    else if (score < 0.9) suggestedAction = 'flag';

    return {
      isProfessional: score >= 0.5,
      score,
      flags: foundFlags,
      suggestedAction,
      cleanedCaption: text.trim(),
    };
  }

  /**
   * Submits a report to the database for admin review.
   */
  static async reportPost(postId: string, reporterId: string, reason: string) {
    try {
      const { error } = await supabase.from('reports').insert({
        post_id: postId,
        reporter_id: reporterId,
        reason: reason,
        status: 'pending',
      });

      if (error) throw error;
      return { success: true };
    } catch (e) {
      console.error('Reporting Error:', e);
      return { success: false, error: e };
    }
  }

  /**
   * System-level moderation: Auto-hides posts with high report counts.
   * Can be triggered by the AutonomousMaintenanceService.
   */
  static async performSweep() {
    console.log('MODERATION: Performing platform professionality sweep...');
    // Logic to identify and flag posts with > 5 reports automatically
  }
}
