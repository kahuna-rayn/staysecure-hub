-- Add learning-specific template variables for lesson completion and progress tracking
-- These variables are used in email templates for learning-related notifications

INSERT INTO public.template_variables (key, category, display_name, is_system, is_active) VALUES
  -- Lesson Variables
  ('lesson_title', 'Learning', 'Lesson Title', true, true),
  ('lesson_url', 'Learning', 'Lesson URL', true, true),
  ('lesson_description', 'Learning', 'Lesson Description', true, true),
  ('lesson_duration', 'Learning', 'Lesson Duration', true, true),
  
  -- Learning Track Variables
  ('learning_track_title', 'Learning', 'Learning Track Title', true, true),
  ('learning_track_description', 'Learning', 'Learning Track Description', true, true),
  ('track_progress_percentage', 'Learning', 'Track Progress Percentage', true, true),
  ('lessons_completed_in_track', 'Learning', 'Lessons Completed in Track', true, true),
  ('total_lessons_in_track', 'Learning', 'Total Lessons in Track', true, true),
  
  -- Completion Variables
  ('completion_date', 'Learning', 'Completion Date', true, true),
  ('completion_time', 'Learning', 'Completion Time', true, true),
  ('completion_score', 'Learning', 'Completion Score', true, true),
  ('completion_percentage', 'Learning', 'Completion Percentage', true, true),
  
  -- Next Lesson Variables
  ('next_lesson_available', 'Learning', 'Next Lesson Available', true, true),
  ('next_lesson_title', 'Learning', 'Next Lesson Title', true, true),
  ('next_lesson_url', 'Learning', 'Next Lesson URL', true, true),
  ('next_lesson_available_date', 'Learning', 'Next Lesson Available Date', true, true);

-- Add translations for these variables
INSERT INTO public.template_variable_translations (variable_id, language_code, display_name, default_value)
SELECT 
  tv.id,
  'en',
  tv.display_name,
  tv.display_name
FROM public.template_variables tv
WHERE tv.key IN (
  'lesson_title', 'lesson_url', 'lesson_description', 'lesson_duration',
  'learning_track_title', 'learning_track_description', 'track_progress_percentage',
  'lessons_completed_in_track', 'total_lessons_in_track',
  'completion_date', 'completion_time', 'completion_score', 'completion_percentage',
  'next_lesson_available', 'next_lesson_title', 'next_lesson_url', 'next_lesson_available_date'
)
AND NOT EXISTS (
  SELECT 1 FROM public.template_variable_translations tvt 
  WHERE tvt.variable_id = tv.id AND tvt.language_code = 'en'
);

-- Add helpful comments
COMMENT ON COLUMN public.template_variables.key IS 
  'Variable key used in templates with double curly braces, e.g., {{lesson_title}}';

-- Create a view to easily see all learning variables
CREATE OR REPLACE VIEW public.learning_template_variables AS
SELECT 
  tv.key,
  tv.category,
  tv.display_name,
  tv.is_system,
  tv.is_active,
  tvt.default_value
FROM public.template_variables tv
LEFT JOIN public.template_variable_translations tvt 
  ON tv.id = tvt.variable_id AND tvt.language_code = 'en'
WHERE tv.category = 'Learning'
ORDER BY tv.key;

-- Grant access to the view
GRANT SELECT ON public.learning_template_variables TO authenticated;

-- Add comment to the view
COMMENT ON VIEW public.learning_template_variables IS 
  'All learning-related template variables available for email templates and lesson notifications';
