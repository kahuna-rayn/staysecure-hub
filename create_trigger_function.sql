-- Create the trigger_lesson_reminders function manually
-- This function allows admins to manually trigger lesson reminder sending

CREATE OR REPLACE FUNCTION public.trigger_lesson_reminders()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id UUID;
  result jsonb;
BEGIN
  -- Get current user ID
  user_id := auth.uid();
  
  -- Check if user is a super_admin or client_admin
  IF NOT (
    has_role(user_id, 'super_admin'::app_role) OR 
    has_role(user_id, 'client_admin'::app_role)
  ) THEN
    RAISE EXCEPTION 'Only administrators (super_admin or client_admin) can trigger lesson reminders';
  END IF;

  -- For now, just return a success message
  -- The actual lesson reminder logic should be handled by the Edge Function
  -- when called directly from the UI
  result := jsonb_build_object(
    'success', true,
    'message', 'Lesson reminder trigger authorized. Please call the send-lesson-reminders Edge Function directly.',
    'timestamp', NOW(),
    'triggered_by', user_id
  );

  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.trigger_lesson_reminders() TO authenticated;

-- Add helpful comment
COMMENT ON FUNCTION public.trigger_lesson_reminders() IS 'Manually trigger lesson reminder sending (admin only)';
