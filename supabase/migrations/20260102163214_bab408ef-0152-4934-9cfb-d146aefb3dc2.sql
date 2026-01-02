-- Add user_id and account_number columns to doctors table for authentication linkage
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS account_number text;

-- Add user_id column to patients table for authentication linkage
ALTER TABLE patients ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_doctors_user_id ON doctors(user_id);
CREATE INDEX IF NOT EXISTS idx_doctors_account_number ON doctors(account_number);
CREATE INDEX IF NOT EXISTS idx_patients_user_id ON patients(user_id);

-- Update RLS policies for doctors table to allow doctor role to view
DROP POLICY IF EXISTS "All authenticated users can view doctors" ON doctors;
CREATE POLICY "Staff and doctors can view all doctors" 
ON doctors FOR SELECT 
USING (get_user_role(auth.uid()) IN ('staff', 'doctor'));

-- Update RLS policies for nurses table to allow doctor role to view
DROP POLICY IF EXISTS "All authenticated users can view nurses" ON nurses;
CREATE POLICY "Staff and doctors can view all nurses" 
ON nurses FOR SELECT 
USING (get_user_role(auth.uid()) IN ('staff', 'doctor'));

-- Update patients policies to allow doctor role
DROP POLICY IF EXISTS "Staff can view all patients" ON patients;
CREATE POLICY "Staff and doctors can view all patients" 
ON patients FOR SELECT 
USING (get_user_role(auth.uid()) IN ('staff', 'doctor'));

DROP POLICY IF EXISTS "Staff can update patients" ON patients;
CREATE POLICY "Staff and doctors can update patients" 
ON patients FOR UPDATE 
USING (get_user_role(auth.uid()) IN ('staff', 'doctor'));

-- Update lab policies to allow doctor role to view
DROP POLICY IF EXISTS "Staff and MedTech can view labs" ON patient_labs;
CREATE POLICY "Staff, doctors, and MedTech can view labs" 
ON patient_labs FOR SELECT 
USING (
  get_user_role(auth.uid()) IN ('staff', 'doctor', 'medtech') 
  OR EXISTS (
    SELECT 1 FROM patients 
    WHERE patients.id = patient_labs.patient_id 
    AND patients.hospital_number = get_patient_number(auth.uid())
  )
);

-- Update imaging policies to allow doctor role to view
DROP POLICY IF EXISTS "Staff and RadTech can view imaging" ON patient_imaging;
CREATE POLICY "Staff, doctors, and RadTech can view imaging" 
ON patient_imaging FOR SELECT 
USING (
  get_user_role(auth.uid()) IN ('staff', 'doctor', 'radtech') 
  OR EXISTS (
    SELECT 1 FROM patients 
    WHERE patients.id = patient_imaging.patient_id 
    AND patients.hospital_number = get_patient_number(auth.uid())
  )
);

-- Update vital signs policies to allow doctor role
DROP POLICY IF EXISTS "Staff can view all vital signs" ON patient_vital_signs;
CREATE POLICY "Staff and doctors can view all vital signs" 
ON patient_vital_signs FOR SELECT 
USING (
  get_user_role(auth.uid()) IN ('staff', 'doctor') 
  OR EXISTS (
    SELECT 1 FROM patients 
    WHERE patients.id = patient_vital_signs.patient_id 
    AND patients.hospital_number = get_patient_number(auth.uid())
  )
);

-- Update medications policies to allow doctor role
DROP POLICY IF EXISTS "Staff can view all medications" ON patient_medications;
CREATE POLICY "Staff and doctors can view all medications" 
ON patient_medications FOR SELECT 
USING (
  get_user_role(auth.uid()) IN ('staff', 'doctor') 
  OR EXISTS (
    SELECT 1 FROM patients 
    WHERE patients.id = patient_medications.patient_id 
    AND patients.hospital_number = get_patient_number(auth.uid())
  )
);

-- Update FDAR notes policies to allow doctor role
DROP POLICY IF EXISTS "Staff can view all fdar_notes" ON fdar_notes;
CREATE POLICY "Staff and doctors can view all fdar_notes" 
ON fdar_notes FOR SELECT 
USING (get_user_role(auth.uid()) IN ('staff', 'doctor'));

-- Update physical assessments policies to allow doctor role
DROP POLICY IF EXISTS "Staff can view all physical assessments" ON physical_assessments;
CREATE POLICY "Staff and doctors can view all physical assessments" 
ON physical_assessments FOR SELECT 
USING (
  get_user_role(auth.uid()) IN ('staff', 'doctor') 
  OR EXISTS (
    SELECT 1 FROM patients 
    WHERE patients.id = physical_assessments.patient_id 
    AND patients.hospital_number = get_patient_number(auth.uid())
  )
);

-- Update pain assessments policies to allow doctor role
DROP POLICY IF EXISTS "Staff can view all pain assessments" ON pain_assessments;
CREATE POLICY "Staff and doctors can view all pain assessments" 
ON pain_assessments FOR SELECT 
USING (
  get_user_role(auth.uid()) IN ('staff', 'doctor') 
  OR EXISTS (
    SELECT 1 FROM patients 
    WHERE patients.id = pain_assessments.patient_id 
    AND patients.hospital_number = get_patient_number(auth.uid())
  )
);

-- Update contraptions policies to allow doctor role
DROP POLICY IF EXISTS "Staff can view all contraptions" ON contraptions;
CREATE POLICY "Staff and doctors can view all contraptions" 
ON contraptions FOR SELECT 
USING (
  get_user_role(auth.uid()) IN ('staff', 'doctor') 
  OR EXISTS (
    SELECT 1 FROM patients 
    WHERE patients.id = contraptions.patient_id 
    AND patients.hospital_number = get_patient_number(auth.uid())
  )
);

-- Update IV fluid monitoring policies to allow doctor role
DROP POLICY IF EXISTS "Staff can view all iv_monitoring" ON iv_fluid_monitoring;
CREATE POLICY "Staff and doctors can view all iv_monitoring" 
ON iv_fluid_monitoring FOR SELECT 
USING (get_user_role(auth.uid()) IN ('staff', 'doctor'));

-- Update intake output records policies to allow doctor role
DROP POLICY IF EXISTS "Staff can view all io_records" ON intake_output_records;
CREATE POLICY "Staff and doctors can view all io_records" 
ON intake_output_records FOR SELECT 
USING (get_user_role(auth.uid()) IN ('staff', 'doctor'));

-- Update medication administration records policies to allow doctor role
DROP POLICY IF EXISTS "Staff can view all mar" ON medication_administration_records;
CREATE POLICY "Staff and doctors can view all mar" 
ON medication_administration_records FOR SELECT 
USING (get_user_role(auth.uid()) IN ('staff', 'doctor'));

-- Update patient documents policies to allow doctor role
DROP POLICY IF EXISTS "Staff can view all documents" ON patient_documents;
CREATE POLICY "Staff and doctors can view all documents" 
ON patient_documents FOR SELECT 
USING (
  get_user_role(auth.uid()) IN ('staff', 'doctor') 
  OR EXISTS (
    SELECT 1 FROM patients 
    WHERE patients.id = patient_documents.patient_id 
    AND patients.hospital_number = get_patient_number(auth.uid())
  )
);