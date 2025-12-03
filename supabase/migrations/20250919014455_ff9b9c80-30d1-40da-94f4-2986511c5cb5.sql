-- Update admin policies to include super_admin access for remaining tables

-- CSBA Master - Add super_admin access
DROP POLICY IF EXISTS "Admins can manage CSBA questions" ON public.csba_master;

CREATE POLICY "Super and Client Admins can manage CSBA questions" 
ON public.csba_master 
FOR ALL 
USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'client_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'client_admin'::app_role));

-- Languages - Add super_admin access
DROP POLICY IF EXISTS "Admins can manage languages" ON public.languages;

CREATE POLICY "Super and Client Admins can manage languages" 
ON public.languages 
FOR ALL 
USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'client_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'client_admin'::app_role));

-- Translation Jobs - Update to include super_admin
DROP POLICY IF EXISTS "Admins can manage all translation jobs" ON public.translation_jobs;

CREATE POLICY "Super and Client Admins can manage all translation jobs" 
ON public.translation_jobs 
FOR ALL 
USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'client_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'client_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Translation Change Log - Update to include super_admin
DROP POLICY IF EXISTS "Admins can view translation change logs" ON public.translation_change_log;

CREATE POLICY "Super and Client Admins can view translation change logs" 
ON public.translation_change_log 
FOR SELECT 
USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'client_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));