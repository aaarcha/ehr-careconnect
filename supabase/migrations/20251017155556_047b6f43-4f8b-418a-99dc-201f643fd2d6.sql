-- Create user roles enum
CREATE TYPE public.user_role AS ENUM ('staff', 'medtech', 'radtech', 'patient');

-- Create specialties enum for doctors
CREATE TYPE public.doctor_specialty AS ENUM (
  'Allergy and Immunology',
  'Anesthesiology',
  'Cardiology',
  'Colon and Rectal Surgery',
  'Dermatology',
  'Diagnostic Radiology',
  'Emergency Medicine',
  'Family Medicine',
  'General Surgery',
  'Internal Medicine',
  'Medical Genetics and Genomics',
  'Neurological Surgery',
  'Neurology',
  'Nuclear Medicine',
  'Obstetrics and Gynecology',
  'Occupational Medicine',
  'Ophthalmology',
  'Orthopaedic Surgery',
  'Otolaryngology (ENT)',
  'Pathology',
  'Pediatrics',
  'Physical Medicine and Rehabilitation (PM&R)',
  'Plastic Surgery',
  'Preventive Medicine',
  'Psychiatry',
  'Radiation Oncology',
  'Thoracic Surgery',
  'Urology'
);

-- Create department enum
CREATE TYPE public.department_type AS ENUM ('WARD', 'OR', 'ICU', 'ER', 'HEMO', 'OUT_PATIENT', 'IN_PATIENT');

-- Create patient status enum
CREATE TYPE public.patient_status AS ENUM ('active', 'archived');

-- Create user_roles table for authentication
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role user_role NOT NULL,
  account_number TEXT UNIQUE,
  patient_number TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Create doctors table
CREATE TABLE public.doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  specialty doctor_specialty NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create nurses table
CREATE TABLE public.nurses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  nurse_no TEXT UNIQUE NOT NULL,
  department department_type NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create patients table
CREATE TABLE public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_number TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  age INTEGER,
  sex TEXT NOT NULL,
  height DECIMAL,
  weight DECIMAL,
  bmi DECIMAL,
  civil_status TEXT,
  address TEXT,
  contact_number TEXT,
  place_of_birth TEXT,
  nationality TEXT,
  religion TEXT,
  occupation TEXT,
  spouse_guardian_name TEXT,
  spouse_guardian_contact TEXT,
  admit_to_department department_type,
  admit_to_location TEXT,
  referred_by TEXT,
  attending_physician_id UUID REFERENCES public.doctors(id),
  philhealth BOOLEAN DEFAULT false,
  past_medical_history JSONB,
  personal_social_history JSONB,
  family_history JSONB,
  history_present_illness TEXT,
  problem_list TEXT[],
  allergies TEXT[],
  current_medications TEXT[],
  admitting_diagnosis TEXT,
  discharge_diagnosis TEXT,
  status patient_status DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create patient_vital_signs table
CREATE TABLE public.patient_vital_signs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  blood_pressure TEXT,
  heart_rate INTEGER,
  respiratory_rate INTEGER,
  oxygen_saturation DECIMAL,
  temperature DECIMAL,
  pain_scale INTEGER,
  notes TEXT
);

-- Create patient_medications table
CREATE TABLE public.patient_medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  medication_name TEXT NOT NULL,
  dosage TEXT,
  frequency TEXT,
  route TEXT,
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  notes TEXT
);

-- Create patient_labs table
CREATE TABLE public.patient_labs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  test_name TEXT NOT NULL,
  test_date TIMESTAMPTZ DEFAULT NOW(),
  results TEXT,
  notes TEXT
);

-- Create patient_imaging table
CREATE TABLE public.patient_imaging (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  imaging_type TEXT NOT NULL,
  imaging_date TIMESTAMPTZ DEFAULT NOW(),
  findings TEXT,
  notes TEXT
);

-- Create patient_documents table
CREATE TABLE public.patient_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  document_type TEXT NOT NULL,
  content TEXT NOT NULL,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create contraptions table
CREATE TABLE public.contraptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  date_inserted TIMESTAMPTZ,
  location_site TEXT,
  inserted_by TEXT,
  due_for_changing TEXT,
  dislodged_reason TEXT,
  dislodged_date TIMESTAMPTZ,
  change_of_dressing_date TIMESTAMPTZ,
  details_remarks TEXT
);

