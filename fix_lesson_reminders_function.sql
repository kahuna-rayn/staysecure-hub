-- Fix the get_users_needing_lesson_reminders function
-- The issue was referencing ut.user_email instead of ut.email

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
  order_index INTEGER,
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
      lt.title::TEXT as track_title,
      lt.schedule_type,
      lt.start_date,
      lt.end_date,
      lt.duration_weeks,
      lt.lessons_per_week,
      lt.allow_all_lessons_immediately,
      lt.schedule_days,
      lt.max_lessons_per_week,
      au.email::TEXT as user_email
    FROM public.user_learning_track_progress ultp
    INNER JOIN public.learning_tracks lt ON ultp.learning_track_id = lt.id
    INNER JOIN auth.users au ON ultp.user_id = au.id
    LEFT JOIN public.email_preferences ep ON ep.user_id = ultp.user_id
    WHERE ultp.completed_at IS NULL -- Only active enrollments
      AND lt.status = 'published'
      AND COALESCE(ep.email_enabled, true) = true -- Email enabled globally
      AND COALESCE(ep.lesson_reminders, true) = true -- Lesson reminders enabled
  ),
  track_lessons AS (
    -- Get all lessons in learning tracks with their order
    SELECT 
      ltl.learning_track_id,
      ltl.lesson_id,
      ltl.order_index,
      l.title::TEXT as lesson_title,
      l.description::TEXT as lesson_description,
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
    la.order_index,
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_users_needing_lesson_reminders() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_users_needing_lesson_reminders() TO service_role;

-- Add comment
COMMENT ON FUNCTION public.get_users_needing_lesson_reminders() IS 'Returns list of users who need lesson reminders. Respects email_preferences.lesson_reminders setting';
