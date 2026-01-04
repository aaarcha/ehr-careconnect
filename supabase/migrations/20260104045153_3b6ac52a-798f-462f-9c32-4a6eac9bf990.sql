-- Add user_id and account_number columns to nurses table for auth linking
ALTER TABLE public.nurses 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS account_number text;

-- Add index for user_id lookups
CREATE INDEX IF NOT EXISTS idx_nurses_user_id ON public.nurses(user_id);

-- Add unique constraint on user_roles.user_id (fixes the upsert issue)
ALTER TABLE public.user_roles 
ADD CONSTRAINT user_roles_user_id_unique UNIQUE (user_id);

-- Nurses can view all nurses
CREATE POLICY "Nurses can view all nurses" ON public.nurses
FOR SELECT USING (get_user_role(auth.uid()) = 'nurse'::user_role);

-- Update patients policies to include nurses
DROP POLICY IF EXISTS "Staff and doctors can view all patients" ON public.patients;
CREATE POLICY "Staff, doctors and nurses can view all patients" ON public.patients
FOR SELECT USING (get_user_role(auth.uid()) = ANY (ARRAY['staff'::user_role, 'doctor'::user_role, 'nurse'::user_role]));

-- Update vital signs policies
DROP POLICY IF EXISTS "Staff and doctors can view all vital signs" ON public.patient_vital_signs;
CREATE POLICY "Staff, doctors and nurses can view all vital signs" ON public.patient_vital_signs
FOR SELECT USING (
  (get_user_role(auth.uid()) = ANY (ARRAY['staff'::user_role, 'doctor'::user_role, 'nurse'::user_role])) 
  OR (EXISTS (SELECT 1 FROM patients WHERE patients.id = patient_vital_signs.patient_id AND patients.hospital_number = get_patient_number(auth.uid())))
);

DROP POLICY IF EXISTS "Staff can insert vital signs" ON public.patient_vital_signs;
CREATE POLICY "Staff and nurses can insert vital signs" ON public.patient_vital_signs
FOR INSERT WITH CHECK (get_user_role(auth.uid()) = ANY (ARRAY['staff'::user_role, 'nurse'::user_role]));

DROP POLICY IF EXISTS "Staff can update vital signs" ON public.patient_vital_signs;
CREATE POLICY "Staff and nurses can update vital signs" ON public.patient_vital_signs
FOR UPDATE USING (get_user_role(auth.uid()) = ANY (ARRAY['staff'::user_role, 'nurse'::user_role]));

-- Update FDAR notes policies
DROP POLICY IF EXISTS "Staff and doctors can view all fdar_notes" ON public.fdar_notes;
CREATE POLICY "Staff, doctors and nurses can view all fdar_notes" ON public.fdar_notes
FOR SELECT USING (get_user_role(auth.uid()) = ANY (ARRAY['staff'::user_role, 'doctor'::user_role, 'nurse'::user_role]));

DROP POLICY IF EXISTS "Staff can insert fdar_notes" ON public.fdar_notes;
CREATE POLICY "Staff and nurses can insert fdar_notes" ON public.fdar_notes
FOR INSERT WITH CHECK (get_user_role(auth.uid()) = ANY (ARRAY['staff'::user_role, 'nurse'::user_role]));

DROP POLICY IF EXISTS "Staff can update fdar_notes" ON public.fdar_notes;
CREATE POLICY "Staff and nurses can update fdar_notes" ON public.fdar_notes
FOR UPDATE USING (get_user_role(auth.uid()) = ANY (ARRAY['staff'::user_role, 'nurse'::user_role]));

-- Update I/O records policies
DROP POLICY IF EXISTS "Staff and doctors can view all io_records" ON public.intake_output_records;
CREATE POLICY "Staff, doctors and nurses can view all io_records" ON public.intake_output_records
FOR SELECT USING (get_user_role(auth.uid()) = ANY (ARRAY['staff'::user_role, 'doctor'::user_role, 'nurse'::user_role]));

