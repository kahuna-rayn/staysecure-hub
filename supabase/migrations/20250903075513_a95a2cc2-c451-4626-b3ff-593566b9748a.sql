-- Fix org_sig_roles RLS policy to use correct admin roles
DROP POLICY IF EXISTS "Super admins can manage organization signatory roles" ON org_sig_roles;
DROP POLICY IF EXISTS "Admins can manage organization signatory roles" ON org_sig_roles;

CREATE POLICY "Admin users can manage organization signatory roles" 
ON org_sig_roles FOR ALL 
USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'client_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'client_admin'::app_role));

-- Update profiles policy to only allow SELECT and UPDATE (no INSERT since profiles are auto-created)
DROP POLICY IF EXISTS "Admin users can manage all profiles" ON profiles;

CREATE POLICY "Admin users can view and update all profiles" 
ON profiles FOR SELECT 
USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'client_admin'::app_role));

CREATE POLICY "Admin users can update all profiles" 
ON profiles FOR UPDATE 
USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'client_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'client_admin'::app_role));