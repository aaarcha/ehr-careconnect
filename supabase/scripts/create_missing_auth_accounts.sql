-- Function to safely generate an email for medical staff
CREATE OR REPLACE FUNCTION generate_staff_email(
    staff_name text,
    staff_type text,
    identifier text
) RETURNS text AS $$
DECLARE
    base_email text;
    counter integer := 0;
    test_email text;
BEGIN
    -- Convert name to lowercase, replace spaces with dots
    base_email := lower(regexp_replace(staff_name, '\s+', '.', 'g'));
    -- Add a suffix based on staff type
    base_email := base_email || '.' || staff_type || '@healthe-weave.local';
    
    -- Try variations until we find an unused email
    LOOP
        test_email := CASE 
            WHEN counter = 0 THEN base_email
            ELSE regexp_replace(base_email, '@', counter || '@')
        END;
        
        IF NOT EXISTS (
            SELECT 1 FROM auth.users WHERE email = test_email
        ) THEN
            RETURN test_email;
        END IF;
        
        counter := counter + 1;
        IF counter > 100 THEN
            RAISE EXCEPTION 'Could not generate unique email after 100 attempts';
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Transaction to create auth accounts for unmatched doctors
DO $$
DECLARE
    d record;
    new_user_id uuid;
    temp_password text;
    generated_email text;
BEGIN
    FOR d IN (
        SELECT id, name, specialty 
        FROM public.doctors 
        WHERE user_id IS NULL
    ) LOOP
        -- Generate deterministic email and password
        generated_email := public.generate_staff_email(d.name, 'doctor', d.id::text);
        temp_password := 'Change.Me!' || d.id;  -- Require change on first login
        
        -- Create auth.users account
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            raw_user_meta_data,
            raw_app_meta_data
        ) 
        VALUES (
            '00000000-0000-0000-0000-000000000000',  -- Replace with your instance_id
            gen_random_uuid(),
            'authenticated',
            'authenticated',
            generated_email,
            crypt(temp_password, gen_salt('bf')),
            NOW(),
            NOW(),
            NOW(),
            jsonb_build_object(
                'name', d.name,
                'specialty', d.specialty,
                'type', 'doctor'
            ),
            jsonb_build_object(
                'provider', 'email',
                'providers', ARRAY['email']
            )
        )
        RETURNING id INTO new_user_id;
        
        -- Create user_roles entry
        INSERT INTO public.user_roles (user_id, role, account_number)
        VALUES (new_user_id, 'doctor', d.id::text);
        
        -- Update doctors table with auth user id
        UPDATE public.doctors 
        SET user_id = new_user_id
        WHERE id = d.id;
        
        RAISE NOTICE 'Created account for doctor: %, Email: %, Password: %', 
                    d.name, generated_email, temp_password;
    END LOOP;
END $$;

-- Transaction to create auth accounts for unmatched nurses
DO $$
DECLARE
    n record;
    new_user_id uuid;
    temp_password text;
    generated_email text;
BEGIN
    FOR n IN (
        SELECT id, name, nurse_no, department
        FROM public.nurses 
        WHERE user_id IS NULL
    ) LOOP
        -- Generate deterministic email and password
        generated_email := public.generate_staff_email(n.name, 'nurse', n.nurse_no);
        temp_password := 'Change.Me!' || n.nurse_no;  -- Require change on first login
        
        -- Create auth.users account
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            raw_user_meta_data,
            raw_app_meta_data
        ) 
        VALUES (
            '00000000-0000-0000-0000-000000000000',  -- Replace with your instance_id
            gen_random_uuid(),
            'authenticated',
            'authenticated',
            generated_email,
            crypt(temp_password, gen_salt('bf')),
            NOW(),
            NOW(),
            NOW(),
            jsonb_build_object(
                'name', n.name,
                'nurse_no', n.nurse_no,
                'department', n.department,
                'type', 'nurse'
            ),
            jsonb_build_object(
                'provider', 'email',
                'providers', ARRAY['email']
            )
        )
        RETURNING id INTO new_user_id;
        
        -- Create user_roles entry
        INSERT INTO public.user_roles (user_id, role, account_number)
        VALUES (new_user_id, 'nurse', n.nurse_no);
        
        -- Update nurses table with auth user id
        UPDATE public.nurses 
        SET user_id = new_user_id
        WHERE id = n.id;
        
        RAISE NOTICE 'Created account for nurse: %, Email: %, Password: %', 
                    n.name, generated_email, temp_password;
    END LOOP;
END $$;

-- Validate results
SELECT 'Doctors without auth accounts' as check_type, COUNT(*) as count
FROM public.doctors WHERE user_id IS NULL
UNION ALL
SELECT 'Nurses without auth accounts', COUNT(*)
FROM public.nurses WHERE user_id IS NULL;

-- Drop the temporary function
DROP FUNCTION IF EXISTS generate_staff_email(text, text, text);