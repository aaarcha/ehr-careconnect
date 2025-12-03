
-- Create FDAR Notes (Nurses Progress Notes) table
CREATE TABLE public.fdar_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  date_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  focus TEXT NOT NULL,
  data TEXT,
  action TEXT,
  response TEXT,
  notes TEXT,
  nurse_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Medication Administration Record (MAR) table
CREATE TABLE public.medication_administration_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  medication_name TEXT NOT NULL,
  dose TEXT NOT NULL,
  route TEXT NOT NULL,
  scheduled_times JSONB DEFAULT '[]'::jsonb,
  administered_times JSONB DEFAULT '[]'::jsonb,
  nurse_initials TEXT,
  is_completed BOOLEAN DEFAULT false,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  room_no TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Intake and Output Records table
CREATE TABLE public.intake_output_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  record_type TEXT NOT NULL CHECK (record_type IN ('intake', 'output')),
  time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  amount DECIMAL(10,2) NOT NULL,
  type_description TEXT NOT NULL,
  notes TEXT,
  recorded_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create IV Fluid Monitoring table
CREATE TABLE public.iv_fluid_monitoring (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  room_no TEXT,
  bottle_no INTEGER,
  iv_solution TEXT NOT NULL,
  running_time TEXT,
  time_started TIMESTAMP WITH TIME ZONE,
  expected_time_to_consume TEXT,
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create storage bucket for imaging files
INSERT INTO storage.buckets (id, name, public) VALUES ('imaging-files', 'imaging-files', true);

-- Add file_path column to patient_imaging for file uploads
ALTER TABLE public.patient_imaging ADD COLUMN IF NOT EXISTS file_path TEXT;

-- Enable RLS on all new tables
ALTER TABLE public.fdar_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medication_administration_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intake_output_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.iv_fluid_monitoring ENABLE ROW LEVEL SECURITY;

-- RLS policies for fdar_notes (staff only)
CREATE POLICY "Staff can view all fdar_notes" ON public.fdar_notes FOR SELECT USING (get_user_role(auth.uid()) = 'staff'::user_role);
CREATE POLICY "Staff can insert fdar_notes" ON public.fdar_notes FOR INSERT WITH CHECK (get_user_role(auth.uid()) = 'staff'::user_role);
CREATE POLICY "Staff can update fdar_notes" ON public.fdar_notes FOR UPDATE USING (get_user_role(auth.uid()) = 'staff'::user_role);
CREATE POLICY "Staff can delete fdar_notes" ON public.fdar_notes FOR DELETE USING (get_user_role(auth.uid()) = 'staff'::user_role);

-- RLS policies for medication_administration_records (staff only)
CREATE POLICY "Staff can view all mar" ON public.medication_administration_records FOR SELECT USING (get_user_role(auth.uid()) = 'staff'::user_role);
CREATE POLICY "Staff can insert mar" ON public.medication_administration_records FOR INSERT WITH CHECK (get_user_role(auth.uid()) = 'staff'::user_role);
CREATE POLICY "Staff can update mar" ON public.medication_administration_records FOR UPDATE USING (get_user_role(auth.uid()) = 'staff'::user_role);
CREATE POLICY "Staff can delete mar" ON public.medication_administration_records FOR DELETE USING (get_user_role(auth.uid()) = 'staff'::user_role);

-- RLS policies for intake_output_records (staff only)
CREATE POLICY "Staff can view all io_records" ON public.intake_output_records FOR SELECT USING (get_user_role(auth.uid()) = 'staff'::user_role);
CREATE POLICY "Staff can insert io_records" ON public.intake_output_records FOR INSERT WITH CHECK (get_user_role(auth.uid()) = 'staff'::user_role);
CREATE POLICY "Staff can update io_records" ON public.intake_output_records FOR UPDATE USING (get_user_role(auth.uid()) = 'staff'::user_role);
CREATE POLICY "Staff can delete io_records" ON public.intake_output_records FOR DELETE USING (get_user_role(auth.uid()) = 'staff'::user_role);

-- RLS policies for iv_fluid_monitoring (staff only)
CREATE POLICY "Staff can view all iv_monitoring" ON public.iv_fluid_monitoring FOR SELECT USING (get_user_role(auth.uid()) = 'staff'::user_role);
CREATE POLICY "Staff can insert iv_monitoring" ON public.iv_fluid_monitoring FOR INSERT WITH CHECK (get_user_role(auth.uid()) = 'staff'::user_role);
CREATE POLICY "Staff can update iv_monitoring" ON public.iv_fluid_monitoring FOR UPDATE USING (get_user_role(auth.uid()) = 'staff'::user_role);
CREATE POLICY "Staff can delete iv_monitoring" ON public.iv_fluid_monitoring FOR DELETE USING (get_user_role(auth.uid()) = 'staff'::user_role);

-- Storage policies for imaging files
CREATE POLICY "Staff can upload imaging files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'imaging-files' AND get_user_role(auth.uid()) IN ('staff'::user_role, 'radtech'::user_role));
CREATE POLICY "Staff can view imaging files" ON storage.objects FOR SELECT USING (bucket_id = 'imaging-files');
CREATE POLICY "Staff can delete imaging files" ON storage.objects FOR DELETE USING (bucket_id = 'imaging-files' AND get_user_role(auth.uid()) IN ('staff'::user_role, 'radtech'::user_role));
