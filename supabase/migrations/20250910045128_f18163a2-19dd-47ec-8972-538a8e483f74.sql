-- Enable RLS on template_variables and template_variable_translations tables
ALTER TABLE template_variables ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_variable_translations ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for template_variables
CREATE POLICY "Anyone can view template variables" 
ON template_variables 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage template variables" 
ON template_variables 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add RLS policies for template_variable_translations
CREATE POLICY "Anyone can view template variable translations" 
ON template_variable_translations 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage template variable translations" 
ON template_variable_translations 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));