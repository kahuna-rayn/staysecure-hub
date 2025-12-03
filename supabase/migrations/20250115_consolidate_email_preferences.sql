-- Consolidate email_preferences and lesson_reminder_config tables
-- Future-proofs email_preferences for potential user-level settings
-- This migration consolidates all email notification settings into a single table

-- Step 1: Drop and recreate email_preferences table with new structure
DROP TABLE IF EXISTS public.email_preferences CASCADE;

-- Step 2: Create new email_preferences table with consolidated structure
CREATE TABLE public.email_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NULL, -- NULL for org-level, user UUID for user-level (future)
  email_enabled BOOLEAN DEFAULT true,
  task_due_dates BOOLEAN DEFAULT true,
  system_alerts BOOLEAN DEFAULT false,
  achievements BOOLEAN DEFAULT true,
  course_completions BOOLEAN DEFAULT true,
  quiet_hours_enabled BOOLEAN DEFAULT false,
  quiet_hours_start_time TIME DEFAULT '22:00:00',
  quiet_hours_end_time TIME DEFAULT '08:00:00',
  -- Reminder settings (consolidated from lesson_reminder_config)
  reminder_days_before INTEGER DEFAULT 0,
  reminder_time TIME DEFAULT '09:00:00',
  include_upcoming_lessons BOOLEAN DEFAULT true,
  upcoming_days_ahead INTEGER DEFAULT 3,
  max_reminder_attempts INTEGER DEFAULT 3,
  reminder_frequency_days INTEGER DEFAULT 7,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Step 4: If no org-level settings exist, create default ones
INSERT INTO public.email_preferences (
  user_id, -- NULL for org-level settings
  email_enabled,
  task_due_dates,
  system_alerts,
  achievements,
  course_completions,
  quiet_hours_enabled,
  quiet_hours_start_time,
  quiet_hours_end_time,
  reminder_days_before,
  reminder_time,
  include_upcoming_lessons,
  upcoming_days_ahead,
  max_reminder_attempts,
  reminder_frequency_days
)
VALUES (
  NULL, -- Org-level settings
  true, -- email_enabled
  true, -- task_due_dates
  false, -- system_alerts
  true, -- achievements
  true, -- course_completions
  false, -- quiet_hours_enabled
  '22:00:00', -- quiet_hours_start_time
  '08:00:00', -- quiet_hours_end_time
  0, -- reminder_days_before
  '09:00:00', -- reminder_time
  true, -- include_upcoming_lessons
  3, -- upcoming_days_ahead
  3, -- max_reminder_attempts
  7 -- reminder_frequency_days
);

-- Step 5: Update RLS policies for the new structure
-- Drop existing policies
DROP POLICY IF EXISTS "Users can manage their own email preferences" ON public.email_preferences;
DROP POLICY IF EXISTS "Admins can manage all email preferences" ON public.email_preferences;
DROP POLICY IF EXISTS "Service role can manage email preferences" ON public.email_preferences;

-- Create new policies that handle both org-level and user-level settings
CREATE POLICY "Admins can manage email preferences"
  ON public.email_preferences FOR ALL
  USING (
    has_role(auth.uid(), 'super_admin'::app_role) OR 
    has_role(auth.uid(), 'client_admin'::app_role)
  )
  WITH CHECK (
    has_role(auth.uid(), 'super_admin'::app_role) OR 
    has_role(auth.uid(), 'client_admin'::app_role)
  );

-- Future policy for user-level settings (commented out for now)
-- CREATE POLICY "Users can manage their own email preferences"
--   ON public.email_preferences FOR ALL
--   USING (user_id IS NULL OR auth.uid() = user_id)
--   WITH CHECK (user_id IS NULL OR auth.uid() = user_id);

-- Service role can manage all preferences (for automated tasks)
CREATE POLICY "Service role can manage email preferences"
  ON public.email_preferences FOR ALL
  USING (true)
  WITH CHECK (true);

-- Step 6: Update the updated_at trigger to handle created_by and updated_by
CREATE OR REPLACE FUNCTION public.update_email_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  -- If updated_by is not set, set it to the current user
  IF NEW.updated_by IS NULL AND auth.uid() IS NOT NULL THEN
    NEW.updated_by = auth.uid();
  END IF;
  -- If created_by is not set, set it to the current user
  IF NEW.created_by IS NULL AND auth.uid() IS NOT NULL THEN
    NEW.created_by = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Add helpful comments
COMMENT ON TABLE public.email_preferences IS 'Email notification preferences - org-level (user_id=NULL) or user-level (user_id=user)';
COMMENT ON COLUMN public.email_preferences.user_id IS 'NULL for org-level settings, user UUID for user-level overrides';
COMMENT ON COLUMN public.email_preferences.created_by IS 'User who created this preference record';
COMMENT ON COLUMN public.email_preferences.updated_by IS 'User who last updated this preference record';
COMMENT ON COLUMN public.email_preferences.reminder_days_before IS 'Days before lesson to send reminder (0 = same day)';
COMMENT ON COLUMN public.email_preferences.reminder_time IS 'Time of day to send lesson reminders';
COMMENT ON COLUMN public.email_preferences.include_upcoming_lessons IS 'Include upcoming lessons in reminder emails';
COMMENT ON COLUMN public.email_preferences.upcoming_days_ahead IS 'How many days ahead to look for upcoming lessons';
COMMENT ON COLUMN public.email_preferences.max_reminder_attempts IS 'Maximum number of reminder attempts per lesson';
COMMENT ON COLUMN public.email_preferences.reminder_frequency_days IS 'Days between reminder attempts';

-- Step 8: Drop the old lesson_reminder_config table (after migration)
-- This will be done in a separate migration to ensure data is safely migrated first
-- DROP TABLE IF EXISTS public.lesson_reminder_config;
