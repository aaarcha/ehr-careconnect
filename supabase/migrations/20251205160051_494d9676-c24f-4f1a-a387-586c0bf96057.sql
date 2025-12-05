-- Create RPC function to get all staff recipients for messaging
-- This includes doctors, nurses, medtechs, radtechs, and staff users

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
  -- Get staff users from user_roles
  SELECT 
    ur.user_id,
    ur.role::text,
    COALESCE(ur.account_number, 'Staff') as display_name
  FROM user_roles ur
  WHERE ur.role = 'staff'
  
  UNION ALL
  
  -- Get medtechs
  SELECT 
    m.user_id,
    'medtech'::text as role,
    m.name as display_name
  FROM medtechs m
  WHERE m.user_id IS NOT NULL
  
  UNION ALL
  
  -- Get radtechs
  SELECT 
    r.user_id,
    'radtech'::text as role,
    r.name as display_name
  FROM radtechs r
  WHERE r.user_id IS NOT NULL
  
  UNION ALL
  
  -- Get nurses (they don't have user_id, so we'll need to join with user_roles)
  SELECT 
    ur.user_id,
    'nurse'::text as role,
    n.name as display_name
  FROM nurses n
  INNER JOIN user_roles ur ON ur.account_number = n.nurse_no AND ur.role = 'staff'
  
  UNION ALL
  
  -- Get all users with staff role that might be doctors
  SELECT 
    ur.user_id,
    'doctor'::text as role,
    d.name as display_name
  FROM doctors d
  CROSS JOIN user_roles ur
  WHERE ur.role = 'staff'
  AND ur.account_number LIKE 'DOC%';
END;
$$;