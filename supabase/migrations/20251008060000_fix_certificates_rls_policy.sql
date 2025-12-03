-- Fix certificates RLS policy to properly allow admins to see all certificates
-- Drop the existing problematic policies
DROP POLICY IF EXISTS "Managers can view certificates for their department users" ON public.certificates;

-- Create new policies using the has_role function
-- Users can view their own certificates
CREATE POLICY "Users can view their own certificates"
ON public.certificates
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own certificates
CREATE POLICY "Users can insert their own certificates"
ON public.certificates
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Admins can view all certificates (for reporting)
CREATE POLICY "Admins can view all certificates"
ON public.certificates
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  has_role(auth.uid(), 'client_admin'::app_role)
);

-- Admins can manage all certificates
CREATE POLICY "Admins can manage all certificates"
ON public.certificates
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  has_role(auth.uid(), 'client_admin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  has_role(auth.uid(), 'client_admin'::app_role)
);

-- Managers can view certificates for their department users
CREATE POLICY "Managers can view certificates for their department users"
ON public.certificates
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'manager'::app_role) AND
  is_user_in_managed_department(auth.uid(), certificates.user_id)
);
