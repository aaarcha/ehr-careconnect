-- Create shift handover table for nurses
CREATE TABLE public.shift_handovers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  outgoing_nurse_id UUID REFERENCES public.nurses(id),
  incoming_nurse_id UUID REFERENCES public.nurses(id),
  department TEXT NOT NULL,
  shift_date DATE NOT NULL DEFAULT CURRENT_DATE,
  shift_time TEXT NOT NULL,
  patient_summary JSONB DEFAULT '[]'::jsonb,
  pending_tasks TEXT,
  critical_alerts TEXT,
  medications_due TEXT,
  general_notes TEXT,
  status TEXT DEFAULT 'pending',
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shift_handovers ENABLE ROW LEVEL SECURITY;

-- Nurses can view shift handovers
CREATE POLICY "Nurses can view relevant handovers" 
ON public.shift_handovers 
FOR SELECT 
USING (get_user_role(auth.uid()) IN ('staff', 'nurse', 'doctor'));

-- Nurses can create handovers
CREATE POLICY "Nurses can create handovers" 
ON public.shift_handovers 
FOR INSERT 
WITH CHECK (get_user_role(auth.uid()) IN ('staff', 'nurse'));

-- Nurses can update handovers
CREATE POLICY "Nurses can update handovers" 
ON public.shift_handovers 
FOR UPDATE 
USING (get_user_role(auth.uid()) IN ('staff', 'nurse'));

-- Only staff can delete handovers
CREATE POLICY "Staff can delete handovers" 
ON public.shift_handovers 
FOR DELETE 
USING (get_user_role(auth.uid()) = 'staff');

-- Create trigger for updated_at using existing function
CREATE TRIGGER update_shift_handovers_updated_at
BEFORE UPDATE ON public.shift_handovers
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();