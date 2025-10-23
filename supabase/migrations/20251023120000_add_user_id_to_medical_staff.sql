-- Validate existing data and log potential issues before making changes
DO $$
DECLARE
    doctor_count integer;
    nurse_count integer;
    role_matches_doctors integer;
    role_matches_nurses integer;
    duplicate_accounts integer;
BEGIN
    -- Count existing records
    SELECT COUNT(*) INTO doctor_count FROM public.doctors;
    SELECT COUNT(*) INTO nurse_count FROM public.nurses;
    
    -- Count potential matches in user_roles
    SELECT COUNT(*) INTO role_matches_doctors 
    FROM public.doctors d
    INNER JOIN public.user_roles ur ON 
        ur.role = 'doctor' AND
        (ur.account_number = d.name OR ur.account_number = d.id::text);
    
    SELECT COUNT(*) INTO role_matches_nurses
    FROM public.nurses n
    INNER JOIN public.user_roles ur ON 
        ur.role = 'nurse' AND
        (ur.account_number = n.nurse_no OR ur.account_number = n.name);
    
    -- Check for duplicate account numbers that might cause ambiguous matches
    SELECT COUNT(*) INTO duplicate_accounts
    FROM (
        SELECT account_number, COUNT(*) 
        FROM public.user_roles 
        WHERE account_number IS NOT NULL 
        GROUP BY account_number 
        HAVING COUNT(*) > 1
    ) dupes;
    
    RAISE NOTICE 'Pre-migration validation:';
    RAISE NOTICE '- Total doctors: %, nurses: %', doctor_count, nurse_count;
    RAISE NOTICE '- Potential matches: % doctors, % nurses', role_matches_doctors, role_matches_nurses;
    RAISE NOTICE '- User roles with duplicate account numbers: %', duplicate_accounts;
    
    -- Warn if match rate is low
    IF role_matches_doctors < doctor_count * 0.5 THEN
        RAISE WARNING 'Less than 50% of doctors have matching user_roles records';
    END IF;
    IF role_matches_nurses < nurse_count * 0.5 THEN
        RAISE WARNING 'Less than 50% of nurses have matching user_roles records';
    END IF;
    IF duplicate_accounts > 0 THEN
        RAISE WARNING 'Found % account numbers used multiple times in user_roles', duplicate_accounts;
    END IF;
END $$;

-- Add columns with NOT VALID constraint first
ALTER TABLE public.doctors
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT VALID;

ALTER TABLE public.nurses 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT VALID;

-- Create temporary tables to store matching results for review
CREATE TEMP TABLE doctor_matches AS
SELECT 
    d.id AS doctor_id,
    d.name AS doctor_name,
    ur.user_id AS auth_user_id,
    ur.account_number AS matched_account,
    ur.role AS user_role
FROM public.doctors d
LEFT JOIN public.user_roles ur ON 
    ur.role = 'doctor' AND
    (ur.account_number = d.name OR ur.account_number = d.id::text);

CREATE TEMP TABLE nurse_matches AS
SELECT 
    n.id AS nurse_id,
    n.name AS nurse_name,
    n.nurse_no,
    ur.user_id AS auth_user_id,
    ur.account_number AS matched_account,
    ur.role AS user_role
FROM public.nurses n
LEFT JOIN public.user_roles ur ON 
    ur.role = 'nurse' AND
    (ur.account_number = n.nurse_no OR ur.account_number = n.name);

-- Log matching results before updates
DO $$
DECLARE
    match_counts record;
BEGIN
    SELECT 
        COUNT(*) AS total_doctors,
        COUNT(auth_user_id) AS matched_doctors
    INTO match_counts
    FROM doctor_matches;
    
    RAISE NOTICE 'Doctor matches found: % of %', match_counts.matched_doctors, match_counts.total_doctors;
    
    SELECT 
        COUNT(*) AS total_nurses,
        COUNT(auth_user_id) AS matched_nurses
    INTO match_counts
    FROM nurse_matches;
    
    RAISE NOTICE 'Nurse matches found: % of %', match_counts.matched_nurses, match_counts.total_nurses;
END $$;

-- Perform the backfill with results from our analysis
UPDATE public.doctors d
SET user_id = m.auth_user_id
FROM doctor_matches m
WHERE d.id = m.doctor_id
  AND m.auth_user_id IS NOT NULL
  AND d.user_id IS NULL;

UPDATE public.nurses n
SET user_id = m.auth_user_id
FROM nurse_matches m
WHERE n.id = m.nurse_id
  AND m.auth_user_id IS NOT NULL
  AND n.user_id IS NULL;

-- Add user_id to existing RLS policies for more granular access control
CREATE POLICY "Users can view their own doctor record"
ON public.doctors FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can view their own nurse record"
ON public.nurses FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Keep the existing "all authenticated" policies for broad access as needed
-- (from earlier migrations)