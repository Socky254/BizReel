-- =============================================================
-- BIZREEL: MARKETPLACE CHECKOUT & PAYMENT LOGIC
-- =============================================================

-- 1. TRANSACTION LOGS
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    amount NUMERIC NOT NULL,
    currency TEXT DEFAULT 'KES',
    status TEXT DEFAULT 'pending', -- 'pending', 'success', 'failed'
    provider TEXT, -- 'mpesa', 'stripe', 'paypal'
    provider_ref TEXT, -- External reference ID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. IMPROVED ORDER PLACEMENT RPC
-- This function atomatically creates an order from a user's cart items for a specific business.
CREATE OR REPLACE FUNCTION public.process_checkout(
    p_buyer_id UUID,
    p_business_id UUID,
    p_address JSONB,
    p_payment_method TEXT
)
RETURNS UUID AS $$
DECLARE
    v_order_id UUID;
    v_total NUMERIC := 0;
BEGIN
    -- 1. Calculate Total from Cart
    SELECT SUM((p.price::NUMERIC) * c.quantity) INTO v_total
    FROM public.cart c
    JOIN public.products p ON c.product_id = p.id
    WHERE c.user_id = p_buyer_id AND p.business_id = p_business_id;

    IF v_total IS NULL OR v_total = 0 THEN
        RAISE EXCEPTION 'Cart is empty for this business.';
    END IF;

    -- 2. Create Order
    INSERT INTO public.orders (
        buyer_id,
        business_id,
        total_amount,
        status,
        payment_method,
        shipping_address
    )
    VALUES (
        p_buyer_id,
        p_business_id,
        v_total,
        'pending',
        p_payment_method,
        p_address
    )
    RETURNING id INTO v_order_id;

    -- 3. Move items to order_items
    INSERT INTO public.order_items (order_id, product_id, quantity, price_at_purchase)
    SELECT v_order_id, product_id, quantity, (SELECT price::NUMERIC FROM public.products WHERE id = cart.product_id)
    FROM public.cart
    WHERE user_id = p_buyer_id AND product_id IN (SELECT id FROM public.products WHERE business_id = p_business_id);

    -- 4. Clear Cart for these specific products
    DELETE FROM public.cart
    WHERE user_id = p_buyer_id AND product_id IN (SELECT id FROM public.products WHERE business_id = p_business_id);

    -- 5. Trigger System Event for AI/Logistics
    INSERT INTO public.system_events (event_type, payload)
    VALUES ('order_placed', jsonb_build_object('order_id', v_order_id, 'buyer_id', p_buyer_id, 'business_id', p_business_id));

    RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);

-- 4. PERMISSIONS
GRANT EXECUTE ON FUNCTION public.process_checkout(UUID, UUID, JSONB, TEXT) TO authenticated;