DROP POLICY IF EXISTS "Staff can insert io_records" ON public.intake_output_records;
CREATE POLICY "Staff and nurses can insert io_records" ON public.intake_output_records
FOR INSERT WITH CHECK (get_user_role(auth.uid()) = ANY (ARRAY['staff'::user_role, 'nurse'::user_role]));

DROP POLICY IF EXISTS "Staff can update io_records" ON public.intake_output_records;
CREATE POLICY "Staff and nurses can update io_records" ON public.intake_output_records
FOR UPDATE USING (get_user_role(auth.uid()) = ANY (ARRAY['staff'::user_role, 'nurse'::user_role]));

-- Update IV fluid monitoring policies
DROP POLICY IF EXISTS "Staff and doctors can view all iv_monitoring" ON public.iv_fluid_monitoring;
CREATE POLICY "Staff, doctors and nurses can view all iv_monitoring" ON public.iv_fluid_monitoring
FOR SELECT USING (get_user_role(auth.uid()) = ANY (ARRAY['staff'::user_role, 'doctor'::user_role, 'nurse'::user_role]));

DROP POLICY IF EXISTS "Staff can insert iv_monitoring" ON public.iv_fluid_monitoring;
CREATE POLICY "Staff and nurses can insert iv_monitoring" ON public.iv_fluid_monitoring
FOR INSERT WITH CHECK (get_user_role(auth.uid()) = ANY (ARRAY['staff'::user_role, 'nurse'::user_role]));

DROP POLICY IF EXISTS "Staff can update iv_monitoring" ON public.iv_fluid_monitoring;
CREATE POLICY "Staff and nurses can update iv_monitoring" ON public.iv_fluid_monitoring
FOR UPDATE USING (get_user_role(auth.uid()) = ANY (ARRAY['staff'::user_role, 'nurse'::user_role]));

-- Update MAR policies
DROP POLICY IF EXISTS "Staff and doctors can view all mar" ON public.medication_administration_records;
CREATE POLICY "Staff, doctors and nurses can view all mar" ON public.medication_administration_records
FOR SELECT USING (get_user_role(auth.uid()) = ANY (ARRAY['staff'::user_role, 'doctor'::user_role, 'nurse'::user_role]));

DROP POLICY IF EXISTS "Staff can insert mar" ON public.medication_administration_records;
CREATE POLICY "Staff and nurses can insert mar" ON public.medication_administration_records
FOR INSERT WITH CHECK (get_user_role(auth.uid()) = ANY (ARRAY['staff'::user_role, 'nurse'::user_role]));

DROP POLICY IF EXISTS "Staff can update mar" ON public.medication_administration_records;
CREATE POLICY "Staff and nurses can update mar" ON public.medication_administration_records
FOR UPDATE USING (get_user_role(auth.uid()) = ANY (ARRAY['staff'::user_role, 'nurse'::user_role]));

-- Update physical assessments policies
DROP POLICY IF EXISTS "Staff and doctors can view all physical assessments" ON public.physical_assessments;
CREATE POLICY "Staff, doctors and nurses can view all physical assessments" ON public.physical_assessments
FOR SELECT USING (
  (get_user_role(auth.uid()) = ANY (ARRAY['staff'::user_role, 'doctor'::user_role, 'nurse'::user_role])) 
  OR (EXISTS (SELECT 1 FROM patients WHERE patients.id = physical_assessments.patient_id AND patients.hospital_number = get_patient_number(auth.uid())))
);

-- Update pain assessments policies
DROP POLICY IF EXISTS "Staff and doctors can view all pain assessments" ON public.pain_assessments;
CREATE POLICY "Staff, doctors and nurses can view all pain assessments" ON public.pain_assessments
FOR SELECT USING (
  (get_user_role(auth.uid()) = ANY (ARRAY['staff'::user_role, 'doctor'::user_role, 'nurse'::user_role])) 
  OR (EXISTS (SELECT 1 FROM patients WHERE patients.id = pain_assessments.patient_id AND patients.hospital_number = get_patient_number(auth.uid())))
);

