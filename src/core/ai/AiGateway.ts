import { supabase } from '../../lib/supabase';

/**
 * AI Gateway Implementation (Clean Architecture Core Layer)
 *
 * This service acts as the central orchestrator for all AI-related calls.
 * Instead of calling LLMs directly, it routes through Supabase Edge Functions
 * to ensure security, cost control, and rate limiting.
 */

export type AiTask = 'RECOMMENDATION' | 'MODERATION' | 'CONTENT_GEN' | 'INSIGHTS';

export class AiGateway {
    private static instance: AiGateway;

    private constructor() {}

    public static getInstance(): AiGateway {
        if (!AiGateway.instance) {
            AiGateway.instance = new AiGateway();
        }
        return AiGateway.instance;
    }

    /**
     * Executes an AI task via the backend gateway.
     */
    async executeTask<T>(task: AiTask, payload: any): Promise<T | null> {
        try {
            const { data, error } = await supabase.functions.invoke('ai-gateway', {
                body: { task, payload }
            });

            if (error) throw error;
            return data as T;
        } catch (error) {
            console.error(`[AiGateway] Task ${task} failed:`, error);
            return null;
        }
    }

    /**
     * Specialized method for streaming AI responses (e.g., Chat)
     */
    async streamTask(task: AiTask, payload: any, onChunk: (chunk: string) => void) {
        // Implementation for EventSource or WebSocket streaming via Gateway
    }
}
