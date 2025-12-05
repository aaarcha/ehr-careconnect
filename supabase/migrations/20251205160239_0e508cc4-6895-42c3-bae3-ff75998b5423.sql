-- Fix the get_all_staff_recipients function to return all users with auth accounts
CREATE OR REPLACE FUNCTION public.get_all_staff_recipients()
RETURNS TABLE (
  user_id uuid,
  role text,
  display_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  -- Get staff users from user_roles (includes staff accounts)
  SELECT 
    ur.user_id,
    ur.role::text,
    COALESCE(ur.account_number, 'Staff ' || LEFT(ur.user_id::text, 8)) as display_name
  FROM user_roles ur
  WHERE ur.user_id IS NOT NULL AND ur.role = 'staff'
  
  UNION ALL
  
  -- Get medtechs with user accounts
  SELECT 
    m.user_id,
    'medtech'::text as role,
    m.name as display_name
  FROM medtechs m
  WHERE m.user_id IS NOT NULL
  
  UNION ALL
  
  -- Get radtechs with user accounts
  SELECT 
    r.user_id,
    'radtech'::text as role,
    r.name as display_name
  FROM radtechs r
  WHERE r.user_id IS NOT NULL;
END;
$$;