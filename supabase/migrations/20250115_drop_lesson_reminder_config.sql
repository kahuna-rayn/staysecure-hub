-- Drop the old lesson_reminder_config table after consolidation
-- This should be run after the consolidation migration has been applied and tested

-- Drop the old table and its related objects
DROP TABLE IF EXISTS public.lesson_reminder_config CASCADE;

-- Drop any remaining functions related to the old table
DROP FUNCTION IF EXISTS public.update_lesson_reminder_config_updated_at() CASCADE;
