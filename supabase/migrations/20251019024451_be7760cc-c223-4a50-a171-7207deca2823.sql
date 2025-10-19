-- Update RLS policies for nurses table to allow UPDATE and DELETE for staff
CREATE POLICY "Staff can update nurses" ON public.nurses
FOR UPDATE USING (get_user_role(auth.uid()) = 'staff');

CREATE POLICY "Staff can delete nurses" ON public.nurses
FOR DELETE USING (get_user_role(auth.uid()) = 'staff');

-- Update RLS policies for doctors table to allow DELETE for staff
CREATE POLICY "Staff can delete doctors" ON public.doctors
FOR DELETE USING (get_user_role(auth.uid()) = 'staff');

-- Add patient_number column to patients table if not exists (for login)
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS patient_number TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS patients_patient_number_key ON public.patients(patient_number);

-- Update patient_labs table to support structured lab results with normal ranges
ALTER TABLE public.patient_labs 
ADD COLUMN IF NOT EXISTS test_category TEXT,
ADD COLUMN IF NOT EXISTS normal_range TEXT,
ADD COLUMN IF NOT EXISTS unit TEXT,
ADD COLUMN IF NOT EXISTS result_value NUMERIC,
ADD COLUMN IF NOT EXISTS flag TEXT CHECK (flag IN ('High', 'Low', 'Normal', NULL));

-- Update patient_imaging table to support image URLs and categories
ALTER TABLE public.patient_imaging 
ADD COLUMN IF NOT EXISTS category TEXT CHECK (category IN ('X-ray', 'CT Scan', 'MRI', 'Ultrasound', 'Mammography', 'PET Scan', 'Fluoroscopy', NULL)),
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS performed_by UUID REFERENCES public.radtechs(id);

-- Update patient_labs to track which medtech performed the test
ALTER TABLE public.patient_labs 
ADD COLUMN IF NOT EXISTS performed_by UUID REFERENCES public.medtechs(id);