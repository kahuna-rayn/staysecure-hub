-- Recreate missing RLS policies with correct syntax

-- Breach management policies
DROP POLICY IF EXISTS "Admins can manage breach management data" ON public.breach_management_team;
CREATE POLICY "Admins can manage breach management data" 
ON public.breach_management_team FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'client_admin'::app_role));

DROP POLICY IF EXISTS "Admins can manage breach team members" ON public.breach_team_members;
CREATE POLICY "Admins can manage breach team members" 
ON public.breach_team_members FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'client_admin'::app_role));

-- Email templates policy
DROP POLICY IF EXISTS "Allow admin users to manage email templates" ON public.email_templates;
CREATE POLICY "Allow admin users to manage email templates" 
ON public.email_templates FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'client_admin'::app_role));

-- Translation policies  
DROP POLICY IF EXISTS "Admins can manage lesson translations" ON public.lesson_translations;
CREATE POLICY "Admins can manage lesson translations" 
ON public.lesson_translations FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

DROP POLICY IF EXISTS "Admins can manage lesson node translations" ON public.lesson_node_translations;
CREATE POLICY "Admins can manage lesson node translations" 
ON public.lesson_node_translations FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

DROP POLICY IF EXISTS "Admins can manage lesson answer translations" ON public.lesson_answer_translations;
CREATE POLICY "Admins can manage lesson answer translations" 
ON public.lesson_answer_translations FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- User roles policies
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
CREATE POLICY "Users can view their own role" 
ON public.user_roles FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Only super admins can modify roles" ON public.user_roles;
CREATE POLICY "Only super admins can modify roles" 
ON public.user_roles FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Translation change log policy
DROP POLICY IF EXISTS "Admins can view translation change log" ON public.translation_change_log;
CREATE POLICY "Admins can view translation change log" 
ON public.translation_change_log FOR SELECT
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Languages policies
DROP POLICY IF EXISTS "Anyone can view languages" ON public.languages;
CREATE POLICY "Anyone can view languages" 
ON public.languages FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Super admins can manage languages" ON public.languages;
CREATE POLICY "Super admins can manage languages" 
ON public.languages FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Key dates policies
DROP POLICY IF EXISTS "Authenticated users can view key dates" ON public.key_dates;
CREATE POLICY "Authenticated users can view key dates" 
ON public.key_dates FOR SELECT
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins can manage key dates" ON public.key_dates;
CREATE POLICY "Admins can manage key dates" 
ON public.key_dates FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'client_admin'::app_role));

-- CSBA policies
DROP POLICY IF EXISTS "Authenticated users can view CSBA master" ON public.csba_master;
CREATE POLICY "Authenticated users can view CSBA master" 
ON public.csba_master FOR SELECT
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can manage their own CSBA answers" ON public.csba_answers;
CREATE POLICY "Users can manage their own CSBA answers" 
ON public.csba_answers FOR ALL
USING (auth.uid() = user_id);