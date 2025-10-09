-- Lesson Reminders System
-- This migration integrates with existing email_notifications and email_preferences tables
-- No organisations table needed (single-tenant per instance)

-- Create global settings table for lesson reminders (single row configuration)
CREATE TABLE IF NOT EXISTS public.lesson_reminder_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  enabled BOOLEAN DEFAULT true,
  reminder_days_before INTEGER DEFAULT 0, -- 0 = same day, 1 = 1 day before, etc.
  reminder_time TIME DEFAULT '09:00:00', -- Time of day to send reminders
  include_upcoming_lessons BOOLEAN DEFAULT true, -- Also remind about lessons available soon
  upcoming_days_ahead INTEGER DEFAULT 3, -- How many days ahead to look for upcoming lessons
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT single_config_row CHECK (id = '00000000-0000-0000-0000-000000000001'::uuid)
);

-- Insert default configuration (single row)
INSERT INTO public.lesson_reminder_config (id, enabled)
VALUES ('00000000-0000-0000-0000-000000000001'::uuid, true)
ON CONFLICT (id) DO NOTHING;

-- Create table to track sent lesson reminders (prevent duplicate reminders)
-- Links to existing email_notifications table
CREATE TABLE IF NOT EXISTS public.lesson_reminder_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  learning_track_id UUID REFERENCES public.learning_tracks(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL, -- 'available_now', 'available_soon', 'overdue'
  available_date DATE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  email_notification_id UUID REFERENCES public.email_notifications(id) ON DELETE SET NULL
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_lesson_reminder_history_user 
  ON public.lesson_reminder_history(user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_reminder_history_lesson 
  ON public.lesson_reminder_history(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_reminder_history_sent_at 
  ON public.lesson_reminder_history(sent_at);
CREATE INDEX IF NOT EXISTS idx_lesson_reminder_history_composite 
  ON public.lesson_reminder_history(user_id, lesson_id, available_date);

-- Add unique constraint to prevent duplicate reminders for the same lesson on the same day
CREATE UNIQUE INDEX IF NOT EXISTS idx_lesson_reminder_unique 
  ON public.lesson_reminder_history(user_id, lesson_id, reminder_type, available_date);

-- Enable RLS
ALTER TABLE public.lesson_reminder_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_reminder_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for lesson_reminder_config (global settings)
-- Only super_admin and client_admin can manage reminder configuration
CREATE POLICY "Admins can view reminder config"
  ON public.lesson_reminder_config FOR SELECT
  USING (
    has_role(auth.uid(), 'super_admin'::app_role) OR 
    has_role(auth.uid(), 'client_admin'::app_role)
  );

CREATE POLICY "Admins can update reminder config"
  ON public.lesson_reminder_config FOR UPDATE
  USING (
    has_role(auth.uid(), 'super_admin'::app_role) OR 
    has_role(auth.uid(), 'client_admin'::app_role)
  );

-- Service role can manage all settings (for automated tasks)
CREATE POLICY "Service role can manage reminder config"
  ON public.lesson_reminder_config FOR ALL
  USING (true)
  WITH CHECK (true);

-- RLS Policies for lesson_reminder_history
-- Users can view their own reminder history
CREATE POLICY "Users can view their own reminder history"
  ON public.lesson_reminder_history FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all reminder history
CREATE POLICY "Admins can view all reminder history"
  ON public.lesson_reminder_history FOR SELECT
  USING (
    has_role(auth.uid(), 'super_admin'::app_role) OR 
    has_role(auth.uid(), 'client_admin'::app_role)
  );

-- Service role can manage all reminder history (for automated tasks)
CREATE POLICY "Service role can manage reminder history"
  ON public.lesson_reminder_history FOR ALL
  USING (true)
  WITH CHECK (true);

-- Function to get users who need lesson reminders
-- This will be called by the Edge Function
-- Respects user preferences from email_preferences table
CREATE OR REPLACE FUNCTION public.get_users_needing_lesson_reminders()
RETURNS TABLE (
  user_id UUID,
  user_email TEXT,
  lesson_id UUID,
  lesson_title TEXT,
  lesson_description TEXT,
  learning_track_id UUID,
  learning_track_title TEXT,
  available_date DATE,
  reminder_type TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH user_tracks AS (
    -- Get all users enrolled in learning tracks with their progress
    -- Only include users who have lesson_reminders enabled in their email preferences
    SELECT 
      ultp.user_id,
      ultp.learning_track_id,
      ultp.enrolled_at,
      ultp.current_lesson_order,
      lt.title as track_title,
      lt.schedule_type,
      lt.start_date,
      lt.end_date,
      lt.duration_weeks,
      lt.lessons_per_week,
      lt.allow_all_lessons_immediately,
      lt.schedule_days,
      lt.max_lessons_per_week,
      au.email
    FROM public.user_learning_track_progress ultp
    INNER JOIN public.learning_tracks lt ON ultp.learning_track_id = lt.id
    INNER JOIN auth.users au ON ultp.user_id = au.id
    LEFT JOIN public.email_preferences ep ON ep.user_id = ultp.user_id
    WHERE ultp.completed_at IS NULL -- Only active enrollments
      AND lt.status = 'active'
      AND COALESCE(ep.email_enabled, true) = true -- Email enabled globally
      AND COALESCE(ep.lesson_reminders, true) = true -- Lesson reminders enabled
  ),
  track_lessons AS (
    -- Get all lessons in learning tracks with their order
    SELECT 
      ltl.learning_track_id,
      ltl.lesson_id,
      ltl.order_index,
      l.title as lesson_title,
      l.description as lesson_description,
      l.status as lesson_status
    FROM public.learning_track_lessons ltl
    INNER JOIN public.lessons l ON ltl.lesson_id = l.id
    WHERE l.status = 'published'
  ),
  lesson_availability AS (
    -- Calculate lesson availability for each user
    -- This is a simplified version - you may need to adjust based on your scheduling logic
    SELECT 
      ut.user_id,
      ut.user_email as email,
      tl.lesson_id,
      tl.lesson_title,
      tl.lesson_description,
      ut.learning_track_id,
      ut.track_title,
      tl.order_index,
      CASE 
        -- If all lessons are available immediately
        WHEN ut.allow_all_lessons_immediately THEN CURRENT_DATE
        -- If fixed dates schedule
        WHEN ut.schedule_type = 'fixed_dates' AND ut.start_date IS NOT NULL THEN
          ut.start_date::DATE
        -- If duration based schedule
        WHEN ut.schedule_type = 'duration_based' AND ut.lessons_per_week > 0 THEN
          (ut.enrolled_at::DATE + (tl.order_index / ut.lessons_per_week * 7)::INTEGER)
        -- Default to enrollment date
        ELSE ut.enrolled_at::DATE
      END as available_date
    FROM user_tracks ut
    INNER JOIN track_lessons tl ON ut.learning_track_id = tl.learning_track_id
    LEFT JOIN public.user_lesson_progress ulp ON 
      ulp.user_id = ut.user_id AND ulp.lesson_id = tl.lesson_id
    WHERE ulp.completed_at IS NULL -- Lesson not yet completed
  )
  SELECT DISTINCT
    la.user_id,
    la.email,
    la.lesson_id,
    la.lesson_title,
    la.lesson_description,
    la.learning_track_id,
    la.track_title,
    la.available_date,
    CASE
      -- Lesson is available now and not completed
      WHEN la.available_date <= CURRENT_DATE THEN 'available_now'
      -- Lesson becomes available soon (within 3 days)
      WHEN la.available_date <= CURRENT_DATE + INTERVAL '3 days' THEN 'available_soon'
      ELSE 'not_yet'
    END as reminder_type
  FROM lesson_availability la
  LEFT JOIN public.lesson_reminder_history lrh ON
    lrh.user_id = la.user_id
    AND lrh.lesson_id = la.lesson_id
    AND lrh.available_date = la.available_date
    AND lrh.sent_at > NOW() - INTERVAL '24 hours' -- Don't send more than once per day
  WHERE lrh.id IS NULL -- No reminder sent in last 24 hours
    AND (
      la.available_date <= CURRENT_DATE -- Available now
      OR la.available_date <= CURRENT_DATE + INTERVAL '3 days' -- Available soon
    )
  ORDER BY la.available_date, la.order_index;
END;
$$;

-- Grant execute permission to authenticated users and service role
GRANT EXECUTE ON FUNCTION public.get_users_needing_lesson_reminders() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_users_needing_lesson_reminders() TO service_role;

-- Create updated_at trigger for config table
CREATE OR REPLACE FUNCTION public.update_lesson_reminder_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_lesson_reminder_config_updated_at
  BEFORE UPDATE ON public.lesson_reminder_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_lesson_reminder_config_updated_at();

-- Add helpful comments
COMMENT ON TABLE public.lesson_reminder_config IS 'Global configuration for automatic lesson reminders (single row)';
COMMENT ON TABLE public.lesson_reminder_history IS 'History of sent lesson reminders to prevent duplicates. Links to email_notifications table';
COMMENT ON FUNCTION public.get_users_needing_lesson_reminders() IS 'Returns list of users who need lesson reminders. Respects email_preferences.lesson_reminders setting';
