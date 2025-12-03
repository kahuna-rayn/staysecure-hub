-- Create template_variables table
CREATE TABLE public.template_variables (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  display_name TEXT NOT NULL,
  is_system BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create template_variable_translations table
CREATE TABLE public.template_variable_translations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  variable_id UUID NOT NULL REFERENCES public.template_variables(id) ON DELETE CASCADE,
  language_code TEXT NOT NULL DEFAULT 'en',
  display_name TEXT NOT NULL,
  default_value TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(variable_id, language_code)
);

-- Enable RLS
ALTER TABLE public.template_variables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_variable_translations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for template_variables
CREATE POLICY "Super admins can manage all template variables" 
ON public.template_variables 
FOR ALL 
USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Client admins can view template variables" 
ON public.template_variables 
FOR SELECT 
USING (has_role(auth.uid(), 'client_admin') OR has_role(auth.uid(), 'super_admin'));

CREATE POLICY "All authenticated users can view active template variables" 
ON public.template_variables 
FOR SELECT 
USING (auth.role() = 'authenticated' AND is_active = true);

-- RLS Policies for template_variable_translations
CREATE POLICY "Super admins can manage all variable translations" 
ON public.template_variable_translations 
FOR ALL 
USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Client admins can update default values only" 
ON public.template_variable_translations 
FOR UPDATE 
USING (has_role(auth.uid(), 'client_admin') OR has_role(auth.uid(), 'super_admin'));

CREATE POLICY "All authenticated users can view variable translations" 
ON public.template_variable_translations 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Create updated_at trigger for template_variables
CREATE TRIGGER update_template_variables_updated_at
BEFORE UPDATE ON public.template_variables
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create updated_at trigger for template_variable_translations
CREATE TRIGGER update_template_variable_translations_updated_at
BEFORE UPDATE ON public.template_variable_translations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed system variables
INSERT INTO public.template_variables (key, category, display_name, is_system, is_active) VALUES
  ('org_name', 'Organization', 'Organization Name', true, true),
  ('user_name', 'User', 'User Name', true, true),
  ('user_email', 'User', 'User Email', true, true),
  ('user_department', 'User', 'User Department', true, true),
  ('current_date', 'System', 'Current Date', true, true),
  ('current_time', 'System', 'Current Time', true, true),
  ('dpo_name', 'Key Personnel', 'DPO Name', true, true),
  ('dpo_email', 'Key Personnel', 'DPO Email', true, true),
  ('iso_name', 'Key Personnel', 'ISO Name', true, true),
  ('iso_email', 'Key Personnel', 'ISO Email', true, true),
  ('cem_name', 'Key Personnel', 'CEM Name', true, true),
  ('cem_email', 'Key Personnel', 'CEM Email', true, true),
  ('hib_name', 'Key Personnel', 'HIB Name', true, true),
  ('hib_email', 'Key Personnel', 'HIB Email', true, true),
  ('dpe_name', 'Key Personnel', 'DPE Name', true, true),
  ('dpe_email', 'Key Personnel', 'DPE Email', true, true),
  ('it_support_number', 'IT', 'IT Support Number', true, true);

-- Seed default English translations
INSERT INTO public.template_variable_translations (variable_id, language_code, display_name, default_value)
SELECT 
  tv.id,
  'en',
  tv.display_name,
  CASE tv.key
    WHEN 'org_name' THEN 'Your Organization'
    WHEN 'user_name' THEN 'User'
    WHEN 'user_email' THEN 'user@example.com'
    WHEN 'user_department' THEN 'Department'
    WHEN 'current_date' THEN to_char(CURRENT_DATE, 'YYYY-MM-DD')
    WHEN 'current_time' THEN to_char(NOW()::time, 'HH24:MI')
    WHEN 'dpo_name' THEN 'Data Protection Officer'
    WHEN 'dpo_email' THEN 'dpo@organization.com'
    WHEN 'iso_name' THEN 'Information Security Officer'
    WHEN 'iso_email' THEN 'iso@organization.com'
    WHEN 'cem_name' THEN 'Compliance & Ethics Manager'
    WHEN 'cem_email' THEN 'cem@organization.com'
    WHEN 'hib_name' THEN 'Health Information Security Officer'
    WHEN 'hib_email' THEN 'hib@organization.com'
    WHEN 'dpe_name' THEN 'Data Protection Executive'
    WHEN 'dpe_email' THEN 'dpe@organization.com'
    WHEN 'it_support_number' THEN '+1-800-IT-HELP'
    ELSE 'Default Value'
  END
FROM public.template_variables tv;