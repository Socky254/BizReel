export interface MentorSession {
  id: string;
  user_id: string;
  topic: string;
  status: 'active' | 'archived' | 'completed';
  created_at: string;
}

export interface MentorMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

export interface BusinessInsight {
  id: string;
  user_id: string;
  title: string;
  description: string;
  insight_type: 'growth' | 'risk' | 'efficiency';
  priority: 'low' | 'medium' | 'high';
  is_actioned: boolean;
  created_at: string;
}
