-- Remove plaintext temporary password columns (do not store passwords in DB)
ALTER TABLE public.patients DROP COLUMN IF EXISTS temp_password;
ALTER TABLE public.medtechs DROP COLUMN IF EXISTS temp_password;
ALTER TABLE public.radtechs DROP COLUMN IF EXISTS temp_password;
