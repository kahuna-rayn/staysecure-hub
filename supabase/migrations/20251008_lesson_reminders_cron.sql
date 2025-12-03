-- Setup pg_cron extension for scheduled lesson reminders
-- This enables automatic execution of the lesson reminder function

-- Enable pg_cron extension (requires superuser, typically done via Supabase dashboard)
-- Note: On Supabase, you may need to enable this via the dashboard under Database > Extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant usage on cron schema to postgres role
GRANT USAGE ON SCHEMA cron TO postgres;

-- Schedule the lesson reminder function to run daily at 9 AM UTC
-- You can adjust the schedule as needed
SELECT cron.schedule(
  'send-daily-lesson-reminders',           -- Job name
  '0 9 * * *',                              -- Cron expression: Every day at 9 AM UTC
  $$
  SELECT
    net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/send-lesson-reminders',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.supabase_service_key')
      ),
      body := '{}'::jsonb
    ) as request_id;
  $$
);

-- Create a table to store cron job configuration for easy management
CREATE TABLE IF NOT EXISTS public.cron_job_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_name TEXT UNIQUE NOT NULL,
  schedule TEXT NOT NULL, -- Cron expression
  enabled BOOLEAN DEFAULT true,
  last_run TIMESTAMP WITH TIME ZONE,
  next_run TIMESTAMP WITH TIME ZONE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert configuration for lesson reminders cron job
INSERT INTO public.cron_job_config (job_name, schedule, enabled, description)
VALUES (
  'send-daily-lesson-reminders',
  '0 9 * * *',
  true,
  'Sends daily lesson reminders to users based on their learning track schedules'
) ON CONFLICT (job_name) DO NOTHING;

-- Enable RLS on cron_job_config
ALTER TABLE public.cron_job_config ENABLE ROW LEVEL SECURITY;

-- Only super_admin and client_admin can view cron job configuration
CREATE POLICY "Only admins can view cron jobs"
  ON public.cron_job_config FOR SELECT
  USING (
    has_role(auth.uid(), 'super_admin'::app_role) OR 
    has_role(auth.uid(), 'client_admin'::app_role)
  );

-- Function to manually trigger lesson reminders (useful for testing)
CREATE OR REPLACE FUNCTION public.trigger_lesson_reminders()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  -- Check if user is a super_admin or client_admin
  IF NOT (
    has_role(auth.uid(), 'super_admin'::app_role) OR 
    has_role(auth.uid(), 'client_admin'::app_role)
  ) THEN
    RAISE EXCEPTION 'Only administrators (super_admin or client_admin) can trigger lesson reminders';
  END IF;

  -- Call the edge function via HTTP
  SELECT content::jsonb INTO result
  FROM http((
    'POST',
    current_setting('app.settings.supabase_url') || '/functions/v1/send-lesson-reminders',
    ARRAY[
      http_header('Content-Type', 'application/json'),
      http_header('Authorization', 'Bearer ' || current_setting('app.settings.supabase_service_key')
    )],
    'application/json',
    '{}'
  )::http_request);

  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.trigger_lesson_reminders() TO authenticated;

-- Add helpful comments
COMMENT ON TABLE public.cron_job_config IS 'Configuration and status of scheduled cron jobs';
COMMENT ON FUNCTION public.trigger_lesson_reminders() IS 'Manually trigger lesson reminder sending (admin only)';

-- Note: To enable pg_cron and http extension on Supabase:
-- 1. Go to your Supabase dashboard
-- 2. Navigate to Database > Extensions
-- 3. Enable "pg_cron" and "pg_net" (for http requests)
-- 4. Set configuration parameters in Database > Settings:
--    - app.settings.supabase_url = 'your-project-url'
--    - app.settings.supabase_service_key = 'your-service-role-key'
