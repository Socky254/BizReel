import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const INTASEND_SECRET_KEY = Deno.env.get('INTASEND_SECRET_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)
    const { action, amount, phone, userId, orderId, transactionId } = await req.json()

    // IntaSend Base URL (Sandbox for testing)
    const INTASEND_URL = 'https://sandbox.intasend.com/api/v1'

    if (action === 'stk-push') {
      const response = await fetch(`${INTASEND_URL}/payment/mpesa-stk-push/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${INTASEND_SECRET_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount,
          phone_number: phone,
          api_ref: orderId || `DEP_${Date.now()}`
        })
      })

      const result = await response.json()

      // Record transaction in Supabase as pending
      await supabase.from('transactions').insert({
        user_id: userId,
        order_id: orderId,
        amount: amount,
        provider: 'intasend',
        provider_id: result.id, // IntaSend tracking ID
        type: orderId ? 'purchase' : 'deposit',
        status: 'pending'
      })

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    if (action === 'withdraw') {
      const response = await fetch(`${INTASEND_URL}/send-money/mpesa/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${INTASEND_SECRET_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          transactions: [{
            name: 'Recipient',
            account: phone,
            amount: amount,
            id: transactionId
          }]
        })
      })

      const result = await response.json()

      // Update transaction with provider ID
      await supabase.from('transactions')
        .update({ provider_id: result.tracking_id })
        .eq('id', transactionId)

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    throw new Error('Invalid action')
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
