-- Enable RLS on template variables tables (fixing typo)
ALTER TABLE template_variables ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_variable_translations ENABLE ROW LEVEL SECURITY;