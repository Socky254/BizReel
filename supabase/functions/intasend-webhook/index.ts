import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const INTASEND_WEBHOOK_CHALLENGE = Deno.env.get('INTASEND_WEBHOOK_CHALLENGE')

serve(async (req) => {
  try {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)
    const payload = await req.json()

    console.log("IntaSend Webhook Received:", payload)

    const { invoice_id, state, challenge, api_ref } = payload

    // IntaSend sometimes sends a challenge for verification during setup
    if (challenge || payload.challenge) {
      const responseChallenge = challenge || payload.challenge
      return new Response(JSON.stringify({ challenge: responseChallenge }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    let status = 'pending'
    if (state === 'COMPLETE') status = 'completed'
    if (state === 'FAILED' || state === 'REJECTED') status = 'failed'

    if (status !== 'pending') {
      // 1. Update Transaction Status
      const { data: transaction, error: txError } = await supabase
        .from('transactions')
        .update({ status: status })
        .eq('provider_id', invoice_id) // Match with the ID IntaSend gave us
        .select()
        .single()

      if (txError) throw txError

      // 2. If it was a purchase, update the order status
      if (transaction && transaction.order_id) {
        await supabase
          .from('orders')
          .update({ status: status === 'completed' ? 'paid' : 'failed' })
          .eq('id', transaction.order_id)
      }
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 })
  } catch (error) {
    console.error("Webhook Error:", error.message)
    return new Response(JSON.stringify({ error: error.message }), { status: 400 })
  }
})
