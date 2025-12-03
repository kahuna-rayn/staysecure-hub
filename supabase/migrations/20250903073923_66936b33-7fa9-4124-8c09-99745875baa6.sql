-- Drop the problematic RLS policies first
DROP POLICY IF EXISTS "Super admins can manage all template variables" ON template_variables;
DROP POLICY IF EXISTS "Client admins can view template variables" ON template_variables;
DROP POLICY IF EXISTS "Super admins can manage all variable translations" ON template_variable_translations;
DROP POLICY IF EXISTS "Client admins can update default values only" ON template_variable_translations;

-- Recreate them with correct has_role function using app_role enum
CREATE POLICY "Super admins can manage all template variables" 
ON template_variables FOR ALL 
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Client admins can view template variables" 
ON template_variables FOR SELECT 
USING (has_role(auth.uid(), 'client_admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins can manage all variable translations" 
ON template_variable_translations FOR ALL 
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Client admins can update default values only" 
ON template_variable_translations FOR UPDATE 
USING (has_role(auth.uid(), 'client_admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'client_admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- Now drop the old has_role function
DROP FUNCTION IF EXISTS public.has_role(uuid, text);