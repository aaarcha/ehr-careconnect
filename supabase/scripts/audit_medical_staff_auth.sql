-- SQL to help audit unmatched doctors/nurses and identify data quality issues

-- 1. Show doctors with no auth.users link
SELECT d.id, d.name, d.specialty
FROM public.doctors d
WHERE d.user_id IS NULL
ORDER BY d.name;

-- 2. Show nurses with no auth.users link
SELECT n.id, n.name, n.nurse_no, n.department
FROM public.nurses n
WHERE n.user_id IS NULL
ORDER BY n.name;

-- 3. Check for potential role mismatches (e.g., doctor marked as nurse)
SELECT ur.user_id, ur.role, ur.account_number,
       d.id as doctor_id, d.name as doctor_name,
       n.id as nurse_id, n.name as nurse_name
FROM public.user_roles ur
LEFT JOIN public.doctors d ON d.user_id = ur.user_id
LEFT JOIN public.nurses n ON n.user_id = ur.user_id
WHERE (ur.role = 'doctor' AND d.id IS NULL)
   OR (ur.role = 'nurse' AND n.id IS NULL);

-- 4. Show auth.users without role table entries
SELECT au.id, au.email
FROM auth.users au
LEFT JOIN public.user_roles ur ON ur.user_id = au.id
WHERE ur.id IS NULL;

-- 5. Show potential duplicate accounts (same person, different roles)
SELECT ur1.user_id, ur1.role as role1, ur2.role as role2,
       ur1.account_number, ur2.account_number
FROM public.user_roles ur1
JOIN public.user_roles ur2 ON 
    ur1.user_id = ur2.user_id AND 
    ur1.role < ur2.role;