-- SECURITY FIX: Remove overly permissive policy that allows public access to executive information
DROP POLICY IF EXISTS "Users can view signatory roles" ON public.org_sig_roles;

-- Add secure policy that only allows authenticated admin users to view signatory roles
CREATE POLICY "Only authenticated admin users can view signatory roles" 
ON public.org_sig_roles 
FOR SELECT 
TO authenticated
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  has_role(auth.uid(), 'client_admin'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Ensure the table structure is secure (no public access by default)
REVOKE ALL ON public.org_sig_roles FROM public;
REVOKE ALL ON public.org_sig_roles FROM anon;