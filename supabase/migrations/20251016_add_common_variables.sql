-- Add additional common template variables for various notification types
-- These variables are commonly used across different email templates

INSERT INTO public.template_variables (key, category, display_name, is_system, is_active) VALUES
  -- System Variables
  ('system_name', 'System', 'System Name', true, true),
  ('app_name', 'System', 'Application Name', true, true),
  ('support_email', 'System', 'Support Email', true, true),
  ('support_phone', 'System', 'Support Phone', true, true),
  
  -- Notification Variables
  ('notification_type', 'System', 'Notification Type', true, true),
  ('notification_priority', 'System', 'Notification Priority', true, true),
  ('notification_date', 'System', 'Notification Date', true, true),
  ('notification_time', 'System', 'Notification Time', true, true),
  
  -- URL Variables
  ('login_url', 'System', 'Login URL', true, true),
  ('dashboard_url', 'System', 'Dashboard URL', true, true),
  ('profile_url', 'System', 'Profile URL', true, true),
  ('settings_url', 'System', 'Settings URL', true, true),
  
  -- Course/Content Variables
  ('course_title', 'Content', 'Course Title', true, true),
  ('course_description', 'Content', 'Course Description', true, true),
  ('course_duration', 'Content', 'Course Duration', true, true),
  ('course_url', 'Content', 'Course URL', true, true),
  
  -- Achievement Variables
  ('achievement_name', 'Achievement', 'Achievement Name', true, true),
  ('achievement_description', 'Achievement', 'Achievement Description', true, true),
  ('achievement_date', 'Achievement', 'Achievement Date', true, true),
  ('achievement_badge_url', 'Achievement', 'Achievement Badge URL', true, true),
  
  -- Assignment/Task Variables
  ('assignment_title', 'Task', 'Assignment Title', true, true),
  ('assignment_description', 'Task', 'Assignment Description', true, true),
  ('assignment_due_date', 'Task', 'Assignment Due Date', true, true),
  ('assignment_url', 'Task', 'Assignment URL', true, true);

-- Add translations for these variables
INSERT INTO public.template_variable_translations (variable_id, language_code, display_name, default_value)
SELECT 
  tv.id,
  'en',
  tv.display_name,
  tv.display_name
FROM public.template_variables tv
WHERE tv.key IN (
  'system_name', 'app_name', 'support_email', 'support_phone',
  'notification_type', 'notification_priority', 'notification_date', 'notification_time',
  'login_url', 'dashboard_url', 'profile_url', 'settings_url',
  'course_title', 'course_description', 'course_duration', 'course_url',
  'achievement_name', 'achievement_description', 'achievement_date', 'achievement_badge_url',
  'assignment_title', 'assignment_description', 'assignment_due_date', 'assignment_url'
)
AND NOT EXISTS (
  SELECT 1 FROM public.template_variable_translations tvt 
  WHERE tvt.variable_id = tv.id AND tvt.language_code = 'en'
);

-- Create a view to easily see all template variables by category
CREATE OR REPLACE VIEW public.template_variables_by_category AS
SELECT 
  tv.category,
  COUNT(*) as variable_count,
  STRING_AGG(tv.key, ', ' ORDER BY tv.key) as variable_keys
FROM public.template_variables tv
WHERE tv.is_active = true
GROUP BY tv.category
ORDER BY tv.category;

-- Grant access to the view
GRANT SELECT ON public.template_variables_by_category TO authenticated;

-- Add comment to the view
COMMENT ON VIEW public.template_variables_by_category IS 
  'Summary of all template variables grouped by category for easy reference';
