-- 1. ENHANCED PROFILE SCHEMA
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS working_hours TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. BUSINESS CART SYSTEM
CREATE TABLE IF NOT EXISTS public.cart (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- 3. RLS POLICIES FOR CART
ALTER TABLE public.cart ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own cart"
ON public.cart
FOR ALL USING (auth.uid() = user_id);

-- 4. STORAGE BUCKET POLICIES (Assuming 'avatars' bucket exists)
-- This allows users to upload their own avatars and allows anyone to view them.
-- To be run if you have a bucket named 'avatars'
/*
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

CREATE POLICY "Avatar Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Avatar Update" ON storage.objects FOR UPDATE WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Avatar Delete" ON storage.objects FOR DELETE WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Avatar Public View" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
*/

-- 5. TERMS & ABOUT (Metadata or System Log for tracking agreement)
-- This creates a log when a user views or agrees to terms if needed in future
CREATE TABLE IF NOT EXISTS public.system_agreements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  agreement_type TEXT NOT NULL, -- 'terms_of_service', 'privacy_policy'
  version TEXT,
  accepted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.system_agreements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own agreements" ON public.system_agreements FOR SELECT USING (auth.uid() = user_id);
