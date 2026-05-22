export interface AiSession {
  id: string;
  userId: string;
  sessionType: 'business_consultant' | 'content_optimizer' | 'market_analyst';
  contextSummary?: string;
  createdAt: Date;
}

export interface AiRecommendation {
  title: string;
  insight: string;
  action: string;
  priority: 'low' | 'medium' | 'high';
}

export interface BusinessInsight {
  metric: string;
  value: string | number;
  trend: 'up' | 'down' | 'stable';
  aiInterpretation: string;
}
