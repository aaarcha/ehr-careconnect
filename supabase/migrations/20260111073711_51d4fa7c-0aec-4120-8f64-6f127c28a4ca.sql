-- Drop the existing policy
DROP POLICY IF EXISTS "Staff, doctors and nurses can view all patients" ON patients;

-- Create updated policy that includes technologists
CREATE POLICY "Staff, doctors, nurses and technologists can view all patients"
ON patients
FOR SELECT
TO public
USING (
  get_user_role(auth.uid()) = ANY (
    ARRAY['staff'::user_role, 'doctor'::user_role, 'nurse'::user_role, 'medtech'::user_role, 'radtech'::user_role]
  )
);