-- Create pain_assessments table
CREATE TABLE public.pain_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  assessment_date TIMESTAMPTZ DEFAULT NOW(),
  pain_tool TEXT NOT NULL,
  score TEXT,
  location_of_pain TEXT,
  description TEXT,
  intervention TEXT
);

-- Create physical_assessments table
CREATE TABLE public.physical_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  assessment_date TIMESTAMPTZ DEFAULT NOW(),
  skin_assessment JSONB,
  eent_assessment JSONB,
  cardiovascular_assessment JSONB,
  respiratory_assessment JSONB,
  gastrointestinal_assessment JSONB,
  genitourinary_assessment JSONB,
  musculoskeletal_assessment JSONB,
  neurological_assessment JSONB
);

-- Enable Row Level Security
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nurses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_vital_signs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_labs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_imaging ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contraptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pain_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.physical_assessments ENABLE ROW LEVEL SECURITY;

-- Create function to check user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid UUID)
RETURNS user_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = user_uuid LIMIT 1;
$$;

-- Create function to get patient number
CREATE OR REPLACE FUNCTION public.get_patient_number(user_uuid UUID)
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT patient_number FROM public.user_roles WHERE user_id = user_uuid LIMIT 1;
$$;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own role"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

-- RLS Policies for doctors (view-only for all authenticated users, insert/update for staff only)
CREATE POLICY "All authenticated users can view doctors"
ON public.doctors FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Staff can insert doctors"
ON public.doctors FOR INSERT
TO authenticated
WITH CHECK (public.get_user_role(auth.uid()) = 'staff');

CREATE POLICY "Staff can update doctors"
ON public.doctors FOR UPDATE
TO authenticated
USING (public.get_user_role(auth.uid()) = 'staff');

-- RLS Policies for nurses (view-only for all authenticated users)
CREATE POLICY "All authenticated users can view nurses"
ON public.nurses FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Staff can insert nurses"
ON public.nurses FOR INSERT
TO authenticated
WITH CHECK (public.get_user_role(auth.uid()) = 'staff');

-- RLS Policies for patients
CREATE POLICY "Staff can view all patients"
ON public.patients FOR SELECT
TO authenticated
USING (public.get_user_role(auth.uid()) = 'staff');

CREATE POLICY "Patients can view their own record"
ON public.patients FOR SELECT
TO authenticated
USING (hospital_number = public.get_patient_number(auth.uid()));

CREATE POLICY "Staff can insert patients"
ON public.patients FOR INSERT
TO authenticated
WITH CHECK (public.get_user_role(auth.uid()) = 'staff');

CREATE POLICY "Staff can update patients"
ON public.patients FOR UPDATE
TO authenticated
USING (public.get_user_role(auth.uid()) = 'staff');

-- RLS Policies for patient_vital_signs
CREATE POLICY "Staff can view all vital signs"
ON public.patient_vital_signs FOR SELECT
TO authenticated
USING (
  public.get_user_role(auth.uid()) = 'staff' OR
  EXISTS (
    SELECT 1 FROM public.patients
    WHERE patients.id = patient_vital_signs.patient_id
    AND patients.hospital_number = public.get_patient_number(auth.uid())
  )
);

CREATE POLICY "Staff can insert vital signs"
ON public.patient_vital_signs FOR INSERT
TO authenticated
WITH CHECK (public.get_user_role(auth.uid()) = 'staff');

-- RLS Policies for patient_medications
CREATE POLICY "Staff can view all medications"
ON public.patient_medications FOR SELECT
TO authenticated
USING (
  public.get_user_role(auth.uid()) = 'staff' OR
  EXISTS (
    SELECT 1 FROM public.patients
    WHERE patients.id = patient_medications.patient_id
    AND patients.hospital_number = public.get_patient_number(auth.uid())
  )
);

CREATE POLICY "Staff can insert medications"
ON public.patient_medications FOR INSERT
TO authenticated
WITH CHECK (public.get_user_role(auth.uid()) = 'staff');

-- RLS Policies for patient_labs
CREATE POLICY "Staff and MedTech can view labs"
ON public.patient_labs FOR SELECT
TO authenticated
USING (
  public.get_user_role(auth.uid()) IN ('staff', 'medtech') OR
  EXISTS (
    SELECT 1 FROM public.patients
    WHERE patients.id = patient_labs.patient_id
    AND patients.hospital_number = public.get_patient_number(auth.uid())
  )
);

