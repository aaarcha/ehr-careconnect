-- Add explicit RLS policies for user_roles table to allow only staff to manage roles
-- This prevents privilege escalation through application vulnerabilities

CREATE POLICY "Only staff can insert user roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role(auth.uid()) = 'staff'::user_role);

CREATE POLICY "Only staff can update user roles"
  ON public.user_roles FOR UPDATE
  TO authenticated
  USING (get_user_role(auth.uid()) = 'staff'::user_role);

CREATE POLICY "Only staff can delete user roles"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (get_user_role(auth.uid()) = 'staff'::user_role);