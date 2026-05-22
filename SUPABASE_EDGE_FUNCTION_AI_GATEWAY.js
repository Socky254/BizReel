/**
 * Supabase Edge Function: ai-gateway
 * Location: /supabase/functions/ai-gateway/index.ts
 *
 * This is the enterprise orchestrator for all AI tasks.
 * Includes RAG (Retrieval-Augmented Generation) using pgvector match_memories.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { task, payload } = await req.json()

    // 1. Validate User
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    let result = {}

    // 2. Task Orchestration
    switch (task) {
      case 'RECOMMENDATION':
        result = await handleRecommendation(payload, supabaseClient, user.id)
        break

      case 'MODERATION':
        result = await handleModeration(payload)
        break

      case 'CONTENT_GEN':
        result = await handleContentGen(payload, supabaseClient, user.id)
        break

      default:
        throw new Error('Unknown AI Task')
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})

async function generateEmbedding(text) {
    if (!OPENAI_API_KEY) return null;
    const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: text, model: 'text-embedding-3-small' })
    });
    const data = await response.json();
    return data.data[0].embedding;
}

async function handleRecommendation(payload, supabase, userId) {
    // Basic recommendation logic (Score ranking)
    return payload.candidateIds.map(id => ({ id, score: Math.random() }))
}

async function handleModeration(payload) {
    return { status: 'approved' }
}

async function handleContentGen(payload, supabase, userId) {
    // RAG IMPLEMENTATION: Match memories for business context
    const embedding = await generateEmbedding(payload.userMessage || 'business context');
    let context = "";

    if (embedding) {
        const { data: memories } = await supabase.rpc('match_memories', {
            query_embedding: embedding,
            match_threshold: 0.5,
            match_count: 3,
            u_id: userId
        });
        context = memories?.map(m => `${m.memory_key}: ${m.memory_value}`).join('\n') || "";
    }

    // Call OpenAI GPT-4o
    if (OPENAI_API_KEY) {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [
                    { role: 'system', content: `You are BizReel AI Mentor. Use this business context:\n${context}` },
                    { role: 'user', content: payload.userMessage }
                ]
            })
        });
        const data = await response.json();
        return { caption: data.choices[0].message.content };
    }

    return { caption: 'Professionalized caption here...' }
}