CREATE POLICY "MedTech can insert labs"
ON public.patient_labs FOR INSERT
TO authenticated
WITH CHECK (public.get_user_role(auth.uid()) IN ('staff', 'medtech'));

-- RLS Policies for patient_imaging
CREATE POLICY "Staff and RadTech can view imaging"
ON public.patient_imaging FOR SELECT
TO authenticated
USING (
  public.get_user_role(auth.uid()) IN ('staff', 'radtech') OR
  EXISTS (
    SELECT 1 FROM public.patients
    WHERE patients.id = patient_imaging.patient_id
    AND patients.hospital_number = public.get_patient_number(auth.uid())
  )
);

CREATE POLICY "RadTech can insert imaging"
ON public.patient_imaging FOR INSERT
TO authenticated
WITH CHECK (public.get_user_role(auth.uid()) IN ('staff', 'radtech'));

-- RLS Policies for patient_documents
CREATE POLICY "Staff can view all documents"
ON public.patient_documents FOR SELECT
TO authenticated
USING (
  public.get_user_role(auth.uid()) = 'staff' OR
  EXISTS (
    SELECT 1 FROM public.patients
    WHERE patients.id = patient_documents.patient_id
    AND patients.hospital_number = public.get_patient_number(auth.uid())
  )
);

CREATE POLICY "Staff can insert documents"
ON public.patient_documents FOR INSERT
TO authenticated
WITH CHECK (public.get_user_role(auth.uid()) = 'staff');

-- RLS Policies for contraptions
CREATE POLICY "Staff can view all contraptions"
ON public.contraptions FOR SELECT
TO authenticated
USING (
  public.get_user_role(auth.uid()) = 'staff' OR
  EXISTS (
    SELECT 1 FROM public.patients
    WHERE patients.id = contraptions.patient_id
    AND patients.hospital_number = public.get_patient_number(auth.uid())
  )
);

CREATE POLICY "Staff can insert contraptions"
ON public.contraptions FOR INSERT
TO authenticated
WITH CHECK (public.get_user_role(auth.uid()) = 'staff');

-- RLS Policies for pain_assessments
CREATE POLICY "Staff can view all pain assessments"
ON public.pain_assessments FOR SELECT
TO authenticated
USING (
  public.get_user_role(auth.uid()) = 'staff' OR
  EXISTS (
    SELECT 1 FROM public.patients
    WHERE patients.id = pain_assessments.patient_id
    AND patients.hospital_number = public.get_patient_number(auth.uid())
  )
);

CREATE POLICY "Staff can insert pain assessments"
ON public.pain_assessments FOR INSERT
TO authenticated
WITH CHECK (public.get_user_role(auth.uid()) = 'staff');

-- RLS Policies for physical_assessments
CREATE POLICY "Staff can view all physical assessments"
ON public.physical_assessments FOR SELECT
TO authenticated
USING (
  public.get_user_role(auth.uid()) = 'staff' OR
  EXISTS (
    SELECT 1 FROM public.patients
    WHERE patients.id = physical_assessments.patient_id
    AND patients.hospital_number = public.get_patient_number(auth.uid())
  )
);

CREATE POLICY "Staff can insert physical assessments"
ON public.physical_assessments FOR INSERT
TO authenticated
WITH CHECK (public.get_user_role(auth.uid()) = 'staff');

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_doctors_updated_at
  BEFORE UPDATE ON public.doctors
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_patients_updated_at
  BEFORE UPDATE ON public.patients
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Insert test data for staff user
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'staff@careconnect.com',
  crypt('staff123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW()
)
ON CONFLICT DO NOTHING;

-- Insert mock nurses data
INSERT INTO public.nurses (name, nurse_no, department) VALUES
('Maria Santos', 'N001', 'WARD'),
('Juan Dela Cruz', 'N002', 'WARD'),
('Ana Reyes', 'N003', 'OR'),
('Pedro Garcia', 'N004', 'OR'),
('Sofia Martinez', 'N005', 'ICU'),
('Carlos Lopez', 'N006', 'ICU'),
('Isabella Torres', 'N007', 'ER'),
('Miguel Rivera', 'N008', 'HEMO');