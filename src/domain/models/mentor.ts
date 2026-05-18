export interface MentorSession {
    id: string;
    userId: string;
    topic: string;
    status: 'active' | 'completed';
    createdAt: Date;
}

export interface MentorMessage {
    id: string;
    sessionId: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    createdAt: Date;
}

export interface BusinessInsight {
    id: string;
    userId: string;
    title: string;
    description: string;
    insightType: 'growth' | 'risk' | 'efficiency';
    priority: 'low' | 'medium' | 'high';
    isActioned: boolean;
    createdAt: Date;
}
