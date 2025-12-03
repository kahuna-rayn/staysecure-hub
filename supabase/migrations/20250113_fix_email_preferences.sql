-- Fix email_preferences table with proper RLS policies
-- This migration ensures the email_preferences table exists with correct policies

-- Create email_preferences table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.email_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email_enabled BOOLEAN DEFAULT true,
  lesson_reminders BOOLEAN DEFAULT true,
  task_due_dates BOOLEAN DEFAULT true,
  system_alerts BOOLEAN DEFAULT false,
  achievements BOOLEAN DEFAULT true,
  course_completions BOOLEAN DEFAULT true,
  quiet_hours_enabled BOOLEAN DEFAULT false,
  quiet_hours_start_time TIME DEFAULT '22:00:00',
  quiet_hours_end_time TIME DEFAULT '08:00:00',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.email_preferences ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can manage their own email preferences" ON public.email_preferences;
DROP POLICY IF EXISTS "Admins can manage all email preferences" ON public.email_preferences;
DROP POLICY IF EXISTS "Service role can manage email preferences" ON public.email_preferences;

-- Create RLS policies
CREATE POLICY "Users can manage their own email preferences"
  ON public.email_preferences FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all email preferences"
  ON public.email_preferences FOR ALL
  USING (
    has_role(auth.uid(), 'super_admin'::app_role) OR 
    has_role(auth.uid(), 'client_admin'::app_role)
  )
  WITH CHECK (
    has_role(auth.uid(), 'super_admin'::app_role) OR 
    has_role(auth.uid(), 'client_admin'::app_role)
  );

-- Service role can manage all preferences (for automated tasks)
CREATE POLICY "Service role can manage email preferences"
  ON public.email_preferences FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.update_email_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_email_preferences_updated_at ON public.email_preferences;
CREATE TRIGGER update_email_preferences_updated_at
  BEFORE UPDATE ON public.email_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_email_preferences_updated_at();

-- Add helpful comments
COMMENT ON TABLE public.email_preferences IS 'User email notification preferences';
COMMENT ON COLUMN public.email_preferences.user_id IS 'References auth.users.id - primary key';
COMMENT ON COLUMN public.email_preferences.email_enabled IS 'Global email notification toggle';
COMMENT ON COLUMN public.email_preferences.lesson_reminders IS 'Enable lesson reminder emails';
COMMENT ON COLUMN public.email_preferences.task_due_dates IS 'Enable task due date emails';
COMMENT ON COLUMN public.email_preferences.system_alerts IS 'Enable system alert emails';
COMMENT ON COLUMN public.email_preferences.achievements IS 'Enable achievement emails';
COMMENT ON COLUMN public.email_preferences.course_completions IS 'Enable course completion emails';
COMMENT ON COLUMN public.email_preferences.quiet_hours_enabled IS 'Enable quiet hours (no emails during specified time)';
COMMENT ON COLUMN public.email_preferences.quiet_hours_start_time IS 'Start time for quiet hours';
COMMENT ON COLUMN public.email_preferences.quiet_hours_end_time IS 'End time for quiet hours';
