-- Recreate essential RLS policies that were dropped by CASCADE

-- Departments policies
CREATE POLICY "Anyone can view departments" 
ON public.departments FOR SELECT 
USING (true);

CREATE POLICY "Super admins and client admins can manage departments" 
ON public.departments FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'client_admin'::app_role));

-- Breach management policies
CREATE POLICY "Admins can manage breach management data" 
ON public.breach_management_team FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'client_admin'::app_role));

CREATE POLICY "Admins can manage breach team members" 
ON public.breach_team_members FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'client_admin'::app_role));

-- Email templates policy
CREATE POLICY "Allow admin users to manage email templates" 
ON public.email_templates FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'client_admin'::app_role));

-- Roles table policy
CREATE POLICY "Allow client_admin and super_admin access to roles" 
ON public.roles FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'client_admin'::app_role));

-- Translation policies  
CREATE POLICY "Admins can manage lesson translations" 
ON public.lesson_translations FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Admins can manage lesson node translations" 
ON public.lesson_node_translations FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Admins can manage lesson answer translations" 
ON public.lesson_answer_translations FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Quiz attempts policy
CREATE POLICY "Admins can manage all quiz attempts" 
ON public.quiz_attempts FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'client_admin'::app_role));

-- User roles policies
CREATE POLICY "Users can view their own role" 
ON public.user_roles FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Only super admins can modify roles" 
ON public.user_roles FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Translation change log policy
CREATE POLICY "Admins can view translation change log" 
ON public.translation_change_log FOR SELECT
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Languages policy
CREATE POLICY "Anyone can view languages" 
ON public.languages FOR SELECT 
USING (true);

CREATE POLICY "Super admins can manage languages" 
ON public.languages FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Key dates policy  
CREATE POLICY "Authenticated users can view key dates" 
ON public.key_dates FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage key dates" 
ON public.key_dates FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'client_admin'::app_role));

-- CSBA policies
CREATE POLICY "Authenticated users can view CSBA master" 
ON public.csba_master FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage their own CSBA answers" 
ON public.csba_answers FOR ALL
USING (auth.uid() = user_id);