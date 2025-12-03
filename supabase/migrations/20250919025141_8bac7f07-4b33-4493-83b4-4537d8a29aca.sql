-- Restrict organization profile access to super_admins and client_admins only
-- Drop any existing overly permissive policies on org_profile

DROP POLICY IF EXISTS "Users can view organization profile" ON public.org_profile;
DROP POLICY IF EXISTS "Authenticated users can view organization profile" ON public.org_profile;
DROP POLICY IF EXISTS "Super admins can manage organization profile" ON public.org_profile;

-- Create restrictive policies for super_admin and client_admin only
CREATE POLICY "Only super_admin and client_admin can view org profile" 
ON public.org_profile 
FOR SELECT 
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  has_role(auth.uid(), 'client_admin'::app_role)
);

CREATE POLICY "Only super_admin and client_admin can insert org profile" 
ON public.org_profile 
FOR INSERT 
WITH CHECK (
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  has_role(auth.uid(), 'client_admin'::app_role)
);

CREATE POLICY "Only super_admin and client_admin can update org profile" 
ON public.org_profile 
FOR UPDATE 
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  has_role(auth.uid(), 'client_admin'::app_role)
);

CREATE POLICY "Only super_admin and client_admin can delete org profile" 
ON public.org_profile 
FOR DELETE 
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  has_role(auth.uid(), 'client_admin'::app_role)
);