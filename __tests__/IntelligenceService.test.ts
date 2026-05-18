import { getUserIntelligence } from '../services/IntelligenceService';
import { supabase } from '../lib/supabase';

jest.mock('../lib/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    gt: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    insert: jest.fn().mockResolvedValue({ error: null }),
  },
}));

describe('IntelligenceService', () => {
  it('should categorize a user as Corporate if they have many logs', async () => {
    const mockLogs = Array(201).fill({
      action: 'view',
      metadata: { category: 'Tech' },
      created_at: new Date().toISOString()
    });

    (supabase.from as jest.Mock).mockImplementation(() => ({
      select: () => ({
        eq: () => ({
          gt: () => ({
            order: () => Promise.resolve({ data: mockLogs, error: null })
          })
        })
      })
    }));

    const result = await getUserIntelligence('user123', 'BizCorp');
    expect(result.strategicRole).toBe('Corporate');
    expect(result.greeting).toContain('Executive');
  });

  it('should identify a user as vulnerable if a security audit failed', async () => {
    const mockLogs = [
      {
        action: 'security_audit',
        metadata: { status: 'security_alert' },
        created_at: new Date().toISOString()
      }
    ];

    (supabase.from as jest.Mock).mockImplementation(() => ({
      select: () => ({
        eq: () => ({
          gt: () => ({
            order: () => Promise.resolve({ data: mockLogs, error: null })
          })
        })
      })
    }));

    const result = await getUserIntelligence('user123', 'MyStore');
    expect(result.securityStatus).toBe('vulnerable');
    expect(result.greeting).toBe('System Warning Active.');
  });

  it('should identify a ScaleUp based on log count', async () => {
    const mockLogs = Array(60).fill({
      action: 'view',
      metadata: { category: 'Retail' },
      created_at: new Date().toISOString()
    });

    (supabase.from as jest.Mock).mockImplementation(() => ({
      select: () => ({
        eq: () => ({
          gt: () => ({
            order: () => Promise.resolve({ data: mockLogs, error: null })
          })
        })
      })
    }));

    const result = await getUserIntelligence('user123', 'GrowShop');
    expect(result.strategicRole).toBe('ScaleUp');
  });

  it('should determine positive sentiment when views increase', async () => {
    const now = Date.now();
    const mockLogs = [
      ...Array(15).fill({ action: 'view_received', created_at: new Date(now - 1000).toISOString() }), // last week
      ...Array(5).fill({ action: 'view_received', created_at: new Date(now - 8 * 24 * 60 * 60 * 1000).toISOString() }) // prev week
    ];

    (supabase.from as jest.Mock).mockImplementation(() => ({
      select: () => ({
        eq: () => ({
          gt: () => ({
            order: () => Promise.resolve({ data: mockLogs, error: null })
          })
        })
      })
    }));

    const result = await getUserIntelligence('user123', 'BizName');
    expect(result.sentiment).toBe('positive');
  });
});
