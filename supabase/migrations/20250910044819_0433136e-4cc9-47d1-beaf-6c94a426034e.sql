-- Insert first_name and last_name variables into template_variables
INSERT INTO template_variables (key, category, display_name, is_system, is_active) VALUES
('first_name', 'User', 'First Name', true, true),
('last_name', 'User', 'Last Name', true, true);

-- Get the IDs for the translations
DO $$
DECLARE
    first_name_id UUID;
    last_name_id UUID;
BEGIN
    -- Get the variable IDs
    SELECT id INTO first_name_id FROM template_variables WHERE key = 'first_name';
    SELECT id INTO last_name_id FROM template_variables WHERE key = 'last_name';
    
    -- Insert English translations
    INSERT INTO template_variable_translations (variable_id, language_code, default_value) VALUES
    (first_name_id, 'en', 'First Name'),
    (last_name_id, 'en', 'Last Name');
END $$;