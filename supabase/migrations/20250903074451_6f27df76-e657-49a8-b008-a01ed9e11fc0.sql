-- Fix org_profile RLS policies to use correct roles
DROP POLICY IF EXISTS "Admins can manage organization profile" ON org_profile;

-- Create new policy that allows super_admin users to manage organisation profile
CREATE POLICY "Super admins can manage organization profile" 
ON org_profile FOR ALL 
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));