-- Update contraptions policies
DROP POLICY IF EXISTS "Staff and doctors can view all contraptions" ON public.contraptions;
CREATE POLICY "Staff, doctors and nurses can view all contraptions" ON public.contraptions
FOR SELECT USING (
  (get_user_role(auth.uid()) = ANY (ARRAY['staff'::user_role, 'doctor'::user_role, 'nurse'::user_role])) 
  OR (EXISTS (SELECT 1 FROM patients WHERE patients.id = contraptions.patient_id AND patients.hospital_number = get_patient_number(auth.uid())))
);

-- Update patient documents policies
DROP POLICY IF EXISTS "Staff and doctors can view all documents" ON public.patient_documents;
CREATE POLICY "Staff, doctors and nurses can view all documents" ON public.patient_documents
FOR SELECT USING (
  (get_user_role(auth.uid()) = ANY (ARRAY['staff'::user_role, 'doctor'::user_role, 'nurse'::user_role])) 
  OR (EXISTS (SELECT 1 FROM patients WHERE patients.id = patient_documents.patient_id AND patients.hospital_number = get_patient_number(auth.uid())))
);

-- Update patient medications policies
DROP POLICY IF EXISTS "Staff and doctors can view all medications" ON public.patient_medications;
CREATE POLICY "Staff, doctors and nurses can view all medications" ON public.patient_medications
FOR SELECT USING (
  (get_user_role(auth.uid()) = ANY (ARRAY['staff'::user_role, 'doctor'::user_role, 'nurse'::user_role])) 
  OR (EXISTS (SELECT 1 FROM patients WHERE patients.id = patient_medications.patient_id AND patients.hospital_number = get_patient_number(auth.uid())))
);

-- Update patient labs policies
DROP POLICY IF EXISTS "Staff, doctors, and MedTech can view labs" ON public.patient_labs;
CREATE POLICY "Staff, doctors, nurses and MedTech can view labs" ON public.patient_labs
FOR SELECT USING (
  (get_user_role(auth.uid()) = ANY (ARRAY['staff'::user_role, 'doctor'::user_role, 'nurse'::user_role, 'medtech'::user_role])) 
  OR (EXISTS (SELECT 1 FROM patients WHERE patients.id = patient_labs.patient_id AND patients.hospital_number = get_patient_number(auth.uid())))
);

-- Update patient imaging policies
DROP POLICY IF EXISTS "Staff, doctors, and RadTech can view imaging" ON public.patient_imaging;
CREATE POLICY "Staff, doctors, nurses and RadTech can view imaging" ON public.patient_imaging
FOR SELECT USING (
  (get_user_role(auth.uid()) = ANY (ARRAY['staff'::user_role, 'doctor'::user_role, 'nurse'::user_role, 'radtech'::user_role])) 
  OR (EXISTS (SELECT 1 FROM patients WHERE patients.id = patient_imaging.patient_id AND patients.hospital_number = get_patient_number(auth.uid())))
);

-- Update get_all_staff_recipients to include nurses and doctors
CREATE OR REPLACE FUNCTION public.get_all_staff_recipients()
RETURNS TABLE(user_id uuid, role text, display_name text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Allow staff, medtech, radtech, doctor, and nurse to view staff directory
  IF get_user_role(auth.uid()) NOT IN ('staff', 'medtech', 'radtech', 'doctor', 'nurse') THEN
    RAISE EXCEPTION 'Access denied: Only authorized users can view recipients list';
  END IF;
  
  RETURN QUERY
  -- Get staff users
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
  WHERE r.user_id IS NOT NULL
  
  UNION ALL
  
  -- Get doctors with user accounts
  SELECT 
    d.user_id,
    'doctor'::text as role,
    d.name as display_name
  FROM doctors d
  WHERE d.user_id IS NOT NULL
  
  UNION ALL
  
  -- Get nurses with user accounts
  SELECT 
    n.user_id,
    'nurse'::text as role,
    n.name as display_name
  FROM nurses n
  WHERE n.user_id IS NOT NULL;
END;
$function$;