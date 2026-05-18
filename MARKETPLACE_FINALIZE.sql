-- =============================================================
-- BIZREEL: MARKETPLACE FINALIZE (ORDERS, SUBSCRIPTIONS & CATEGORIES)
-- =============================================================

-- 1. MASTER CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    icon_name TEXT, -- For Expo @expo/vector-icons
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed Initial Categories
INSERT INTO public.categories (name, slug, icon_name) VALUES
('Fashion', 'fashion', 'shirt'),
('Electronics', 'electronics', 'hardware-chip'),
('Food & Drinks', 'food', 'fast-food'),
('Beauty', 'beauty', 'sparkles'),
('Services', 'services', 'construct'),
('Home & Decor', 'home', 'home'),
('Automotive', 'automotive', 'car')
ON CONFLICT (slug) DO NOTHING;

-- 2. SUBSCRIPTION TIERS
CREATE TABLE IF NOT EXISTS public.subscription_tiers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE, -- 'Free', 'Professional', 'Enterprise'
    price_monthly NUMERIC DEFAULT 0,
    max_reels INTEGER DEFAULT 10,
    max_products INTEGER DEFAULT 5,
    has_analytics BOOLEAN DEFAULT false,
    has_featured_posts BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed Tiers
INSERT INTO public.subscription_tiers (name, price_monthly, max_reels, max_products, has_analytics, has_featured_posts) VALUES
('Free', 0, 10, 5, false, false),
('Professional', 29.99, 100, 50, true, true),
('Enterprise', 99.99, -1, -1, true, true)
ON CONFLICT (name) DO NOTHING;

-- Link Profiles to Tiers
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS subscription_tier_id UUID REFERENCES public.subscription_tiers(id),
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active';

-- 3. ORDERS & TRANSACTIONS
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    buyer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    business_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    total_amount NUMERIC NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'shipped', 'completed', 'cancelled'
    payment_method TEXT,
    shipping_address JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL,
    price_at_purchase NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. FEATURED CONTENT (Paid Promotions)
CREATE TABLE IF NOT EXISTS public.featured_content (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    business_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    reach_estimate INTEGER,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. NOTIFICATION TRIGGER FOR ORDERS
CREATE OR REPLACE FUNCTION public.notify_order_creation()
RETURNS TRIGGER AS $$
BEGIN
    -- Notify Business Owner
    INSERT INTO public.notifications (receiver_id, sender_id, type, post_id)
    VALUES (NEW.business_id, NEW.buyer_id, 'new_order', NULL);

    -- Notify Buyer (Confirmation)
    INSERT INTO public.notifications (receiver_id, sender_id, type, is_read)
    VALUES (NEW.buyer_id, NEW.business_id, 'order_confirmed', false);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_notify_order
AFTER INSERT ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.notify_order_creation();

-- 6. RLS POLICIES
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.featured_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Anyone can view tiers" ON subscription_tiers FOR SELECT USING (true);

CREATE POLICY "Users can view their own orders"
ON public.orders FOR SELECT
USING (auth.uid() = buyer_id OR auth.uid() = business_id);

CREATE POLICY "Buyers can create orders"
ON public.orders FOR INSERT
WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Users can view their own order items"
ON public.order_items FOR SELECT
USING (EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_items.order_id
    AND (orders.buyer_id = auth.uid() OR orders.business_id = auth.uid())
));

CREATE POLICY "Featured content is public" ON featured_content FOR SELECT USING (true);

-- 7. MARKETPLACE LOGIC (RPC)

-- Function to place an order from cart
CREATE OR REPLACE FUNCTION public.place_order_from_cart(p_buyer_id UUID, p_business_id UUID, p_shipping_address JSONB, p_payment_method TEXT)
RETURNS UUID AS $$
DECLARE
    v_order_id UUID;
    v_total NUMERIC := 0;
BEGIN
    -- 1. Calculate Total
    SELECT SUM(p.price::NUMERIC * c.quantity) INTO v_total
    FROM public.cart c
    JOIN public.products p ON c.product_id = p.id
    WHERE c.user_id = p_buyer_id AND p.business_id = p_business_id;

    IF v_total IS NULL OR v_total = 0 THEN
        RAISE EXCEPTION 'Cart is empty for this business.';
    END IF;

    -- 2. Create Order
    INSERT INTO public.orders (buyer_id, business_id, total_amount, status, payment_method, shipping_address)
    VALUES (p_buyer_id, p_business_id, v_total, 'pending', p_payment_method, p_shipping_address)
    RETURNING id INTO v_order_id;

    -- 3. Move items from cart to order_items
    INSERT INTO public.order_items (order_id, product_id, quantity, price_at_purchase)
    SELECT v_order_id, product_id, quantity, (SELECT price::NUMERIC FROM public.products WHERE id = cart.product_id)
    FROM public.cart
    WHERE user_id = p_buyer_id AND product_id IN (SELECT id FROM public.products WHERE business_id = p_business_id);

    -- 4. Clear Cart for these items
    DELETE FROM public.cart
    WHERE user_id = p_buyer_id AND product_id IN (SELECT id FROM public.products WHERE business_id = p_business_id);

    RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.place_order_from_cart(UUID, UUID, JSONB, TEXT) TO authenticated;

