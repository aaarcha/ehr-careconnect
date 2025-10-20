-- Add password fields to tech staff tables
ALTER TABLE public.medtechs ADD COLUMN temp_password text;
ALTER TABLE public.radtechs ADD COLUMN temp_password text;

-- Add temp_password field to patients for password management
ALTER TABLE public.patients ADD COLUMN temp_password text;

-- Add UPDATE and DELETE policies for clinical data tables so staff can correct errors

-- Patient Labs - Add UPDATE and DELETE policies
CREATE POLICY "Staff and MedTech can update labs"
ON public.patient_labs
FOR UPDATE
USING (get_user_role(auth.uid()) = ANY (ARRAY['staff'::user_role, 'medtech'::user_role]));

CREATE POLICY "Staff and MedTech can delete labs"
ON public.patient_labs
FOR DELETE
USING (get_user_role(auth.uid()) = ANY (ARRAY['staff'::user_role, 'medtech'::user_role]));

-- Patient Imaging - Add UPDATE and DELETE policies
CREATE POLICY "Staff and RadTech can update imaging"
ON public.patient_imaging
FOR UPDATE
USING (get_user_role(auth.uid()) = ANY (ARRAY['staff'::user_role, 'radtech'::user_role]));

CREATE POLICY "Staff and RadTech can delete imaging"
ON public.patient_imaging
FOR DELETE
USING (get_user_role(auth.uid()) = ANY (ARRAY['staff'::user_role, 'radtech'::user_role]));

-- Patient Vital Signs - Add UPDATE and DELETE policies
CREATE POLICY "Staff can update vital signs"
ON public.patient_vital_signs
FOR UPDATE
USING (get_user_role(auth.uid()) = 'staff'::user_role);

CREATE POLICY "Staff can delete vital signs"
ON public.patient_vital_signs
FOR DELETE
USING (get_user_role(auth.uid()) = 'staff'::user_role);

-- Patient Medications - Add UPDATE and DELETE policies
CREATE POLICY "Staff can update medications"
ON public.patient_medications
FOR UPDATE
USING (get_user_role(auth.uid()) = 'staff'::user_role);

CREATE POLICY "Staff can delete medications"
ON public.patient_medications
FOR DELETE
USING (get_user_role(auth.uid()) = 'staff'::user_role);

-- Physical Assessments - Add UPDATE and DELETE policies
CREATE POLICY "Staff can update physical assessments"
ON public.physical_assessments
FOR UPDATE
USING (get_user_role(auth.uid()) = 'staff'::user_role);

CREATE POLICY "Staff can delete physical assessments"
ON public.physical_assessments
FOR DELETE
USING (get_user_role(auth.uid()) = 'staff'::user_role);

-- Pain Assessments - Add UPDATE and DELETE policies
CREATE POLICY "Staff can update pain assessments"
ON public.pain_assessments
FOR UPDATE
USING (get_user_role(auth.uid()) = 'staff'::user_role);

CREATE POLICY "Staff can delete pain assessments"
ON public.pain_assessments
FOR DELETE
USING (get_user_role(auth.uid()) = 'staff'::user_role);

-- Contraptions - Add UPDATE and DELETE policies
CREATE POLICY "Staff can update contraptions"
ON public.contraptions
FOR UPDATE
USING (get_user_role(auth.uid()) = 'staff'::user_role);

CREATE POLICY "Staff can delete contraptions"
ON public.contraptions
FOR DELETE
USING (get_user_role(auth.uid()) = 'staff'::user_role);

-- Patient Documents - Add UPDATE and DELETE policies
CREATE POLICY "Staff can update documents"
ON public.patient_documents
FOR UPDATE
USING (get_user_role(auth.uid()) = 'staff'::user_role);

CREATE POLICY "Staff can delete documents"
ON public.patient_documents
FOR DELETE
USING (get_user_role(auth.uid()) = 'staff'::user_role);

-- Add DELETE policy for patients (staff only, for data management)
CREATE POLICY "Staff can delete patients"
ON public.patients
FOR DELETE
USING (get_user_role(auth.uid()) = 'staff'::user_role);