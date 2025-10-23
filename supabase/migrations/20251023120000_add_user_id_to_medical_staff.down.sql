ALTER TABLE public.doctors DROP COLUMN user_id;
ALTER TABLE public.nurses DROP COLUMN user_id;

DROP POLICY IF EXISTS "Users can view their own doctor record" ON public.doctors;
DROP POLICY IF EXISTS "Users can view their own nurse record" ON public.nurses;