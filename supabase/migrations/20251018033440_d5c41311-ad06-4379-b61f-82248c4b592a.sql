-- Create tables for medtech and radtech with user roles integration
CREATE TABLE IF NOT EXISTS public.medtechs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  account_number TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.radtechs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  account_number TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.medtechs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.radtechs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for medtechs
CREATE POLICY "Staff can view all medtechs"
  ON public.medtechs FOR SELECT
  USING (get_user_role(auth.uid()) = 'staff'::user_role);

CREATE POLICY "Staff can insert medtechs"
  ON public.medtechs FOR INSERT
  WITH CHECK (get_user_role(auth.uid()) = 'staff'::user_role);

CREATE POLICY "Staff can update medtechs"
  ON public.medtechs FOR UPDATE
  USING (get_user_role(auth.uid()) = 'staff'::user_role);

CREATE POLICY "Staff can delete medtechs"
  ON public.medtechs FOR DELETE
  USING (get_user_role(auth.uid()) = 'staff'::user_role);

-- RLS Policies for radtechs
CREATE POLICY "Staff can view all radtechs"
  ON public.radtechs FOR SELECT
  USING (get_user_role(auth.uid()) = 'staff'::user_role);

CREATE POLICY "Staff can insert radtechs"
  ON public.radtechs FOR INSERT
  WITH CHECK (get_user_role(auth.uid()) = 'staff'::user_role);

CREATE POLICY "Staff can update radtechs"
  ON public.radtechs FOR UPDATE
  USING (get_user_role(auth.uid()) = 'staff'::user_role);

CREATE POLICY "Staff can delete radtechs"
  ON public.radtechs FOR DELETE
  USING (get_user_role(auth.uid()) = 'staff'::user_role);

-- Add messages table for functional messaging
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Messages policies - users can see messages they sent or received
CREATE POLICY "Users can view their own messages"
  ON public.messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Recipients can update read status"
  ON public.messages FOR UPDATE
  USING (auth.uid() = recipient_id);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Add support tickets table
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tickets"
  ON public.support_tickets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create tickets"
  ON public.support_tickets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Add user preferences table for settings
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  theme TEXT DEFAULT 'light',
  email_notifications BOOLEAN DEFAULT TRUE,
  patient_alerts BOOLEAN DEFAULT TRUE,
  system_updates BOOLEAN DEFAULT TRUE,
  auto_save BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own preferences"
  ON public.user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
  ON public.user_preferences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
  ON public.user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);